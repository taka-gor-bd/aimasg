document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    const tasksContainer = document.getElementById('tasks-container');
    const myTasksFab = document.getElementById('my-tasks-fab');
    const myTasksModal = document.getElementById('my-tasks-modal');
    const closeMyTasksModalBtn = myTasksModal.querySelector('.modal-close-btn');
    const addNewTaskBtn = document.getElementById('add-new-task-btn');
    
    // টাস্কের বিবরণ দেখার মডাল
    const detailsModal = document.getElementById('task-details-modal');
    const closeDetailsModalBtn = detailsModal.querySelector('.modal-close-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            loadAvailableTasks();
        } else {
            window.location.replace('index.html');
        }
    });

    // --- মডাল ইভেন্ট লিসেনার ---
    myTasksFab.addEventListener('click', () => {
        loadMyTasks();
        myTasksModal.classList.add('active');
    });
    closeMyTasksModalBtn.addEventListener('click', () => myTasksModal.classList.remove('active'));
    addNewTaskBtn.addEventListener('click', () => { window.location.href = 'create_task.html'; });
    closeDetailsModalBtn.addEventListener('click', () => detailsModal.classList.remove('active'));

    function loadAvailableTasks() {
        const jobsRef = database.ref('microJobs').orderByChild('timestamp');
        jobsRef.on('value', snapshot => {
            tasksContainer.innerHTML = '';
            const tasks = [];
            
            if (snapshot.exists()) {
                snapshot.forEach(childSnapshot => {
                    const taskId = childSnapshot.key;
                    const task = childSnapshot.val();
                    // শুধুমাত্র فعال কাজ, যা নিজের তৈরি নয় এবং যা সম্পন্ন করা হয়নি, সেগুলোই দেখানো হবে
                    if (task.status === 'active' && task.creatorUid !== currentUserId && !(task.completedBy && task.completedBy[currentUserId])) {
                        tasks.push({ id: taskId, ...task });
                    }
                });
            }
            
            // নতুন টাস্কগুলো যেন তালিকার উপরে থাকে, তাই reverse() করা হলো
            tasks.reverse();

            if (tasks.length > 0) {
                tasks.forEach(task => createTaskElement(task.id, task));
            } else {
                tasksContainer.innerHTML = '<p class="loading-text">বর্তমানে কোনো নতুন কাজ নেই।</p>';
            }
        });
    }

    function createTaskElement(taskId, task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.innerHTML = `
            <div class="task-icon"><i class="fas fa-tasks"></i></div>
            <div class="task-details">
                <div class="task-title">${task.title}</div>
                <div class="task-reward">পুরস্কার: ৳ ${task.reward.toFixed(2)}</div>
            </div>
            <div class="task-action-wrapper">
                <button class="task-action-btn" id="btn-${taskId}"></button>
            </div>
        `;
        
        // টাস্কের বিবরণের জন্য মডাল খোলার ইভেন্ট
        taskElement.querySelector('.task-details').addEventListener('click', () => {
            openDetailsModal(task);
        });

        tasksContainer.appendChild(taskElement);
        initializeButtonState(taskId, task);
    }
    
    function openDetailsModal(task) {
        document.getElementById('modal-task-title').textContent = task.title;
        document.getElementById('modal-task-creator').textContent = task.creatorName || 'Unknown';
        document.getElementById('modal-task-description').textContent = task.description;
        document.getElementById('modal-task-reward').textContent = `৳ ${task.reward.toFixed(2)}`;
        detailsModal.classList.add('active');
    }

    function loadMyTasks() {
        const myTasksList = document.getElementById('my-tasks-list');
        myTasksList.innerHTML = '<p class="loading-text">লোড হচ্ছে...</p>';
        const myJobsRef = database.ref('microJobs').orderByChild('creatorUid').equalTo(currentUserId);
        
        myJobsRef.on('value', snapshot => {
            myTasksList.innerHTML = '';
            if (!snapshot.exists()) {
                myTasksList.innerHTML = '<p class="loading-text">আপনি এখনো কোনো জব পোস্ট করেননি।</p>';
                return;
            }
            snapshot.forEach(childSnapshot => {
                const taskId = childSnapshot.key;
                const task = childSnapshot.val();
                const completions = task.currentCompletions || 0;
                const listItem = document.createElement('div');
                listItem.className = 'my-task-list-item';
                listItem.innerHTML = `
                    <div class="my-task-details">
                        <div class="my-task-title">${task.title}</div>
                        <div class="my-task-completion">সম্পন্ন হয়েছে: ${completions}/${task.maxCompletions} জন</div>
                    </div>
                    <button class="delete-task-btn" data-task-id="${taskId}"><i class="fas fa-trash-alt"></i></button>
                `;
                myTasksList.appendChild(listItem);
            });

            myTasksList.querySelectorAll('.delete-task-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const taskIdToDelete = e.currentTarget.dataset.taskId;
                    deleteTask(taskIdToDelete);
                });
            });
        });
    }

    function deleteTask(taskId) {
        if (confirm("আপনি কি নিশ্চিতভাবে এই জবটি ডিলিট করতে চান?")) {
            database.ref(`microJobs/${taskId}`).remove()
                .then(() => alert("জব সফলভাবে ডিলিট করা হয়েছে।"))
                .catch(error => console.error("ডিলিট করতে সমস্যা:", error));
        }
    }

    function initializeButtonState(taskId, task) {
        const button = document.getElementById(`btn-${taskId}`);
        if (!button) return;
        const timerKey = `task_timer_${taskId}`;
        const timerData = JSON.parse(localStorage.getItem(timerKey));

        if (timerData && timerData.userId === currentUserId) {
            const timeLeft = Math.round((timerData.endTime - Date.now()) / 1000);
            if (timeLeft > 0) {
                startCountdown(button, timeLeft, timerKey, taskId, task);
            } else {
                setButtonState(button, 'claim');
            }
        } else {
            setButtonState(button, 'start');
        }
        button.onclick = (e) => {
            e.stopPropagation(); // বাটন ক্লিকে যেন মডাল না খোলে
            handleButtonClick(taskId, task);
        };
    }
    
    function handleButtonClick(taskId, task) {
        const button = document.getElementById(`btn-${taskId}`);
        const currentState = button.dataset.state;
        if (currentState === 'start') {
            const timerData = { endTime: Date.now() + 11000, userId: currentUserId };
            localStorage.setItem(`task_timer_${taskId}`, JSON.stringify(timerData));
            window.open(task.link, '_blank');
            button.disabled = true;
            button.textContent = "Visiting...";
            // ফিরে আসার পর টাইমারটি স্বয়ংক্রিয়ভাবে চালু হওয়ার জন্য ৫ সেকেন্ড পর স্টেট চেক করা হচ্ছে
            setTimeout(() => initializeButtonState(taskId, task), 5000); 
        } else if (currentState === 'claim') {
            claimReward(taskId, task.reward, button);
        }
    }

    function startCountdown(button, duration, timerKey, taskId, task) {
        setButtonState(button, 'timer');
        let timeLeft = duration;
        const interval = setInterval(() => {
            button.textContent = `Wait: ${timeLeft}s`;
            timeLeft--;
            if (timeLeft < 0) {
                clearInterval(interval);
                setButtonState(button, 'claim');
                localStorage.removeItem(timerKey);
                button.onclick = (e) => { e.stopPropagation(); handleButtonClick(taskId, task); };
            }
        }, 1000);
    }

    function setButtonState(button, state) {
        button.dataset.state = state;
        button.className = 'task-action-btn';
        button.disabled = false;
        switch (state) {
            case 'start':
                button.classList.add('start');
                button.textContent = 'Do Task';
                break;
            case 'timer':
                button.classList.add('timer');
                button.disabled = true;
                break;
            case 'claim':
                button.classList.add('claim');
                button.textContent = 'Claim';
                break;
        }
    }

    async function claimReward(taskId, reward, button) {
        button.disabled = true;
        button.textContent = 'Claiming...';
        const taskRef = database.ref(`microJobs/${taskId}`);
        try {
            const { committed } = await taskRef.transaction(task => {
                if (task) {
                    if ((task.currentCompletions || 0) >= task.maxCompletions || (task.completedBy && task.completedBy[currentUserId])) return;
                    task.currentCompletions = (task.currentCompletions || 0) + 1;
                    if (!task.completedBy) task.completedBy = {};
                    task.completedBy[currentUserId] = true;
                    if (task.currentCompletions >= task.maxCompletions) {
                        task.status = 'completed';
                    }
                }
                return task;
            });

            if (committed) {
                await database.ref(`users/${currentUserId}/balance`).transaction(balance => (balance || 0) + reward);
                alert(`অভিনন্দন! আপনি ৳ ${reward.toFixed(2)} আয় করেছেন।`);
            } else {
                alert("দুঃখিত, এই কাজটি সম্পন্ন করার সুযোগ শেষ হয়ে গেছে।");
                button.textContent = 'Finished';
            }
        } catch (error) {
            console.error("Reward claim error:", error);
            button.disabled = false;
            button.textContent = 'Claim';
        }
    }
});
