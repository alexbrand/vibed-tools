document.addEventListener('DOMContentLoaded', () => {
    const wrapLengthInput = document.getElementById('wrapLength');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const outputSection = document.getElementById('outputSection');
    const wrapBtn = document.getElementById('wrapBtn');
    const clearBtn = document.getElementById('clearBtn');
    const copyBtn = document.getElementById('copyBtn');
    const syntaxAwareCheckbox = document.getElementById('syntaxAware');

    // URL regex pattern to detect URLs
    const URL_PATTERN = /https?:\/\/[^\s]+/g;

    function wrapText() {
        const text = inputText.value;
        const wrapLength = parseInt(wrapLengthInput.value) || 100;
        const syntaxAware = syntaxAwareCheckbox.checked;

        if (!text.trim()) {
            outputSection.classList.add('hidden');
            return;
        }

        if (wrapLength < 10 || wrapLength > 9999) {
            alert('ERROR: Wrap length must be between 10 and 9999');
            return;
        }

        const wrappedText = syntaxAware
            ? wrapTextSyntaxAware(text, wrapLength)
            : wrapTextSimple(text, wrapLength);

        outputText.value = wrappedText;
        outputSection.classList.remove('hidden');
    }

    function wrapTextSimple(text, maxLength) {
        const lines = text.split('\n');
        const wrappedLines = [];

        for (const line of lines) {
            if (line.length <= maxLength) {
                wrappedLines.push(line);
            } else {
                wrappedLines.push(...breakLine(line, maxLength));
            }
        }

        return wrappedLines.join('\n');
    }

    function wrapTextSyntaxAware(text, maxLength) {
        const lines = text.split('\n');
        const wrappedLines = [];

        for (const line of lines) {
            // Detect indentation
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[1] : '';
            const contentStartIndex = indent.length;

            if (line.length <= maxLength) {
                wrappedLines.push(line);
                continue;
            }

            // Check if line contains URLs
            const urls = [];
            const urlMatches = line.matchAll(URL_PATTERN);
            for (const match of urlMatches) {
                urls.push({
                    url: match[0],
                    start: match.index,
                    end: match.index + match[0].length
                });
            }

            // If line has URLs, try not to break them
            if (urls.length > 0) {
                const broken = breakLineWithURLs(line, maxLength, indent, urls);
                wrappedLines.push(...broken);
            } else {
                // Standard break with indentation preservation
                const broken = breakLine(line, maxLength, indent);
                wrappedLines.push(...broken);
            }
        }

        return wrappedLines.join('\n');
    }

    function breakLine(line, maxLength, indent = '') {
        const lines = [];
        let currentLine = line;

        while (currentLine.length > maxLength) {
            // Try to break at a space
            let breakPoint = currentLine.lastIndexOf(' ', maxLength);

            if (breakPoint === -1 || breakPoint < maxLength / 2) {
                // No good break point found, hard break
                breakPoint = maxLength;
            }

            lines.push(currentLine.substring(0, breakPoint));
            currentLine = indent + currentLine.substring(breakPoint).trim();
        }

        if (currentLine.trim()) {
            lines.push(currentLine);
        }

        return lines;
    }

    function breakLineWithURLs(line, maxLength, indent, urls) {
        const lines = [];
        let pos = 0;
        let currentLine = '';

        // Process the line segment by segment
        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];

            // Add text before URL
            const textBefore = line.substring(pos, url.start);

            // If adding this text would exceed limit, break before it
            if ((currentLine + textBefore).length > maxLength && currentLine.trim()) {
                lines.push(currentLine.trimEnd());
                currentLine = indent + textBefore.trim();
            } else {
                currentLine += textBefore;
            }

            // Add URL - don't break it if possible
            if ((currentLine + url.url).length > maxLength && currentLine.trim()) {
                // URL won't fit on current line, start new line
                lines.push(currentLine.trimEnd());
                currentLine = indent + url.url;
            } else {
                currentLine += url.url;
            }

            pos = url.end;
        }

        // Add remaining text after last URL
        const remaining = line.substring(pos);
        if (remaining) {
            if ((currentLine + remaining).length > maxLength && currentLine.trim()) {
                lines.push(currentLine.trimEnd());
                const brokenRemaining = breakLine(indent + remaining.trim(), maxLength, indent);
                lines.push(...brokenRemaining);
            } else {
                currentLine += remaining;
                if (currentLine.trim()) {
                    lines.push(currentLine);
                }
            }
        } else if (currentLine.trim()) {
            lines.push(currentLine);
        }

        return lines;
    }

    function clearAll() {
        inputText.value = '';
        outputText.value = '';
        outputSection.classList.add('hidden');
        inputText.focus();
    }

    function copyToClipboard() {
        outputText.select();
        document.execCommand('copy');

        const originalText = copyBtn.textContent;
        copyBtn.textContent = '[COPIED!]';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 1500);
    }

    // Event listeners
    wrapBtn.addEventListener('click', wrapText);
    clearBtn.addEventListener('click', clearAll);
    copyBtn.addEventListener('click', copyToClipboard);

    // Wrap on Enter in wrap length input
    wrapLengthInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            wrapText();
        }
    });

    // Allow only numbers in wrap length input
    wrapLengthInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });

    // Focus input on load
    inputText.focus();
});
