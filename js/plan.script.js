// ==========================================================================
// PLAN PAGE SCRIPT (plan.script.js) - চূড়ান্ত, নির্ভুল এবং মসৃণ ভার্সন
// ==========================================================================

// সকল প্ল্যানের তথ্য একটি জায়গায় রাখা হলো। বাস্তব অ্যাপে এটি ডেটাবেস থেকেও আসতে পারে।
const PLANS_DATA = [
    {
        id: 'free',
        name: 'ফ্রি প্ল্যান',
        price: 0,
        level: 0,
        icon: 'fa-leaf',
        features: [
            'দৈনিক ৫টি কাজ',
            'দৈনিক আয় সীমা ৳১০',
            'সর্বনিম্ন উইথড্র ৳২০০',
            'রেফারেল কমিশন ৫%',
            'গ্রাহক সহায়তা (সাধারণ)'
        ]
    },
    {
        id: 'bronze',
        name: 'ব্রোঞ্জ',
        price: 500,
        level: 1,
        icon: 'fa-medal',
        features: [
            'দৈনিক ১০টি কাজ',
            'দৈনিক আয় সীমা ৳২৫',
            'সর্বনিম্ন উইথড্র ৳১৫০',
            'রেফারেল কমিশন ৮%',
            'গ্রাহক সহায়তা (অগ্রাধিকার)'
        ]
    },
    {
        id: 'silver',
        name: 'সিলভার',
        price: 1000,
        level: 2,
        icon: 'fa-award',
        features: [
            'দৈনিক ২০টি কাজ',
            'দৈনিক আয় সীমা ৳৫০',
            'সর্বনিম্ন উইথড্র ৳১০০',
            'রেফারেল কমিশন ১০%',
            'প্রিমিয়াম ব্যাজ ও প্রোফাইল বর্ডার'
        ]
    },
    {
        id: 'gold',
        name: 'গোল্ড',
        price: 2500,
        level: 3,
        icon: 'fa-trophy',
        features: [
            'দৈনিক ৫০টি কাজ',
            'দৈনিক আয় সীমা ৳১২৫',
            'সর্বনিম্ন উইথড্র ৳৫০',
            'রেফারেল কমিশন ১৫%',
            'সকল প্রিমিয়াম সুবিধা'
        ]
    },
    {
        id: 'diamond',
        name: 'ডায়মন্ড',
        price: 5000,
        level: 4,
        icon: 'fa-gem',
        features: [
            'দৈনিক সীমাহীন কাজ',
            'দৈনিক আয় সীমা ৳৩০০',
            'যেকোনো পরিমাণ উইথড্র',
            'রেফারেল কমিশন ২০%',
            'ডেডিকেটেড গ্রাহক সহায়তা'
        ]
    }
];

document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            fetchUserPlanAndDisplay(currentUserId);
        } else {
            // লগইন করা না থাকলে লগইন পেজে পাঠান
            window.location.href = 'login.html';
        }
    });
});

/**
 * ব্যবহারকারীর বর্তমান প্ল্যান Firebase থেকে নিয়ে আসে এবং সকল প্ল্যান প্রদর্শন করে।
 * @param {string} userId - বর্তমান ব্যবহারকারীর আইডি।
 */
function fetchUserPlanAndDisplay(userId) {
    const userRef = database.ref('users/' + userId);
    userRef.once('value').then((snapshot) => {
        const userData = snapshot.val();
        // ব্যবহারকারীর প্ল্যান 'free' ধরা হবে যদি কোনো প্ল্যান সেট করা না থাকে।
        const currentUserPlanId = userData.plan || 'free'; 
        displayAllPlans(currentUserPlanId, userId);
    });
}

/**
 * সকল প্ল্যানকে কার্ড আকারে UI-তে প্রদর্শন করে।
 * @param {string} currentUserPlanId - ব্যবহারকারীর বর্তমান প্ল্যানের আইডি।
 * @param {string} userId - বর্তমান ব্যবহারকারীর আইডি।
 */
function displayAllPlans(currentUserPlanId, userId) {
    const plansContainer = document.getElementById('plans-container');
    plansContainer.innerHTML = ''; // লোডিং টেক্সট মুছে ফেলা

    const currentUserPlan = PLANS_DATA.find(p => p.id === currentUserPlanId);

    PLANS_DATA.forEach(plan => {
        const planCard = createPlanCard(plan, currentUserPlan, userId);
        plansContainer.appendChild(planCard);
    });
}

/**
 * একটি প্ল্যানের জন্য HTML কার্ড তৈরি করে।
 * @param {object} plan - যে প্ল্যানের জন্য কার্ড তৈরি হবে তার ডেটা।
 * @param {object} currentUserPlan - ব্যবহারকারীর বর্তমান প্ল্যানের ডেটা।
 * @param {string} userId - বর্তমান ব্যবহারকারীর আইডি।
 */
