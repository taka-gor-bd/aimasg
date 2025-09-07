// ==========================================================================
// QUIZ PAGE SCRIPT (quiz.script.js) - Today's Earning Fixed
// ==========================================================================

// --- কুইজের প্রশ্নসমূহ ---
const quizQuestions = [
    {
        question: "১. একটি ত্রিভুজের তিন কোণের সমষ্টি কত?",
        options: ["A. 90°", "B. 180°", "C. 270°", "D. 360°"],
        correctAnswer: 1
    },
    {
        question: "২. যদি ৫টি কলমের দাম ৭৫ টাকা হয়, তবে ১২টি কলমের দাম কত?",
        options: ["A. ১৫০ টাকা", "B. ১৬০ টাকা", "C. ১৮০ টাকা", "D. ২০০ টাকা"],
        correctAnswer: 2
    },
    {
        question: "৩. কোনটি মৌলিক সংখ্যা?",
        options: ["A. ৪", "B. ৯", "C. ১২", "D. ১৭"],
        correctAnswer: 3
    },
    {
        question: "৪. একটি ঘড়িতে যখন ৩:১৫ বাজে, তখন ঘণ্টা ও মিনিটের কাঁটার মধ্যে কোণ কত ডিগ্রি?",
        options: ["A. ০°", "B. ৭.৫°", "C. ১৫°", "D. ২২.৫°"],
        correctAnswer: 1
    },
    {
        question: "৫. x + 8 = 15 হলে, x এর মান কত?",
        options: ["A. 5", "B. 6", "C. 7", "D. 8"],
        correctAnswer: 2
    }
];

const TOTAL_ATTEMPTS = 3;
const REWARD_PER_CORRECT_ANSWER = 0.40;
let currentUserId = null;
let currentQuestionIndex = 0;
let score = 0;
let earningsThisRound = 0;
let questionTimer;

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            checkQuizStatus(currentUserId);
        } else {
            window.location.replace('index.html');
        }
    });

    document.getElementById('prepare-quiz-btn').addEventListener('click', showReadyCheck);
    document.getElementById('start-quiz-btn').addEventListener('click', startQuiz);
    document.getElementById('next-question-btn').addEventListener('click', nextQuestion);
    document.getElementById('back-to-quiz-home-btn').addEventListener('click', () => checkQuizStatus(currentUserId));
});

async function checkQuizStatus(userId) {
    showScreen('quiz-start-screen');
    const userRef = database.ref(`users/${userId}/quizStats`);
    const snapshot = await userRef.once('value');
    const stats = snapshot.val();
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!stats || (now - (stats.lastPlayTimestamp || 0) > oneDay)) {
        await userRef.set({ plays: 0, lastPlayTimestamp: now });
        document.getElementById('quiz-attempts-left').textContent = `আজকের জন্য আপনার সুযোগ বাকি আছে: ${TOTAL_ATTEMPTS}/৩`;
        document.getElementById('prepare-quiz-btn').disabled = false;
    } else if (stats.plays < TOTAL_ATTEMPTS) {
        document.getElementById('quiz-attempts-left').textContent = `আজকের জন্য আপনার সুযোগ বাকি আছে: ${TOTAL_ATTEMPTS - stats.plays}/৩`;
        document.getElementById('prepare-quiz-btn').disabled = false;
    } else {
        const timeToWait = (stats.lastPlayTimestamp + oneDay) - now;
        showScreen('quiz-cooldown-screen');
        startCooldownTimer(timeToWait);
    }
}

function showReadyCheck() {
    document.getElementById('ready-check-modal-overlay').classList.add('active');
}

function startQuiz() {
    document.getElementById('ready-check-modal-overlay').classList.remove('active');
    currentQuestionIndex = 0;
    score = 0;
    earningsThisRound = 0;
    showScreen('quiz-game-screen');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestionIndex >= quizQuestions.length) {
        endQuiz();
        return;
    }
    const questionData = quizQuestions[currentQuestionIndex];
    document.getElementById('question-text').textContent = questionData.question;
    document.getElementById('current-question-number').textContent = currentQuestionIndex + 1;
    const answerGrid = document.getElementById('answer-grid');
    answerGrid.innerHTML = '';
    questionData.options.forEach((option, index) => {
        const optionElement = document.createElement('button');
        optionElement.className = 'answer-option';
        optionElement.textContent = option;
        optionElement.onclick = () => handleAnswer(index);
        answerGrid.appendChild(optionElement);
    });
    startQuestionTimer();
}

