document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;

    const balanceEl = document.getElementById('current-balance');
    const incomeEl = document.getElementById('total-income');
    const expenseEl = document.getElementById('total-expense');
    const transactionList = document.getElementById('transaction-list');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            loadAllTransactions(currentUserId);
        } else {
            window.location.replace('index.html');
        }
    });

    async function loadAllTransactions(userId) {
        try {
            // সকল ডেটা একসাথে আনার জন্য Promise.all ব্যবহার
            const [
                userSnapshot,
                taskHistorySnapshot,
                withdrawalSnapshot,
                depositSnapshot,
                jobCreationSnapshot
            ] = await Promise.all([
                database.ref(`users/${userId}`).once('value'),
                database.ref(`users/${userId}/taskHistory`).once('value'),
                database.ref(`withdrawalRequests/${userId}`).orderByChild('status').equalTo('Approved').once('value'),
                database.ref(`depositRequests/${userId}`).orderByChild('status').equalTo('Approved').once('value'),
                database.ref('microJobs').orderByChild('creatorUid').equalTo(userId).once('value')
            ]);

            let allTransactions = [];
            let totalIncome = 0;
            let totalExpense = 0;

            // ১. টাস্ক থেকে আয়
            if (taskHistorySnapshot.exists()) {
                taskHistorySnapshot.forEach(dateSnap => {
                    dateSnap.forEach(taskSnap => {
                        const task = taskSnap.val();
                        allTransactions.push({
                            type: 'income',
                            title: task.title,
                            amount: task.reward,
                            date: new Date(task.completedAt).getTime()
                        });
                        totalIncome += task.reward;
                    });
                });
            }

            // ২. ডিপোজিট (আয় হিসেবে ধরা হচ্ছে)
            if (depositSnapshot.exists()) {
                depositSnapshot.forEach(snap => {
                    const deposit = snap.val();
                    allTransactions.push({
                        type: 'income',
                        title: `${deposit.method} এর মাধ্যমে ডিপোজিট`,
                        amount: deposit.amount,
                        date: deposit.timestamp
                    });
                    // Note: This is an external income, not added to totalIncome from app activities.
                });
            }

            // ৩. উইথড্র (ব্যয়)
            if (withdrawalSnapshot.exists()) {
                withdrawalSnapshot.forEach(snap => {
                    const withdrawal = snap.val();
                    allTransactions.push({
                        type: 'expense',
                        title: `${withdrawal.method} এর মাধ্যমে উইথড্র`,
                        amount: withdrawal.amount,
                        date: withdrawal.timestamp
                    });
                    totalExpense += withdrawal.amount;
                });
            }

            // ৪. জব পোস্ট করার জন্য ব্যয়
            if (jobCreationSnapshot.exists()) {
                jobCreationSnapshot.forEach(snap => {
                    const job = snap.val();
                    const cost = (job.reward * job.maxCompletions);
                    allTransactions.push({
                        type: 'expense',
                        title: `'${job.title}' জব পোস্টের জন্য ব্যয়`,
                        amount: cost,
                        date: job.timestamp
                    });
                    totalExpense += cost;
                });
            }

            // সারাংশ কার্ড আপডেট করা
            const userData = userSnapshot.val();
            balanceEl.textContent = `৳ ${(userData.balance || 0).toFixed(2)}`;
            incomeEl.textContent = `৳ ${totalIncome.toFixed(2)}`;
            expenseEl.textContent = `৳ ${totalExpense.toFixed(2)}`;
            
            // তালিকা রেন্ডার করা
            renderTransactionList(allTransactions);

        } catch (error) {
            console.error("লেনদেন লোড করতে সমস্যা:", error);
            transactionList.innerHTML = '<p class="loading-text">লেনদেন লোড করা যায়নি।</p>';
        }
    }

    function renderTransactionList(transactions) {
        transactionList.innerHTML = '';
        if (transactions.length === 0) {
            transactionList.innerHTML = '<p class="loading-text">কোনো লেনদেনের হিস্টোরি নেই।</p>';
            return;
        }

        // নতুন লেনদেন উপরে দেখানোর জন্য সর্ট করা
        transactions.sort((a, b) => b.date - a.date);

        transactions.forEach(tx => {
            const item = document.createElement('li');
            item.className = 'transaction-item';

            const iconClass = tx.type === 'income' ? 'fa-plus' : 'fa-minus';
            const amountClass = tx.type;
            const amountSign = tx.type === 'income' ? '+' : '-';

            const date = new Date(tx.date).toLocaleString('bn-BD', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            item.innerHTML = `
                <div class="transaction-icon ${amountClass}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <div class="transaction-title">${tx.title}</div>
                    <div class="transaction-date">${date}</div>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountSign} ৳ ${tx.amount.toFixed(2)}
                </div>
            `;
            transactionList.appendChild(item);
        });
    }
});
