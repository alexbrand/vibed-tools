#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

// Function to load schools from JSON file
function loadSchoolsFromJSON(filePath) {
  console.log(`Loading schools from ${filePath}...`);
  const content = fs.readFileSync(filePath, 'utf8');
  const schools = JSON.parse(content);

  console.log(`Loaded ${schools.length} schools from JSON file`);
  return schools;
}

// Function to make HTTP request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Nationwide Schools Map Geocoder (https://github.com/user/schools-map)'
      }
    }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Function to geocode a school
async function geocodeSchool(school) {
  try {
    console.log(`Geocoding: ${school.name}, ${school.city}, ${school.state}`);

    // Try geocoding with full school address first
    let query = `${school.name}, ${school.city}, ${school.state}, USA`;
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`;

    let data = await makeRequest(url);

    // If no results with school name, try just city and state
    if (!data || data.length === 0) {
      console.log(`  Fallback to city: ${school.city}, ${school.state}`);
      query = `${school.city}, ${school.state}, USA`;
      url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`;
      data = await makeRequest(url);
    }

    if (data && data.length > 0) {
      const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      console.log(`  ✓ Found: ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`);
      return coords;
    }

    console.log(`  ✗ Not found`);
    return null;

  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return null;
  }
}

// Function to load existing results if they exist
function loadExistingResults() {
  const resultsFile = 'nationwide-schools-with-coordinates.js';

  if (fs.existsSync(resultsFile)) {
    try {
      console.log('Loading existing results...');
      const content = fs.readFileSync(resultsFile, 'utf8');
      // Extract the JSON array from the JS file
      const match = content.match(/const nationwideSchoolsWithCoordinates = (\[[\s\S]*?\]);/);
      if (match) {
        const existingResults = JSON.parse(match[1]);
        console.log(`Found ${existingResults.length} existing results`);
        return existingResults;
      }
    } catch (error) {
      console.log(`Could not load existing results: ${error.message}`);
    }
  }

  return [];
}

// Function to save results incrementally
function saveResults(results) {
  const outputData = `const nationwideSchoolsWithCoordinates = ${JSON.stringify(results, null, 2)};`;
  fs.writeFileSync('nationwide-schools-with-coordinates.js', outputData);
}

// Main geocoding function
async function geocodeAllSchools() {
  console.log('Loading schools.json file...');
  const schools = loadSchoolsFromJSON('schools.json');
  console.log(`Found ${schools.length} schools to geocode.\n`);

  // Load existing results
  const existingResults = loadExistingResults();
  const existingSchoolKeys = new Set(
    existingResults.map(school => `${school.state}|${school.city}|${school.name}`)
  );

  let results = [...existingResults];
  let successCount = existingResults.filter(school => school.coordinates).length;
  const stateStats = {};

  // Initialize state stats from existing results
  existingResults.forEach(school => {
    if (!stateStats[school.state]) {
      stateStats[school.state] = { total: 0, success: 0 };
    }
    stateStats[school.state].total++;
    if (school.coordinates) {
      stateStats[school.state].success++;
    }
  });

  console.log(`Starting from ${existingResults.length} existing results (${successCount} successful)\n`);

  let processed = 0;
  for (let i = 0; i < schools.length; i++) {
    const school = schools[i];
    const schoolKey = `${school.state}|${school.city}|${school.name}`;

    // Skip if already processed
    if (existingSchoolKeys.has(schoolKey)) {
      continue;
    }

    processed++;

    // Initialize state stats
    if (!stateStats[school.state]) {
      stateStats[school.state] = { total: 0, success: 0 };
    }
    stateStats[school.state].total++;

    const coords = await geocodeSchool(school);

    const schoolResult = {
      ...school,
      coordinates: coords
    };

    results.push(schoolResult);

    if (coords) {
      successCount++;
      stateStats[school.state].success++;
    }

    // Save results after each geocoding request
    saveResults(results);

    // Rate limiting - wait 1 second between requests
    if (processed < schools.length - existingResults.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Progress update every 10 schools
    if (processed % 10 === 0) {
      const remaining = schools.length - results.length;
      console.log(`\nProgress: ${results.length}/${schools.length} schools total (${processed} processed this session, ${remaining} remaining)`);
    }
  }

  console.log(`\nGeocoding complete: ${successCount}/${schools.length} schools found`);
  console.log(`Success rate: ${((successCount / schools.length) * 100).toFixed(1)}%`);

  // Print state-by-state stats
  console.log('\nState-by-state results:');
  Object.keys(stateStats).sort().forEach(state => {
    const stats = stateStats[state];
    const rate = ((stats.success / stats.total) * 100).toFixed(1);
    console.log(`  ${state}: ${stats.success}/${stats.total} (${rate}%)`);
  });

  // Final save (already saved incrementally, but ensure it's up to date)
  saveResults(results);
  console.log('\nFinal results saved to nationwide-schools-with-coordinates.js');

  // Also create a summary
  const summary = {
    totalSchools: schools.length,
    successfullyGeocoded: successCount,
    failed: schools.length - successCount,
    successRate: ((successCount / schools.length) * 100).toFixed(1) + '%',
    stateStats: stateStats,
    generatedAt: new Date().toISOString()
  };

  fs.writeFileSync('nationwide-geocoding-summary.json', JSON.stringify(summary, null, 2));
  console.log('Summary saved to nationwide-geocoding-summary.json');
}

// Run the geocoding
geocodeAllSchools().catch(console.error);