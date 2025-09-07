document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserData = null;

    const activityContainer = document.getElementById('activity-list-container');
    const filterNav = document.querySelector('.filter-nav');
    
    // রসিদ মডাল
    const receiptModal = document.getElementById('receipt-modal');
    const closeReceiptModalBtn = receiptModal.querySelector('.modal-close-btn');
    const copyReceiptBtn = document.getElementById('copy-receipt-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            database.ref(`users/${currentUserId}`).once('value', snapshot => {
                currentUserData = snapshot.val();
                loadActivities('all'); // ডিফল্ট হিসেবে সকল কার্যকলাপ লোড
            });
        } else {
            window.location.replace('index.html');
        }
    });

    filterNav.addEventListener('click', e => {
        if (e.target.classList.contains('filter-btn')) {
            filterNav.querySelector('.active').classList.remove('active');
            e.target.classList.add('active');
            loadActivities(e.target.dataset.filter);
        }
    });

    async function loadActivities(filter) {
        activityContainer.innerHTML = '<p class="loading-text">কার্যকলাপ লোড হচ্ছে...</p>';
        
        try {
            const withdrawalPromise = database.ref(`withdrawalRequests/${currentUserId}`).once('value');
            const depositPromise = database.ref(`depositRequests/${currentUserId}`).once('value'); // ভবিষ্যতে ডিপোজিট সিস্টেমের জন্য
            
            const [withdrawalSnapshot, depositSnapshot] = await Promise.all([withdrawalPromise, depositPromise]);

            let activities = [];
            withdrawalSnapshot.forEach(snap => activities.push({ id: snap.key, type: 'withdrawal', ...snap.val() }));
            depositSnapshot.forEach(snap => activities.push({ id: snap.key, type: 'deposit', ...snap.val() }));

            // নতুন কার্যকলাপ উপরে দেখানোর জন্য সর্ট
            activities.sort((a, b) => b.timestamp - a.timestamp);

            if (filter !== 'all') {
                activities = activities.filter(act => act.type === filter);
            }

            renderActivities(activities);
        } catch (error) {
            console.error("কার্যকলাপ লোড করতে সমস্যা:", error);
            activityContainer.innerHTML = '<p class="loading-text">কার্যকলাপ লোড করা যায়নি।</p>';
        }
    }

    function renderActivities(activities) {
        activityContainer.innerHTML = '';
        if (activities.length === 0) {
            activityContainer.innerHTML = '<p class="loading-text">কোনো কার্যকলাপ পাওয়া যায়নি।</p>';
            return;
        }
        activities.forEach(activity => {
            const card = createActivityCard(activity);
            activityContainer.appendChild(card);
        });
    }

    function createActivityCard(activity) {
        const item = document.createElement('div');
        item.className = 'activity-item';

        const date = new Date(activity.timestamp).toLocaleDateString('bn-BD');
        const statusClass = `status-${activity.status.toLowerCase()}`;
        
        const typeText = activity.type === 'withdrawal' ? 'টাকা উত্তোলন' : 'ডিপোজিট';
        const amountColor = activity.type === 'withdrawal' ? 'var(--danger-color)' : 'var(--primary-color)';

        item.innerHTML = `
            <div class="activity-header">
                <img src="${currentUserData.avatarUrl}" alt="Avatar" class="activity-avatar">
                <span class="activity-username">${currentUserData.username}</span>
            </div>
            <div class="activity-body">
                <div class="detail-row">
                    <span class="detail-label">অর্ডার আইডি</span>
                    <div class="detail-value order-id">
                        <span>${activity.orderId}</span>
                        <button class="copy-btn" title="কপি করুন"><i class="fas fa-copy"></i></button>
                    </div>
                </div>
                <div class="detail-row">
                    <span class="detail-label">ধরন</span>
                    <span class="detail-value">${typeText}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">পরিমাণ</span>
                    <strong class="detail-value" style="color: ${amountColor};">৳ ${activity.amount.toFixed(2)}</strong>
                </div>
                <div class="detail-row">
                    <span class="detail-label">স্ট্যাটাস</span>
                    <span class="detail-value status-badge ${statusClass}">${activity.status}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">তারিখ</span>
                    <span class="detail-value">${date}</span>
                </div>
            </div>
            <div class="activity-footer">
                <button class="receipt-btn">রসিদ দেখুন</button>
            </div>
        `;
        
        // ইভেন্ট লিসেনার
        item.querySelector('.copy-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(activity.orderId);
            const copyBtn = e.currentTarget;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i>'; }, 2000);
        });
        
        item.querySelector('.receipt-btn').addEventListener('click', () => {
            showReceiptModal(activity, date, amountColor);
        });

        return item;
    }
    
    function showReceiptModal(activity, date, amountColor) {
        const receiptBody = document.getElementById('receipt-body');
        const receiptText = `
            অর্ডার আইডি: ${activity.orderId}\n
            নাম: ${currentUserData.username}\n
            ধরন: ${activity.type === 'withdrawal' ? 'টাকা উত্তোলন' : 'ডিপোজিট'}\n
            পেমেন্ট মেথড: ${activity.method}\n
            নাম্বার: ${activity.number}\n
            পরিমাণ: ৳ ${activity.amount.toFixed(2)}\n
            স্ট্যাটাস: ${activity.status}\n
            তারিখ: ${date}
        `;
        
        receiptBody.innerHTML = `
            <div class="detail-row"><span>অর্ডার আইডি:</span><strong>${activity.orderId}</strong></div>
            <div class="detail-row"><span>নাম:</span><strong>${currentUserData.username}</strong></div>
            <div class="detail-row"><span>ধরন:</span><strong>${activity.type === 'withdrawal' ? 'টাকা উত্তোলন' : 'ডিপোজিট'}</strong></div>
            <div class="detail-row"><span>মেথড:</span><strong>${activity.method}</strong></div>
            <div class="detail-row"><span>নাম্বার:</span><strong>${activity.number}</strong></div>
            <div class="detail-row"><span>পরিমাণ:</span><strong style="color:${amountColor};">৳ ${activity.amount.toFixed(2)}</strong></div>
            <div class="detail-row"><span>স্ট্যাটাস:</span><strong>${activity.status}</strong></div>
            <div class="detail-row"><span>তারিখ:</span><strong>${date}</strong></div>
        `;
        
        copyReceiptBtn.onclick = () => {
            navigator.clipboard.writeText(receiptText);
            copyReceiptBtn.querySelector('i').className = 'fas fa-check';
            copyReceiptBtn.childNodes[2].textContent = ' কপি হয়েছে';
            setTimeout(() => {
                copyReceiptBtn.querySelector('i').className = 'fas fa-copy';
                copyReceiptBtn.childNodes[2].textContent = ' তথ্য কপি করুন';
            }, 2000);
        };
        
        receiptModal.classList.add('active');
    }
    
    closeReceiptModalBtn.addEventListener('click', () => receiptModal.classList.remove('active'));

});
