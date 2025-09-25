class Base64SwissArmy {
    constructor() {
        this.inputData = document.getElementById('inputData');
        this.fileInput = document.getElementById('fileInput');
        this.fileName = document.getElementById('fileName');
        this.detection = document.getElementById('detection');
        this.detectionResult = document.getElementById('detectionResult');
        this.preview = document.getElementById('preview');
        this.previewContent = document.getElementById('previewContent');
        this.output = document.getElementById('output');
        this.outputData = document.getElementById('outputData');
        this.status = document.getElementById('status');
        this.dataType = document.getElementById('dataType');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        console.log('Initializing event listeners...');

        document.getElementById('encodeBtn').addEventListener('click', () => this.encode());
        document.getElementById('decodeBtn').addEventListener('click', () => this.decode());
        document.getElementById('autoDetectBtn').addEventListener('click', () => this.autoDetect());
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('copyBtn').addEventListener('click', () => this.copyOutput());

        console.log('File input element:', this.fileInput);

        // Add multiple event listeners to debug
        this.fileInput.addEventListener('change', (e) => {
            console.log('File input change event triggered');
            this.handleFileUpload(e);
        });

        this.fileInput.addEventListener('input', (e) => {
            console.log('File input input event triggered');
        });

        this.inputData.addEventListener('input', () => this.onInputChange());

        // Add global paste listener for automatic paste and decode
        document.addEventListener('paste', (e) => this.handleGlobalPaste(e));

        const fileLabel = document.querySelector('.file-label');
        console.log('File label element:', fileLabel);

        // Let the native 'for' attribute handle the click, but add debugging
        fileLabel.addEventListener('click', (e) => {
            console.log('File label clicked - allowing native behavior');
            // Don't prevent default - let the native behavior work
        });

        // Also add a direct click listener to the file input for debugging
        this.fileInput.addEventListener('click', (e) => {
            console.log('File input directly clicked');
        });

        console.log('Event listeners initialized');
    }

    onInputChange() {
        if (this.inputData.value.trim()) {
            this.status.textContent = 'DATA LOADED';
        } else {
            this.status.textContent = 'READY';
            this.dataType.textContent = 'UNKNOWN';
        }
    }

    handleGlobalPaste(event) {
        console.log('Global paste event detected');

        // Skip if user is already typing in the input area
        if (event.target === this.inputData) {
            console.log('Paste target is input area, allowing normal behavior');
            return;
        }

        // Skip if user is typing in another input/textarea
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            console.log('Paste target is another input, skipping');
            return;
        }

        event.preventDefault();

        // Get clipboard data
        const clipboardData = event.clipboardData || window.clipboardData;
        const pastedData = clipboardData.getData('text');

        console.log('Pasted data length:', pastedData.length);
        console.log('Pasted data preview:', pastedData.substring(0, 100));

        if (!pastedData.trim()) {
            console.log('No clipboard data found');
            return;
        }

        // Put the data in the input field
        this.inputData.value = pastedData.trim();
        this.onInputChange();

        // Automatically attempt to decode if it looks like base64
        if (this.isBase64(pastedData.trim())) {
            console.log('Auto-detected base64, attempting decode');
            this.showDetection('AUTO-DETECTED: BASE64 DATA - DECODING...');
            setTimeout(() => this.decode(), 100);
        } else {
            console.log('Data appears to be plain text');
            this.showDetection('AUTO-DETECTED: PLAIN TEXT DATA');
        }
    }

    handleFileUpload(event) {
        console.log('File upload triggered', event);
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File details:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        });

        this.fileName.textContent = file.name;
        this.status.textContent = 'FILE LOADING...';

        const reader = new FileReader();
        reader.onload = (e) => {
            console.log('File read successfully', {
                resultType: typeof e.target.result,
                resultLength: e.target.result ? e.target.result.length || e.target.result.byteLength : 0
            });

            const result = e.target.result;
            if (this.isImageFile(file)) {
                console.log('Processing as image file');
                // For images, extract base64 from data URL
                const base64Data = result.split(',')[1];
                this.inputData.value = base64Data;
                this.dataType.textContent = `IMAGE/${file.type.split('/')[1].toUpperCase()}`;
                this.showPreview(result, 'image');
                console.log('Image processed, base64 length:', base64Data.length);
            } else if (this.isTextFile(file)) {
                console.log('Processing as text file');
                // For text files, encode the text content
                try {
                    this.inputData.value = btoa(result);
                    this.dataType.textContent = 'TEXT FILE';
                    console.log('Text file encoded to base64, length:', this.inputData.value.length);
                } catch (error) {
                    console.error('Error encoding text file:', error);
                    this.status.textContent = 'ENCODING ERROR';
                }
            } else {
                console.log('Processing as binary file');
                // For binary files, use ArrayBuffer approach
                try {
                    const bytes = new Uint8Array(result);
                    let binary = '';
                    for (let i = 0; i < bytes.byteLength; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    this.inputData.value = btoa(binary);
                    this.dataType.textContent = 'BINARY FILE';
                    console.log('Binary file processed, base64 length:', this.inputData.value.length);
                } catch (error) {
                    console.error('Error processing binary file:', error);
                    this.status.textContent = 'ENCODING ERROR';
                }
            }
            this.status.textContent = 'FILE LOADED';
        };

        reader.onerror = (error) => {
            console.error('FileReader error:', error);
            this.status.textContent = 'FILE LOAD ERROR';
        };

        if (this.isImageFile(file)) {
            console.log('Reading file as DataURL');
            reader.readAsDataURL(file);
        } else if (this.isTextFile(file)) {
            console.log('Reading file as Text');
            reader.readAsText(file);
        } else {
            console.log('Reading file as ArrayBuffer');
            reader.readAsArrayBuffer(file);
        }
    }

    isImageFile(file) {
        return file.type.startsWith('image/');
    }

    isTextFile(file) {
        return file.type.startsWith('text/') ||
               file.type === 'application/json' ||
               file.type === 'application/xml' ||
               file.type === 'application/javascript' ||
               file.name.endsWith('.txt') ||
               file.name.endsWith('.md') ||
               file.name.endsWith('.json') ||
               file.name.endsWith('.xml') ||
               file.name.endsWith('.html') ||
               file.name.endsWith('.css') ||
               file.name.endsWith('.js');
    }

    encode() {
        const input = this.inputData.value.trim();
        if (!input) {
            this.updateStatus('ERROR: NO INPUT DATA');
            return;
        }

        try {
            const encoded = btoa(input);
            this.showOutput(encoded);
            this.updateStatus('ENCODED SUCCESSFULLY');
        } catch (error) {
            this.updateStatus('ERROR: ENCODING FAILED');
        }
    }

    decode() {
        const input = this.inputData.value.trim();
        if (!input) {
            this.updateStatus('ERROR: NO INPUT DATA');
            return;
        }

        try {
            const decoded = atob(input);
            this.showOutput(decoded);
            this.updateStatus('DECODED SUCCESSFULLY');

            this.detectDataType(decoded);
            this.tryShowPreview(decoded, input);
        } catch (error) {
            this.updateStatus('ERROR: INVALID BASE64');
        }
    }

    autoDetect() {
        const input = this.inputData.value.trim();
        if (!input) {
            this.updateStatus('ERROR: NO INPUT DATA');
            return;
        }

        if (this.isBase64(input)) {
            this.showDetection('DETECTED: BASE64 ENCODED DATA');
            this.decode();
        } else {
            this.showDetection('DETECTED: PLAIN TEXT OR BINARY DATA');
            this.encode();
        }
    }

    isBase64(str) {
        try {
            return btoa(atob(str)) === str;
        } catch (err) {
            return false;
        }
    }

    detectDataType(data) {
        if (this.isJSON(data)) {
            this.dataType.textContent = 'JSON';
        } else if (this.isXML(data)) {
            this.dataType.textContent = 'XML';
        } else if (this.isHTML(data)) {
            this.dataType.textContent = 'HTML';
        } else if (this.hasImageHeader(data)) {
            this.dataType.textContent = 'IMAGE';
        } else if (this.isPrintableText(data)) {
            this.dataType.textContent = 'TEXT';
        } else {
            this.dataType.textContent = 'BINARY';
        }
    }

    isJSON(str) {
        try {
            JSON.parse(str);
            return true;
        } catch {
            return false;
        }
    }

    isXML(str) {
        return str.trim().startsWith('<') && str.trim().endsWith('>') && str.includes('</');
    }

    isHTML(str) {
        return str.toLowerCase().includes('<html') || str.toLowerCase().includes('<!doctype');
    }

    hasImageHeader(data) {
        const headers = [
            '\xFF\xD8\xFF',
            '\x89PNG',
            'GIF87a',
            'GIF89a',
            '\x00\x00\x00\x00ftyp'
        ];
        return headers.some(header => data.startsWith(header));
    }

    isPrintableText(str) {
        return /^[\x20-\x7E\s]*$/.test(str);
    }

    tryShowPreview(decoded, base64) {
        if (this.hasImageHeader(decoded)) {
            const mimeType = this.getImageMimeType(decoded);
            const dataUrl = `data:${mimeType};base64,${base64}`;
            this.showPreview(dataUrl, 'image');
        } else if (this.isJSON(decoded)) {
            this.showPreview(this.formatJSON(decoded), 'json');
        } else if (this.isHTML(decoded)) {
            this.showPreview(decoded, 'html');
        } else if (this.isPrintableText(decoded) && decoded.length < 1000) {
            this.showPreview(decoded, 'text');
        }
    }

    getImageMimeType(data) {
        if (data.startsWith('\xFF\xD8\xFF')) return 'image/jpeg';
        if (data.startsWith('\x89PNG')) return 'image/png';
        if (data.startsWith('GIF87a') || data.startsWith('GIF89a')) return 'image/gif';
        return 'image/unknown';
    }

    formatJSON(str) {
        try {
            return JSON.stringify(JSON.parse(str), null, 2);
        } catch {
            return str;
        }
    }

    showPreview(content, type) {
        this.preview.classList.remove('hidden');
        this.previewContent.innerHTML = '';

        switch (type) {
            case 'image':
                const img = document.createElement('img');
                img.src = content;
                img.style.maxWidth = '100%';
                img.style.maxHeight = '200px';
                img.style.border = '1px solid #b3b3b3';
                this.previewContent.appendChild(img);
                break;
            case 'json':
                this.previewContent.innerHTML = `<pre>${this.escapeHtml(content)}</pre>`;
                break;
            case 'html':
                this.previewContent.innerHTML = `<pre>${this.escapeHtml(content.substring(0, 500))}${content.length > 500 ? '...' : ''}</pre>`;
                break;
            case 'text':
                this.previewContent.innerHTML = `<pre>${this.escapeHtml(content)}</pre>`;
                break;
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showDetection(message) {
        this.detection.classList.remove('hidden');
        this.detectionResult.textContent = message;
    }

    showOutput(data) {
        this.output.classList.remove('hidden');
        this.outputData.value = data;
    }

    updateStatus(message) {
        this.status.textContent = message;
        setTimeout(() => {
            if (this.inputData.value.trim()) {
                this.status.textContent = 'DATA LOADED';
            } else {
                this.status.textContent = 'READY';
            }
        }, 3000);
    }

    copyOutput() {
        this.outputData.select();
        this.outputData.setSelectionRange(0, 99999);
        navigator.clipboard.writeText(this.outputData.value);
        this.updateStatus('COPIED TO CLIPBOARD');
    }

    clear() {
        this.inputData.value = '';
        this.fileName.textContent = '';
        this.fileInput.value = '';
        this.detection.classList.add('hidden');
        this.preview.classList.add('hidden');
        this.output.classList.add('hidden');
        this.status.textContent = 'READY';
        this.dataType.textContent = 'UNKNOWN';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Base64SwissArmy();
});