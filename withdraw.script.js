document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserBalance = 0;
    let selectedAmount = 0;

    const presetAmounts = [200, 300, 500, 1000, 2000, 5000, 10000];
    const amountGrid = document.getElementById('amount-grid');
    presetAmounts.forEach(amount => {
        const btn = document.createElement('button');
        btn.className = 'amount-btn';
        btn.textContent = `৳ ${amount}`;
        btn.dataset.amount = amount;
        amountGrid.appendChild(btn);
    });

    // DOM Elements
    const balanceEl = document.getElementById('current-balance');
    const customAmountInput = document.getElementById('custom-amount-input');
    const withdrawNowBtn = document.getElementById('withdraw-now-btn');
    const errorEl = document.getElementById('error-message');
    
    // Modal Elements
    const modal = document.getElementById('withdraw-modal');
    const closeModalBtn = modal.querySelector('.modal-close-btn');
    const allSteps = modal.querySelectorAll('.modal-step');
    const numberInput = document.getElementById('payment-number-input');
    const submitNumberBtn = document.getElementById('submit-number-btn');
    const methodSelectStep = document.getElementById('step-method-select');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            const userRef = database.ref(`users/${currentUserId}/balance`);
            userRef.on('value', snapshot => {
                currentUserBalance = snapshot.val() || 0;
                balanceEl.textContent = `৳ ${currentUserBalance.toFixed(2)}`;
                validateSelection();
            });
        } else {
            window.location.replace('index.html');
        }
    });

    amountGrid.addEventListener('click', e => {
        if (e.target.classList.contains('amount-btn')) {
            document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            customAmountInput.value = '';
            selectedAmount = parseFloat(e.target.dataset.amount);
            validateSelection();
        }
    });

    customAmountInput.addEventListener('input', () => {
        document.querySelectorAll('.amount-btn').forEach(btn => btn.classList.remove('selected'));
        selectedAmount = parseFloat(customAmountInput.value) || 0;
        validateSelection();
    });

    function validateSelection() {
        errorEl.textContent = '';
        if (selectedAmount > 0 && selectedAmount <= currentUserBalance) {
            withdrawNowBtn.disabled = false;
        } else {
            withdrawNowBtn.disabled = true;
            if (selectedAmount > currentUserBalance) {
                errorEl.textContent = 'আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই।';
            }
        }
    }

    withdrawNowBtn.addEventListener('click', () => {
        modal.classList.add('active');
        showStep('step-number-input');
    });

    closeModalBtn.addEventListener('click', () => modal.classList.remove('active'));

    submitNumberBtn.addEventListener('click', () => {
        const number = numberInput.value.trim();
        if (number.length >= 11 && /^[0-9]+$/.test(number)) {
            document.getElementById('number-error').textContent = '';
            document.getElementById('display-amount-method').textContent = `৳ ${selectedAmount} - ${number}`;
            showStep('step-method-select');
        } else {
            document.getElementById('number-error').textContent = 'অনুগ্রহ করে একটি সঠিক নাম্বার দিন।';
        }
    });

    methodSelectStep.addEventListener('click', e => {
        const methodBtn = e.target.closest('.method-btn');
        if (methodBtn) {
            const method = methodBtn.dataset.method;
            const number = numberInput.value.trim();
            submitWithdrawalRequest(selectedAmount, number, method);
        }
    });

    async function submitWithdrawalRequest(amount, number, method) {
        showStep(); // সব স্টেপ হাইড করে লোডিং দেখানো যেতে পারে
        methodSelectStep.innerHTML = `<div class="loading-spinner"></div><p>অনুগ্রহ করে অপেক্ষা করুন...</p>`;

        const userBalanceRef = database.ref(`users/${currentUserId}/balance`);
        
        try {
            // Transaction দিয়ে ব্যালেন্স কমানো
            const { committed } = await userBalanceRef.transaction(balance => {
                if (balance >= amount) return balance - amount;
                return; // ব্যালেন্স না থাকলে ট্রান্সেকশন বাতিল
            });

            if (committed) {
                const orderId = `WD-${Date.now()}`;
                const requestData = {
                    amount, number, method,
                    status: 'Pending',
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    orderId: orderId,
                    userId: currentUserId
                };
                await database.ref(`withdrawalRequests/${currentUserId}`).push(requestData);
                
                showStep('step-success');
                setTimeout(() => {
                    window.location.href = 'activity.html';
                }, 2500);

            } else {
                throw new Error("অপর্যাপ্ত ব্যালেন্স।");
            }
        } catch (error) {
            alert(`উইথড্র অনুরোধ ব্যর্থ হয়েছে: ${error.message}`);
            modal.classList.remove('active');
        }
    }

    function showStep(stepId) {
        allSteps.forEach(step => {
            step.classList.remove('active');
        });
        if (stepId) {
            document.getElementById(stepId).classList.add('active');
        }
    }
});