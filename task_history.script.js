document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;

    const historyContainer = document.getElementById('history-list-container');
    const totalTasksEl = document.getElementById('total-tasks-completed');
    const totalEarningsEl = document.getElementById('total-earnings-from-tasks');

    // প্রতিটি কাজের জন্য ভিন্ন ভিন্ন স্টাইল
    const taskStyles = [
        { icon: 'fas fa-thumbs-up', color: '#3498db' },
        { icon: 'fas fa-play-circle', color: '#e74c3c' },
        { icon: 'fas fa-star', color: '#f1c40f' },
        { icon: 'fas fa-link', color: '#9b59b6' },
        { icon: 'fas fa-check-square', color: '#2ecc71' },
        { icon: 'fas fa-file-alt', color: '#e67e22' }
    ];

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            loadTaskHistory(currentUserId);
        } else {
            window.location.replace('index.html');
        }
    });

    function loadTaskHistory(userId) {
        // Firebase Security Rules অনুযায়ী, ব্যবহারকারীরা শুধুমাত্র তাদের নিজেদের taskHistory দেখতে পারবে
        const historyRef = database.ref(`users/${userId}/taskHistory`);
        historyRef.on('value', snapshot => {
            historyContainer.innerHTML = ''; // পুরোনো তালিকা মুছে ফেলা

            if (!snapshot.exists()) {
                historyContainer.innerHTML = '<p class="loading-text">আপনার কোনো কাজের হিস্টোরি নেই।</p>';
                totalTasksEl.textContent = '০';
                totalEarningsEl.textContent = '৳ ০.০০';
                return;
            }

            const historyData = snapshot.val();
            let tasks = [];
            // Firebase-এ ডেটা সাধারণত তারিখ অনুযায়ী সাজানো থাকে না, তাই আমাদের অ্যারেতে আনতে হবে
            for (const dateKey in historyData) {
                for (const taskId in historyData[dateKey]) {
                    tasks.push(historyData[dateKey][taskId]);
                }
            }

            // নতুন কাজগুলো উপরে দেখানোর জন্য তারিখ অনুযায়ী সর্ট করা
            tasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

            // সারাংশ কার্ড আপডেট করা
            const totalTasksCompleted = tasks.length;
            const totalEarnings = tasks.reduce((sum, task) => sum + task.reward, 0);
            totalTasksEl.textContent = totalTasksCompleted.toLocaleString('bn-BD');
            totalEarningsEl.textContent = `৳ ${totalEarnings.toFixed(2)}`;

            // তালিকা তৈরি করা
            tasks.forEach((task, index) => {
                const style = taskStyles[index % taskStyles.length];
                const item = document.createElement('div');
                item.className = 'history-item';
                
                const date = new Date(task.completedAt).toLocaleDateString('bn-BD', {
                    day: 'numeric', month: 'long', year: 'numeric'
                });

                item.innerHTML = `
                    <div class="history-icon" style="background-color: ${style.color};">
                        <i class="${style.icon}"></i>
                    </div>
                    <div class="history-details">
                        <div class="history-title">${task.title}</div>
                        <div class="history-date">${date}</div>
                    </div>
                    <div class="history-reward">৳ ${task.reward.toFixed(2)}</div>
                `;
                historyContainer.appendChild(item);
            });
        });
    }
});