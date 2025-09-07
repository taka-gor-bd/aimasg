// ==========================================================================
// HOMEPAGE SCRIPT (home.script.js) - চূড়ান্ত, নির্ভুল এবং মসৃণ ভার্সন
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            fetchHomepageData(currentUserId);
            fetchAdminUpdates(currentUserId);
        }
    });

    const postOptionsOverlay = document.getElementById('post-options-overlay');
    if (postOptionsOverlay) {
        postOptionsOverlay.addEventListener('click', () => {
            postOptionsOverlay.style.display = 'none';
        });
    }
});

function fetchHomepageData(userId) { /* ... এই অংশটি আগের মতোই অপরিবর্তিত ... */
    const userRef = database.ref('users/' + userId);
    userRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const todayEarningEl = document.getElementById('today-earning');
            const totalBalanceEl = document.getElementById('total-balance');
            const today = new Date().toISOString().split('T')[0];
            if (data.lastEarningResetDate !== today) {
                userRef.update({ todayEarning: 0, lastEarningResetDate: today });
            }
            if (todayEarningEl) { todayEarningEl.textContent = `৳ ${data.todayEarning ? data.todayEarning.toFixed(2) : '0.00'}`; }
            if (totalBalanceEl) { totalBalanceEl.textContent = `৳ ${data.balance ? data.balance.toFixed(2) : '0.00'}`; }
        }
    });
}

/**
 * Firebase থেকে সর্বশেষ ২টি অ্যাডমিন পোস্ট লোড করে।
 */
function fetchAdminUpdates(userId) {
    const updatesRef = database.ref('updates').orderByChild('timestamp').limitToLast(2);
    const feedContainer = document.getElementById('feed-container');

    updatesRef.on('value', (snapshot) => {
        feedContainer.innerHTML = '';
        if (snapshot.exists()) {
            let updates = [];
            snapshot.forEach(child => updates.push({ id: child.key, ...child.val() }));
            updates.reverse().forEach(async (post) => {
                const userLikeSnapshot = await database.ref(`/userLikes/${userId}/${post.id}`).once('value');
                const userHasLiked = userLikeSnapshot.exists();
                feedContainer.appendChild(createPostCard(post, userId, userHasLiked));
            });
        } else {
            feedContainer.innerHTML = '<p class="loading-text">এখনও কোনো নতুন আপডেট নেই।</p>';
        }
    });
}

function formatCount(count) { /* ... এই অংশটি আগের মতোই অপরিবর্তিত ... */
    if (!count) return '0';
    if (count >= 1000000) return (count / 1000000).toFixed(1).replace('.0', '') + 'M';
    if (count >= 1000) return (count / 1000).toFixed(1).replace('.0', '') + 'K';
    return count.toString();
}

/**
 * একটি পোস্টের জন্য HTML কার্ড তৈরি করে।
 */
