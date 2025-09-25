document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const greetBtn = document.getElementById('greetBtn');
    const greetingDiv = document.getElementById('greeting');

    const greetings = [
        "> Hello there, {name}!",
        "> Hey {name}! Welcome to the system.",
        "> Greetings, {name}! Access granted.",
        "> What's up, {name}? Connection established.",
        "> Hello {name}! Ready to execute commands?"
    ];

    function showGreeting() {
        const name = nameInput.value.trim();

        if (!name) {
            showError("ERROR: Name parameter required");
            nameInput.focus();
            return;
        }

        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        const personalizedGreeting = randomGreeting.replace('{name}', name.toUpperCase());

        greetingDiv.textContent = personalizedGreeting;
        greetingDiv.classList.remove('hidden', 'error');

        // Clear input after successful execution
        nameInput.value = '';
    }

    function showError(message) {
        greetingDiv.textContent = message;
        greetingDiv.classList.remove('hidden');
        greetingDiv.classList.add('error');
    }

    // Event listeners
    greetBtn.addEventListener('click', showGreeting);

    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            showGreeting();
        }
    });

    // Focus input on load
    nameInput.focus();
});