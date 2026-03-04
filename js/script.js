document.addEventListener('DOMContentLoaded', () => {
    // --- AUTHENTICATION LOGIC ---
    const authModal = document.getElementById('login-modal');
    const authForm = document.getElementById('auth-form');
    const authTitle = document.getElementById('auth-title');
    const authDesc = document.getElementById('auth-desc');
    const authSubmit = document.getElementById('auth-submit');
    const authToggleBtn = document.getElementById('auth-toggle-btn');
    const authToggleText = document.getElementById('auth-toggle-text');
    const usernameGroup = document.getElementById('username-group');

    let isRegisterMode = true;

    // Toggle between Login and Register
    if (authToggleBtn) {
        authToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isRegisterMode = !isRegisterMode;

            if (isRegisterMode) {
                authTitle.innerText = 'إنشاء حساب جديد';
                authDesc.innerText = 'انضم إلى Kheir Math لبدء رحلتك التعليمية';
                authSubmit.innerText = 'إنشاء حساب';
                authToggleText.innerText = 'لديك حساب بالفعل؟';
                authToggleBtn.innerText = 'سجل دخولك';
                usernameGroup.style.display = 'block';
                document.getElementById('user-name').required = true;
            } else {
                authTitle.innerText = 'تسجيل الدخول';
                authDesc.innerText = 'مرحباً بك مجدداً في منصتك التعليمية';
                authSubmit.innerText = 'دخول';
                authToggleText.innerText = 'ليس لديك حساب؟';
                authToggleBtn.innerText = 'أنشئ حساباً جديداً';
                usernameGroup.style.display = 'none';
                document.getElementById('user-name').required = false;
            }
        });
    }

    // --- AUTHENTICATION & UI SYNC ---
    function syncAuthStateUI(user) {
        const headerInfo = document.querySelector('.header-info p') || document.querySelector('header p');
        if (user) {
            authModal.classList.add('hidden');
            const username = user.displayName || user.email.split('@')[0];
            if (headerInfo) headerInfo.innerText = `مرحباً بك، ${username}`;

            // Trigger renderings that depend on user
            renderMyQuestions();
        } else {
            authModal.classList.remove('hidden');
            if (headerInfo) headerInfo.innerText = 'مرحباً بك مجدداً في رحلتك التعليمية';
        }
    }

    if (window.auth) {
        auth.onAuthStateChanged((user) => {
            syncAuthStateUI(user);
        });
    }

    // Helper to get IP Address
    async function getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('Error fetching IP:', error);
            return 'unknown';
        }
    }

    // Auth Form Submission
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('user-email').value;
            const password = document.getElementById('user-password').value;
            const ip = await getUserIP();

            if (isRegisterMode) {
                const username = document.getElementById('user-name').value;

                // Password Validation: 6+ chars, contains number and symbol (any non-alphanumeric)
                const passwordRegex = /^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{6,}$/;
                if (!passwordRegex.test(password)) {
                    alert('كلمة المرور يجب أن تكون 6 أحرف على الأقل، وتحتوي على رقم ورمز واحد على الأقل (مثل: @، #، $، *).');
                    return;
                }

                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        return db.collection('users').doc(user.uid).set({
                            username: username,
                            email: email,
                            ip: ip,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .catch((error) => {
                        alert('خطأ في التسجيل: ' + error.message);
                    });
            } else {
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        const user = userCredential.user;
                        return db.collection('users').doc(user.uid).update({
                            ip: ip,
                            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    })
                    .catch((error) => {
                        alert('خطأ في الدخول: ' + error.message);
                    });
            }
        });
    }

    // Google Auth Logic
    const googleAuthBtn = document.getElementById('google-auth-btn');
    if (googleAuthBtn && window.auth) {
        googleAuthBtn.addEventListener('click', async () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            const ip = await getUserIP();

            auth.signInWithPopup(provider)
                .then((result) => {
                    const user = result.user;
                    db.collection('users').doc(user.uid).get().then((doc) => {
                        if (!doc.exists) {
                            // New Google user, create profile with username from email
                            const generatedUsername = user.email.split('@')[0];
                            return db.collection('users').doc(user.uid).set({
                                username: generatedUsername,
                                email: user.email,
                                ip: ip,
                                createdAt: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        } else {
                            return db.collection('users').doc(user.uid).update({
                                ip: ip,
                                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                            });
                        }
                    });
                })
                .catch((error) => {
                    alert('خطأ في تسجيل الدخول بواسطة Google: ' + error.message);
                });
        });
    }

    // --- EXISTING UI LOGIC ---
    // Handle Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn && window.auth) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('هل تريد تسجيل الخروج؟')) {
                auth.signOut().then(() => {
                    window.location.reload();
                });
            }
        });
    }

    // 0. Sidebar Toggle for Mobile
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('active');
            const icon = sidebarToggle.querySelector('i');
            if (sidebar.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });

        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
                sidebar.classList.remove('active');
                if (sidebarToggle.querySelector('i')) {
                    sidebarToggle.querySelector('i').className = 'fas fa-bars';
                }
            }
        });
    }

    // 1. Navigation & Theme
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (currentPath.includes(href) && href !== 'index.html') {
            link.classList.add('active');
        } else if (currentPath.endsWith('/') || currentPath.endsWith('index.html')) {
            if (href === 'index.html' || href === '../index.html') {
                link.classList.add('active');
            }
        }
    });

    // 2. Dynamic Notifications (System & List)
    const notificationsList = document.getElementById('notifications-list');

    // Request permission for system notifications
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    if (notificationsList && window.db) {
        let isInitialLoad = true;
        db.collection('notifications').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
            notificationsList.innerHTML = '';

            if (snapshot.empty) {
                notificationsList.innerHTML = '<li style="color: var(--text-muted); font-style: italic;">لا توجد تنبيهات حالياً.</li>';
                return;
            }

            snapshot.docs.forEach((doc, index) => {
                const data = doc.data();

                // Show system notification for the newest one (if not initial load)
                if (!isInitialLoad && index === 0 && Notification.permission === "granted") {
                    new Notification("تنبيه جديد من Kheir Math", {
                        body: data.text,
                        icon: "../icon.png" // Replace with your icon path if you have one
                    });
                }

                const li = document.createElement('li');
                li.innerText = `• ${data.text}`;
                notificationsList.appendChild(li);
            });
            isInitialLoad = false;
        });
    }

    // 3. Dynamic Dashboard Content
    const qWeekContainer = document.querySelector('.card:has(.fa-star)');
    if (qWeekContainer && window.db) {
        db.collection('settings').doc('qWeek').onSnapshot((doc) => {
            if (doc.exists) {
                const savedQ = doc.data();
                const qTitle = qWeekContainer.querySelector('.card-content p');
                const qMath = qWeekContainer.querySelector('.card-content div');
                if (qTitle) qTitle.innerText = savedQ.text;
                if (qMath) qMath.innerText = `$${savedQ.math}$`;

                if (window.renderMathInElement) {
                    renderMathInElement(qWeekContainer);
                }
            }
        });
    }

    // 3. Dynamic Leaderboard
    const leaderboardList = document.querySelector('.card:has(.fa-trophy) .card-content div');
    if (leaderboardList && window.db) {
        db.collection('students').orderBy('points', 'desc').limit(5).onSnapshot((snapshot) => {
            leaderboardList.innerHTML = '';
            snapshot.docs.forEach((doc, index) => {
                const student = doc.data();
                const isTop = index === 0;
                const div = document.createElement('div');
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.alignItems = 'center';
                div.style.padding = '0.5rem 1rem';
                div.style.background = isTop ? 'rgba(251, 191, 36, 0.1)' : 'rgba(99, 102, 241, 0.05)';
                div.style.borderRadius = '0.5rem';
                if (isTop) div.style.border = '1px solid rgba(251, 191, 36, 0.2)';

                div.innerHTML = `
                    <span style="${isTop ? 'font-weight: bold;' : ''}">${index + 1}. ${student.name}</span>
                    <span style="color: var(--primary);">${student.points} نقطة</span>
                `;
                leaderboardList.appendChild(div);
            });
        });
    }

    // 4. Dynamic Resources Library
    const resourcesGrid = document.querySelector('.resources-grid');
    const searchInput = document.querySelector('.search-box input');
    const tags = document.querySelectorAll('.tag');

    function renderResources(filter = '', typeFilter = 'الكل') {
        if (!resourcesGrid || !window.db) return;

        db.collection('resources').get().then((snapshot) => {
            let resources = snapshot.docs.map(doc => doc.data());

            // Fallback for empty DB
            if (resources.length === 0) {
                resources = [
                    { title: "ملخص شامل لقوانين الاشتقاق", type: "PDF", link: "#", date: "12 مايو 2024" },
                    { title: "شرح الدوال الأسية واللوغاريتمية", type: "فيديو", link: "https://youtube.com/...", date: "45 دقيقة" }
                ];
            }

            const filtered = resources.filter(res => {
                const matchesSearch = res.title.toLowerCase().includes(filter.toLowerCase());
                const matchesTag = typeFilter === 'الكل' || res.type === typeFilter || (typeFilter === 'PDF' && res.type === 'PDF') || (typeFilter === 'فيديوهات' && res.type === 'فيديو');
                return matchesSearch && matchesTag;
            });

            resourcesGrid.innerHTML = '';
            if (filtered.length === 0) {
                resourcesGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 3rem;">لا توجد نتائج تطابق بحثك.</p>';
                return;
            }

            filtered.forEach(res => {
                const card = document.createElement('div');
                card.className = 'resource-card';
                const icon = res.type === 'فيديو' ? 'fa-play-circle' : (res.type === 'PDF' ? 'fa-file-pdf' : 'fa-file-contract');
                const iconColor = res.type === 'فيديو' ? 'var(--secondary)' : (res.type === 'PDF' ? 'var(--primary)' : 'var(--accent)');

                card.innerHTML = `
                    <div class="resource-thumb" style="color: ${iconColor};">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="resource-info">
                        <span class="resource-type">${res.type}</span>
                        <h3 class="resource-title">${res.title}</h3>
                        <div class="resource-meta">
                            <span><i class="far ${res.type === 'فيديو' ? 'fa-clock' : 'fa-calendar-alt'}"></i> ${res.date}</span>
                            <a href="${res.link}" target="_blank" class="btn btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                                <i class="fas ${res.type === 'فيديو' ? 'fa-external-link-alt' : (res.type === 'PDF' ? 'fa-download' : 'fa-eye')}"></i>
                            </a>
                        </div>
                    </div>
                `;
                resourcesGrid.appendChild(card);
            });
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const activeTag = document.querySelector('.tag.active')?.innerText || 'الكل';
            renderResources(e.target.value, activeTag);
        });
    }

    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            renderResources(searchInput?.value || '', tag.innerText);
        });
    });

    renderResources();

    // 5. Community Interaction Logic
    const submitBtn = document.querySelector('.ask-teacher-form .btn');
    const myQuestionsList = document.getElementById('my-questions-list');

    function renderMyQuestions() {
        if (!myQuestionsList || !window.db || !auth.currentUser) return;
        const userEmail = auth.currentUser.email;

        db.collection('questions')
            .where('userEmail', '==', userEmail)
            .orderBy('id', 'desc')
            .onSnapshot((snapshot) => {
                if (snapshot.empty) {
                    myQuestionsList.innerHTML = '<p style="color: var(--text-muted);">لم تقم بطرح أي أسئلة بعد.</p>';
                    return;
                }

                myQuestionsList.innerHTML = '';
                snapshot.docs.forEach(doc => {
                    const q = doc.data();
                    const div = document.createElement('div');
                    div.className = 'card';
                    div.style.marginBottom = '1rem';
                    div.style.padding = '1.5rem';

                    let replyHTML = q.reply
                        ? `<div style="margin-top: 1rem; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-right: 4px solid #10b981; border-radius: 0.5rem;">
                         <strong><i class="fas fa-reply"></i> رد الأستاذ:</strong>
                         <p style="margin-top: 0.5rem; color: var(--text);">${q.reply}</p>
                       </div>`
                        : `<div style="margin-top: 1rem; color: var(--text-muted); font-style: italic; font-size: 0.9rem;">
                         <i class="fas fa-hourglass-half"></i> في انتظار رد الأستاذ...
                       </div>`;

                    div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <h3 style="font-size: 1.1rem;">${q.title}</h3>
                        <span style="font-size: 0.8rem; color: var(--text-muted);">${q.time}</span>
                    </div>
                    <p style="color: var(--text-muted);">${q.details}</p>
                    ${replyHTML}
                `;
                    myQuestionsList.appendChild(div);
                });
            });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const title = document.querySelector('.ask-teacher-form input').value;
            const details = document.querySelector('.ask-teacher-form textarea').value;
            const currentUser = auth.currentUser;

            if (!title || !details) return alert('الرجاء ملء بيانات السؤال');
            if (!currentUser) return alert('الرجاء تسجيل الدخول أولاً');
            if (!window.db) return alert('خطأ في الاتصال بقاعدة البيانات');

            const newQuestion = {
                id: Date.now(),
                title,
                details,
                sender: currentUser.email.split('@')[0],
                userEmail: currentUser.email,
                time: new Date().toLocaleString('ar-DZ'),
                reply: null
            };

            db.collection('questions').add(newQuestion)
                .then(() => {
                    alert('تم إرسال سؤالك بنجاح! سيظهر في لوحة الأستاذ.');
                    document.querySelector('.ask-teacher-form').reset();
                })
                .catch(err => {
                    console.error("Error adding document: ", err);
                    alert("فشل في إرسال السؤال.");
                });
        });
    }

    // Initial render of questions moved to syncAuthStateUI
    // --- END OF SCRIPT ---
});
