// ==========================================================================
// AI SUPPORT PAGE SCRIPT (support.script.js) - v2.0 - Advanced Scoring Engine
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let isAiTyping = false;

    // --- DOM Elements ---
    const chatWindow = document.getElementById('chat-window');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const quickReplyContainer = document.getElementById('quick-reply-container');

    // --- AI Configuration ---
    const CONFIDENCE_THRESHOLD = 10; // AI কতটা নিশ্চিত হলে উত্তর দেবে তার সর্বনিম্ন স্কোর

    // ==========================================================================
    // ADVANCED AI KNOWLEDGE BASE
    // প্রতিটি Intent এর জন্য একাধিক কীওয়ার্ড এবং তাদের স্কোর দেওয়া হয়েছে।
    // ==========================================================================
    const intents = [
        {
            name: 'check_balance',
            keywords: {
                'ব্যালেন্স': 10, 'balance': 10, 'টাকা': 9, 'ট্যাকা': 9, 'টকা': 8, 'আয়': 8, 'earning': 8,
                'কত': 5, 'কতো': 5, 'আছে': 4, 'দেখাও': 4, 'দেখি': 4, 'অ্যাকাউন্টে': 6, 'account': 6, 'আমার': 2
            },
            action: async (userId) => {
                const userRef = database.ref(`users/${userId}/balance`);
                const balance = (await userRef.once('value')).val() || 0;
                return `৳ ${balance.toFixed(2)}`;
            },
            responses: [
                "আপনার বর্তমান অ্যাকাউন্টে {data} রয়েছে।",
                "এই মুহূর্তে আপনার ব্যালেন্স হলো {data}।",
                "আপনার অ্যাকাউন্টে এখন {data} জমা আছে।"
            ],
            followUp: ['আমার পোস্ট কতগুলো?', 'টাকা তুলবো কিভাবে?', 'আমার রেফারেল কয়জন?']
        },
        {
            name: 'check_posts',
            keywords: {
                'পোস্ট': 10, 'post': 10, 'পোস্টগুলো': 9, 'করেছি': 5, 'মোট': 6, 'কয়টা': 5, 'কয়টি': 5, 'সংখ্যা': 6,
                'আমার': 2, 'দেখাও': 4
            },
            action: async (userId) => {
                const postsRef = database.ref('posts').orderByChild('authorUid').equalTo(userId);
                const snapshot = await postsRef.once('value');
                return snapshot.numChildren();
            },
            responses: [
                "আপনি এখন পর্যন্ত মোট {data} টি পোস্ট করেছেন।",
                "আপনার মোট পোস্ট সংখ্যা হলো {data} টি।",
                "আমি দেখতে পাচ্ছি আপনি {data} টি পোস্ট করেছেন। চালিয়ে যান!"
            ],
            followUp: ['আমার রেফারেল কয়জন?', 'আমার ব্যালেন্স কত?']
        },
        {
            name: 'check_referrals',
            keywords: {
                'রেফার': 10, 'refer': 10, 'রেফারেল': 10, 'রেফারেলস': 10, 'সদস্য': 7, 'যোগ': 6, 'দিয়েছে': 5,
                'কয়জন': 5, 'আমার': 2, 'টিম': 8, 'team': 8
            },
            action: async (userId) => {
                const userRef = database.ref(`users/${userId}/referrals`);
                const snapshot = (await userRef.once('value')).val() || {};
                return Object.keys(snapshot).length;
            },
            responses: [
                "আপনার রেফারে মোট {data} জন যোগ দিয়েছেন।",
                "আপনি সফলভাবে {data} জনকে রেফার করেছেন।",
                "আপনার রেফারেল সংখ্যা হলো {data}। আরও রেফার করতে <a href='refer.html'>এখানে ক্লিক করুন</a>।"
            ],
            followUp: ['কিভাবে আয় করবো?', 'আমার ব্যালেন্স কত?']
        },
        {
            name: 'how_to_earn',
            keywords: {
                'কাজ': 10, 'task': 10, 'কাম': 9, 'আয়': 8, 'earn': 8, 'ইনকাম': 8, 'income': 8, 'করবো': 5,
                'কিভাবে': 6, 'উপায়': 7, 'পদ্ধতি': 7
            },
            responses: [
                "আপনি মাইক্রো-জব সম্পন্ন করে আয় করতে পারেন। কাজের তালিকা দেখতে <a href='tasks.html'>'কাজ করুন'</a> পেজে যান।",
                "আয় করার জন্য আমাদের <a href='tasks.html'>কাজ করার</a> পেজটি দেখুন। সেখানে অনেক সহজ কাজ রয়েছে।"
            ],
            followUp: ['টাকা তুলবো কিভাবে?', 'আমার রেফারেল কয়জন?']
        },
        {
            name: 'how_to_withdraw',
            keywords: {
                'উইথড্র': 10, 'withdraw': 10, 'তুলবো': 9, 'তুলব': 9, 'টাকা তুলব': 10, 'পেমেন্ট': 8, 'payment': 8,
                'কিভাবে': 6, 'নিয়ম': 7
            },
            responses: [
                "আপনি আপনার আয় <a href='withdraw.html'>'উইথড্র'</a> পেজ থেকে তুলতে পারবেন।",
                "টাকা তোলার জন্য, অনুগ্রহ করে <a href='withdraw.html'>এই পেজে</a> যান এবং নির্দেশনা অনুসরণ করুন।"
            ],
            followUp: ['আমার ব্যালেন্স কত?']
        },
        {
            name: 'greeting',
            keywords: {
                'হ্যালো': 10, 'হাই': 10, 'hello': 10, 'hi': 10, 'hey': 9, 'কেমন': 6, 'আছো': 5, 'আছেন': 5,
                'আসসালামু': 8, 'আলাইকুম': 8, 'নমস্কার': 9
            },
            responses: [
                "হ্যালো! আপনাকে কিভাবে সাহায্য করতে পারি?",
                "হাই! বলুন কি জানতে চান?",
                "ওয়ালাইকুম আসসালাম! আপনার সেবায় আমি حاضر।"
            ],
            followUp: ['আমার ব্যালেন্স কত?', 'আমার পোস্ট কতগুলো?']
        },
        {
            name: 'gratitude',
            keywords: {
                'ধন্যবাদ': 10, 'thank you': 10, 'thanks': 9, 'অনেক': 3, 'ভালো': 4, 'উপকার': 7
            },
            responses: [
                "আপনাকে স্বাগতম!",
                "আপনাকে সাহায্য করতে পেরে আমি আনন্দিত।",
                "কোনো সমস্যা নেই। আরও কিছু জানার থাকলে বলুন।"
            ],
            followUp: []
        },
        {
            name: 'bot_identity',
            keywords: {
                'তুমি': 8, 'আপনি': 8, 'কে': 9, 'তোমার': 7, 'পরিচয়': 10, 'নাম': 9, 'কি': 4, 'who are you': 10
            },
            responses: [
                "আমি একটি AI অ্যাসিস্ট্যান্ট, আপনার অ্যাকাউন্ট সম্পর্কিত তথ্য দিয়ে সাহায্য করার জন্য এখানে আছি।",
                "আমার নাম Gemini। আমি আপনার পার্সোনাল সাপোর্ট অ্যাসিস্ট্যান্ট।"
            ],
            followUp: ['আমার ব্যালেন্স কত?', 'কিভাবে আয় করবো?']
        }
    ];

    const fallbackResponses = {
        responses: [
            "দুঃখিত, আমি আপনার প্রশ্নটি ঠিক বুঝতে পারিনি। আপনি কি অন্যভাবে চেষ্টা করবেন?",
            " माफ করবেন, এই বিষয়টি আমার জানা নেই। আপনি কি আপনার 'ব্যালেন্স', 'পোস্ট' বা 'কাজ' সম্পর্কে জানতে চান?",
            "আমি এখনও শিখছি। আপনার প্রশ্নটি আরেকবার একটু সহজ করে বলবেন কি?"
        ],
        followUp: ['আমার ব্যালেন্স কত?', 'কাজ সম্পর্কে বলুন', 'আমার রেফারেল কয়জন?']
    };


    // --- Firebase Auth Observer ---
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            addMessageToChat('ai', `হ্যালো! আমি আপনার পার্সোনাল AI অ্যাসিস্ট্যান্ট। আপনার অ্যাকাউন্টের যেকোনো তথ্য জানতে আমাকে প্রশ্ন করতে পারেন।`);
            showQuickReplies(['আমার ব্যালেন্স কত?', 'আমার মোট পোস্ট কত?', 'কাজ সম্পর্কে বলুন']);
        } else {
            window.location.replace('index.html');
        }
    });

    // --- Event Listeners ---
    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleUserInput();
        }
    });
    quickReplyContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('quick-reply-btn')) {
            const query = e.target.dataset.query;
            userInput.value = query;
            handleUserInput();
        }
    });

    /**
     * Handles the user's input from the text field.
     */
    function handleUserInput() {
        const query = userInput.value.trim();
        if (!query || isAiTyping) return;

        addMessageToChat('user', query);
        userInput.value = '';
        quickReplyContainer.innerHTML = '';
        quickReplyContainer.style.display = 'none';

        showTypingIndicator();
        isAiTyping = true;

        setTimeout(() => {
            processQuery(query, currentUserId);
        }, 1500);
    }

    /**
     * Processes the user's query using the scoring engine.
     * @param {string} query - The user's question.
     * @param {string} userId - The current user's UID.
     */
    async function processQuery(query, userId) {
        const lowerCaseQuery = query.toLowerCase();
        // 1. Tokenization: বাক্যকে শব্দে বিভক্ত করা
        const tokens = lowerCaseQuery.split(/\s+/).filter(token => token.length > 0);
        
        let intentScores = {};

        // 2. Scoring: প্রতিটি intent এর জন্য স্কোর গণনা করা
        for (const intent of intents) {
            let currentScore = 0;
            for (const token of tokens) {
                if (intent.keywords[token]) {
                    currentScore += intent.keywords[token];
                }
            }
            intentScores[intent.name] = currentScore;
        }

        // 3. Find Best Intent: সর্বোচ্চ স্কোর পাওয়া intent খুঁজে বের করা
        let bestIntentName = null;
        let maxScore = 0;
        for (const intentName in intentScores) {
            if (intentScores[intentName] > maxScore) {
                maxScore = intentScores[intentName];
                bestIntentName = intentName;
            }
        }

        let responseText = "";
        let followUpQuestions = [];

        try {
            // 4. Confidence Check: স্কোর কি যথেষ্ট?
            if (bestIntentName && maxScore >= CONFIDENCE_THRESHOLD) {
                const matchedIntent = intents.find(intent => intent.name === bestIntentName);
                
                let data = null;
                if (matchedIntent.action) {
                    data = await matchedIntent.action(userId);
                }

                const randomResponseTemplate = matchedIntent.responses[Math.floor(Math.random() * matchedIntent.responses.length)];
                responseText = data !== null ? randomResponseTemplate.replace('{data}', data) : randomResponseTemplate;
                followUpQuestions = matchedIntent.followUp;

            } else {
                // Fallback: যদি কোনো intent যথেষ্ট স্কোর না পায়
                responseText = fallbackResponses.responses[Math.floor(Math.random() * fallbackResponses.responses.length)];
                followUpQuestions = fallbackResponses.followUp;
            }
        } catch (error) {
            console.error("AI processing error:", error);
            responseText = "দুঃখিত, তথ্য আনতে একটি প্রযুক্তিগত সমস্যা হয়েছে।";
        }

        hideTypingIndicator();
        isAiTyping = false;
        addMessageToChat('ai', responseText);

        if (followUpQuestions && followUpQuestions.length > 0) {
            showQuickReplies(followUpQuestions);
        }
    }

    // --- UI Functions ---

    function addMessageToChat(sender, message) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `chat-message ${sender}-msg`;
        let messageHtml = sender === 'ai' ?
            `<div class="avatar"><i class="fas fa-robot"></i></div><div class="message-bubble">${message}</div>` :
            `<div class="message-bubble">${message}</div>`;
        messageWrapper.innerHTML = messageHtml;
        chatWindow.appendChild(messageWrapper);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showQuickReplies(replies) {
        quickReplyContainer.innerHTML = '';
        replies.forEach(reply => {
            const button = document.createElement('button');
            button.className = 'quick-reply-btn';
            button.dataset.query = reply;
            button.textContent = reply;
            quickReplyContainer.appendChild(button);
        });
        quickReplyContainer.style.display = 'flex';
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function showTypingIndicator() {
        if (document.getElementById('typing-indicator')) return;
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typing-indicator';
        typingIndicator.className = 'chat-message ai-msg';
        typingIndicator.innerHTML = `
            <div class="avatar"><i class="fas fa-robot"></i></div>
            <div class="message-bubble typing-indicator">
                <span></span><span></span><span></span>
            </div>`;
        chatWindow.appendChild(typingIndicator);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
});