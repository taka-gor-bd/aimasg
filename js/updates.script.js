// ==========================================================================
// UPDATES PAGE SCRIPT (updates.script.js) - সম্পূর্ণ এবং চূড়ান্ত ভার্সন
// ==========================================================================

// গ্লোবাল ভ্যারিয়েবলগুলো এখানে রাখা হয়েছে
let currentUserId = null;
let currentUserData = {};
let activePostIdForComment = null;
let activeCommentsListener = null;

// DOM লোড হয়ে গেলে এই ফাংশনটি কাজ শুরু করবে
document.addEventListener('DOMContentLoaded', () => {
    // ব্যবহারকারী লগইন করা আছে কিনা তা চেক করা হচ্ছে
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            
            // --- প্রোফাইল লোডিং এবং ক্যাশিং ---
            // প্রথমে ব্রাউজারের মেমোরি থেকে সেভ করা ডেটা দেখানোর চেষ্টা করা হবে
            const cachedData = localStorage.getItem('currentUserData');
            if (cachedData) {
                currentUserData = JSON.parse(cachedData);
                updateCommentSectionUI(); // কমেন্ট সেকশনের UI আপডেট করা
            }
            
            // এখন সার্ভার থেকে লাইভ ডেটা আনা হবে এবং যেকোনো পরিবর্তনের জন্য শোনা হবে
            fetchAndListenUserData(user.uid);

            // --- মূল ফাংশন কল ---
            fetchAllAdminUpdates(user.uid); // সকল আপডেট পোস্ট লোড করা
            setupCommentSheetListeners(); // কমেন্ট শিটের বাটনগুলো সেটআপ করা

        } else {
            // লগইন করা না থাকলে লগইন পেইজে পাঠিয়ে দেওয়া হবে
            console.log("ব্যবহারকারী লগইন করা নেই, লগইন পেজে পাঠানো হচ্ছে।");
            window.location.href = 'login.html';
        }
    });
});

/**
 * ব্যবহারকারীর তথ্য সার্ভার থেকে আনে এবং রিয়েল-টাইমে যেকোনো পরিবর্তনের জন্য শোনে।
 * @param {string} userId - ব্যবহারকারীর ইউনিক আইডি
 */
function fetchAndListenUserData(userId) {
    const userRef = database.ref('users/' + userId);
    userRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            currentUserData = snapshot.val();
            // নতুন ডেটা ব্রাউজারের মেমোরিতে সেভ করে রাখা হয়
            localStorage.setItem('currentUserData', JSON.stringify(currentUserData));
            updateCommentSectionUI(); // নতুন ডেটা দিয়ে UI আবার আপডেট করা হয়
        } else {
            console.warn("বর্তমান ব্যবহারকারীর ডেটাবেসে কোনো তথ্য পাওয়া যায়নি।");
            currentUserData = { name: "Guest User", profilePic: 'images/default-avatar.png' };
            updateCommentSectionUI();
        }
    }, (error) => {
        console.error("ব্যবহারকারীর তথ্য আনতে ব্যর্থ:", error);
    });
}

/**
 * ব্যবহারকারীর প্রোফাইল ডেটা পাওয়ার পর কমেন্ট সেকশনের UI (ছবি ও ইনপুট বক্স) আপডেট করে।
 */
function updateCommentSectionUI() {
    const userAvatar = document.getElementById('currentUserCommentAvatar');
    const commentInputField = document.getElementById('comment-input-field');
    const postBtn = document.getElementById('post-comment-btn');

    if (userAvatar && currentUserData.profilePic) {
        userAvatar.src = currentUserData.profilePic;
    }

    if (commentInputField && currentUserData.name) {
        commentInputField.placeholder = "আপনার মন্তব্য লিখুন...";
        commentInputField.disabled = false;
        postBtn.disabled = commentInputField.value.trim() === '';
    }
}

/**
 * অ্যাডমিনের সকল পোস্ট ডেটাবেস থেকে নিয়ে আসে এবং প্রদর্শন করে।
 * @param {string} userId - বর্তমানে লগইন করা ব্যবহারকারীর আইডি
 */
