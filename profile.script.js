document.addEventListener('DOMContentLoaded', () => {
    let currentUserId = null;
    let profileUid = null;
    let currentUserData = null;
    let profileData = null;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserId = user.uid;
            const params = new URLSearchParams(window.location.search);
            profileUid = params.get('uid') || currentUserId;
            initializeProfilePage();
        } else {
            window.location.replace('index.html');
        }
    });

    function initializeProfilePage() {
        const isOwnProfile = profileUid === currentUserId;

        database.ref(`users/${profileUid}`).on('value', snapshot => {
            profileData = snapshot.val();
            if (profileData) renderProfileData(profileData, isOwnProfile);
        });
        
        database.ref(`users/${currentUserId}`).on('value', snapshot => {
            currentUserData = snapshot.val();
            if (profileData && !isOwnProfile) renderProfileData(profileData, isOwnProfile);
        });

        const postsRef = database.ref('posts').orderByChild('authorUid').equalTo(profileUid);
        postsRef.on('value', snapshot => {
            const posts = [];
            snapshot.forEach(child => posts.push({ id: child.key, ...child.val() }));
            renderUserPosts(posts, isOwnProfile);
        });

        if (isOwnProfile) {
            document.getElementById('edit-profile-icon').style.display = 'flex';
            document.getElementById('profile-avatar').addEventListener('click', openAvatarSelectionModal);
        }
    }

    function renderProfileData(data, isOwnProfile) {
        if (!data) return;
        document.getElementById('profile-avatar').src = data.avatarUrl || 'https://api.dicebear.com/7/initials/svg?seed=User';
        document.getElementById('profile-name').textContent = data.username || 'Unknown';
        document.getElementById('profile-username').textContent = `@${data.username?.toLowerCase()}`;
        document.getElementById('followers-count').textContent = data.followers ? Object.keys(data.followers).length : 0;
        document.getElementById('following-count').textContent = data.following ? Object.keys(data.following).length : 0;

        const actionsContainer = document.getElementById('profile-actions');
        if (!isOwnProfile && currentUserData) {
            const isFollowing = currentUserData.following && currentUserData.following[profileUid];
            actionsContainer.innerHTML = `<button class="profile-btn follow-btn ${isFollowing ? 'following' : ''}">${isFollowing ? 'Following' : 'Follow'}</button>`;
            actionsContainer.querySelector('.follow-btn').onclick = () => handleFollowToggle(profileUid, isFollowing);
        } else {
            actionsContainer.innerHTML = '';
        }
    }

    function renderUserPosts(posts, isOwnProfile) {
        const container = document.getElementById('user-posts-container');
        container.innerHTML = '';
        posts.sort((a, b) => b.timestamp - a.timestamp);
        document.getElementById('posts-count').textContent = posts.length;

        if (posts.length === 0) {
            container.innerHTML = '<p class="loading-text">কোনো পোস্ট পাওয়া যায়নি।</p>';
            return;
        }

        posts.forEach(post => {
            const postItem = document.createElement('div');
            postItem.className = 'post-item';
            postItem.id = `post-${post.id}`;
            postItem.innerHTML = `
                ${isOwnProfile ? `<button class="delete-post-btn" data-post-id="${post.id}"><i class="fas fa-trash-alt"></i></button>` : ''}
                <h3 class="post-title">${post.title}</h3>
                <p class="post-message">${post.message}</p>
                <div class="post-actions">
                    <button class="action-button like-button"><i class="fas fa-heart"></i> <span>${post.likesCount || 0}</span></button>
                    <button class="action-button comment-button" data-post-id="${post.id}"><i class="fas fa-comment"></i> <span>কমেন্ট</span></button>
                </div>
            `;
            container.appendChild(postItem);

            const likeBtn = postItem.querySelector('.like-button');
            database.ref(`postLikes/${post.id}/${currentUserId}`).on('value', snapshot => {
                if (snapshot.exists()) likeBtn.classList.add('liked');
                else likeBtn.classList.remove('liked');
            });
            likeBtn.onclick = () => handleLike(post.id, currentUserId);
            
            postItem.querySelector('.comment-button').onclick = () => {
                window.location.href = `feed.html?postId=${post.id}&action=comment`;
            };
        });

        if (isOwnProfile) {
            container.querySelectorAll('.delete-post-btn').forEach(btn => {
                btn.onclick = () => {
                    Swal.fire({
                        title: 'আপনি কি নিশ্চিত?',
                        text: "এই পোস্টটি ডিলিট করলে তা আর ফিরিয়ে আনা যাবে না!",
                        icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33',
                        cancelButtonColor: '#3085d6', confirmButtonText: 'হ্যাঁ, ডিলিট করুন!', cancelButtonText: 'না'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            database.ref(`posts/${btn.dataset.postId}`).remove();
                            Swal.fire('ডিলিটেড!', 'আপনার পোস্টটি ডিলিট করা হয়েছে।', 'success');
                        }
                    });
                };
            });
        }
    }

    function openAvatarSelectionModal() {
        const avatars = [
            'https://api.dicebear.com/7/avataaars/svg?seed=Peanut', 'https://api.dicebear.com/7/avataaars/svg?seed=Midnight',
            'https://api.dicebear.com/7/avataaars/svg?seed=Trouble', 'https://api.dicebear.com/7/bottts/svg?seed=Sheba',
            'https://api.dicebear.com/7/bottts/svg?seed=Zoe', 'https://api.dicebear.com/7/bottts/svg?seed=Gizmo',
            'https://api.dicebear.com/7/lorelei/svg?seed=Snowball', 'https://api.dicebear.com/7/lorelei/svg?seed=Precious',
            'https://api.dicebear.com/7/lorelei/svg?seed=Coco'
        ];
        
        let avatarGridHtml = avatars.map(src => `<div class="avatar-option" data-src="${src}"><img src="${src}" alt="Avatar"></div>`).join('');
        
        Swal.fire({
            title: 'আপনার অ্যাভাটার বাছাই করুন',
            html: `<div class="avatar-grid">${avatarGridHtml}</div>`,
            showConfirmButton: false,
            width: '90%',
            willOpen: () => {
                const avatarOptions = Swal.getHtmlContainer().querySelectorAll('.avatar-option');
                avatarOptions.forEach(el => {
                    el.onclick = async () => {
                        await database.ref(`users/${currentUserId}`).update({ avatarUrl: el.dataset.src });
                        Swal.fire({ icon: 'success', title: 'সফল!', text: 'আপনার প্রোফাইল ছবি পরিবর্তন হয়েছে।', timer: 1500 });
                    };
                });
            }
        });
    }

    async function handleFollowToggle(targetUid, isCurrentlyFollowing) {
        const updates = {};
        updates[`users/${currentUserId}/following/${targetUid}`] = isCurrentlyFollowing ? null : true;
        updates[`users/${targetUid}/followers/${currentUserId}`] = isCurrentlyFollowing ? null : true;
        await database.ref().update(updates);
    }

    async function handleLike(postId, userId) {
        const postLikesRef = database.ref(`postLikes/${postId}/${userId}`);
        const postRef = database.ref(`posts/${postId}`);
        const snapshot = await postLikesRef.once('value');
        if (snapshot.exists()) {
            await postLikesRef.remove();
            await postRef.child('likesCount').transaction(c => (c || 1) - 1);
        } else {
            await postLikesRef.set(true);
            await postRef.child('likesCount').transaction(c => (c || 0) + 1);
        }
    }
});