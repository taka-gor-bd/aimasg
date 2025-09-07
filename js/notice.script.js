document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;

    const noticeContainer = document.getElementById('notice-list-container');
    const noticeModal = document.getElementById('notice-modal');
    const closeModalBtn = noticeModal.querySelector('.modal-close-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            loadNotices(currentUserId);
        } else {
            window.location.replace('index.html');
        }
    });

    async function loadNotices(userId) {
        try {
            const noticesRef = database.ref('notices').orderByChild('timestamp');
            const userRef = database.ref(`users/${userId}`);
            
            const [noticeSnapshot, userSnapshot] = await Promise.all([noticesRef.once('value'), userRef.once('value')]);

            noticeContainer.innerHTML = '';
            if (!noticeSnapshot.exists()) {
                noticeContainer.innerHTML = '<p class="loading-text">এখন কোনো নতুন নোটিশ নেই।</p>';
                return;
            }

            const userData = userSnapshot.val();
            const lastReadTimestamp = userData.lastReadNoticeTimestamp || 0;

            let notices = [];
            noticeSnapshot.forEach(snap => {
                notices.push({ id: snap.key, ...snap.val() });
            });

            // নতুন নোটিশ উপরে দেখানোর জন্য
            notices.reverse();

            notices.forEach(notice => {
                const isUnread = notice.timestamp > lastReadTimestamp;
                const item = document.createElement('div');
                item.className = 'notice-item';
                
                const date = new Date(notice.timestamp).toLocaleDateString('bn-BD', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                item.innerHTML = `
                    <div class="notice-icon"><i class="fas fa-bullhorn"></i></div>
                    <div class="notice-content">
                        <div class="notice-title">${notice.title}</div>
                        <div class="notice-date">${date}</div>
                    </div>
                    ${isUnread ? '<div class="unread-dot"></div>' : ''}
                `;

                item.addEventListener('click', () => {
                    openNoticeModal(notice, date, isUnread);
                });

                noticeContainer.appendChild(item);
            });
            
            // ব্যবহারকারীর শেষ পড়া নোটিশের সময় আপডেট করা (সবচেয়ে নতুনটির)
            if (notices.length > 0) {
                userRef.update({ lastReadNoticeTimestamp: notices[0].timestamp });
            }

        } catch (error) {
            console.error("নোটিশ লোড করতে সমস্যা:", error);
            noticeContainer.innerHTML = '<p class="loading-text">নোটিশ লোড করা যায়নি।</p>';
        }
    }

    function openNoticeModal(notice, date, isUnread) {
        document.getElementById('modal-notice-title').textContent = notice.title;
        document.getElementById('modal-notice-date').textContent = date;
        document.getElementById('modal-notice-message').textContent = notice.message;
        
        noticeModal.classList.add('active');
        
        // যদি নোটিশটি অপঠিত থাকে, তাহলে তালিকাটি আবার রিলোড করা হবে ডট সরানোর জন্য
        if (isUnread) {
            // একটি ছোট ডিলে দেওয়া হচ্ছে যাতে ব্যবহারকারী পরিবর্তনটি লক্ষ্য করে
            setTimeout(() => loadNotices(currentUserId), 500);
        }
    }

    closeModalBtn.addEventListener('click', () => {
        noticeModal.classList.remove('active');
    });

});
