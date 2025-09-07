document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserData = null;
    let currentUserBalance = 0;

    const form = document.getElementById('create-offer-form');
    const amountInput = document.getElementById('amount');
    const balanceEl = document.getElementById('current-balance');
    const remainingBalanceEl = document.getElementById('remaining-balance');
    const errorEl = document.getElementById('balance-error');
    const submitBtn = document.getElementById('submit-offer-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            const userRef = database.ref(`users/${currentUserId}`);
            userRef.on('value', snapshot => {
                currentUserData = snapshot.val();
                currentUserBalance = currentUserData.balance || 0;
                balanceEl.textContent = `৳ ${currentUserBalance.toFixed(2)}`;
                validateAmount(); // ব্যালেন্স লোড হওয়ার পর ভ্যালিডেট করা
            });
        } else {
            window.location.replace('index.html');
        }
    });

    amountInput.addEventListener('input', validateAmount);

    function validateAmount() {
        const amount = parseFloat(amountInput.value) || 0;
        const remaining = currentUserBalance - amount;
        remainingBalanceEl.textContent = `৳ ${remaining.toFixed(2)}`;

        if (amount > 0 && amount <= currentUserBalance) {
            errorEl.style.display = 'none';
            submitBtn.disabled = false;
        } else {
            submitBtn.disabled = true;
            if (amount > currentUserBalance) {
                errorEl.style.display = 'block';
            } else {
                errorEl.style.display = 'none';
            }
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'পোস্ট করা হচ্ছে...';

        const amount = parseFloat(amountInput.value);
        const paymentNumber = document.getElementById('payment-number').value.trim();
        const selectedMethods = [...document.querySelectorAll('input[name="paymentMethod"]:checked')].map(el => el.value);

        if (selectedMethods.length === 0) {
            Swal.fire('ত্রুটি', 'অনুগ্রহ করে حداقل একটি পেমেন্ট মেথড সিলেক্ট করুন।', 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'অফার পোস্ট করুন';
            return;
        }

        try {
            // --- এসক্রো (Escrow) সিস্টেমের জন্য Firebase Transaction ---
            const userBalanceRef = database.ref(`users/${currentUserId}/balance`);
            const { committed, snapshot } = await userBalanceRef.transaction(balance => {
                if (balance >= amount) {
                    return balance - amount; // ব্যালেন্স কেটে নেওয়া হচ্ছে
                }
                return; // অপর্যাপ্ত ব্যালেন্স, ট্রান্সেকশন বাতিল
            });

            if (committed) {
                // ট্রান্সেকশন সফল হলে অফার তৈরি করা
                const newOffer = {
                    creatorUid: currentUserId,
                    creatorName: currentUserData.username,
                    avatarUrl: currentUserData.avatarUrl,
                    rating: currentUserData.p2pRating || 100, // ভবিষ্যতে রেটিং সিস্টেম যোগ হবে
                    amount,
                    price: 1.00, // আপাতত দর ১:১
                    paymentMethods: selectedMethods,
                    paymentNumber,
                    status: 'active',
                    timestamp: firebase.database.ServerValue.TIMESTAMP
                };
                
                await database.ref('p2p_offers').push(newOffer);

                Swal.fire({
                    icon: 'success',
                    title: 'সফল!',
                    text: 'আপনার বিক্রয়ের অফার সফলভাবে পোস্ট করা হয়েছে।',
                    timer: 2000,
                    showConfirmButton: false
                }).then(() => {
                    window.location.href = 'p2p.html';
                });

            } else {
                throw new Error("অপর্যাপ্ত ব্যালেন্স। আপনার অনুরোধটি বাতিল করা হয়েছে।");
            }
        } catch (error) {
            Swal.fire('ব্যর্থ', error.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'অফার পোস্ট করুন';
        }
    });
});
