// Initialize the map centered on the United States
const map = L.map('map').setView([39.8283, -98.5795], 4);

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Store all markers and data
let allMarkers = [];
let allSchools = [];
let currentStateFilter = '';
let selectedTypes = new Set(['Elementary', 'Middle/K-8', 'High School', 'University', 'Other']);

// Function to determine school type and color
function getSchoolTypeAndColor(schoolName) {
    const name = schoolName.toLowerCase();

    if (name.includes('elementary')) {
        return { type: 'Elementary', color: '#e74c3c' };
    } else if (name.includes('middle') || name.includes('k-8') || name.includes('k-') || name.includes('-8')) {
        return { type: 'Middle/K-8', color: '#f39c12' };
    } else if (name.includes('high') && !name.includes('school district')) {
        return { type: 'High School', color: '#3498db' };
    } else if (name.includes('university') || name.includes('college')) {
        return { type: 'University', color: '#9b59b6' };
    } else {
        return { type: 'Other', color: '#27ae60' };
    }
}

// Function to create marker for a school
function createSchoolMarker(school) {
    if (!school.coordinates) return null;

    const schoolInfo = getSchoolTypeAndColor(school.name);
    const coords = school.coordinates;

    const marker = L.circleMarker([coords[0], coords[1]], {
        radius: 8,
        fillColor: schoolInfo.color,
        color: '#fff',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    });

    // Create popup content
    const popupContent = `
        <div class="school-popup">
            <h3>${school.name}</h3>
            <p><strong>City:</strong> ${school.city}</p>
            <p><strong>State:</strong> ${school.state}</p>
            <p><strong>Type:</strong> ${schoolInfo.type}</p>
            <p><strong>Coordinates:</strong> ${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}</p>
        </div>
    `;

    marker.bindPopup(popupContent);

    // Add hover effect
    marker.on('mouseover', function() {
        this.setStyle({
            radius: 10,
            weight: 2
        });
    });

    marker.on('mouseout', function() {
        this.setStyle({
            radius: 8,
            weight: 1
        });
    });

    return marker;
}

// Function to populate state selector
function populateStateSelector(schools) {
    const states = [...new Set(schools.map(school => school.state))].sort();
    const selector = document.getElementById('state-selector');

    // Clear existing options (except "All States")
    while (selector.children.length > 1) {
        selector.removeChild(selector.lastChild);
    }

    states.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state.replace(/\s*\([^)]*\)/g, ''); // Remove parenthetical parts like (NORTHERN)
        selector.appendChild(option);
    });
}

// Function to filter and display schools
function filterSchools(stateFilter = '') {
    currentStateFilter = stateFilter;

    // Remove all markers from map
    allMarkers.forEach(marker => map.removeLayer(marker));

    // Filter schools by state
    let filteredSchools = stateFilter ?
        allSchools.filter(school => school.state === stateFilter) :
        allSchools;

    // Filter schools by selected types
    filteredSchools = filteredSchools.filter(school => {
        const schoolInfo = getSchoolTypeAndColor(school.name);
        return selectedTypes.has(schoolInfo.type);
    });

    // Add filtered markers to map
    let visibleCount = 0;
    filteredSchools.forEach(school => {
        if (school.coordinates) {
            const marker = createSchoolMarker(school);
            if (marker) {
                marker.addTo(map);
                allMarkers.push(marker);
                visibleCount++;
            }
        }
    });

    // Update stats
    document.getElementById('total-count').textContent = allSchools.length;
    document.getElementById('visible-count').textContent = visibleCount;

    // Adjust map view
    if (filteredSchools.length > 0 && stateFilter) {
        // Zoom to state bounds
        const validSchools = filteredSchools.filter(school => school.coordinates);
        if (validSchools.length > 0) {
            const group = new L.featureGroup(
                validSchools.map(school => createSchoolMarker(school))
            );
            map.fitBounds(group.getBounds().pad(0.1));
        }
    } else if (!stateFilter) {
        // Show all USA
        map.setView([39.8283, -98.5795], 4);
    }
}

// Function to load schools data
function loadSchoolsData() {
    const loadingDiv = document.getElementById('loading');

    // Check if nationwide data is available
    if (typeof nationwideSchoolsWithCoordinates !== 'undefined') {
        allSchools = nationwideSchoolsWithCoordinates;
        populateStateSelector(allSchools);
        filterSchools('');
        loadingDiv.style.display = 'none';
        console.log(`Loaded ${allSchools.length} nationwide schools`);
    }
    // Fallback to Florida data
    else if (typeof schoolsWithCoordinates !== 'undefined') {
        allSchools = schoolsWithCoordinates;
        populateStateSelector(allSchools);
        filterSchools('');
        loadingDiv.style.display = 'none';
        console.log(`Loaded ${allSchools.length} Florida schools`);

        // Center on Florida
        map.setView([27.7663, -82.6404], 7);
    }
    else {
        loadingDiv.querySelector('p').textContent = 'Error: No school data found';
        console.error('No school data available');
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // State selector change
    document.getElementById('state-selector').addEventListener('change', function() {
        filterSchools(this.value);
    });

    // Type checkbox changes
    const typeCheckboxes = ['type-elementary', 'type-middle', 'type-high', 'type-university', 'type-other'];
    const typeNames = ['Elementary', 'Middle/K-8', 'High School', 'University', 'Other'];

    typeCheckboxes.forEach((checkboxId, index) => {
        document.getElementById(checkboxId).addEventListener('change', function() {
            const typeName = typeNames[index];
            if (this.checked) {
                selectedTypes.add(typeName);
            } else {
                selectedTypes.delete(typeName);
            }
            filterSchools(currentStateFilter);
        });
    });

    loadSchoolsData();
});

// Add a scale control
L.control.scale().addTo(map);