function fetchAllAdminUpdates(userId) {
    const updatesRef = database.ref('updates').orderByChild('timestamp');
    const updatesContainer = document.getElementById('updates-container');
    const loadingText = document.getElementById('loading-text');

    updatesRef.on('value', async (snapshot) => {
        updatesContainer.innerHTML = ''; // আগের কন্টেন্ট মুছে ফেলা হলো

        if (snapshot.exists()) {
            let updates = [];
            snapshot.forEach(child => {
                updates.push({ id: child.key, ...child.val() });
            });
            updates.reverse(); // নতুন পোস্ট আগে দেখানোর জন্য

            const userLikesSnapshot = await database.ref(`/userLikes/${userId}`).once('value');
            const userLikes = userLikesSnapshot.val() || {};

            updates.forEach(post => {
                const userHasLiked = userLikes.hasOwnProperty(post.id);
                const postCard = createUpdateCard(post, userId, userHasLiked);
                updatesContainer.appendChild(postCard);
            });
        } else {
            updatesContainer.innerHTML = '<p class="loading-text">এখনও কোনো নতুন আপডেট নেই।</p>';
        }

        if (loadingText) loadingText.style.display = 'none'; // লোডিং টেক্সট হাইড করা
    }, error => {
        console.error("অ্যাডমিন আপডেট আনতে ব্যর্থ:", error);
        if (loadingText) loadingText.textContent = "আপডেট লোড করা যায়নি।";
    });
}

/**
 * একটি পোস্টের ডেটা দিয়ে তার জন্য একটি HTML কার্ড তৈরি করে।
 * @param {object} post - পোস্টের সকল তথ্য
 * @param {string} userId - বর্তমান ব্যবহারকারীর আইডি
 * @param {boolean} userHasLiked - ব্যবহারকারী এই পোস্টে লাইক দিয়েছে কিনা
 * @returns {HTMLElement} - পোস্টের জন্য তৈরি করা HTML এলিমেন্ট
 */
function createUpdateCard(post, userId, userHasLiked) {
    const postCard = document.createElement('div');
    postCard.className = 'card feed-card';
    postCard.dataset.postId = post.id;
    const postDate = new Date(post.timestamp).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' });

    postCard.innerHTML = `
        <div class="feed-header">
            <div class="feed-user-info">
                <img src="https://api.dicebear.com/9.x/initials/svg?seed=Admin" alt="Admin">
                <div class="feed-user">
                    <div class="name-wrapper">
                        <span class="name">অ্যাডমিন</span>
                        <div class="verified-badge active"><i class="fas fa-check"></i></div>
                    </div>
                    <p class="time">${postDate}</p>
                </div>
            </div>
        </div>
        <div class="feed-body">
            <h4>${post.title}</h4>
            <p>${post.message.replace(/\n/g, '<br>')}</p>
        </div>
        <div class="feed-footer">
            <div class="footer-action like-btn ${userHasLiked ? 'liked' : ''}">
                <i class="fas fa-thumbs-up"></i> <span>${formatCount(post.likeCount || 0)}</span>
            </div>
            <div class="footer-action comment-btn">
                <i class="fas fa-comment"></i> <span>${formatCount(post.commentsCount || 0)}</span>
            </div>
            <div class="footer-action share-btn">
                <i class="fas fa-share"></i>
            </div>
        </div>
    `;

    postCard.querySelector('.like-btn').addEventListener('click', () => handleLike(post.id, userId));
    postCard.querySelector('.comment-btn').addEventListener('click', () => openCommentSheet(post.id));
    return postCard;
}

/**
 * লাইক বাটনে ক্লিকের ইভেন্ট পরিচালনা করে।
 * @param {string} postId - যে পোস্টে লাইক দেওয়া হয়েছে তার আইডি
 * @param {string} userId - যে ব্যবহারকারী লাইক দিয়েছে তার আইডি
 */
async function handleLike(postId, userId) {
    const userLikesRef = database.ref(`userLikes/${userId}/${postId}`);
    const likeCountRef = database.ref(`updates/${postId}/likeCount`);
    const likeButton = document.querySelector(`.feed-card[data-post-id="${postId}"] .like-btn`);
    const likeCountSpan = likeButton.querySelector('span');
    
    const hasLiked = likeButton.classList.contains('liked');
    const currentLikes = parseInt(likeCountSpan.textContent.replace('K', '000').replace('M', '000000')) || 0;
    
    likeButton.classList.toggle('liked');
    likeCountSpan.textContent = formatCount(hasLiked ? currentLikes - 1 : currentLikes + 1);

    try {
        await likeCountRef.transaction(currentLikesInDb => {
            if (hasLiked) {
                userLikesRef.remove();
                return (currentLikesInDb || 1) - 1;
            } else {
                userLikesRef.set(true);
                return (currentLikesInDb || 0) + 1;
            }
        });
    } catch (error) {
        console.error("লাইক অপারেশন ব্যর্থ:", error);
        likeButton.classList.toggle('liked');
        likeCountSpan.textContent = formatCount(currentLikes);
        alert("লাইক দেওয়া যায়নি। আবার চেষ্টা করুন।");
    }
}

/**
 * কমেন্ট শিটটি (নিচের পপ-আপ) খুলে দেয়।
 * @param {string} postId - যে পোস্টের জন্য কমেন্ট শিট খুলবে তার আইডি
 */
