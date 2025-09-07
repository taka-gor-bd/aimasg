document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let currentUserData = null;

    const nameInput = document.getElementById('edit-name');
    const saveNameBtn = document.getElementById('save-name-btn');
    const resetPasswordBtn = document.getElementById('reset-password-btn');

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            // ব্যবহারকারীর বর্তমান তথ্য লোড করা
            const userRef = database.ref(`users/${currentUserId}`);
            userRef.once('value', snapshot => {
                currentUserData = snapshot.val();
                if (currentUserData) {
                    nameInput.value = currentUserData.username || '';
                }
            });
        } else {
            // যদি লগইন করা না থাকে, তাহলে লগইন পেজে পাঠিয়ে দেওয়া হবে
            window.location.replace('index.html');
        }
    });

    // নাম সেভ করার জন্য ইভেন্ট লিসেনার
    saveNameBtn.addEventListener('click', async () => {
        const newName = nameInput.value.trim();
        
        if (!newName) {
            Swal.fire('ত্রুটি', 'অনুগ্রহ করে আপনার নাম লিখুন।', 'error');
            return;
        }

        if (newName === currentUserData.username) {
            Swal.fire('তথ্য', 'আপনি কোনো পরিবর্তন করেননি।', 'info');
            return;
        }
        
        saveNameBtn.disabled = true;
        saveNameBtn.textContent = 'সেভ করা হচ্ছে...';

        try {
            // ডাটাবেসে নতুন নাম আপডেট করা
            await database.ref(`users/${currentUserId}`).update({ username: newName });
            Swal.fire('সফল!', 'আপনার নাম সফলভাবে পরিবর্তন হয়েছে।', 'success');
        } catch (error) {
            Swal.fire('ব্যর্থ', 'একটি সমস্যা হয়েছে, আবার চেষ্টা করুন।', 'error');
            console.error("Name update error:", error);
        } finally {
            saveNameBtn.disabled = false;
            saveNameBtn.textContent = 'পরিবর্তন সেভ করুন';
        }
    });

    // পাসওয়ার্ড রিসেট করার জন্য ইভেন্ট লিসেনার
    resetPasswordBtn.addEventListener('click', () => {
        if (currentUserData && currentUserData.email) {
            auth.sendPasswordResetEmail(currentUserData.email)
                .then(() => {
                    Swal.fire(
                        'লিঙ্ক পাঠানো হয়েছে',
                        'পাসওয়ার্ড রিসেট করার জন্য একটি লিঙ্ক আপনার ইমেইলে পাঠানো হয়েছে। অনুগ্রহ করে আপনার ইমেইল চেক করুন।',
                        'success'
                    );
                })
                .catch(error => {
                    Swal.fire('ব্যর্থ', `একটি সমস্যা হয়েছে: ${error.message}`, 'error');
                    console.error("Password reset error:", error);
                });
        } else {
            Swal.fire('ত্রুটি', 'আপনার ইমেইল খুঁজে পাওয়া যায়নি।', 'error');
        }
    });
});```

এই ফাইলগুলো যোগ করার পর আপনার "প্রোফাইল এডিট" পেজটি সম্পূর্ণরূপে কার্যকর, নিরাপদ এবং অত্যন্ত সুন্দরভাবে কাজ করবে।