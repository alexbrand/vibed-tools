class SecureDrop {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
        this.checkUrlOnLoad();
        this.updateStatus('ready for operation...');
    }

    initializeElements() {
        this.textInput = document.getElementById('text-input');
        this.secretInput = document.getElementById('secret');
        this.encryptBtn = document.getElementById('encrypt-btn');
        this.encryptResult = document.getElementById('encrypt-result');

        this.encryptedDataInput = document.getElementById('encrypted-data');
        this.decryptSecretInput = document.getElementById('decrypt-secret');
        this.decryptBtn = document.getElementById('decrypt-btn');
        this.decryptManualBtn = document.getElementById('decrypt-manual-btn');
        this.decryptResult = document.getElementById('decrypt-result');

        this.status = document.getElementById('status');
    }

    attachEventListeners() {
        this.encryptBtn.addEventListener('click', () => this.encryptText());
        this.decryptBtn.addEventListener('click', () => this.decryptFromUrl());
        this.decryptManualBtn.addEventListener('click', () => this.decryptManual());
        window.addEventListener('hashchange', () => this.checkUrlOnLoad());
    }

    checkUrlOnLoad() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.updateStatus('encrypted data detected in URL - enter secret to decrypt');
        }
    }

    updateStatus(message, isError = false) {
        this.status.textContent = `$ ${message}`;
        this.status.className = isError ? 'status-display error' : 'status-display';
    }

    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    async encryptData(data, password) {
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await this.deriveKey(password, salt);

        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        // Combine salt + iv + encrypted data
        const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        result.set(salt, 0);
        result.set(iv, salt.length);
        result.set(new Uint8Array(encrypted), salt.length + iv.length);

        return result;
    }

    async decryptData(encryptedData, password) {
        const salt = encryptedData.slice(0, 16);
        const iv = encryptedData.slice(16, 28);
        const data = encryptedData.slice(28);

        const key = await this.deriveKey(password, salt);

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        return new Uint8Array(decrypted);
    }

    async encryptText() {
        const text = this.textInput.value.trim();
        const secret = this.secretInput.value;

        if (!text) {
            this.updateStatus('error: no text to encrypt', true);
            return;
        }

        if (!secret) {
            this.updateStatus('error: secret required', true);
            return;
        }

        this.updateStatus('encrypting text...');
        this.encryptResult.innerHTML = '';

        try {
            const textData = new TextEncoder().encode(text);
            const encrypted = await this.encryptData(textData, secret);

            // Convert to base64 for URL-safe storage
            const base64Data = this.arrayBufferToBase64(encrypted);

            // Create shareable URL
            const shareUrl = `${window.location.origin}${window.location.pathname}#${base64Data}`;

            const resultDiv = document.createElement('div');
            resultDiv.className = 'encrypt-output';
            resultDiv.innerHTML = `
                <p>> encrypted data (${this.formatBytes(encrypted.length)}):</p>
                <div class="share-section">
                    <label>$ shareable url:</label>
                    <div class="url-container">
                        <input type="text" class="share-url" value="${shareUrl}" readonly>
                        <button class="copy-btn" onclick="this.previousElementSibling.select(); document.execCommand('copy'); this.textContent='[COPIED]'; setTimeout(() => this.textContent='[COPY]', 2000)">[COPY]</button>
                    </div>
                </div>
                <div class="manual-section">
                    <label>$ or copy encrypted data manually:</label>
                    <textarea class="encrypted-output" readonly>${base64Data}</textarea>
                </div>
            `;
            this.encryptResult.appendChild(resultDiv);

            this.updateStatus('text encrypted successfully - share URL or encrypted data');
        } catch (error) {
            this.updateStatus(`error: encryption failed - ${error.message}`, true);
        }
    }

    async decryptFromUrl() {
        const secret = this.decryptSecretInput.value;
        const hash = window.location.hash.substring(1);

        if (!hash) {
            this.updateStatus('error: no encrypted data in URL', true);
            return;
        }

        if (!secret) {
            this.updateStatus('error: secret required', true);
            return;
        }

        await this.performDecryption(hash, secret);
    }

    async decryptManual() {
        const secret = this.decryptSecretInput.value;
        const encryptedData = this.encryptedDataInput.value.trim();

        if (!encryptedData) {
            this.updateStatus('error: no encrypted data provided', true);
            return;
        }

        if (!secret) {
            this.updateStatus('error: secret required', true);
            return;
        }

        await this.performDecryption(encryptedData, secret);
    }

    async performDecryption(base64Data, secret) {
        this.updateStatus('decrypting text...');
        this.decryptResult.innerHTML = '';

        try {
            const encryptedData = this.base64ToArrayBuffer(base64Data);
            const decrypted = await this.decryptData(new Uint8Array(encryptedData), secret);
            const text = new TextDecoder().decode(decrypted);

            const resultDiv = document.createElement('div');
            resultDiv.className = 'decrypt-output';
            resultDiv.innerHTML = `
                <p>> decrypted text (${this.formatBytes(text.length)}):</p>
                <textarea class="decrypted-text" readonly>${text}</textarea>
                <button class="copy-btn" onclick="this.previousElementSibling.select(); document.execCommand('copy'); this.textContent='[COPIED]'; setTimeout(() => this.textContent='[COPY TEXT]', 2000)">[COPY TEXT]</button>
            `;
            this.decryptResult.appendChild(resultDiv);

            this.updateStatus('decryption successful');
        } catch (error) {
            this.updateStatus('error: decryption failed - invalid secret or corrupted data', true);
        }
    }

    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SecureDrop();
});