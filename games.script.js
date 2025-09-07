document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            renderGames();
        } else {
            window.location.replace('index.html');
        }
    });

    function renderGames() {
        const gamesGrid = document.getElementById('games-grid');
        gamesGrid.innerHTML = '';

        const gamesData = [
            {
                title: "স্পিন হুইল",
                description: "চাকা ঘুরিয়ে আপনার ভাগ্য পরীক্ষা করুন এবং আকর্ষণীয় পুরস্কার জিতুন।",
                icon: "fas fa-dharmachakra",
                // উদাহরণ লিঙ্ক (আপনাকে আপনার নিজের লিঙ্ক ব্যবহার করতে হবে)
                url: "https://your-website.com/games/spin-wheel/", 
                status: "active"
            },
            {
                title: "স্ক্র্যাচ কার্ড",
                description: "কার্ড ঘষে তাৎক্ষণিক পুরস্কার জিতে নিন। প্রতিটি কার্ডে রয়েছে নতুন চমক।",
                icon: "fas fa-star",
                 // উদাহরণ লিঙ্ক (আপনাকে আপনার নিজের লিঙ্ক ব্যবহার করতে হবে)
                url: "https://your-website.com/games/scratch-card/",
                status: "active"
            },
            {
                title: "টাইপিং স্পিড",
                description: "দ্রুত টাইপ করে আপনার দক্ষতা দেখান এবং পয়েন্ট অর্জন করুন।",
                icon: "fas fa-keyboard",
                url: "#",
                status: "coming-soon"
            },
            {
                title: "টিক-ট্যাক-টো",
                description: "ক্লাসিক এই গেমটি খেলে বুদ্ধির পরীক্ষা দিন এবং প্রতিপক্ষকে হারান।",
                icon: "fas fa-times",
                url: "#",
                status: "coming-soon"
            }
        ];

        gamesData.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';

            let buttonHtml = `<a href="${game.url}" class="game-play-btn">খেলুন</a>`;
            if (game.status === 'coming-soon') {
                gameCard.classList.add('coming-soon');
                // "শীঘ্রই আসছে" বাটনে ক্লিক করা যাবে না
                buttonHtml = `<a href="#" class="game-play-btn" onclick="return false;">শীঘ্রই আসছে</a>`;
            }

            gameCard.innerHTML = `
                ${game.status === 'coming-soon' ? '<div class="coming-soon-badge">Coming Soon</div>' : ''}
                <div class="game-card-icon">
                    <i class="${game.icon}"></i>
                </div>
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                ${buttonHtml}
            `;
            gamesGrid.appendChild(gameCard);
        });
    }
});