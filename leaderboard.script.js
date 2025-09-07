// ==========================================================================
// LEADERBOARD PAGE SCRIPT (leaderboard.script.js)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) {
            fetchLeaderboardData(user.uid);
            setupModalEventListeners();
        } else {
            window.location.replace('index.html');
        }
    });
});

/**
 * Firebase থেকে ব্যবহারকারীদের তথ্য এনে লিডারবোর্ড তৈরি করে
 * @param {string} currentUserId - বর্তমানে লগইন করা ব্যবহারকারীর UID
 */
async function fetchLeaderboardData(currentUserId) {
    const usersRef = database.ref('users').orderByChild('balance');
    const container = document.getElementById('leaderboard-container');

    try {
        const snapshot = await usersRef.once('value');
        if (!snapshot.exists()) {
            container.innerHTML = '<p class="loading-text">কোনো ব্যবহারকারী পাওয়া যায়নি।</p>';
            return;
        }

        const users = [];
        snapshot.forEach(childSnapshot => {
            // শুধুমাত্র প্রয়োজনীয় ডেটা অ্যারেতে রাখা হচ্ছে
            const user = childSnapshot.val();
            users.push({
                uid: childSnapshot.key,
                username: user.username,
                avatarUrl: user.avatarUrl,
                balance: user.balance || 0,
                isSubscriptionUser: user.isSubscriptionUser || false
            });
        });

        // ব্যালেন্স অনুযায়ী বড় থেকে ছোট ক্রমে সাজানো
        users.reverse();

        renderLeaderboard(users, currentUserId);
    } catch (error) {
        console.error("লিডারবোর্ড লোড করতে সমস্যা হয়েছে:", error);
        container.innerHTML = '<p class="loading-text">লিডারবোর্ড লোড করা যায়নি।</p>';
    }
}

/**
 * ব্যবহারকারীদের তালিকা UI-তে প্রদর্শন করে
 * @param {Array} users - সাজানো ব্যবহারকারীদের তালিকা
 * @param {string} currentUserId - বর্তমানে লগইন করা ব্যবহারকারীর UID
 */
function renderLeaderboard(users, currentUserId) {
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = ''; // পুরোনো ডেটা মুছে ফেলা

    users.forEach((user, index) => {
        const rank = index + 1;
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.dataset.uid = user.uid; // ব্যবহারকারীর UID ডেটাসেটে রাখা হচ্ছে

        item.innerHTML = `
            <div class="rank-number">${rank}</div>
            <img src="${user.avatarUrl || 'images/avatar-placeholder.png'}" alt="${user.username}" class="leaderboard-avatar">
            <div class="user-info">
                <div class="user-details">
                    <div class="user-name">
                        ${user.username}
                        ${user.isSubscriptionUser ? '<i class="fas fa-check-circle verified-badge"></i>' : ''}
                    </div>
                    <div class="user-balance">ব্যালেন্স: ৳ ${user.balance.toFixed(2)}</div>
                </div>
                <div class="balance-display">
                    <i class="fas fa-chevron-right"></i>
                </div>
            </div>
        `;

        // প্রতিটি আইটেমে ক্লিক করলে মডাল খোলার জন্য ইভেন্ট লিসেনার
        item.addEventListener('click', () => openUserDetailsModal(user.uid, currentUserId));
        container.appendChild(item);
    });
}

/**
 * ব্যবহারকারীর বিস্তারিত তথ্যসহ মডাল খোলে
 * @param {string} targetUid - যার প্রোফাইল দেখা হবে তার UID
 * @param {string} currentUserId - বর্তমানে লগইন করা ব্যবহারকারীর UID
 */
