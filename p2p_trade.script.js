document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let tradeId = null;
    let tradeData = null;
    let userRole = null; // 'buyer' or 'seller'

    const params = new URLSearchParams(window.location.search);
    tradeId = params.get('tradeId');

    auth.onAuthStateChanged(user => {
        if (user && tradeId) {
            currentUserId = user.uid;
            loadTradeDetails();
        } else {
            // window.location.replace('index.html');
        }
    });

    function loadTradeDetails() {
        const tradeRef = database.ref(`p2p_trades/${tradeId}`);
        tradeRef.on('value', snapshot => {
            tradeData = snapshot.val();
            if (!tradeData) {
                alert("ট্রেডটি পাওয়া যায়নি।");
                window.location.href = 'p2p.html';
                return;
            }

            userRole = (currentUserId === tradeData.buyerUid) ? 'buyer' : 'seller';
            renderTradeInfo();
            renderActionPanel();
        });
    }

    function renderTradeInfo() {
        document.getElementById('trade-amount').textContent = `৳ ${tradeData.amount.toFixed(2)}`;
        document.getElementById('trade-order-id').textContent = tradeData.orderId;
        // ... (অন্যান্য তথ্য দেখানো)
    }

    function renderActionPanel() {
        const panel = document.getElementById('action-panel');
        panel.innerHTML = '';

        if (userRole === 'buyer') {
            if (tradeData.status === 'awaiting-payment') {
                panel.innerHTML = `<p>অনুগ্রহ করে বিক্রেতাকে টাকা পাঠিয়ে নিচের বাটনে ক্লিক করুন।</p>
                                   <button class="action-btn-primary" id="payment-sent-btn">আমি টাকা পাঠিয়েছি</button>`;
                document.getElementById('payment-sent-btn').onclick = markAsPaid;
            } else if (tradeData.status === 'payment-done') {
                panel.innerHTML = `<p>আপনি পেমেন্ট নিশ্চিত করেছেন। বিক্রেতার ব্যালেন্স রিলিজ করার জন্য অপেক্ষা করুন।</p>`;
                // এখানে ডিসপিউট টাইমার দেখানো যেতে পারে
            }
        } else if (userRole === 'seller') {
            if (tradeData.status === 'payment-done') {
                panel.innerHTML = `<p>ক্রেতা টাকা পাঠিয়েছে বলে নিশ্চিত করেছে। অনুগ্রহ করে আপনার পেমেন্ট চেক করে ব্যালেন্স রিলিজ করুন।</p>
                                   <div class="timer" id="release-timer">১৫:০০</div>
                                   <button class="action-btn-primary" id="release-btn">ব্যালেন্স রিলিজ করুন</button>`;
                document.getElementById('release-btn').onclick = releaseBalance;
                startReleaseTimer();
            } else {
                panel.innerHTML = `<p>ক্রেতার টাকা পাঠানোর জন্য অপেক্ষা করা হচ্ছে...</p>`;
            }
        }
    }

    async function markAsPaid() {
        const tradeRef = database.ref(`p2p_trades/${tradeId}`);
        await tradeRef.update({
            status: 'payment-done',
            paymentTimestamp: firebase.database.ServerValue.TIMESTAMP
        });
    }

    async function releaseBalance() {
        // --- চূড়ান্ত ধাপ: ব্যালেন্স ট্রান্সফার এবং ট্রেড সম্পন্ন ---
        const updates = {};
        // ১. ক্রেতার ব্যালেন্স বাড়ানো
        updates[`users/${tradeData.buyerUid}/balance`] = firebase.database.ServerValue.increment(tradeData.amount);
        // ২. বিক্রেতার অ্যাকাউন্ট আনলক করা
        updates[`users/${tradeData.sellerUid}/tradeLocked`] = null;
        // ৩. ট্রেডের স্ট্যাটাস 'completed' করা
        updates[`p2p_trades/${tradeId}/status`] = 'completed';
        // ৪. মূল অফারটি মুছে ফেলা
        updates[`p2p_offers/${tradeData.offerId}`] = null;

        await database.ref().update(updates);

        Swal.fire('সফল!', 'লেনদেন সফলভাবে সম্পন্ন হয়েছে!', 'success')
            .then(() => window.location.href = 'p2p.html');
    }

    function startReleaseTimer() {
        // ১৫ মিনিটের টাইমার লজিক এখানে যুক্ত হবে
    }

    // চ্যাট কার্যকারিতা এখানে যুক্ত হবে

});