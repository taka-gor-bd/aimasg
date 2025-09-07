document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;

    const depositForm = document.getElementById('deposit-form');
    const submitBtn = document.getElementById('submit-deposit-btn');
    const errorEl = document.getElementById('error-message');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
        } else {
            window.location.replace('index.html');
        }
    });

    // --- কপি বাটন কার্যকারিতা ---
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.dataset.target;
            const textToCopy = document.getElementById(targetId).textContent;
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalIcon = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    button.innerHTML = originalIcon;
                }, 2000);
            });
        });
    });

    depositForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorEl.textContent = '';
        submitBtn.disabled = true;
        submitBtn.textContent = 'প্রসেসিং...';

        try {
            const method = document.querySelector('input[name="method"]:checked').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const senderNumber = document.getElementById('sender-number').value.trim();
            const trxId = document.getElementById('trx-id').value.trim();

            if (isNaN(amount) || amount <= 0) {
                throw new Error("অনুগ্রহ করে সঠিক পরিমাণ লিখুন।");
            }
            if (senderNumber.length < 11) {
                throw new Error("আপনার নাম্বারটি সঠিক নয়।");
            }
            if (!trxId) {
                throw new Error("Transaction ID দিন।");
            }

            const orderId = `DP-${Date.now()}`;
            const requestData = {
                amount, method, senderNumber, trxId,
                status: 'Pending',
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                orderId: orderId,
                userId: currentUserId,
                type: 'deposit' // activity পেজে ফিল্টার করার জন্য
            };

            await database.ref(`depositRequests/${currentUserId}`).push(requestData);

            alert('আপনার ডিপোজিট অনুরোধ সফলভাবে জমা হয়েছে। অ্যাডমিন পর্যালোচনার পর আপনার ব্যালেন্স আপডেট করা হবে।');
            window.location.href = 'activity.html';

        } catch (error) {
            errorEl.textContent = error.message;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'অনুরোধ জমা দিন';
        }
    });
});
