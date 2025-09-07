document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserBalance = 0;

    const rewardInput = document.getElementById('task-reward');
    const completionsInput = document.getElementById('task-completions');
    const totalCostEl = document.getElementById('total-cost');
    const balanceEl = document.getElementById('current-balance');
    const errorEl = document.getElementById('balance-error');
    const submitBtn = document.getElementById('submit-task-btn');
    const form = document.getElementById('create-task-form');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            const userRef = database.ref(`users/${currentUserId}/balance`);
            userRef.on('value', (snapshot) => {
                currentUserBalance = snapshot.val() || 0;
                balanceEl.textContent = `৳ ${currentUserBalance.toFixed(2)}`;
                updateCost();
            });
        } else {
            window.location.replace('index.html');
        }
    });

    rewardInput.addEventListener('input', updateCost);
    completionsInput.addEventListener('input', updateCost);

    function updateCost() {
        const reward = parseFloat(rewardInput.value) || 0;
        const completions = parseInt(completionsInput.value) || 0;
        const totalCost = reward * completions;
        
        totalCostEl.textContent = `৳ ${totalCost.toFixed(2)}`;

        if (totalCost > currentUserBalance || totalCost <= 0) {
            submitBtn.disabled = true;
            if (totalCost > currentUserBalance) {
                errorEl.style.display = 'block';
            } else {
                errorEl.style.display = 'none';
            }
        } else {
            errorEl.style.display = 'none';
            submitBtn.disabled = false;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.textContent = 'পোস্ট করা হচ্ছে...';

        const title = document.getElementById('task-title').value.trim();
        const link = document.getElementById('task-link').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const reward = parseFloat(rewardInput.value);
        const maxCompletions = parseInt(completionsInput.value);
        const totalCost = reward * maxCompletions;

        if (currentUserBalance < totalCost) {
            alert("দুঃখিত, আপনার ব্যালেন্স পর্যাপ্ত নয়।");
            submitBtn.disabled = false;
            submitBtn.textContent = 'জব পোস্ট করুন';
            return;
        }
        
        const creatorName = (await database.ref(`users/${currentUserId}/username`).once('value')).val();

        const newTask = {
            creatorUid: currentUserId,
            creatorName: creatorName,
            title,
            link,
            description,
            reward,
            maxCompletions,
            currentCompletions: 0,
            status: 'active',
            timestamp: Date.now()
        };

        try {
            await database.ref(`users/${currentUserId}/balance`).transaction(balance => {
                if (balance < totalCost) return;
                return balance - totalCost;
            });
            await database.ref('microJobs').push(newTask);
            
            alert('আপনার জব সফলভাবে পোস্ট করা হয়েছে!');
            form.reset();
        } catch (error) {
            console.error("জব পোস্ট করতে সমস্যা হয়েছে:", error);
            alert("দুঃখিত, একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'জব পোস্ট করুন';
        }
    });
});