function createPlanCard(plan, currentUserPlan, userId) {
    const card = document.createElement('div');
    card.className = `plan-card ${plan.id}`;

    const isCurrent = plan.id === currentUserPlan.id;

    // ফিচারগুলো HTML লিস্ট আইটেম হিসেবে তৈরি করা
    const featuresHTML = plan.features.map(feature => `<li><i class="fas fa-check-circle"></i> ${feature}</li>`).join('');

    // বাটনের টেক্সট এবং ক্লাস নির্ধারণ
    let buttonHTML = '';
    if (isCurrent) {
        buttonHTML = `<button class="plan-action-btn btn-current" disabled>বর্তমান প্ল্যান</button>`;
    } else if (plan.level > currentUserPlan.level) {
        buttonHTML = `<button class="plan-action-btn btn-upgrade" data-plan-id="${plan.id}" data-plan-price="${plan.price}">আপগ্রেড করুন</button>`;
    } else {
        buttonHTML = `<button class="plan-action-btn btn-downgrade" data-plan-id="${plan.id}" data-plan-price="${plan.price}">ডাউনগ্রেড করুন</button>`;
    }

    card.innerHTML = `
        ${isCurrent ? '<div class="current-plan-badge">আপনার প্ল্যান</div>' : ''}
        <i class="fas ${plan.icon} plan-icon"></i>
        <h3 class="plan-name">${plan.name}</h3>
        <div class="plan-price">৳${plan.price}<span>/স্থায়ী</span></div>
        <ul class="plan-features">
            ${featuresHTML}
        </ul>
        ${buttonHTML}
    `;

    // বাটনে ইভেন্ট লিসেনার যোগ করা
    const actionButton = card.querySelector('.plan-action-btn');
    if (actionButton && !isCurrent) {
        actionButton.addEventListener('click', () => handlePlanAction(plan, currentUserPlan, userId));
    }

    return card;
}

/**
 * প্ল্যান আপগ্রেড বা ডাউনগ্রেড করার জন্য কাজ করে।
 * @param {object} targetPlan - যে প্ল্যানটি কেনা হবে।
 * @param {object} currentUserPlan - ব্যবহারকারীর বর্তমান প্ল্যান।
 * @param {string} userId - বর্তমান ব্যবহারকারীর আইডি।
 */
function handlePlanAction(targetPlan, currentUserPlan, userId) {
    const userRef = database.ref('users/' + userId);

    userRef.once('value').then(snapshot => {
        const userData = snapshot.val();
        const userBalance = userData.balance || 0;

        // আপগ্রেড করার জন্য প্রয়োজনীয় ব্যালেন্স চেক
        if (targetPlan.level > currentUserPlan.level) {
            if (userBalance < targetPlan.price) {
                alert(`দুঃখিত, আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই। এই প্ল্যানটি কিনতে ৳${targetPlan.price} প্রয়োজন।`);
                return;
            }

            const confirmation = confirm(`আপনি কি নিশ্চিত যে ৳${targetPlan.price} দিয়ে "${targetPlan.name}" প্ল্যানে আপগ্রেড করতে চান? আপনার অ্যাকাউন্ট থেকে এই পরিমাণ টাকা কেটে নেওয়া হবে।`);
            if (confirmation) {
                const newBalance = userBalance - targetPlan.price;
                userRef.update({
                    plan: targetPlan.id,
                    balance: newBalance
                }).then(() => {
                    alert('অভিনন্দন! আপনার প্ল্যান সফলভাবে আপগ্রেড করা হয়েছে।');
                    displayAllPlans(targetPlan.id, userId); // UI আপডেট করা
                }).catch(error => alert('একটি সমস্যা হয়েছে: ' + error.message));
            }
        } else {
            // ডাউনগ্রেড করার জন্য কনফার্মেশন
            const confirmation = confirm(`আপনি কি নিশ্চিত যে "${targetPlan.name}" প্ল্যানে ডাউনগ্রেড করতে চান? ডাউনগ্রেড করলে কোনো টাকা ফেরত দেওয়া হবে না।`);
            if (confirmation) {
                userRef.update({ plan: targetPlan.id })
                    .then(() => {
                        alert('আপনার প্ল্যান সফলভাবে পরিবর্তন করা হয়েছে।');
                        displayAllPlans(targetPlan.id, userId); // UI আপডেট করা
                    }).catch(error => alert('একটি সমস্যা হয়েছে: ' + error.message));
            }
        }
    });
}
