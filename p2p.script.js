document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserData = null;

    const tabs = document.querySelectorAll('.p2p-tab-btn');
    const offersContainer = document.getElementById('offers-list-container');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            database.ref(`users/${currentUserId}`).once('value', snapshot => {
                currentUserData = snapshot.val();
                loadOffers('buy'); // ডিফল্ট হিসেবে "কিনুন" ট্যাব লোড হবে
            });
        } else {
            window.location.replace('index.html');
        }
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadOffers(tab.dataset.tab);
        });
    });

    function loadOffers(type) {
        offersContainer.innerHTML = '<p class="loading-text">অফার লোড হচ্ছে...</p>';
        
        // ভবিষ্যতে অফারগুলো ডাটাবেস থেকে আসবে
        // এখন আমরা কিছু ডেমো ডেটা ব্যবহার করছি
        const demoOffers = [
            { id: 'offer1', creatorUid: 'user2', creatorName: 'Rahim Mia', avatar: 'https://api.dicebear.com/7/avataaars/svg?seed=Rahim', rating: 98, amount: 500, price: 1.00, methods: ['bKash'] },
            { id: 'offer2', creatorUid: 'user3', creatorName: 'Fatema Begum', avatar: 'https://api.dicebear.com/7/lorelei/svg?seed=Fatema', rating: 95, amount: 1000, price: 1.00, methods: ['bKash', 'Nagad'] },
            { id: 'offer3', creatorUid: 'user4', creatorName: 'Kamal Hasan', avatar: 'https://api.dicebear.com/7/bottts/svg?seed=Kamal', rating: 100, amount: 200, price: 1.00, methods: ['Nagad'] }
        ];

        renderOffers(demoOffers, type);
    }

    function renderOffers(offers, type) {
        offersContainer.innerHTML = '';
        if (offers.length === 0) {
            offersContainer.innerHTML = '<p class="loading-text">এখন কোনো অফার নেই।</p>';
            return;
        }

        offers.forEach(offer => {
            // নিজের অফার দেখানো হবে না
            if (offer.creatorUid === currentUserId) return;

            const card = document.createElement('div');
            card.className = 'offer-card';

            const methodBadges = offer.methods.map(method => {
                const className = `badge-${method.toLowerCase()}`;
                return `<span class="payment-badge ${className}">${method}</span>`;
            }).join('');

            const buttonText = type === 'buy' ? 'কিনুন' : 'বিক্রি করুন';
            const buttonClass = type === 'buy' ? 'btn-buy' : 'btn-sell';

            // --- নতুন HTML স্ট্রাকচার (আপনার ছবির মতো) ---
            card.innerHTML = `
                <div class="offer-header">
                    <div class="offer-user-details">
                        <div class="offer-username">${offer.creatorName}</div>
                        <div class="offer-rating"><i class="fas fa-star"></i> ${offer.rating}% সম্পন্ন</div>
                    </div>
                </div>
                <div class="offer-body">
                    <div class="offer-info-item">
                        <span class="offer-info-label">পরিমাণ</span>
                        <span class="offer-info-value">৳ ${offer.amount.toFixed(2)}</span>
                    </div>
                    <div class="offer-info-item">
                        <span class="offer-info-label">দর</span>
                        <span class="offer-info-value">৳ ${offer.price.toFixed(2)}</span>
                    </div>
                    <div class="offer-info-item full-width">
                        <span class="offer-info-label">পেমেন্ট</span>
                        <div class="payment-methods">${methodBadges}</div>
                    </div>
                </div>
                <div class="offer-footer">
                    <button class="trade-btn ${buttonClass}" data-offer-id="${offer.id}">${buttonText}</button>
                </div>
            `;
            
            card.querySelector('.trade-btn').addEventListener('click', handleTradeClick);
            offersContainer.appendChild(card);
        });
    }

    function handleTradeClick(e) {
        if (!currentUserData || !currentUserData.isNidVerified) {
            Swal.fire({
                icon: 'warning',
                title: 'অ্যাকাউন্ট ভেরিফাই করুন',
                text: 'P2P ট্রেডিং করার জন্য আপনার অ্যাকাউন্টটি NID দিয়ে ভেরিফাই করতে হবে।',
                confirmButtonText: 'ভেরিফাই করুন'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = 'verify_account.html';
                }
            });
        } else {
            // NID ভেরিফায়েড হলে ট্রেড শুরু হবে
            const offerId = e.target.dataset.offerId;
            alert(`ট্রেড শুরু হচ্ছে অফার আইডি: ${offerId}`);
            // এখানে p2p_trade.html পেজে নিয়ে যাওয়ার কোড হবে
        }
    }
});