async function openUserDetailsModal(targetUid, currentUserId) {
    const modalOverlay = document.getElementById('user-details-modal-overlay');
    const userRef = database.ref('users/' + targetUid);

    try {
        const snapshot = await userRef.once('value');
        const userData = snapshot.val();
        if (!userData) return;

        // মডালের DOM এলিমেন্টগুলো আপডেট করা
        document.getElementById('modal-avatar').src = userData.avatarUrl || 'images/avatar-placeholder.png';
        document.getElementById('modal-profile-link').textContent = userData.username;
        document.getElementById('modal-profile-link').href = `profile.html?uid=${targetUid}`;
        document.getElementById('modal-username').textContent = `@${userData.username.toLowerCase()}`;
        
        const followersCount = userData.followers ? Object.keys(userData.followers).length : 0;
        const followingCount = userData.following ? Object.keys(userData.following).length : 0;
        // পোস্ট সংখ্যা গণনা করতে Firebase Query ব্যবহার করা ভালো
        const postsSnapshot = await database.ref('posts').orderByChild('authorUid').equalTo(targetUid).once('value');
        
        document.getElementById('modal-posts-count').textContent = postsSnapshot.numChildren();
        document.getElementById('modal-followers-count').textContent = followersCount;
        document.getElementById('modal-balance').textContent = `৳ ${(userData.balance || 0).toFixed(2)}`;
        
        // ফলো বাটন সেটআপ করা
        const followBtnContainer = document.getElementById('modal-follow-btn-container');
        if (targetUid === currentUserId) {
            followBtnContainer.innerHTML = ''; // নিজের প্রোফাইলে ফলো বাটন থাকবে না
        } else {
            const isFollowing = userData.followers && userData.followers[currentUserId];
            followBtnContainer.innerHTML = `
                <button class="follow-btn ${isFollowing ? 'following' : ''}">
                    <i class="fas fa-${isFollowing ? 'check' : 'user-plus'}"></i>
                    ${isFollowing ? 'Following' : 'Follow'}
                </button>
            `;
            followBtnContainer.querySelector('.follow-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                handleFollowToggle(targetUid, currentUserId, isFollowing, e.currentTarget);
            });
        }

        modalOverlay.classList.add('active');
    } catch (error) {
        console.error("ব্যবহারকারীর তথ্য আনতে সমস্যা হয়েছে:", error);
    }
}

/**
 * মডাল বন্ধ করার জন্য ইভেন্ট লিসেনার সেটআপ করে
 */
function setupModalEventListeners() {
    const modalOverlay = document.getElementById('user-details-modal-overlay');
    const closeModalBtn = document.getElementById('close-user-details-modal');
    
    // বাইরে ক্লিক করলে বা ক্লোজ বাটনে ক্লিক করলে মডাল বন্ধ হবে
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.classList.remove('active');
        }
    });
    closeModalBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });
}

/**
 * ফলো/আনফলো করার ফাংশন
 * @param {string} targetUid - যাকে ফলো করা হবে তার UID
 * @param {string} currentUserId - যে ফলো করছে তার UID
 * @param {boolean} isCurrentlyFollowing - বর্তমানে কি ফলো করা আছে?
 * @param {HTMLElement} button - যে বাটনে ক্লিক করা হয়েছে
 */
async function handleFollowToggle(targetUid, currentUserId, isCurrentlyFollowing, button) {
    const currentUserFollowingRef = database.ref(`users/${currentUserId}/following/${targetUid}`);
    const targetUserFollowersRef = database.ref(`users/${targetUid}/followers/${currentUserId}`);

    button.disabled = true; // ডাবল ক্লিক এড়ানো

    try {
        if (isCurrentlyFollowing) {
            // আনফলো
            await currentUserFollowingRef.remove();
            await targetUserFollowersRef.remove();
            button.classList.remove('following');
            button.innerHTML = `<i class="fas fa-user-plus"></i> Follow`;
        } else {
            // ফলো
            await currentUserFollowingRef.set(true);
            await targetUserFollowersRef.set(true);
            button.classList.add('following');
            button.innerHTML = `<i class="fas fa-check"></i> Following`;
        }
        // রিয়েল-টাইম আপডেটের জন্য আবার fetch করার প্রয়োজন নেই, তবে UI তে পরিবর্তন দেখানো হলো
    } catch (error) {
        console.error("Follow toggle failed:", error);
    } finally {
        button.disabled = false;
        // একটি নতুন ফাংশন কল করে মডালটি রিফ্রেশ করা যেতে পারে
        openUserDetailsModal(targetUid, currentUserId);
    }
}