document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    const referralCodeInput = document.getElementById('referral-code-input');
    const copyBtn = document.getElementById('copy-code-btn');
    const shareWhatsappBtn = document.getElementById('share-whatsapp');
    const shareTelegramBtn = document.getElementById('share-telegram');
    const shareMoreBtn = document.getElementById('share-more');
    const referralListContainer = document.getElementById('referral-list-container');
    const totalEarningsEl = document.getElementById('total-referral-earnings');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            loadReferralData(currentUserId);
            loadReferralHistory(currentUserId);
        } else {
            window.location.replace('index.html');
        }
    });

    function loadReferralData(userId) {
        const userRef = database.ref(`users/${userId}`);
        userRef.on('value', (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                referralCodeInput.value = userData.referralCode || 'N/A';
                totalEarningsEl.textContent = `৳ ${(userData.referralBonusTotal || 0).toFixed(2)}`;
            }
        });
    }

    function loadReferralHistory(userId) {
        const referralsRef = database.ref(`users/${userId}/referrals`);
        referralsRef.on('value', (snapshot) => {
            referralListContainer.innerHTML = '';
            if (!snapshot.exists()) {
                referralListContainer.innerHTML = '<p class="loading-text">আপনি এখনো কাউকে রেফার করেননি।</p>';
                return;
            }

            snapshot.forEach(childSnapshot => {
                const referral = childSnapshot.val();
                const referredUsername = referral.username || 'Unknown User';
                const item = document.createElement('div');
                item.className = 'referral-list-item';
                const statusClass = referral.status === 'completed' ? 'status-completed' : 'status-pending';
                const statusText = referral.status === 'completed' ? 'সম্পন্ন' : 'পেন্ডিং';

                item.innerHTML = `
                    <div class="referral-user">
                        <img src="https://api.dicebear.com/7/initials/svg?seed=${referredUsername.charAt(0)}" alt="Avatar" class="referral-avatar">
                        <span class="referral-name">${referredUsername}</span>
                    </div>
                    <div class="referral-status ${statusClass}">${statusText}</div>
                `;
                referralListContainer.appendChild(item);
            });
        });
    }

    copyBtn.addEventListener('click', () => {
        referralCodeInput.select(); document.execCommand('copy');
        copyBtn.textContent = 'কপি হয়েছে!';
        setTimeout(() => { copyBtn.innerHTML = '<i class="fas fa-copy"></i> কপি'; }, 2000);
    });

    const getShareMessage = () => {
        const code = referralCodeInput.value;
        return `আমার রেফারেল কোড (${code}) ব্যবহার করে অ্যাপে যোগ দিন এবং ৳১০ সাইন-আপ বোনাস জিতুন! লিঙ্ক: ${window.location.origin}/index.html?ref=${code}`;
    };

    shareWhatsappBtn.addEventListener('click', () => { window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(getShareMessage())}`); });
    shareTelegramBtn.addEventListener('click', () => { window.open(`https://t.me/share/url?url=${window.location.origin}&text=${encodeURIComponent(getShareMessage())}`); });
    shareMoreBtn.addEventListener('click', async () => {
        if (navigator.share) {
            await navigator.share({ title: 'অ্যাপে যোগ দিন', text: getShareMessage() });
        } else {
            alert('আপনার ব্রাউজার এই ফিচারটি সাপোর্ট করে না।');
        }
    });
});