function createPostCard(post, userId, userHasLiked) {
    const postCard = document.createElement('div');
    postCard.className = 'card feed-card';
    postCard.dataset.postId = post.id;

    // পোস্টের ডেটা
    const postDate = new Date(post.timestamp).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long' });
    const likesCount = post.likeCount || 0;
    const commentsCount = post.commentsCount || 0;
    const viewsCount = post.views || 0;
    const authorHasBlueTick = post.authorIsVerified || true;

    postCard.innerHTML = `
        <div class="feed-header">
            <div class="feed-user-info">
                <img src="https://api.dicebear.com/9.x/initials/svg?seed=Admin" alt="Admin">
                <div class="feed-user">
                    <div class="name-wrapper">
                        <span class="name">অ্যাডমিন</span>
                        ${authorHasBlueTick ? '<div class="verified-badge active" style="width:14px; height:14px; font-size:8px;"><i class="fas fa-check"></i></div>' : ''}
                    </div>
                    <p class="time">${postDate}</p>
                </div>
            </div>
            <button class="post-options-btn"><i class="fas fa-ellipsis-h"></i></button>
        </div>
        <div class="feed-body">
            <h4>${post.title}</h4>
            <p>${post.message.substring(0, 120)}...</p>
            <div class="view-counter-body">
                <i class="fas fa-eye"></i> <span>${formatCount(viewsCount)}</span>
            </div>
        </div>
        <div class="feed-footer">
            <div class="footer-action like-btn ${userHasLiked ? 'liked' : ''}">
                <i class="fas fa-thumbs-up"></i> <span>${formatCount(likesCount)}</span>
            </div>
            <div class="footer-action comment-btn">
                <i class="fas fa-comment"></i> <span>${formatCount(commentsCount)}</span>
            </div>
            <div class="footer-action share-btn">
                <i class="fas fa-share"></i>
            </div>
        </div>
    `;

    // ভিউ কাউন্ট বাড়ানোর লজিক
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            setTimeout(() => {
                if (entries[0].isIntersecting) {
                    const viewedPosts = JSON.parse(sessionStorage.getItem('viewedPosts')) || [];
                    if (!viewedPosts.includes(post.id)) {
                        database.ref(`updates/${post.id}/views`).transaction(v => (v || 0) + 1);
                        viewedPosts.push(post.id);
                        sessionStorage.setItem('viewedPosts', JSON.stringify(viewedPosts));
                    }
                }
            }, 2000);
            observer.disconnect();
        }
    }, { threshold: 0.5 });
    observer.observe(postCard);

    // ইভেন্ট লিসেনার
    postCard.querySelector('.like-btn').addEventListener('click', e => { e.stopPropagation(); handleLike(post.id, userId, userHasLiked); });
    postCard.querySelector('.comment-btn').addEventListener('click', e => { e.stopPropagation(); window.location.href = `updates.html#${post.id}`; });
    postCard.querySelector('.share-btn').addEventListener('click', e => { e.stopPropagation(); alert("শেয়ার ফিচার শীঘ্রই আসছে!"); });
    postCard.querySelector('.post-options-btn').addEventListener('click', e => { e.stopPropagation(); openPostOptionsMenu(e.currentTarget, post.id, false); });

    return postCard;
}

/**
 * লাইক দেওয়া বা তুলে নেওয়ার চূড়ান্ত এবং নির্ভুল ফাংশন।
 * @param {boolean} hasLiked - ব্যবহারকারী আগে থেকেই লাইক দিয়েছেন কি না।
 */
function handleLike(postId, userId, hasLiked) {
    const likeCountRef = database.ref(`updates/${postId}/likeCount`);
    const postLikesRef = database.ref(`postLikes/${postId}/${userId}`);
    const userLikesRef = database.ref(`userLikes/${userId}/${postId}`);

    // UI-তে তাৎক্ষণিক পরিবর্তন দেখানো হচ্ছে, ঝাঁকুনি এড়ানোর জন্য
    const likeButton = document.querySelector(`.feed-card[data-post-id="${postId}"] .like-btn`);
    const likeCountSpan = likeButton.querySelector('span');
    let currentCount = parseInt(likeCountSpan.textContent.replace('K','000').replace('M','000000'));

    if (hasLiked) {
        // --- আনলাইক ---
        likeButton.classList.remove('liked');
        likeCountSpan.textContent = formatCount(currentCount - 1);
        
        // ডেটাবেস থেকে লাইক মুছে ফেলা হচ্ছে
        likeCountRef.transaction(count => (count || 1) - 1);
        postLikesRef.remove();
        userLikesRef.remove();
    } else {
        // --- লাইক ---
        likeButton.classList.add('liked');
        likeCountSpan.textContent = formatCount(currentCount + 1);
        
        // ডেটাবেসে লাইক যোগ করা হচ্ছে
        likeCountRef.transaction(count => (count || 0) + 1);
        postLikesRef.set(true);
        userLikesRef.set(true);
    }
}

function openPostOptionsMenu(button, postId, isOwner) { /* ... এই অংশটি আগের মতোই অপরিবর্তিত ... */ }
