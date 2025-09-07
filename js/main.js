// ==========================================================================
// MAIN JAVASCRIPT FILE (main.js) - পিক্সেল পারফেক্ট ডিজাইনসহ চূড়ান্ত ভার্সন
// ==========================================================================

// ফায়ারবেস কনফিগারেশন
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

document.addEventListener('DOMContentLoaded', () => { /* ... এই অংশটি আগের মতোই ... */
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const isPublicPage = page === 'index.html' || page === 'register.html' || page === '';
    
    if (!isPublicPage) {
        document.body.insertAdjacentHTML('afterbegin', '<div id="header-placeholder"></div>');
        document.body.insertAdjacentHTML('beforeend', '<div id="menu-popup-placeholder"></div>');
        document.body.insertAdjacentHTML('beforeend', '<div id="bottom-nav-placeholder"></div>');
        loadTemplatesAndInitialize();
    }
    auth.onAuthStateChanged(user => {
        if (user) {
            if (isPublicPage) { window.location.replace('home.html'); } 
            else { updateUserInfoInTemplates(user); }
        } else {
            if (!isPublicPage) { window.location.replace('index.html'); }
        }
    });
});

async function loadTemplatesAndInitialize() { /* ... এই অংশটি আগের মতোই ... */
    await Promise.all([
        fetch('templates/header.html').then(res => res.text()),
        fetch('templates/menu_popup.html').then(res => res.text()),
        fetch('templates/bottom_nav.html').then(res => res.text())
    ]).then(([headerHtml, menuPopupHtml, bottomNavHtml]) => {
        document.querySelector('#header-placeholder').innerHTML = headerHtml;
        document.querySelector('#menu-popup-placeholder').innerHTML = menuPopupHtml;
        document.querySelector('#bottom-nav-placeholder').innerHTML = bottomNavHtml;
    });
    initializeMenuPopupEvents();
    setActiveNavItem();
}

function initializeMenuPopupEvents() { /* ... এই অংশটি আগের মতোই ... */
    const menuIcon = document.getElementById('menuIcon');
    const popupMenuOverlay = document.getElementById('popupMenuOverlay');
    const closePopupBtn = document.getElementById('closePopupBtn');
    const logoutBtnPopup = document.getElementById('logoutBtnPopup');
    const togglePopupMenu = (show) => { if (popupMenuOverlay) popupMenuOverlay.classList.toggle('active', show); };
    if (menuIcon) menuIcon.addEventListener('click', () => togglePopupMenu(true));
    if (closePopupBtn) closePopupBtn.addEventListener('click', () => togglePopupMenu(false));
    if (popupMenuOverlay) popupMenuOverlay.addEventListener('click', (e) => { if (e.target === popupMenuOverlay) togglePopupMenu(false); });
    if (logoutBtnPopup) logoutBtnPopup.addEventListener('click', (e) => { e.preventDefault(); auth.signOut(); });
}

function setActiveNavItem() { /* ... এই অংশটি আগের মতোই ... */
    const page = window.location.pathname.split("/").pop();
    const navLinks = document.querySelectorAll('.bottom-nav .nav-item, .popup-nav-list a');
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref && linkHref.split("/").pop() === page) { link.classList.add('active'); }
        else { link.classList.remove('active'); }
    });
}

function updateUserInfoInTemplates(user) { /* ... এই অংশটি আগের মতোই ... */
    const userRef = database.ref('users/' + user.uid);
    const cachedData = localStorage.getItem('user_data_' + user.uid);
    if(cachedData) renderUserInfo(JSON.parse(cachedData));
    userRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            renderUserInfo(data);
            localStorage.setItem('user_data_' + user.uid, JSON.stringify(data));
        }
    });
}

// UI-তে তথ্য রেন্ডার করার চূড়ান্ত এবং নতুন ফাংশন
function renderUserInfo(data) {
    const avatarUrl = data.avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${data.username.charAt(0)}`;
    let displayName = data.username;
    
    // নামের দৈর্ঘ্য ৭ অক্ষরের বেশি হলে (...) যোগ করা
    if (displayName.length > 7) {
        displayName = displayName.substring(0, 7) + "...";
    }
    
    // সাধারণ তথ্য আপডেট
    document.getElementById('header-avatar').src = avatarUrl;
    document.getElementById('user-name-display').textContent = displayName;
    document.getElementById('popup-avatar').src = avatarUrl;
    document.getElementById('popup-username').textContent = data.username; // পপ-আপে পুরো নাম
    
    // ১. ব্লু টিক (ভেরিফাইড ব্যাজ) লজিক
    const verifiedBadge = document.getElementById('verified-badge');
    if (data.isUserActive) { 
        verifiedBadge.classList.add('active');
    } else {
        verifiedBadge.classList.remove('active');
    }

    // ২. প্রিমিয়াম প্ল্যান অনুযায়ী প্রোফাইল বর্ডার এবং 'V' আইকন
    const profilePicContainer = document.getElementById('profile-picture-container');
    const premiumIcon = document.getElementById('premium-icon');
    
    profilePicContainer.className = 'profile-picture-container'; 
    premiumIcon.className = 'premium-icon';
    
    if (data.activePlan) {
        profilePicContainer.classList.add(data.activePlan);
        premiumIcon.classList.add('active');
        premiumIcon.classList.add(data.activePlan);
    } else {
        premiumIcon.classList.remove('active');
    }
}
