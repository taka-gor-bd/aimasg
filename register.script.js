document.addEventListener('DOMContentLoaded', () => {
    // Firebase Config
    const firebaseConfig = {
      apiKey: "AIzaSyCwtr07rzsBp6yLilCh4EEIl2YDAELYmKM",
      authDomain: "personal-message-f2930.firebaseapp.com",
      databaseURL: "https://personal-message-f2930-default-rtdb.asia-southeast1.firebasedatabase.app",
      projectId: "personal-message-f2930",
      storageBucket: "personal-message-f2930.appspot.com",
      messagingSenderId: "883994486321",
      appId: "1:883994486321:web:e527a093dd64fdecb31710",
    };
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const database = firebase.database();

    auth.onAuthStateChanged(user => {
        if (user) window.location.replace('home.html');
    });

    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginBtn.disabled = true;
        loginBtn.textContent = 'প্রসেসিং...';
        errorMessage.textContent = '';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            const userSnapshot = await database.ref('users/' + user.uid).once('value');
            
            if (!userSnapshot.val()?.isUserActive) {
                await auth.signOut();
                errorMessage.textContent = "আপনার অ্যাকাউন্টটি এখনো অ্যাক্টিভেট হয়নি।";
            }
            // সফল হলে onAuthStateChanged রিডাইরেক্ট করবে
        } catch (error) {
            errorMessage.textContent = "আপনার ইমেইল বা পাসওয়ার্ড সঠিক নয়।";
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'লগইন করুন';
        }
    });
});