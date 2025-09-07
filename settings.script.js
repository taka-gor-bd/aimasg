document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;

    const logoutBtn = document.getElementById('logout-btn');
    const deleteAccountBtn = document.getElementById('delete-account-btn');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    
    // পিন মডাল
    const pinModal = document.getElementById('pin-modal');
    const securityPinItem = document.getElementById('security-pin-item');
    const closePinModalBtn = pinModal.querySelector('.modal-close-btn');
    const savePinBtn = document.getElementById('save-pin-btn');
    const pinError = document.getElementById('pin-error');

    // --- ডার্ক মোড লোড ---
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
        } else {
            window.location.replace('index.html');
        }
    });

    // --- ইভেন্ট লিসেনার ---
    logoutBtn.addEventListener('click', () => {
        Swal.fire({
            title: 'আপনি কি নিশ্চিত?',
            text: "আপনি লগ আউট করতে যাচ্ছেন।",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'হ্যাঁ, লগ আউট করুন',
            cancelButtonText: 'না'
        }).then((result) => {
            if (result.isConfirmed) {
                auth.signOut().then(() => {
                    window.location.replace('index.html');
                });
            }
        });
    });

    deleteAccountBtn.addEventListener('click', () => {
        Swal.fire({
            title: 'অ্যাকাউন্ট ডিলিট',
            text: "অ্যাকাউন্ট ডিলিট করার জন্য, অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।",
            icon: 'info'
        });
    });
    
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
    });

    // --- পিন মডাল কার্যকারিতা ---
    securityPinItem.addEventListener('click', () => pinModal.classList.add('active'));
    closePinModalBtn.addEventListener('click', () => pinModal.classList.remove('active'));

    savePinBtn.addEventListener('click', async () => {
        const newPin = document.getElementById('new-pin').value;
        const confirmPin = document.getElementById('confirm-pin').value;
        pinError.textContent = '';

        if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
            pinError.textContent = 'পিন অবশ্যই ৪-ডিজিটের সংখ্যা হতে হবে।';
            return;
        }
        if (newPin !== confirmPin) {
            pinError.textContent = 'দুটি পিন মিলছে না।';
            return;
        }

        try {
            await database.ref(`users/${currentUserId}`).update({ withdrawalPin: newPin });
            pinModal.classList.remove('active');
            Swal.fire('সফল!', 'আপনার নিরাপত্তা পিন সফলভাবে সেট করা হয়েছে।', 'success');
        } catch (error) {
            pinError.textContent = 'একটি সমস্যা হয়েছে। আবার চেষ্টা করুন।';
        }
    });
});