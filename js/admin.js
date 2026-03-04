document.addEventListener('DOMContentLoaded', () => {
    // 1. Question of the Week Logic
    const qWeekForm = document.getElementById('q-week-form');
    const qText = document.getElementById('q-text');
    const qMath = document.getElementById('q-math');

    // Load existing question from Firestore
    if (window.db) {
        db.collection('settings').doc('qWeek').get().then((doc) => {
            if (doc.exists) {
                const data = doc.data();
                qText.value = data.text;
                qMath.value = data.math;
            }
        });
    }

    qWeekForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = { text: qText.value, math: qMath.value };
        if (window.db) {
            db.collection('settings').doc('qWeek').set(data)
                .then(() => alert('تم تحديث سؤال الأسبوع بنجاح!'))
                .catch(() => alert('فشل التحديث.'));
        }
    });

    // 2. Leaderboard Logic
    const studentList = document.getElementById('student-list');
    const addStudentForm = document.getElementById('add-student-form');
    let students = JSON.parse(localStorage.getItem('students')) || [
        { id: 1, name: "أحمد محمد", points: 2540 },
        { id: 2, name: "سارة أحمد", points: 2310 },
        { id: 3, name: "خالد علي", points: 2150 }
    ];

    function renderStudents() {
        if (!studentList || !window.db) return;

        db.collection('students').orderBy('points', 'desc').onSnapshot((snapshot) => {
            studentList.innerHTML = '';
            snapshot.docs.forEach((doc, index) => {
                const student = doc.data();
                const studentId = doc.id;
                const div = document.createElement('div');
                div.className = 'student-entry';
                div.innerHTML = `
                    <span style="font-weight: bold; width: 30px;">${index + 1}.</span>
                    <input type="text" value="${student.name}" onchange="updateStudent('${studentId}', 'name', this.value)" style="flex-grow: 1;">
                    <input type="number" value="${student.points}" onchange="updateStudent('${studentId}', 'points', this.value)" style="width: 80px;">
                    <button onclick="deleteStudent('${studentId}')" class="btn" style="background: var(--secondary); padding: 0.4rem 0.6rem;"><i class="fas fa-trash"></i></button>
                `;
                studentList.appendChild(div);
            });
        });
    }

    window.updateStudent = function (id, field, value) {
        const updateData = {};
        updateData[field] = field === 'points' ? parseInt(value) : value;
        db.collection('students').doc(id).update(updateData);
    };

    window.deleteStudent = function (id) {
        if (confirm('حذف التلميذ؟')) {
            db.collection('students').doc(id).delete();
        }
    };

    addStudentForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-student-name').value;
        const points = parseInt(document.getElementById('new-student-points').value);
        if (window.db) {
            db.collection('students').add({ name, points })
                .then(() => {
                    addStudentForm.reset();
                });
        }
    });

    renderStudents();

    // 4. Community Inbox Logic
    const adminInbox = document.getElementById('admin-inbox');

    function renderInbox() {
        if (!adminInbox || !window.db) return;

        db.collection('questions').onSnapshot((snapshot) => {
            adminInbox.innerHTML = '';
            if (snapshot.empty) {
                adminInbox.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">لا توجد أسئلة حالياً.</p>';
                return;
            }

            // Sort in JS to avoid Index requirements
            const sortedDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => (b.timestamp?.seconds || b.id || 0) - (a.timestamp?.seconds || a.id || 0));

            sortedDocs.forEach((q_data) => {
                const q = q_data;
                const docId = q_data.id;
                const div = document.createElement('div');
                div.className = 'inbox-item';
                const inboxHeaderHTML = `
                    <div class="inbox-header">
                        <span class="badge" style="background: ${q.reply ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)'}; color: ${q.reply ? '#10b981' : 'var(--primary)'}">${q.reply ? 'تم الرد' : 'سؤال جديد'}</span>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">${q.time}</span>
                    </div>
                `;

                const imageHTML = q.image ? `
                    <div style="margin: 1rem 0; border-radius: 0.8rem; overflow: hidden; border: 1px solid var(--border); cursor: pointer;" onclick="window.open('${q.image}', '_blank')">
                        <img src="${q.image}" alt="Question Image" style="max-width: 100%; display: block; max-height: 200px; object-fit: cover;">
                        <div style="background: rgba(0,0,0,0.5); color: white; padding: 0.3rem; text-align: center; font-size: 0.75rem;"><i class="fas fa-search-plus"></i> اضغط لتكبير الصورة</div>
                    </div>
                ` : '';

                div.innerHTML = `
                    ${inboxHeaderHTML}
                    <div class="inbox-title" style="font-weight: bold; margin: 0.5rem 0;">${q.sender}: ${q.title}</div>
                    <p style="font-size: 0.9rem; color: var(--text); background: var(--bg); padding: 1rem; border-radius: 0.5rem; border-right: 3px solid var(--primary);">${q.details}</p>
                    ${imageHTML}
                    
                    <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed var(--border);">
                        <textarea id="reply-${docId}" placeholder="اكتب ردك هنا..." style="width: 100%; padding: 0.8rem; border-radius: 0.5rem; background: var(--bg); border: 1px solid var(--border); color: white; resize: vertical; margin-bottom: 0.5rem; min-height: 80px;">${q.reply || ''}</textarea>
                        <div style="display: flex; gap: 0.5rem;">
                            <button onclick="saveReply('${docId}')" class="btn btn-primary" style="flex-grow: 1; justify-content: center;">
                                <i class="fas fa-paper-plane"></i> ${q.reply ? 'تحديث الرد' : 'إرسال الرد'}
                            </button>
                            <button onclick="deleteQuestion('${docId}')" class="btn" style="background: var(--secondary);"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `;
                adminInbox.appendChild(div);
            });
        });
    }

    window.saveReply = function (id) {
        const replyText = document.getElementById(`reply-${id}`).value;
        if (!replyText) return alert('الرجاء كتابة الرد');

        db.collection('questions').doc(id).update({
            reply: replyText
        }).then(() => alert('تم حفظ الرد بنجاح!'));
    };

    window.deleteQuestion = function (id) {
        if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
        db.collection('questions').doc(id).delete();
    };

    renderInbox();

    // 5. Resources Logic (Restored)
    const resourceForm = document.getElementById('resource-form');

    resourceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newRes = {
            title: document.getElementById('res-title').value,
            type: document.getElementById('res-type').value,
            link: document.getElementById('res-link').value,
            date: new Date().toLocaleDateString('ar-DZ')
        };

        if (window.db) {
            db.collection('resources').add(newRes)
                .then(() => {
                    alert('تمت إضافة المحتوى للمكتبة!');
                    resourceForm.reset();
                });
        }
    });

    // 6. Security Gate Logic
    const adminGate = document.getElementById('admin-gate');
    const adminGateForm = document.getElementById('admin-gate-form');
    const adminCodeInput = document.getElementById('admin-code');
    const SECRET_CODE = "1962684120112026";

    function checkAdminAuth() {
        const isVerified = sessionStorage.getItem('adminVerified');
        if (isVerified === 'true') {
            adminGate.classList.add('hidden');
        } else {
            adminGate.classList.remove('hidden');
        }
    }

    if (adminGateForm) {
        adminGateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (adminCodeInput.value === SECRET_CODE) {
                sessionStorage.setItem('adminVerified', 'true');
                adminGate.classList.add('hidden');
                alert('تم الدخول بنجاح، أهلاً بك يا أستاذ!');
            } else {
                alert('رمز الوصول غير صحيح!');
                adminCodeInput.value = '';
            }
        });
    }

    checkAdminAuth();
});