function startQuestionTimer() {
    let timeLeft = 30;
    const timerText = document.getElementById('timer-text');
    const timerProgress = document.getElementById('timer-progress');
    timerText.textContent = timeLeft;
    timerProgress.style.background = `conic-gradient(var(--primary-color) 360deg, #e9ecef 0deg)`;
    questionTimer = setInterval(() => {
        timeLeft--;
        timerText.textContent = timeLeft;
        const degrees = (timeLeft / 30) * 360;
        timerProgress.style.background = `conic-gradient(var(--primary-color) ${degrees}deg, #e9ecef 0deg)`;
        if (timeLeft <= 0) {
            clearInterval(questionTimer);
            handleAnswer(-1);
        }
    }, 1000);
}

function handleAnswer(selectedIndex) {
    clearInterval(questionTimer);
    document.querySelectorAll('.answer-option').forEach(btn => btn.classList.add('disabled'));
    const correctIndex = quizQuestions[currentQuestionIndex].correctAnswer;
    const isCorrect = selectedIndex === correctIndex;
    if (isCorrect) {
        score++;
        earningsThisRound += REWARD_PER_CORRECT_ANSWER;
    }
    showFeedback(isCorrect);
}

function showFeedback(isCorrect) {
    const modal = document.getElementById('feedback-modal-overlay');
    const icon = document.getElementById('feedback-icon');
    const title = document.getElementById('feedback-title');
    const message = document.getElementById('feedback-message');
    if (isCorrect) {
        icon.innerHTML = '🎉';
        icon.classList.remove('shake');
        title.textContent = "সঠিক উত্তর!";
        title.style.color = 'var(--success-color)';
        message.textContent = `অভিনন্দন! আপনি ৳ ${REWARD_PER_CORRECT_ANSWER.toFixed(2)} জিতেছেন।`;
        createConfetti();
    } else {
        icon.innerHTML = '😭';
        icon.classList.add('shake');
        title.textContent = "ভুল উত্তর!";
        title.style.color = 'var(--danger-color)';
        message.textContent = "দুঃখিত, আপনার উত্তরটি সঠিক নয়।";
    }
    const nextBtn = document.getElementById('next-question-btn');
    if (currentQuestionIndex >= quizQuestions.length - 1) {
        nextBtn.textContent = 'ফলাফল দেখুন';
    } else {
        nextBtn.textContent = 'পরবর্তী প্রশ্ন';
    }
    modal.classList.add('active');
}

function nextQuestion() {
    document.getElementById('feedback-modal-overlay').classList.remove('active');
    currentQuestionIndex++;
    loadQuestion();
}

async function endQuiz() {
    const userRef = database.ref(`users/${currentUserId}`);
    const statsRef = database.ref(`users/${currentUserId}/quizStats`);
    
    await statsRef.child('plays').transaction(currentPlays => (currentPlays || 0) + 1);
    await statsRef.child('lastPlayTimestamp').set(Date.now());

    if (earningsThisRound > 0) {
        // মোট ব্যালেন্স যোগ করা
        await userRef.child('balance').transaction(currentBalance => (currentBalance || 0) + earningsThisRound);
        
        // ==========================================================
        // আজকের আয়ের সাথে যোগ করার জন্য নতুন কোড
        // ==========================================================
        await userRef.child('todayEarning').transaction(currentTodayEarning => (currentTodayEarning || 0) + earningsThisRound);
    }

    document.getElementById('summary-score').textContent = `${score}/${quizQuestions.length}`;
    document.getElementById('summary-earnings').textContent = `৳ ${earningsThisRound.toFixed(2)}`;
    showScreen('quiz-summary-screen');
}

function showScreen(screenId) {
    document.querySelectorAll('.quiz-screen').forEach(screen => screen.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function startCooldownTimer(duration) {
    const timerElement = document.getElementById('cooldown-timer');
    let timeLeft = duration;
    const interval = setInterval(() => {
        timeLeft -= 1000;
        if (timeLeft <= 0) {
            clearInterval(interval);
            checkQuizStatus(currentUserId);
            return;
        }
        const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
        const seconds = Math.floor((timeLeft / 1000) % 60);
        timerElement.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#28a745', '#ffc107', '#dc3545', '#0dcaf0'];
    for (let i = 0; i < 100; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(confetti);
    }
}