function openCommentSheet(postId) {
    activePostIdForComment = postId;
    const overlay = document.getElementById('comment-sheet-overlay');
    const commentList = document.getElementById('comment-list');
    commentList.innerHTML = '<p class="loading-text">মন্তব্য লোড হচ্ছে...</p>';
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    fetchComments(postId);
}

/**
 * কমেন্ট শিট বন্ধ করার এবং কমেন্ট পোস্ট করার জন্য প্রয়োজনীয় ইভেন্ট লিসেনার সেট করে।
 */
function setupCommentSheetListeners() {
    const overlay = document.getElementById('comment-sheet-overlay');
    const closeBtn = document.getElementById('close-sheet-btn');
    const postBtn = document.getElementById('post-comment-btn');
    const inputField = document.getElementById('comment-input-field');

    inputField.placeholder = "প্রোফাইল লোড হচ্ছে...";
    inputField.disabled = true;
    postBtn.disabled = true;

    const closeSheet = () => {
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        if (activeCommentsListener && activePostIdForComment) {
            database.ref(`comments/${activePostIdForComment}`).off('value', activeCommentsListener);
        }
        activePostIdForComment = null;
    };

    overlay.addEventListener('click', closeSheet);
    closeBtn.addEventListener('click', closeSheet);
    document.getElementById('comment-sheet-content').addEventListener('click', e => e.stopPropagation());

    inputField.addEventListener('input', () => {
        if (!inputField.disabled) {
            postBtn.disabled = inputField.value.trim() === '';
        }
    });

    postBtn.addEventListener('click', postNewComment);
}

/**
 * একটি নির্দিষ্ট পোস্টের সকল কমেন্ট নিয়ে আসে এবং প্রদর্শন করে।
 * @param {string} postId - পোস্টের আইডি
 */
function fetchComments(postId) {
    const commentsRef = database.ref(`comments/${postId}`).orderByChild('timestamp');
    const commentList = document.getElementById('comment-list');
    
    activeCommentsListener = commentsRef.on('value', snapshot => {
        commentList.innerHTML = '';
        if (snapshot.exists()) {
            let comments = [];
            snapshot.forEach(child => comments.push(child.val()));
            comments.reverse();

            comments.forEach(comment => {
                const commentElement = createCommentElement(comment);
                commentList.appendChild(commentElement);
            });
        } else {
            commentList.innerHTML = '<p style="text-align:center; color: #888;">এখনও কোনো মন্তব্য নেই।</p>';
        }
    }, error => {
        console.error("কমেন্ট আনতে ব্যর্থ:", error);
        commentList.innerHTML = '<p style="text-align:center; color: red;">মন্তব্য লোড করা যায়নি।</p>';
    });
}

/**
 * একটি কমেন্টের ডেটা দিয়ে তার জন্য একটি HTML এলিমেন্ট তৈরি করে।
 * @param {object} comment - কমেন্টের তথ্য
 * @returns {HTMLElement} - কমেন্টের জন্য তৈরি করা HTML এলিমেন্ট
 */
function createCommentElement(comment) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.innerHTML = `
        <img src="${comment.authorAvatar || 'images/default-avatar.png'}" alt="${comment.authorName}">
        <div class="comment-body">
            <p class="comment-author">${comment.authorName}</p>
            <p class="comment-text">${comment.text}</p>
        </div>
    `;
    return div;
}

/**
 * নতুন কমেন্ট ডেটাবেসে পোস্ট করে।
 */
async function postNewComment() {
    const inputField = document.getElementById('comment-input-field');
    const postBtn = document.getElementById('post-comment-btn');
    const commentText = inputField.value.trim();

    if (commentText === '' || !activePostIdForComment || !currentUserData.name) {
        if(!currentUserData.name) alert("আপনার ইউজার প্রোফাইল লোড হয়নি, দয়া করে আবার চেষ্টা করুন।");
        return;
    }

    postBtn.disabled = true;
    postBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

    const newComment = {
        authorId: currentUserId,
        authorName: currentUserData.name,
        authorAvatar: currentUserData.profilePic || 'images/default-avatar.png',
        text: commentText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    try {
        const commentRef = database.ref(`comments/${activePostIdForComment}`).push();
        await commentRef.set(newComment);
        await database.ref(`updates/${activePostIdForComment}/commentsCount`).transaction(count => (count || 0) + 1);
        inputField.value = '';
    } catch (error) {
        console.error("কমেন্ট পোস্ট করতে ব্যর্থ:", error);
        alert("মন্তব্য পোস্ট করা যায়নি।");
    } finally {
        postBtn.disabled = false;
        postBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
    }
}

/**
 * সংখ্যাকে ফরম্যাট করে (যেমন: 1200 কে 1.2K দেখায়)।
 * @param {number} count - সংখ্যা
 * @returns {string} - ফরম্যাট করা স্ট্রিং
 */
function formatCount(count) {
    if (count === null || count === undefined) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    return count.toString();
}
