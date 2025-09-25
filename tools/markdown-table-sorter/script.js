class MarkdownTableSorter {
    constructor() {
        this.tableInput = document.getElementById('tableInput');
        this.columnSelect = document.getElementById('columnSelect');
        this.sortOrder = document.getElementById('sortOrder');
        this.sortBtn = document.getElementById('sortBtn');
        this.tableOutput = document.getElementById('tableOutput');
        this.copyBtn = document.getElementById('copyBtn');

        this.headers = [];
        this.rows = [];

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.tableInput.addEventListener('input', () => this.parseTable());
        this.sortBtn.addEventListener('click', () => this.sortTable());
        this.copyBtn.addEventListener('click', () => this.copyToClipboard());
    }

    parseTable() {
        const input = this.tableInput.value.trim();

        if (!input) {
            this.resetControls();
            return;
        }

        try {
            const lines = input.split('\n').filter(line => line.trim());

            if (lines.length < 3) {
                this.showError('ERROR: Table must have at least a header, separator, and one data row');
                return;
            }

            // Parse header
            const headerLine = lines[0];
            this.headers = this.parseTableRow(headerLine);

            // Validate separator line
            const separatorLine = lines[1];
            if (!this.isValidSeparator(separatorLine, this.headers.length)) {
                this.showError('ERROR: Invalid separator row. Use |---|---|---| format');
                return;
            }

            // Parse data rows
            this.rows = [];
            for (let i = 2; i < lines.length; i++) {
                const rowData = this.parseTableRow(lines[i]);
                if (rowData.length === this.headers.length) {
                    this.rows.push(rowData);
                }
            }

            if (this.rows.length === 0) {
                this.showError('ERROR: No valid data rows found');
                return;
            }

            this.populateColumnSelect();
            this.enableControls();
            this.clearMessages();

        } catch (error) {
            this.showError('ERROR: Failed to parse table - ' + error.message);
        }
    }

    parseTableRow(line) {
        return line.split('|')
            .slice(1, -1) // Remove first and last empty elements
            .map(cell => cell.trim());
    }

    isValidSeparator(line, expectedColumns) {
        const parts = line.split('|').slice(1, -1);
        return parts.length === expectedColumns &&
               parts.every(part => /^-+$/.test(part.trim()));
    }

    populateColumnSelect() {
        this.columnSelect.innerHTML = '<option value="">Select a column</option>';

        this.headers.forEach((header, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = header;
            this.columnSelect.appendChild(option);
        });

        // Default to first column
        if (this.headers.length > 0) {
            this.columnSelect.value = "0";
        }
    }

    enableControls() {
        this.columnSelect.disabled = false;
        this.sortBtn.disabled = false;
    }

    resetControls() {
        this.columnSelect.innerHTML = '<option value="">Select a column</option>';
        this.columnSelect.disabled = true;
        this.sortBtn.disabled = true;
        this.tableOutput.value = '';
        this.copyBtn.disabled = true;
        this.clearMessages();
    }

    sortTable() {
        const columnIndex = parseInt(this.columnSelect.value);
        const isDescending = this.sortOrder.value === 'desc';

        if (isNaN(columnIndex)) {
            this.showError('ERROR: Please select a column to sort by');
            return;
        }

        try {
            const sortedRows = [...this.rows].sort((a, b) => {
                return this.compareValues(a[columnIndex], b[columnIndex], isDescending);
            });

            const outputTable = this.buildMarkdownTable(sortedRows);
            this.tableOutput.value = outputTable;
            this.copyBtn.disabled = false;
            this.showSuccess('> Table sorted successfully');

        } catch (error) {
            this.showError('ERROR: Failed to sort table - ' + error.message);
        }
    }

    compareValues(a, b, isDescending) {
        // Extract text from markdown links if present
        const textA = this.extractTextFromMarkdown(a);
        const textB = this.extractTextFromMarkdown(b);

        // Try to detect data types and sort accordingly
        const numA = this.parseNumber(textA);
        const numB = this.parseNumber(textB);

        // If both are numbers, sort numerically
        if (!isNaN(numA) && !isNaN(numB)) {
            return isDescending ? numB - numA : numA - numB;
        }

        // Try to parse as dates
        const dateA = this.parseDate(textA);
        const dateB = this.parseDate(textB);

        // If both are valid dates, sort by date
        if (dateA && dateB) {
            return isDescending ? dateB - dateA : dateA - dateB;
        }

        // Default to string comparison
        const strA = String(textA).toLowerCase();
        const strB = String(textB).toLowerCase();

        if (isDescending) {
            return strB.localeCompare(strA);
        } else {
            return strA.localeCompare(strB);
        }
    }

    extractTextFromMarkdown(value) {
        const str = String(value).trim();

        // Match markdown links [text](url) and extract the text part
        const linkMatch = str.match(/^\[([^\]]+)\]\([^)]+\)$/);
        if (linkMatch) {
            return linkMatch[1];
        }

        // If not a markdown link, return as is
        return str;
    }

    parseNumber(value) {
        // Remove common number formatting
        const cleaned = String(value).replace(/[,\s]/g, '');
        const num = parseFloat(cleaned);
        return num;
    }

    parseDate(value) {
        // Try to parse various date formats
        const str = String(value).trim();

        // ISO date format
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            const date = new Date(str);
            return isNaN(date.getTime()) ? null : date;
        }

        // Common US formats
        if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(str)) {
            const date = new Date(str);
            return isNaN(date.getTime()) ? null : date;
        }

        // Try other common formats
        const date = new Date(str);
        return isNaN(date.getTime()) ? null : date;
    }

    buildMarkdownTable(sortedRows) {
        const headerRow = '| ' + this.headers.join(' | ') + ' |';
        const separatorRow = '|' + this.headers.map(() => '---').join('|') + '|';
        const dataRows = sortedRows.map(row => '| ' + row.join(' | ') + ' |');

        return [headerRow, separatorRow, ...dataRows].join('\n');
    }

    async copyToClipboard() {
        try {
            await navigator.clipboard.writeText(this.tableOutput.value);
            this.showSuccess('> Table copied to clipboard');
        } catch (error) {
            // Fallback for older browsers
            this.tableOutput.select();
            document.execCommand('copy');
            this.showSuccess('> Table copied to clipboard');
        }
    }

    showError(message) {
        this.clearMessages();
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        this.tableInput.parentNode.appendChild(errorDiv);
    }

    showSuccess(message) {
        this.clearMessages();
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        this.tableOutput.parentNode.appendChild(successDiv);
    }

    clearMessages() {
        document.querySelectorAll('.error, .success').forEach(el => el.remove());
    }
}

// Initialize the sorter when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MarkdownTableSorter();
});