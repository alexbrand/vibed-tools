document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const greetBtn = document.getElementById('greetBtn');
    const greetingDiv = document.getElementById('greeting');

    const greetings = [
        "Hello there, {name}! 👋",
        "Hey {name}! Welcome to the vibes! ✨",
        "Greetings, {name}! You're awesome! 🚀",
        "What's up, {name}? Looking good! 😎",
        "Hello {name}! Ready to vibe? 🌟"
    ];

    function showGreeting() {
        const name = nameInput.value.trim();

        if (!name) {
            nameInput.focus();
            nameInput.classList.add('shake');
            setTimeout(() => nameInput.classList.remove('shake'), 500);
            return;
        }

        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        const personalizedGreeting = randomGreeting.replace('{name}', name);

        greetingDiv.textContent = personalizedGreeting;
        greetingDiv.classList.remove('hidden');
        greetingDiv.classList.add('fade-in');

        // Add some celebratory animation
        greetingDiv.style.transform = 'scale(1.05)';
        setTimeout(() => {
            greetingDiv.style.transform = 'scale(1)';
        }, 200);
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

    // Add some fun hover effects
    const card = document.querySelector('.card');
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-2px)';
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
    });

    // Animate vibe meter
    const vibeMeter = document.querySelector('.vibe-meter');
    setInterval(() => {
        vibeMeter.style.opacity = Math.random() > 0.5 ? '0.7' : '1';
    }, 2000);
});