// Add this at the very top of script.js to confirm it's loading
console.log("script.js loaded and executing (LOCAL VERSION).");

// --- LOCAL STORAGE DATA MANAGEMENT (Re-implemented) ---
const LocalStore = {
    get: (key) => { try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : null; } catch (e) { console.error(`Error getting ${key} from localStorage`, e); return null; } },
    set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error(`Error setting ${key} to localStorage`, e); } },
    getAllData: () => { const d = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); d[k] = LocalStore.get(k); } return d; },
    importData: (d) => { try { for(const k in d) LocalStore.set(k, d[k]); return true; } catch(e) { console.error("Error importing", e); return false; } },
    clearAll: () => localStorage.clear(),
};

// --- GLOBAL STATE & DEFAULTS ---
let userId = 'local_admin'; // Hardcoded for local development
let currentUserRole = 'admin'; // Hardcoded for local development
let isAuthReady = true; // Always true for local development
// Removed authMode as login screen is gone

// Application data caches (will be populated by LocalStorage)
let studentsCache = [];
let classesCache = [];
let settingsCache = {};
let attendanceCache = {};
let plansCache = [];
let notificationsCache = [];
let examsCache = {};
let financialsCache = {};
let expensesCache = []; // New cache for expenses

// Dummy teachers data for local development
let teachersCache = [
    { id: 'teacher1', name: 'أحمد محمود' },
    { id: 'teacher2', name: 'فاطمة علي' },
    { id: 'teacher3', name: 'خالد إبراهيم' },
];


const defaultSettings = { theme: 'light', themeColor: '#0d9488', currency: 'SDG', examFields: [{ name: "جودة الحفظ", mark: 50 }, { name: "أحكام التجويد", mark: 30 }, { name: "جمال الصوت", mark: 20 }] };
let weeklyProgressChart, classDistributionChart, incomeOverTimeChart, monthlyAttendanceChart; // Added monthlyAttendanceChart

const APP_ID = 'local-app-id'; 

// --- Achievement Definitions ---
const achievementsDefinitions = {
    "first_juz": { name: "حافظ الجزء الأول", description: "أتم حفظ الجزء الأول", icon: "⭐" },
    "five_juz": { name: "حافظ خمسة أجزاء", description: "أتم حفظ خمسة أجزاء", icon: "🌟" },
    "ten_juz": { name: "حافظ عشرة أجزاء", description: "أتم حفظ عشرة أجزاء", icon: "✨" },
    "perfect_attendance_month": { name: "حضور مثالي لشهر", description: "لم يغب طوال الشهر", icon: "🗓️" },
    "first_exam_pass": { name: "اجتياز أول اختبار", description: "اجتاز أول اختبار بنجاح", icon: "🏆" },
    "high_scorer": { name: "امتياز في الاختبار", description: "حقق 90% أو أكثر في اختبار", icon: "🏅" },
    "consistent_plan": { name: "مواظب على الخطة", description: "أتم صفحات الخطة الأسبوعية", icon: "✅" }, // New Achievement
};


// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initializeAppState();
    setupEventListeners();
});

async function initializeAppState() {
    console.log("Initializing local app state...");
    // Load data from localStorage
    studentsCache = LocalStore.get('students') || [];
    classesCache = LocalStore.get('classes') || [];
    settingsCache = { ...defaultSettings, ...(LocalStore.get('settings') || {}) };
    attendanceCache = LocalStore.get('attendance') || {};
    plansCache = LocalStore.get('plans') || [];
    notificationsCache = LocalStore.get('notifications') || [];
    examsCache = LocalStore.get('exams') || {};
    financialsCache = LocalStore.get('financials') || {};
    expensesCache = LocalStore.get('expenses') || []; // Load expenses

    applySettings(); // Apply theme settings
    renderAll(); // Render initial UI with loaded data

    // Set initial values for date inputs
    const today = new Date();
    const financialMonthInput = document.getElementById('financial-month');
    const attendanceDateInput = document.getElementById('attendance-date');
    const currencySelect = document.getElementById('currency-select');

    if (financialMonthInput) financialMonthInput.value = today.toISOString().slice(0, 7);
    if (attendanceDateInput) attendanceDateInput.value = today.toISOString().slice(0, 10);
    if (currencySelect) currencySelect.value = settingsCache.currency; 
    
    // For local development, the app container is always visible
    const userIdDisplay = document.getElementById('user-id-display');
    if (userIdDisplay) {
        userIdDisplay.textContent = `معرف المستخدم: ${userId} (الدور: ${currentUserRole})`;
    }

    showView('dashboard-view'); // Show default view
    createNotification("تم تحميل التطبيق بنجاح (الوضع المحلي).", "system");
    console.log("Local app state initialized and main app displayed.");
}


function renderAll() {
    // For local development, auth is always ready and user is 'admin'
    renderStudentsTable();
    renderClassesGrid();
    renderPlans();
    renderNotifications();
    renderExamFieldSettings();
    renderExamFieldsForEntry();
    renderFinancialsTable();
    renderExpensesList(); // Render expenses list
    updateDashboard();
    renderFinancialsDashboard();
    populateAllClassDropdowns();
    populateAllPlanDropdowns();
    populateTeacherDropdowns(); // Populate teacher dropdowns
    applyRoleBasedUI(); // Apply UI rules based on hardcoded admin role
    populateParentPortalStudentDropdown(); // Populate student dropdown for parent portal
}

// --- UI & NAVIGATION ---
window.showView = (viewId) => {
    document.querySelectorAll('.view').forEach(v => v.classList.add('hidden'));
    const viewToShow = document.getElementById(viewId);
    if (viewToShow) viewToShow.classList.remove('hidden');
    if (window.innerWidth < 1024) document.getElementById('sidebar').classList.add('sidebar-closed');
    if (viewId === 'dashboard-view') updateDashboard();
    if (viewId === 'financials-dashboard-view') renderFinancialsDashboard();
    if (viewId === 'financials-view') renderExpensesList(); // Ensure expenses are rendered when financials view is shown
    if (viewId === 'parent-portal-view') populateParentPortalStudentDropdown(); // Repopulate on view change
};

function setupEventListeners() {
    console.log("Setting up event listeners...");
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('sidebar-closed'));
        console.log("Sidebar toggle listener attached.");
    } else {
        console.warn("Sidebar toggle element not found.");
    }

    const studentSearch = document.getElementById('student-search');
    if (studentSearch) {
        studentSearch.addEventListener('input', renderStudentsTable);
        console.log("Student search listener attached.");
    } else {
        console.warn("Student search element not found.");
    }

    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    if (confirmCancelBtn) {
        confirmCancelBtn.addEventListener('click', () => closeModal('confirm-modal'));
        console.log("Confirm cancel button listener attached.");
    } else {
        console.warn("Confirm cancel button not found.");
    }

    const confirmOkBtn = document.getElementById('confirm-ok-btn');
    if (confirmOkBtn) {
        confirmOkBtn.addEventListener('click', () => { if (window.confirmCallback) window.confirmCallback(); closeModal('confirm-modal'); window.confirmCallback = null; });
        console.log("Confirm OK button listener attached.");
    } else {
        console.warn("Confirm OK button not found.");
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log("Theme toggle listener attached.");
    } else {
        console.warn("Theme toggle element not found.");
    }

    const themeColorPicker = document.getElementById('theme-color-picker');
    if (themeColorPicker) {
        themeColorPicker.addEventListener('input', (e) => applySettings(e.target.value));
        themeColorPicker.addEventListener('change', (e) => { // Changed to local storage save
            settingsCache.themeColor = e.target.value;
            LocalStore.set('settings', settingsCache); // Save to local storage
            createNotification("تم حفظ لون الواجهة الجديد.", "success");
        });
        console.log("Theme color picker listeners attached.");
    } else {
        console.warn("Theme color picker element not found.");
    }

    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', (e) => {
            e.stopPropagation();
            const notificationsPanel = document.getElementById('notifications-panel');
            if (notificationsPanel) notificationsPanel.classList.toggle('hidden');
        });
        console.log("Notification bell listener attached.");
    } else {
        console.warn("Notification bell element not found.");
    }
    document.body.addEventListener('click', () => {
        const notificationsPanel = document.getElementById('notifications-panel');
        if (notificationsPanel) notificationsPanel.classList.add('hidden');
    });

    populateCountryCodes(); // Call global function
    
    // Logout button in main app header
    const logoutButton = document.querySelector('#sidebar button[onclick="handleLogout()"]');
    if (logoutButton) {
        logoutButton.addEventListener('click', window.handleLogout);
        console.log("Logout button in sidebar listener attached.");
    } else {
        console.warn("Logout button in sidebar not found.");
    }

    // Parent Portal student select listener
    const parentPortalStudentSelect = document.getElementById('parent-portal-student-select');
    if (parentPortalStudentSelect) {
        parentPortalStudentSelect.addEventListener('change', (e) => renderParentStudentProfile(e.target.value));
    }
}

window.applySettings = (newColor = null) => {
    const color = newColor || settingsCache.themeColor;
    document.body.classList.toggle('dark', settingsCache.theme === 'dark');
    document.documentElement.style.setProperty('--theme-color', color);
    const darkColor = Chart.helpers.color(color).darken(0.2).hexString();
    document.documentElement.style.setProperty('--theme-color-dark', darkColor);
    if (!newColor) {
        const themeColorPicker = document.getElementById('theme-color-picker');
        if (themeColorPicker) themeColorPicker.value = color;
    }
};

window.toggleTheme = () => { // Changed to local storage save
    settingsCache.theme = document.body.classList.contains('dark') ? 'light' : 'dark';
    applySettings();
    LocalStore.set('settings', settingsCache); // Save to local storage
};

// --- LOCAL AUTHENTICATION FUNCTIONS (for development bypass) ---
// This function is now the primary "login" handler for local dev
window.handleLogin = (email, password) => {
    // This function is no longer used for local dev, but keeping a stub
    console.warn("handleLogin (Firebase) is not active in local development mode.");
};

window.handleSignUp = (email, password) => {
    // This function is no longer used for local dev, but keeping a stub
    console.warn("handleSignUp (Firebase) is not active in local development mode.");
};

window.handleAnonymousSignIn = () => {
    // This function is no longer used for local dev, but keeping a stub
    console.warn("handleAnonymousSignIn (Firebase) is not active in local development mode.");
};

window.handleLogout = () => {
    customConfirm("هل أنت متأكد من تسجيل الخروج؟", () => {
        // Simulate logout for local development
        userId = 'anonymous';
        currentUserRole = 'anonymous';
        isAuthReady = false;
        LocalStore.clearAll(); // Clear local data on logout for clean slate
        location.reload(); // Reload page to show login screen again
        createNotification("تم تسجيل الخروج بنجاح.", "info");
    });
};

// Removed toggleAuthMode since there's no auth screen anymore

// --- ROLE-BASED UI CONTROL ---
window.applyRoleBasedUI = () => {
    const isAdmin = currentUserRole === 'admin';
    const isTeacher = currentUserRole === 'teacher';
    // const isAnonymous = currentUserRole === 'anonymous'; // Not explicitly used for UI toggles here

    // Elements visible only to Admin
    document.querySelectorAll('[data-role-admin]').forEach(el => {
        el.classList.toggle('hidden', !isAdmin);
    });

    // Elements visible to Admin and Teacher (most data entry)
    document.querySelectorAll('[data-role-teacher-admin]').forEach(el => {
        el.classList.toggle('hidden', !(isAdmin || isTeacher));
    });

    // Specific elements
    const addStudentBtn = document.querySelector('#students-view button[onclick="openStudentModal()"]');
    if (addStudentBtn) addStudentBtn.classList.toggle('hidden', !(isAdmin || isTeacher));

    const assignClassBulkBtn = document.getElementById('assign-class-bulk');
    if (assignClassBulkBtn) assignClassBulkBtn.classList.toggle('hidden', !(isAdmin || isTeacher));

    const createClassBtn = document.querySelector('#classes-view button[onclick="openClassModal()"]');
    if (createClassBtn) createClassBtn.classList.toggle('hidden', !(isAdmin || isTeacher));

    const createPlanBtn = document.querySelector('#plans-view button[onclick="openPlanModal()"]');
    if (createPlanBtn) createPlanBtn.classList.toggle('hidden', !(isAdmin || isTeacher));

    const settingsView = document.getElementById('settings-view');
    if (settingsView) settingsView.classList.toggle('hidden', !isAdmin); // Settings only for admin

    // Student table actions (edit/delete buttons)
    // These are dynamically rendered, so we need to ensure the renderStudentsTable function
    // is aware of the role. For now, we'll rely on security rules to block actual actions.
    // For local, we control via `canEditDelete` in renderStudentsTable.
}


// --- MODALS ---
window.openModal = (modalId) => document.getElementById(modalId).classList.remove('hidden');
window.closeModal = (modalId) => document.getElementById(modalId).classList.add('hidden');
window.customAlert = (msg) => { document.getElementById('alert-message').textContent = msg; openModal('alert-modal'); };
window.customConfirm = (msg, cb) => { document.getElementById('confirm-message').textContent = msg; window.confirmCallback = cb; openModal('confirm-modal'); }; // Fixed typo here

// --- DATA RENDERING ---
window.renderStudentsTable = () => {
    const searchTermInput = document.getElementById('student-search');
    const classFilterSelect = document.getElementById('filter-class');
    const tableBody = document.getElementById('students-table-body');

    const searchTerm = searchTermInput ? searchTermInput.value.toLowerCase() : '';
    const classFilter = classFilterSelect ? classFilterSelect.value : '';

    let filtered = studentsCache.filter(s => (s.name.toLowerCase().includes(searchTerm) || s.id.includes(searchTerm)) && (!classFilter || s.classId === classFilter));
    if (filtered.length === 0) { 
        if (tableBody) tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">لم يتم العثور على طلاب.</td></tr>`; 
        return; 
    }
    
    const canEditDelete = currentUserRole === 'admin' || currentUserRole === 'teacher';

    if (tableBody) {
        tableBody.innerHTML = filtered.map(s => {
            const cls = classesCache.find(c => c.id === s.classId);
            const pages = Object.values(s.progress || {}).reduce((sum, p) => sum + p.length, 0); 
            let actionsHtml = '';
            if (canEditDelete) {
                actionsHtml = `<button class="text-blue-500 hover:text-blue-700 mx-1" onclick='openStudentModal("${s.id}")'>تعديل</button><button class="text-red-500 hover:text-red-700 mx-1" onclick='deleteStudent("${s.id}", "${s.name}")'>حذف</button>`;
            }
            return `<tr class="hover:bg-gray-50 dark:hover:bg-gray-600"><td class="py-3 px-2 text-center"><input type="checkbox" class="custom-checkbox student-checkbox" data-student-id="${s.id}"></td><td class="py-3 px-6 font-semibold text-theme dark:text-theme-dark cursor-pointer hover:underline" onclick="viewStudentProfile('${s.id}')">${s.name}</td><td class="py-3 px-6">${cls ? cls.name : 'غير محدد'}</td><td class="py-3 px-6">${pages}</td><td class="py-3 px-6">${s.age || 'N/A'}</td><td class="py-3 px-6 text-center">${actionsHtml}</td></tr>`;
        }).join('');
    }
};

window.viewClassDetails = (classId) => {
    const classObj = classesCache.find(c => c.id === classId);
    if (!classObj) {
        customAlert("لم يتم العثور على الفصل.");
        return;
    }

    const classDetailsView = document.getElementById('class-details-view');
    if (!classDetailsView) {
        console.error("Class details view element not found.");
        return;
    }

    const studentsInClass = studentsCache.filter(s => s.classId === classId);
    let studentsListHtml = '';
    if (studentsInClass.length > 0) {
        studentsListHtml = `<h4 class="text-lg font-semibold mb-2">الطلاب في هذا الفصل:</h4>
                            <ul class="list-disc list-inside space-y-1">`;
        studentsInClass.forEach(student => {
            studentsListHtml += `<li class="text-gray-700 dark:text-gray-300">${student.name} (${student.age || 'N/A'} سنة)</li>`;
        });
        studentsListHtml += `</ul>`;
    } else {
        studentsListHtml = `<p class="text-gray-500">لا يوجد طلاب مسجلون في هذا الفصل.</p>`;
    }

    // Calculate class statistics
    const totalStudentsInClass = studentsInClass.length;
    const totalPagesMemorizedInClass = studentsInClass.reduce((sum, s) => sum + Object.values(s.progress || {}).reduce((pSum, p) => pSum + p.length, 0), 0);
    const avgPagesMemorized = totalStudentsInClass > 0 ? (totalPagesMemorizedInClass / totalStudentsInClass).toFixed(1) : 0;

    // Get assigned teacher name
    const assignedTeacher = teachersCache.find(t => t.id === classObj.teacherId);
    const teacherName = assignedTeacher ? assignedTeacher.name : 'غير محدد';


    classDetailsView.innerHTML = `
        <div class="flex justify-between items-start mb-6">
            <div>
                <h2 class="text-3xl font-bold">${classObj.name}</h2>
                <p class="text-gray-500 dark:text-gray-400">${classObj.schedule || 'لم يحدد جدول'}</p>
                <p class="font-bold text-theme dark:text-theme-dark mt-1">${classObj.fee || 0} ${settingsCache.currency}</p>
                <p class="text-gray-600 dark:text-gray-300 mt-1"><strong>المعلم:</strong> ${teacherName}</p>
            </div>
            <button class="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg" onclick="showView('classes-view')">العودة للفصول</button>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-600">معلومات الفصل</h3>
                <img src="${classObj.photo || `https://placehold.co/600x400/0d9488/ffffff?text=${encodeURIComponent(classObj.name)}`}" class="w-full h-48 object-cover rounded-md mb-4" onerror="this.onerror=null;this.src='https://placehold.co/600x400/cccccc/ffffff?text=Error';">
                <p><strong>عدد الطلاب:</strong> ${totalStudentsInClass}</p>
                <p><strong>متوسط الحفظ لكل طالب:</strong> ${avgPagesMemorized} صفحة</p>
                <div class="mt-4 text-left">
                    <button class="text-blue-500 hover:text-blue-700 mx-1 text-sm" onclick='openClassModal("${classObj.id}")'>تعديل الفصل</button>
                    <button class="text-red-500 hover:text-red-700 mx-1 text-sm" onclick='deleteClass("${classObj.id}", "${classObj.name}")'>حذف الفصل</button>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-600">قائمة الطلاب</h3>
                <div class="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    ${studentsListHtml}
                </div>
            </div>
        </div>
    `;
    showView('class-details-view');
};


window.viewStudentProfile = (studentId) => {
    const student = studentsCache.find(s => s.id === studentId);
    if (!student) { customAlert("لم يتم العثور على الطالب."); return; }
    const profileView = document.getElementById('student-profile-view');
    const studentClass = classesCache.find(c => c.id === student.classId);
    const studentPlan = plansCache.find(p => p.id === student.planId);
    let contactLinks = '';
    if (student.phone && student.countryCode) {
        let cleanPhone = student.phone.startsWith('0') ? student.phone.substring(1) : student.phone;
        const fullPhone = `${student.countryCode.replace('+', '')}${cleanPhone}`;
        contactLinks = `<div class="flex gap-4 mt-4">
                            <a href="https://wa.me/${fullPhone}" target="_blank" class="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.487 5.235 3.487 8.413.003 6.557-5.338 11.892-11.894 11.892-1.99 0-3.903-.52-5.586-1.456l-6.305 1.654zM6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.267.655 4.398 1.804 6.043l-1.225 4.485 4.574-1.194z"/></svg>
                                واتساب
                            </a>
                            <a href="https://t.me/+${fullPhone}" target="_blank" class="flex items-center gap-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm7.14 8.33l-2.34 11.12c-.15.73-.59.9-1.2.56l-3.6-2.66-1.74 1.67c-.19.19-.36.37-.7.37l.25-3.72 6.7-6.04c.28-.25-.06-.39-.43-.14L7.3 12.44l-3.53-1.1c-.72-.23-.73-.73.14-1.08l12.4-4.62c.6-.23 1.1.14.93.87z"/></svg>
                                تليجرام
                            </a>
                        </div>`;
    }
    let memorizationHtml = '';
    const canToggleMemorization = currentUserRole === 'admin' || currentUserRole === 'teacher';

    // Display Tasmee' Sessions
    let tasmeeSessionsHtml = '';
    if (student.tasmeeSessions && student.tasmeeSessions.length > 0) {
        tasmeeSessionsHtml = `<h3 class="text-xl font-bold mb-4 mt-6 border-b pb-2 dark:border-gray-600">سجل التسميع</h3><div class="max-h-40 overflow-y-auto border rounded p-2 dark:border-gray-600">`;
        student.tasmeeSessions.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(session => {
            tasmeeSessionsHtml += `<p class="text-sm mb-1">بتاريخ: ${new Date(session.date).toLocaleDateString()} - الجزء ${session.juz} من صفحة ${session.pageFrom} إلى ${session.pageTo} (${session.pagesMemorized} صفحات)${session.score !== undefined ? ` - الدرجة: ${session.score}` : ''}</p>`;
        });
        tasmeeSessionsHtml += `</div>`;
    }

    // Display Achievements
    let achievementsHtml = '';
    if (student.achievements && student.achievements.length > 0) {
        achievementsHtml = `<h3 class="text-xl font-bold mb-4 mt-6 border-b pb-2 dark:border-gray-600">الإنجازات</h3><div class="flex flex-wrap gap-2 mt-2">`;
        student.achievements.forEach(achId => {
            const ach = achievementsDefinitions[achId];
            if (ach) {
                achievementsHtml += `<span class="achievement-badge">${ach.icon} ${ach.name}</span>`;
            }
        });
        achievementsHtml += `</div>`;
    }

    // Display Exam History and Average Score
    let examHistoryHtml = '';
    const studentExams = examsCache[studentId] || [];
    if (studentExams.length > 0) {
        let totalStudentScore = 0;
        let totalStudentMaxScore = 0;
        examHistoryHtml = `<h3 class="text-xl font-bold mb-4 mt-6 border-b pb-2 dark:border-gray-600">سجل الاختبارات</h3><div class="max-h-40 overflow-y-auto border rounded p-2 dark:border-gray-600">`;
        studentExams.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(exam => {
            examHistoryHtml += `<p class="text-sm mb-1">بتاريخ: ${new Date(exam.date).toLocaleDateString()} - ${exam.name} (الجزء ${exam.juz}): ${exam.totalScore} / ${exam.maxScore}</p>`;
            totalStudentScore += exam.totalScore;
            totalStudentMaxScore += exam.maxScore;
        });
        const studentAvgExamScore = totalStudentMaxScore > 0 ? ((totalStudentScore / totalStudentMaxScore) * 100).toFixed(0) : 0;
        examHistoryHtml += `</div><p class="text-md font-semibold mt-2">متوسط درجة الاختبارات: ${studentAvgExamScore}%</p>`;
    } else {
        examHistoryHtml = `<h3 class="text-xl font-bold mb-4 mt-6 border-b pb-2 dark:border-gray-600">سجل الاختبارات</h3><p class="text-gray-500">لا توجد اختبارات مسجلة لهذا الطالب.</p>`;
    }


    for (let i = 1; i <= 30; i++) {
        const juzProgress = student.progress ? (student.progress[i] || []) : [];
        const percentage = (juzProgress.length / 20) * 100;
        memorizationHtml += `<div class="mb-4"><h4 class="font-semibold">الجزء ${i} (${juzProgress.length}/20)</h4><div class="w-full progress-bar-bg mt-1"><div class="progress-bar" style="width: ${percentage}%"></div></div><details class="mt-2"><summary class="cursor-pointer text-sm text-gray-500 dark:text-gray-400">عرض/تعديل الصفحات</summary><div class="memorization-grid mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">${[...Array(20).keys()].map(p => `<div class="page-square ${juzProgress.includes(p + 1) ? 'memorized' : ''}" ${canToggleMemorization ? `onclick="togglePageMemorization('${student.id}', ${i}, ${p + 1})"` : ''}>${p + 1}</div>`).join('')}</div></details></div>`;
    }
    
    // Conditional rendering for notes textarea
    const notesTextarea = canToggleMemorization ? `<textarea id="student-notes" class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600" rows="4" onchange="updateStudentNote('${student.id}', this.value)">${student.notes || ''}</textarea>` : `<p class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600">${student.notes || 'لا توجد ملاحظات.'}</p>`;

    if (profileView) {
        profileView.innerHTML = `<div class="flex justify-between items-start"><div><h2 class="text-3xl font-bold">${student.name}</h2><p class="text-gray-500 dark:text-gray-400">تاريخ الانضمام: ${student.startDate || 'غير محدد'}</p></div><button class="bg-gray-200 dark:bg-gray-600 px-4 py-2 rounded-lg" onclick="showView('students-view')">العودة للطلاب</button></div><div class="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="lg:col-span-1 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md"><h3 class="text-xl font-bold mb-4 border-b pb-2 dark:border-gray-600">معلومات الطالب</h3><p><strong>العمر:</strong> ${student.age || 'غير محدد'}</p><p><strong>ولي الأمر:</strong> ${student.guardianName || 'غير محدد'}</p><p><strong>الفصل:</strong> ${studentClass ? studentClass.name : 'غير محدد'}</p><p><strong>الخطة:</strong> ${studentPlan ? studentPlan.name : 'غير محدد'}</p>${contactLinks}<h3 class="text-xl font-bold mb-4 mt-6 border-b pb-2 dark:border-gray-600">ملاحظات المعلم</h3>${notesTextarea}${tasmeeSessionsHtml}${achievementsHtml}${examHistoryHtml}</div><div class="lg:col-span-2 bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md"><h3 class="text-xl font-bold mb-4">متابعة الحفظ التفصيلي</h3><div class="overflow-y-auto max-h-[70vh] pr-2">${memorizationHtml}</div></div></div>`;
    }
    showView('student-profile-view');
};

window.renderClassesGrid = () => {
    const grid = document.getElementById('classes-grid');
    if (classesCache.length === 0) { 
        if (grid) grid.innerHTML = `<p class="col-span-full text-center py-4">لم يتم إنشاء أي فصول بعد.</p>`; 
        return; 
    }
    
    const canEditDelete = currentUserRole === 'admin' || currentUserRole === 'teacher';

    if (grid) {
        grid.innerHTML = classesCache.map(cls => {
            const membersCount = studentsCache.filter(s => s.classId === cls.id).length;
            const assignedTeacher = teachersCache.find(t => t.id === cls.teacherId);
            const teacherName = assignedTeacher ? assignedTeacher.name : 'غير محدد';
            let actionsHtml = '';
            if (canEditDelete) {
                actionsHtml = `<button class="text-blue-500 hover:text-blue-700 mx-1 text-sm" onclick='event.stopPropagation(); openClassModal("${cls.id}")'>تعديل</button><button class="text-red-500 hover:text-red-700 mx-1 text-sm" onclick='event.stopPropagation(); deleteClass("${cls.id}", "${cls.name}")'>حذف</button>`;
            }
            return `<div class="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-md flex flex-col justify-between cursor-pointer hover:shadow-lg transition-shadow" onclick="viewClassDetails('${cls.id}')"><div><img src="${cls.photo || `https://placehold.co/600x400/0d9488/ffffff?text=${encodeURIComponent(cls.name)}`}" class="w-full h-32 object-cover rounded-md mb-4" onerror="this.onerror=null;this.src='https://placehold.co/600x400/cccccc/ffffff?text=Error';"><h3 class="text-xl font-bold text-blue-700 dark:text-blue-400">${cls.name}</h3><p class="text-gray-600 dark:text-gray-300">${membersCount} طالب</p><p class="text-sm text-gray-500 dark:text-gray-400 mt-2">${cls.schedule || 'لم يحدد جدول'}</p><p class="font-bold text-theme dark:text-theme-dark mt-2">${cls.fee || 0} ${settingsCache.currency}</p><p class="text-sm text-gray-500 dark:text-gray-400">المعلم: ${teacherName}</p></div><div class="mt-4 text-left">${actionsHtml}</div></div>`;
        }).join('');
    }
};

window.renderPlans = () => {
    const container = document.getElementById('plans-container');
    if (plansCache.length === 0) { 
        if (container) container.innerHTML = `<p class="text-center py-4">لم يتم إنشاء أي خطط بعد.</p>`; 
        return; 
    }
    
    const canEditDelete = currentUserRole === 'admin' || currentUserRole === 'teacher';

    if (container) {
        container.innerHTML = plansCache.map(plan => {
            let actionsHtml = '';
            if (canEditDelete) {
                actionsHtml = `<button class="text-blue-500 hover:text-blue-700 mx-1 text-sm" onclick='openPlanModal("${plan.id}")'>تعديل</button><button class="text-red-500 hover:text-red-700 mx-1 text-sm" onclick='deletePlan("${plan.id}", "${plan.name}")'>حذف</button>`;
            }
            return `<div class="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md"><h4 class="font-bold text-lg">${plan.name}</h4><p class="text-gray-600 dark:text-gray-300">${plan.description}</p><p class="text-sm text-gray-500 dark:text-gray-400">الصفحات الأسبوعية: ${plan.pagesPerWeek || 'غير محدد'}</p><div class="mt-4 text-left">${actionsHtml}</div></div>`;
        }).join('');
    }
};

window.renderNotifications = () => {
    const panel = document.getElementById('notifications-panel-content');
    const dot = document.getElementById('notification-dot');
    notificationsCache.sort((a, b) => new Date(b.date) - new Date(a.date));
    const unreadCount = notificationsCache.filter(n => !n.read).length;
    if (dot) dot.classList.toggle('hidden', unreadCount === 0);
    if (notificationsCache.length === 0) { 
        if (panel) panel.innerHTML = `<p class="p-4 text-center text-gray-500">لا توجد إشعارات</p>`; 
        return; 
    }
    if (panel) {
        panel.innerHTML = notificationsCache.map(n => `<div class="p-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 ${!n.read ? 'bg-teal-50 dark:bg-teal-900' : ''}" onclick="openNotificationModal('${n.id}')"><p class="text-sm">${n.message}</p><p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${new Date(n.date).toLocaleString()}</p></div>`).join('');
    }
};

window.renderExamFieldSettings = () => {
    const container = document.getElementById('exam-fields-settings-container');
    // Only render if user is admin
    if (currentUserRole !== 'admin') {
        if (container) container.innerHTML = `<p class="text-center py-4 text-gray-500">لا تملك صلاحية لإدارة حقول الاختبارات.</p>`;
        return;
    }
    if (container) {
        container.innerHTML = (settingsCache.examFields || []).map((field, index) => `<div class="flex items-center justify-between bg-gray-100 dark:bg-gray-600 p-2 rounded mb-2"><span>${field.name} (${field.mark} درجة)</span><button class="text-red-500 hover:text-red-700" onclick="removeExamField(${index})">&times;</button></div>`).join('');
    }
};

window.renderExamFieldsForEntry = () => {
    const container = document.getElementById('exam-fields-container');
    // Only render if user is admin or teacher
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        if (container) container.innerHTML = `<p class="text-center py-4 text-gray-500">لا تملك صلاحية لرصد درجات الاختبارات.</p>`;
        return;
    }
    if (container) {
        container.innerHTML = (settingsCache.examFields || []).map(field => `<div><label class="block mb-1 font-semibold">${field.name} (من ${field.mark})</label><input type="number" data-field-name="${field.name}" data-max-mark="${field.mark}" class="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-600 exam-score-field" placeholder="الدرجة"></div>`).join('');
    }
};

window.renderAttendanceTable = () => {
    const classIdSelect = document.getElementById('attendance-class-select');
    const dateInput = document.getElementById('attendance-date');
    const container = document.getElementById('attendance-table-container');
    
    if (currentUserRole !== 'admin' && currentUserRole !== 'teacher') {
        if (container) container.innerHTML = `<p class="text-center py-4 text-gray-500">لا تملك صلاحية لتسجيل الحضور والغياب.</p>`;
        return;
    }

    const classId = classIdSelect ? classIdSelect.value : '';
    const date = dateInput ? dateInput.value : '';

    if (!classId || !date) { 
        if (container) container.innerHTML = '<p class="text-center py-4">الرجاء اختيار فصل وتاريخ.</p>'; 
        return; 
    }
    const studentsInClass = studentsCache.filter(s => s.classId === classId);
    if (studentsInClass.length === 0) { 
        if (container) container.innerHTML = '<p class="text-center py-4">لا يوجد طلاب في هذا الفصل.</p>'; 
        return; 
    }
    const dailyRecord = attendanceCache[date] || {};
    if (container) {
        container.innerHTML = `<table class="min-w-full bg-white dark:bg-gray-700"><thead class="bg-gray-200 dark:bg-gray-600"><tr><th class="py-3 px-6 text-right">الاسم</th><th class="py-3 px-6 text-center">الحالة</th></tr></thead><tbody>${studentsInClass.map(student => `<tr class="hover:bg-gray-50 dark:hover:bg-gray-600"><td class="py-3 px-6">${student.name}</td><td class="py-3 px-6 text-center"><div class="flex justify-center gap-4"><label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="attendance-${student.id}" value="present" class="form-radio text-green-500" ${dailyRecord[student.id] === 'present' ? 'checked' : ''}><span>حاضر</span></label><label class="flex items-center gap-2 cursor-pointer"><input type="radio" name="attendance-${student.id}" value="absent" class="form-radio text-red-500" ${dailyRecord[student.id] === 'absent' ? 'checked' : ''}><span>غائب</span></label></div></td></tr>`).join('')}</tbody></table>`;
    }
};

window.renderFinancialsTable = () => {
    const container = document.getElementById('financials-table-container');
    const monthInput = document.getElementById('financial-month');
    
    const month = monthInput ? monthInput.value : '';
    const monthData = financialsCache[month] || {};

    if (currentUserRole !== 'admin') { // Only admin can manage financials
        if (container) container.innerHTML = `<p class="text-center py-4 text-gray-500">لا تملك صلاحية لمتابعة الأمور المالية.</p>`;
        return;
    }

    if (studentsCache.length === 0) { 
        if (container) container.innerHTML = `<p class="text-center py-4">لا يوجد طلاب.</p>`; 
        return; 
    }
    if (container) {
        container.innerHTML = `<table class="min-w-full bg-white dark:bg-gray-700"><thead class="bg-gray-200 dark:bg-gray-600"><tr><th class="py-3 px-6 text-right">الطالب</th><th class="py-3 px-6 text-right">رسوم الفصل</th><th class="py-3 px-6 text-center">الحالة</th></tr></thead><tbody>${studentsCache.map(student => {
            // **FIXED CODE**
            // 1. Find the student's class to determine the fee.
            const studentClass = classesCache.find(c => c.id === student.classId);
            const fee = studentClass ? (studentClass.fee || 0) : 0;
            
            // 2. Get the student's payment status for the selected month.
            const status = monthData[student.id] || 'pending';
            // **END OF FIX**

            return `<tr class="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td class="py-3 px-6">${student.name}</td>
                <td class="py-3 px-6">${fee} ${settingsCache.currency}</td>
                <td class="py-3 px-6 text-center">
                    <select data-student-id="${student.id}" class="p-1 border rounded dark:bg-gray-800 financial-status-select">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>لم يدفع</option>
                        <option value="paid" ${status === 'paid' ? 'selected' : ''}>دفع</option>
                        <option value="exempt" ${status === 'exempt' ? 'selected' : ''}>معفى</option>
                    </select>
                </td>
                </tr>`;
        }).join('')}</tbody></table>`;
    }
};

window.renderExpensesList = () => {
    const expensesListDiv = document.getElementById('expenses-list');
    if (!expensesListDiv) return;

    if (expensesCache.length === 0) {
        expensesListDiv.innerHTML = `<p class="text-center text-gray-500">لا توجد مصروفات مسجلة.</p>`;
        return;
    }

    let expensesHtml = `<table class="min-w-full bg-white dark:bg-gray-700 mt-4">
                            <thead class="bg-gray-200 dark:bg-gray-600">
                                <tr>
                                    <th class="py-3 px-6 text-right">الوصف</th>
                                    <th class="py-3 px-6 text-right">المبلغ</th>
                                    <th class="py-3 px-6 text-right">التاريخ</th>
                                    <th class="py-3 px-6 text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>`;
    expensesCache.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(expense => {
        expensesHtml += `<tr class="hover:bg-gray-50 dark:hover:bg-gray-600">
                            <td class="py-3 px-6">${expense.description}</td>
                            <td class="py-3 px-6">${expense.amount} ${settingsCache.currency}</td>
                            <td class="py-3 px-6">${new Date(expense.date).toLocaleDateString()}</td>
                            <td class="py-3 px-6 text-center">
                                <button class="text-red-500 hover:text-red-700 mx-1" onclick="deleteExpense('${expense.id}')">حذف</button>
                            </td>
                        </tr>`;
    });
    expensesHtml += `</tbody></table>`;
    expensesListDiv.innerHTML = expensesHtml;
};

window.updateDashboard = () => {
    const totalStudentsDashboard = document.getElementById('total-students-dashboard');
    if (totalStudentsDashboard) totalStudentsDashboard.textContent = studentsCache.length;

    const today = new Date().toISOString().slice(0, 10);
    const activeToday = Object.values(attendanceCache[today] || {}).filter(s => s === 'present').length;
    const activeTodayDashboard = document.getElementById('active-today-dashboard');
    if (activeTodayDashboard) activeTodayDashboard.textContent = activeToday;

    const totalPages = studentsCache.reduce((sum, s) => sum + Object.values(s.progress || {}).reduce((pSum, p) => pSum + p.length, 0), 0);
    const totalPagesDashboard = document.getElementById('total-pages-dashboard');
    if (totalPagesDashboard) totalPagesDashboard.textContent = totalPages;
    
    let totalScores = 0, totalMaxScores = 0;
    Object.values(examsCache).flat().forEach(studentExams => { // examsCache stores studentId -> array of exams
        if (Array.isArray(studentExams)) {
            studentExams.forEach(exam => {
                totalScores += exam.totalScore;
                totalMaxScores += exam.maxScore;
            });
        }
    });
    const avgScore = totalMaxScores > 0 ? ((totalScores / totalMaxScores) * 100).toFixed(0) : 0;
    const avgExamScoreDashboard = document.getElementById('avg-exam-score-dashboard');
    if (avgExamScoreDashboard) avgExamScoreDashboard.textContent = `${avgScore}%`;

    renderTopStudents(); // Call global function
    renderWeeklyProgressChart(); // Call global function
    renderClassDistributionChart(); // Call global function
    checkPendingAttendance(); // Call to check and display pending attendance
    renderMonthlyAttendanceChart(); // Call to render the new attendance trend chart
    checkPendingPayments(); // Call to check and display pending payments
    renderTotalExpensesDashboard(); // Call to render total expenses on dashboard
};

window.renderTopStudents = () => {
    const list = document.getElementById('top-students-list');
    const sorted = [...studentsCache].sort((a, b) => (Object.values(b.progress||{}).flat().length) - (Object.values(a.progress||{}).flat().length)).slice(0, 5);
    if (sorted.length === 0) { 
        if (list) list.innerHTML = `<p class="text-center text-gray-500">لا يوجد بيانات</p>`; 
        return; 
    }
    if (list) {
        list.innerHTML = sorted.map((s, i) => `<div class="flex justify-between items-center p-2 rounded ${i % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}"><div class="font-semibold">${i + 1}. ${s.name}</div><div class="text-theme dark:text-theme-dark font-bold">${Object.values(s.progress||{}).flat().length} صفحة</div></div>`).join('');
    }
};

window.renderWeeklyProgressChart = () => {
    const ctxCanvas = document.getElementById('weekly-progress-chart');
    if (!ctxCanvas) return;
    const ctx = ctxCanvas.getContext('2d');
    const labels = [];
    const data = [];
    const today = new Date();
    for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - (i * 7));
        labels.push(`أسبوع ${weekStart.toLocaleDateString('ar-EG', {day: '2-digit', month: '2-digit'})}`);
        
        // This part generates random data, it should be replaced with actual data from examsCache or tasmee data
        let pagesThisWeek = 0;
        // Example of how you might calculate real data (this is placeholder logic)
        studentsCache.forEach(student => {
            // Iterate through student's tasmee records for this week
            // For now, keeping the random generation as the original code did not have this data.
            if (Math.random() < (0.8 - i*0.1)) pagesThisWeek += Math.floor(Math.random() * 5); 
        });
        data.push(pagesThisWeek);
    }

    if (weeklyProgressChart) weeklyProgressChart.destroy();
    weeklyProgressChart = new Chart(ctx, { type: 'line', data: { labels, datasets: [{ label: 'صفحات تم تسميعها', data, borderColor: settingsCache.themeColor, backgroundColor: Chart.helpers.color(settingsCache.themeColor).alpha(0.2).rgbString(), fill: true, tension: 0.3 }] } });
};

window.renderClassDistributionChart = () => {
    const ctxCanvas = document.getElementById('class-distribution-chart');
    if (!ctxCanvas) return;
    const ctx = ctxCanvas.getContext('2d');
    const labels = classesCache.map(c => c.name);
    const data = classesCache.map(c => studentsCache.filter(s => s.classId === c.id).length);
    if (classDistributionChart) classDistributionChart.destroy();
    classDistributionChart = new Chart(ctx, { type: 'doughnut', data: { labels, datasets: [{ label: 'الطلاب', data, backgroundColor: ['#34d399', '#60a5fa', '#c084fc', '#f87171', '#fbbf24'] }] }, options: { responsive: true, plugins: { legend: { position: 'top' } } } });
};

window.renderFinancialsDashboard = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthData = financialsCache[currentMonth] || {};
    let totalIncome = 0, pendingPayments = 0, exemptStudents = 0;

    studentsCache.forEach(student => {
        const status = monthData[student.id];
        const cls = classesCache.find(c => c.id === student.classId);
        const fee = cls ? (cls.fee || 0) : 0;
        if (status === 'paid') {
            totalIncome += fee;
        } else if (status === 'pending' || !status) {
            pendingPayments += fee;
        } else if (status === 'exempt') {
            exemptStudents++;
        }
    });

    const totalIncomeDashboard = document.getElementById('total-income-dashboard');
    if (totalIncomeDashboard) totalIncomeDashboard.textContent = `${totalIncome.toLocaleString()} ${settingsCache.currency}`;
    
    const pendingPaymentsDashboard = document.getElementById('pending-payments-dashboard');
    if (pendingPaymentsDashboard) pendingPaymentsDashboard.textContent = `${pendingPayments.toLocaleString()} ${settingsCache.currency}`;
    
    const exemptStudentsDashboard = document.getElementById('exempt-students-dashboard');
    if (exemptStudentsDashboard) exemptStudentsDashboard.textContent = exemptStudents;
    
    // Chart
    const ctxCanvas = document.getElementById('income-over-time-chart');
    if (!ctxCanvas) return;
    const ctx = ctxCanvas.getContext('2d');
    const labels = [];
    const expectedData = [];
    const actualData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthKey = d.toISOString().slice(0, 7);
        labels.push(monthKey);

        let expected = 0, actual = 0;
        const monthPayments = financialsCache[monthKey] || {};
        studentsCache.forEach(student => {
            const cls = classesCache.find(c => c.id === student.classId);
            const fee = cls ? (cls.fee || 0) : 0;
            if (monthPayments[student.id] !== 'exempt') {
                expected += fee;
            }
            if (monthPayments[student.id] === 'paid') {
                actual += fee;
            }
        });
        expectedData.push(expected);
        actualData.push(actual);
    }

    if(incomeOverTimeChart) incomeOverTimeChart.destroy();
    incomeOverTimeChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                { label: 'الدخل الفعلي', data: actualData, backgroundColor: 'rgba(75, 192, 192, 0.6)' },
                { label: 'الدخل المتوقع', data: expectedData, backgroundColor: 'rgba(255, 99, 132, 0.6)' }
            ]
        }
    });
};

// --- DATA MANIPULATION (Local Storage) ---
window.generateId = () => { return Date.now().toString(36) + Math.random().toString(36).substr(2); };

window.addExpense = (e) => {
    e.preventDefault();
    const descriptionInput = document.getElementById('expense-description');
    const amountInput = document.getElementById('expense-amount');
    const dateInput = document.getElementById('expense-date');

    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const amount = parseFloat(amountInput ? amountInput.value : '');
    const date = dateInput ? dateInput.value : '';

    if (!description || isNaN(amount) || amount <= 0 || !date) {
        customAlert("الرجاء إدخال وصف ومبلغ وتاريخ صالحين للمصروف.");
        return;
    }

    const newExpense = {
        id: generateId(),
        description: description,
        amount: amount,
        date: date
    };

    expensesCache.push(newExpense);
    LocalStore.set('expenses', expensesCache);
    createNotification("تم إضافة المصروف بنجاح.", "success");
    
    // Clear form
    if (descriptionInput) descriptionInput.value = '';
    if (amountInput) amountInput.value = '';
    if (dateInput) dateInput.value = '';

    renderExpensesList();
    updateDashboard(); // Update dashboard to reflect new expenses
};

window.deleteExpense = (id) => {
    customConfirm("هل أنت متأكد من حذف هذا المصروف؟", () => {
        expensesCache = expensesCache.filter(expense => expense.id !== id);
        LocalStore.set('expenses', expensesCache);
        createNotification("تم حذف المصروف.", "warning");
        renderExpensesList();
        updateDashboard(); // Update dashboard after deletion
    });
};

window.renderTotalExpensesDashboard = () => {
    const totalExpenses = expensesCache.reduce((sum, expense) => sum + expense.amount, 0);
    // As there isn't a specific element for this on the main dashboard,
    // we'll add a new card to the dashboard to display total expenses.
    const totalExpensesDashboardElement = document.getElementById('total-expenses-dashboard-card'); // Assuming a new ID for a card
    if (totalExpensesDashboardElement) {
        totalExpensesDashboardElement.querySelector('p').textContent = `${totalExpenses.toLocaleString()} ${settingsCache.currency}`;
    } else {
        // Fallback or log if the element doesn't exist (e.g., if HTML isn't updated yet)
        console.log(`Total Expenses (Dashboard): ${totalExpenses.toLocaleString()} ${settingsCache.currency}`);
    }
};

window.handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    // No role check needed for local dev, as it's always admin
    
    const id = document.getElementById('student-id')?.value;
    const studentName = document.getElementById('student-name')?.value;
    const studentAge = document.getElementById('student-age')?.value;
    const studentGuardian = document.getElementById('student-guardian')?.value;
    const studentStartDate = document.getElementById('student-start-date')?.value;
    const studentPhone = document.getElementById('student-phone')?.value;
    const studentCountryCode = document.getElementById('student-country-code')?.value;
    const studentClassSelect = document.getElementById('student-class-select')?.value;
    const studentPlanSelect = document.getElementById('student-plan-select')?.value;
    const studentJuzStart = document.getElementById('student-juz-start')?.value;
    const studentNotesModal = document.getElementById('student-notes-modal')?.value;

    const studentData = {
        name: studentName,
        age: studentAge,
        guardianName: studentGuardian,
        startDate: studentStartDate,
        phone: studentPhone,
        countryCode: studentCountryCode,
        classId: studentClassSelect,
        planId: studentPlanSelect,
        juzStart: parseInt(studentJuzStart),
        notes: studentNotesModal,
        progress: id ? (studentsCache.find(s => s.id === id)?.progress || {}) : {},
        tasmeeSessions: id ? (studentsCache.find(s => s.id === id)?.tasmeeSessions || []) : [],
        achievements: id ? (studentsCache.find(s => s.id === id)?.achievements || []) : [] // Initialize achievements
    };

    // If a plan is assigned and juzStart is not explicitly set, use the plan's juzStart
    if (studentData.planId && !studentData.juzStart) {
        const assignedPlan = plansCache.find(p => p.id === studentData.planId);
        if (assignedPlan && assignedPlan.juzStart) { // Assuming plans can have a juzStart
             studentData.juzStart = assignedPlan.juzStart;
        }
    }


    if (id) {
        studentsCache[studentsCache.findIndex(s => s.id === id)] = studentData;
        createNotification(`تم تحديث بيانات الطالب ${studentData.name}`, "success");
    } else {
        studentData.id = generateId(); // Generate local ID
        studentsCache.push(studentData);
        // Auto-create pending payment for new student
        if (studentData.classId) {
            const currentMonth = new Date().toISOString().slice(0, 7);
            if (!financialsCache[currentMonth]) financialsCache[currentMonth] = {};
            financialsCache[currentMonth][studentData.id] = 'pending';
            LocalStore.set('financials', financialsCache);
        }
        createNotification(`تم إضافة طالب جديد: ${studentData.name}`, "success");
    }
    LocalStore.set('students', studentsCache);
    closeModal('student-modal');
    renderAll(); // Re-render after local storage update
}

window.deleteStudent = (id, name) => {
    // No role check needed for local dev, as it's always admin
    customConfirm(`هل أنت متأكد من حذف الطالب ${name}؟`, () => {
        studentsCache = studentsCache.filter(s => s.id !== id);
        LocalStore.set('students', studentsCache);

        // Also remove their exams and financial records from cache and local storage
        if (examsCache[id]) {
            delete examsCache[id];
            LocalStore.set('exams', examsCache);
        }
        
        for (const date in attendanceCache) {
            if (attendanceCache[date][id]) {
                delete attendanceCache[date][id];
                LocalStore.set('attendance', attendanceCache); // Update attendance for that date
            }
        }

        for (const month in financialsCache) {
            if (financialsCache[month][id]) {
                delete financialsCache[month][id];
                LocalStore.set('financials', financialsCache); // Update financials for that month
            }
        }

        createNotification(`تم حذف الطالب ${name}`, "warning");
        renderAll(); // Re-render after local storage update
    });
}

window.handleClassFormSubmit = async (e) => {
    e.preventDefault();
    // No role check needed for local dev, as it's always admin

    const id = document.getElementById('class-id')?.value;
    const className = document.getElementById('class-name')?.value;
    const classSchedule = document.getElementById('class-schedule')?.value;
    const classFee = parseFloat(document.getElementById('class-fee')?.value) || 0;
    const classTeacherSelect = document.getElementById('class-teacher-select')?.value; // Get teacher ID
    const classPhoto = document.getElementById('class-photo')?.value;

    const classData = {
        name: className,
        schedule: classSchedule,
        fee: classFee,
        teacherId: classTeacherSelect, // Save teacher ID
        photo: classPhoto,
    };

    if (id) {
        classesCache[classesCache.findIndex(c => c.id === id)] = classData;
        createNotification(`تم تحديث الفصل ${classData.name}`, "success");
    } else {
        classData.id = generateId(); // Generate local ID
        classesCache.push(classData);
        createNotification(`تم إنشاء فصل جديد: ${classData.name}`, "success");
    }
    LocalStore.set('classes', classesCache);
    closeModal('class-modal');
    renderAll(); // Re-render after local storage update
}

window.deleteClass = (id, name) => {
    // No role check needed for local dev, as it's always admin
    customConfirm(`هل أنت متأكد من حذف فصل ${name}؟ سيتم إزالة الطلاب منه.`, () => {
        classesCache = classesCache.filter(c => c.id !== id);
        studentsCache.forEach(s => { if (s.classId === id) s.classId = ''; }); // Update students in cache
        LocalStore.set('classes', classesCache);
        LocalStore.set('students', studentsCache); // Save updated students
        createNotification(`تم حذف الفصل ${name}`, "warning");
        renderAll(); // Re-render after local storage update
    });
}

window.handlePlanFormSubmit = async (e) => {
    e.preventDefault();
    // No role check needed for local dev, as it's always admin

    const id = document.getElementById('plan-id')?.value;
    const planName = document.getElementById('plan-name')?.value;
    const planDescription = document.getElementById('plan-description')?.value;
    const planPagesPerWeek = parseInt(document.getElementById('plan-pages-per-week')?.value); // Get pages per week

    const planData = {
        name: planName,
        description: planDescription,
        pagesPerWeek: isNaN(planPagesPerWeek) ? 0 : planPagesPerWeek, // Save pages per week
    };

    if (id) {
        plansCache[plansCache.findIndex(p => p.id === id)] = planData;
        createNotification(`تم تحديث الخطة ${planData.name}`, "success");
    } else {
        planData.id = generateId(); // Generate local ID
        plansCache.push(planData);
        createNotification(`تم إنشاء خطة جديدة: ${planData.name}`, "success");
    }
    LocalStore.set('plans', plansCache);
    closeModal('plan-modal');
    renderAll(); // Re-render after local storage update
}

window.deletePlan = (id, name) => {
    // No role check needed for local dev, as it's always admin
    customConfirm(`هل أنت متأكد من حذف خطة ${name}؟`, () => {
        plansCache = plansCache.filter(p => p.id !== id);
        LocalStore.set('plans', plansCache);
        // Update students who were assigned this plan to have no planId
        studentsCache.forEach(s => { if (s.planId === id) s.planId = ''; });
        LocalStore.set('students', studentsCache); // Save updated students
        createNotification(`تم حذف الخطة ${name}`, "warning");
        renderAll(); // Re-render after local storage update
    });
}

window.saveTasmeeResults = async () => {
    // No role check needed for local dev, as it's always admin

    const studentId = document.getElementById('tasmee-student-select')?.value;
    const juz = parseInt(document.getElementById('tasmee-juz')?.value);
    const pageFrom = parseInt(document.getElementById('tasmee-page-from')?.value);
    const pageTo = parseInt(document.getElementById('tasmee-page-to')?.value) || pageFrom;
    const tasmeeScore = parseInt(document.getElementById('tasmee-score')?.value); // Get the score
    const tasmeeDate = new Date().toISOString(); // Current date for the session

    if (!studentId || isNaN(juz) || isNaN(pageFrom)) { customAlert("الرجاء اختيار طالب وتحديد الجزء والصفحة."); return; }
    if (pageTo < pageFrom) { customAlert("صفحة النهاية يجب أن تكون بعد صفحة البداية."); return; }
    if (juz < 1 || juz > 30) { customAlert("رقم الجزء يجب أن يكون بين 1 و 30."); return; }
    if (pageFrom < 1 || pageFrom > 20 || pageTo < 1 || pageTo > 20) { customAlert("رقم الصفحة يجب أن يكون بين 1 و 20."); return; }
    if (isNaN(tasmeeScore) || tasmeeScore < 0 || tasmeeScore > 100) { customAlert("الرجاء إدخال درجة صالحة بين 0 و 100."); return; }


    const student = studentsCache.find(s => s.id === studentId);
    if (!student) { customAlert("لم يتم العثور على الطالب."); return; }

    if (!student.progress) student.progress = {};
    if (!student.progress[juz]) student.progress[juz] = [];
    if (!student.tasmeeSessions) student.tasmeeSessions = []; // Initialize tasmeeSessions if not present

    for (let i = pageFrom; i <= pageTo; i++) {
        if (!student.progress[juz].includes(i)) {
            student.progress[juz].push(i);
        }
    }
    student.progress[juz].sort((a, b) => a - b); // Ensure pages are sorted

    // Add the new tasmee session to the student's record
    student.tasmeeSessions.push({
        id: generateId(),
        date: tasmeeDate,
        juz: juz,
        pageFrom: pageFrom,
        pageTo: pageTo,
        pagesMemorized: pageTo - pageFrom + 1,
        score: tasmeeScore, // Include the score
    });

    LocalStore.set('students', studentsCache); // Save updated students
    customAlert(`تم تسجيل التسميع بنجاح.`);
    
    // Check for achievements after tasmee'
    checkAndAwardAchievements(student);

    renderAll(); // Re-render after local storage update
}

window.saveAttendance = async () => {
    // No role check needed for local dev, as it's always admin

    const dateInput = document.getElementById('attendance-date');
    const date = dateInput ? dateInput.value : '';
    if (!date) { customAlert("الرجاء تحديد التاريخ أولاً."); return; }

    const dailyRecord = {};
    document.querySelectorAll('input[type="radio"][name^="attendance-"]:checked').forEach(input => {
        dailyRecord[input.name.replace('attendance-', '')] = input.value;
    });

    attendanceCache[date] = dailyRecord; // Update cache
    LocalStore.set('attendance', attendanceCache); // Save to local storage
    customAlert("تم حفظ بيانات الحضور بنجاح.");
    
    // Check for perfect attendance achievement
    checkPerfectAttendanceAchievement(date);

    updateDashboard(); // Update dashboard with new attendance data
}

window.saveExamResults = async () => {
    // No role check needed for local dev, as it's always admin

    const studentId = document.getElementById('exam-student-select')?.value;
    const examName = document.getElementById('exam-name')?.value.trim();
    const examJuz = parseInt(document.getElementById('exam-juz')?.value);

    if (!studentId || !examName || isNaN(examJuz)) { customAlert("الرجاء ملء جميع الحقول."); return; }

    const scores = {};
    let totalScore = 0, maxScore = 0, isValid = true;
    document.querySelectorAll('.exam-score-field').forEach(field => {
        const fieldName = field.dataset.fieldName;
        const maxMark = parseInt(field.dataset.maxMark);
        const score = parseInt(field.value);
        if (isNaN(score) || score < 0 || score > maxMark) {
            customAlert(`الدرجة لحقل "${fieldName}" غير صالحة. يجب أن تكون بين 0 و ${maxMark}.`);
            isValid = false;
        }
        scores[fieldName] = score;
        totalScore += score;
        maxScore += maxMark;
    });
    if (!isValid) return;

    const examData = { id: generateId(), name: examName, juz: examJuz, scores, totalScore, maxScore, date: new Date().toISOString() };

    if (!examsCache[studentId]) examsCache[studentId] = [];
    examsCache[studentId].push(examData);

    LocalStore.set('exams', examsCache); // Save to local storage
    customAlert("تم حفظ نتيجة الاختبار بنجاح.");

    // Check for achievements after exam
    const student = studentsCache.find(s => s.id === studentId);
    if (student) {
        checkFirstExamPassAchievement(student, examData);
        checkHighScorerAchievement(student, examData);
    }

    renderAll(); // Re-render after local storage update
}

window.addExamField = async () => {
    // No role check needed for local dev, as it's always admin

    const nameInput = document.getElementById('new-field-name');
    const markInput = document.getElementById('new-field-mark');

    const name = nameInput ? nameInput.value.trim() : '';
    const mark = parseInt(markInput ? markInput.value : '');

    if (!name || isNaN(mark) || mark <= 0) { customAlert("الرجاء إدخال اسم حقل صحيح ودرجة موجبة."); return; }

    if (!settingsCache.examFields) settingsCache.examFields = [];
    settingsCache.examFields.push({ name, mark });

    LocalStore.set('settings', settingsCache); // Save to local storage
    renderExamFieldSettings(); // Call global function
    renderExamFieldsForEntry(); // Call global function
}

window.removeExamField = async (index) => {
    // No role check needed for local dev, as it's always admin

    settingsCache.examFields.splice(index, 1);

    LocalStore.set('settings', settingsCache); // Save to local storage
    renderExamFieldSettings(); // Call global function
    renderExamFieldsForEntry(); // Call global function
}

window.saveFinancials = async () => {
    // No role check needed for local dev, as it's always admin

    const monthInput = document.getElementById('financial-month');
    const month = monthInput ? monthInput.value : '';
    if (!month) { customAlert("الرجاء تحديد الشهر أولاً."); return; }

    const monthData = {};
    document.querySelectorAll('.financial-status-select').forEach(select => {
        monthData[select.dataset.studentId] = select.value;
    });

    financialsCache[month] = monthData; // Update cache
    LocalStore.set('financials', financialsCache); // Save to local storage
    createNotification(`تم حفظ الحالة المالية لشهر ${month}.`, "success");
    renderFinancialsDashboard(); // Update dashboard
}

window.togglePageMemorization = async (studentId, juz, page) => {
    // No role check needed for local dev, as it's always admin

    const student = studentsCache.find(s => s.id === studentId);
    if (!student) { customAlert("لم يتم العثور على الطالب."); return; }

    if (!student.progress) student.progress = {};
    if (!student.progress[juz]) student.progress[juz] = [];

    const pageIndex = student.progress[juz].indexOf(page);
    if (pageIndex > -1) {
        student.progress[juz].splice(pageIndex, 1);
    } else {
        student.progress[juz].push(page);
    }
    student.progress[juz].sort((a, b) => a - b);

    LocalStore.set('students', studentsCache); // Save updated students
    createNotification("تم تحديث حالة الحفظ.", "info");
    
    // Check for achievements after page memorization
    checkAndAwardAchievements(student);

    viewStudentProfile(studentId); // Re-render profile to show changes
};

window.updateStudentNote = async (studentId, newNote) => {
    // No role check needed for local dev, as it's always admin

    const student = studentsCache.find(s => s.id === studentId);
    if (student) {
        student.notes = newNote;
        LocalStore.set('students', studentsCache); // Save updated students
        createNotification("تم حفظ الملاحظة.", "info");
    }
}

window.handleBulkAssignClass = async () => {
    // No role check needed for local dev, as it's always admin

    const selectedStudentIds = Array.from(document.querySelectorAll('.student-checkbox:checked')).map(cb => cb.dataset.studentId);
    const classSelect = document.getElementById('bulk-assign-class-select');
    const classId = classSelect ? classSelect.value : '';

    if (selectedStudentIds.length === 0 || !classId) { customAlert("الرجاء تحديد الطلاب والفصل."); return; }

    for (const studentId of selectedStudentIds) {
        const student = studentsCache.find(s => s.id === studentId);
        if (student) student.classId = classId;
    }
    LocalStore.set('students', studentsCache); // Save updated students
    createNotification(`تم تعيين ${selectedStudentIds.length} طالب للفصل.`, "success");
    closeModal('assign-class-bulk-modal');
    renderAll(); // Re-render after bulk update
}

// --- DATA IMPORT/EXPORT (Local Storage) ---
window.exportData = () => {
    // No role check needed for local dev, as it's always admin

    const data = {
        students: studentsCache,
        classes: classesCache,
        settings: settingsCache,
        attendance: attendanceCache,
        plans: plansCache,
        notifications: notificationsCache,
        exams: examsCache,
        financials: financialsCache,
        expenses: expensesCache, // Include expenses in export
        currentUserRole: currentUserRole // Include role in export for context
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", `backup-quran-app-local-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dl);
    dl.click();
    dl.remove();
    customAlert("تم بدء تصدير البيانات المحلية.", "success");
};

window.importData = (event) => {
    // No role check needed for local dev, as it's always admin

    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target.result);
            customConfirm("سيؤدي هذا إلى الكتابة فوق جميع بياناتك الحالية المحلية. هل أنت متأكد؟", () => {
                if (LocalStore.importData(importedData)) {
                    customAlert("تم استيراد البيانات بنجاح. سيتم إعادة تحميل التطبيق.", "success");
                    setTimeout(() => location.reload(), 2000);
                } else { customAlert("فشل استيراد البيانات.", "error"); }
            });
        } catch (err) {
            customAlert("ملف JSON غير صالح.", "error");
            console.error("Invalid JSON file:", err);
        }
    };
    reader.readAsText(file);
};


window.resetAllData = () => {
    // No role check needed for local dev, as it's always admin
    customConfirm("تحذير! سيتم حذف جميع البيانات المحلية بشكل دائم. هل أنت متأكد تماماً؟", () => {
        LocalStore.clearAll();
        customAlert("تم مسح جميع البيانات المحلية. سيتم إعادة تحميل التطبيق.", "warning");
        setTimeout(() => location.reload(), 2000);
    });
};

// --- HELPERS (Local Storage) ---
window.createNotification = (message, type = 'info') => {
    // No authReady check needed, always save locally
    notificationsCache.unshift({ id: generateId(), message, type, date: new Date().toISOString(), read: false });
    if (notificationsCache.length > 50) notificationsCache.pop();
    LocalStore.set('notifications', notificationsCache); // Save to local storage
    renderNotifications();
};

window.openNotificationModal = (id) => {
    // No authReady check needed
    const notification = notificationsCache.find(n => n.id === id);
    if (!notification) return;
    notification.read = true;
    LocalStore.set('notifications', notificationsCache); // Save read status
    renderNotifications();
    
    const notificationModalMessage = document.getElementById('notification-modal-message');
    const notificationModalDate = document.getElementById('notification-modal-date');

    if (notificationModalMessage) notificationModalMessage.textContent = notification.message;
    if (notificationModalDate) notificationModalDate.textContent = new Date(notification.date).toLocaleString();
    openModal('notification-details-modal');
};

window.markAllNotificationsAsRead = () => {
    // No authReady check needed
    notificationsCache.forEach(n => n.read = true);
    LocalStore.set('notifications', notificationsCache); // Save read status
    renderNotifications();
    createNotification("تم تعليم جميع الإشعارات كمقروءة.", "info");
}

window.updateCurrency = () => {
    // No role check needed, always admin
    settingsCache.currency = document.getElementById('currency-select')?.value;
    LocalStore.set('settings', settingsCache); // Save to local storage
    renderAll(); // Re-render to apply currency changes
}

window.populateCountryCodes = async () => {
    const select = document.getElementById('student-country-code');
    if (!select) return; // Ensure the select element exists
    try {
        // Using a more stable Gist URL or a local fallback if Gist is unreliable
        const response = await fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json');
        const countries = await response.json();
        const countryCodes = countries.map(c => ({
            name: c.name.common,
            dial_code: c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : '')
        })).filter(c => c.dial_code !== ''); // Filter out entries without dial codes

        countryCodes.sort((a, b) => a.name.localeCompare(b.name)); // Sort by country name
        select.innerHTML = countryCodes.map(c => `<option value="${c.dial_code}">${c.name} (${c.dial_code})</option>`).join('');
        select.value = "+249"; // Default to Sudan
    } catch (e) {
        console.error("Could not load country codes from external source, using a fallback list.", e);
        // Fallback list (ensure it's valid JSON)
        const codes = [
            { "name": "السودان", "dial_code": "+249" },
            { "name": "المملكة العربية السعودية", "dial_code": "+966" },
            { "name": "مصر", "dial_code": "+20" },
            { "name": "الإمارات العربية المتحدة", "dial_code": "+971" },
            { "name": "قطر", "dial_code": "+974" },
            { "name": "الكويت", "dial_code": "+965" },
            { "name": "البحرين", "dial_code": "+973" },
            { "name": "عمان", "dial_code": "+968" }
        ];
        select.innerHTML = codes.map(c => `<option value="${c.dial_code}">${c.name} (${c.dial_code})</option>`).join('');
        select.value = "+249";
    }
}

window.populateAllClassDropdowns = () => {
    const filterClass = document.getElementById('filter-class');
    if (filterClass) populateClassDropdown(filterClass, 'كل الفصول');
    
    const studentClassSelect = document.getElementById('student-class-select');
    if (studentClassSelect) populateClassDropdown(studentClassSelect);
    
    const tasmeeClassSelect = document.getElementById('tasmee-class-select');
    if (tasmeeClassSelect) populateClassDropdown(tasmeeClassSelect);
    
    const attendanceClassSelect = document.getElementById('attendance-class-select');
    if (attendanceClassSelect) populateClassDropdown(attendanceClassSelect);
    
    const examClassSelect = document.getElementById('exam-class-select');
    if (examClassSelect) populateClassDropdown(examClassSelect);
    
    const bulkAssignClassSelect = document.getElementById('bulk-assign-class-select');
    if (bulkAssignClassSelect) populateClassDropdown(bulkAssignClassSelect);

    const bulkAssignClassSelectPlan = document.getElementById('bulk-assign-class-select-plan');
    if (bulkAssignClassSelectPlan) populateClassDropdown(bulkAssignClassSelectPlan);
};

window.populateClassDropdown = (select, defaultOption = "اختر فصلاً") => {
    if (!select) return; // Ensure select element exists
    const val = select.value;
    select.innerHTML = `<option value="">${defaultOption}</option>`;
    classesCache.forEach(c => select.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    select.value = val;
};

window.populateAllPlanDropdowns = () => {
    const studentPlanSelect = document.getElementById('student-plan-select');
    if (studentPlanSelect) populatePlanDropdown(studentPlanSelect);

    const bulkAssignPlanSelect = document.getElementById('bulk-assign-plan-select');
    if (bulkAssignPlanSelect) populatePlanDropdown(bulkAssignPlanSelect);
};

window.populatePlanDropdown = (select, defaultOption = "بدون خطة") => {
    if (!select) return; // Ensure select element exists
    const val = select.value;
    select.innerHTML = `<option value="">${defaultOption}</option>`;
    plansCache.forEach(p => select.innerHTML += `<option value="${p.id}">${p.name}</option>`);
    select.value = val;
};

// New function to populate teacher dropdowns
window.populateTeacherDropdowns = () => {
    const teacherSelect = document.getElementById('class-teacher-select');
    if (!teacherSelect) return;

    const currentVal = teacherSelect.value;
    teacherSelect.innerHTML = `<option value="">اختر معلمًا</option>`;
    teachersCache.forEach(teacher => {
        teacherSelect.innerHTML += `<option value="${teacher.id}">${teacher.name}</option>`;
    });
    teacherSelect.value = currentVal;
};


window.loadStudentsFor = (selectId, classId) => {
    const studentSelect = document.getElementById(selectId);
    if (!studentSelect) return; // Ensure select element exists
    studentSelect.innerHTML = '<option value="">اختر طالباً</option>';
    if (!classId) return;
    studentsCache.filter(s => s.classId === classId).forEach(s => studentSelect.innerHTML += `<option value="${s.id}">${s.name}</option>`);
};

window.openStudentModal = (id = null) => {
    // No role check needed, always admin
    const form = document.getElementById('student-form');
    if (!form) { console.error("Student form not found."); return; }
    form.reset();
    populateAllClassDropdowns(); // Call global function
    populateAllPlanDropdowns(); // Call global function
    
    const studentModalTitle = document.getElementById('student-modal-title');
    if (studentModalTitle) studentModalTitle.textContent = id ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد';

    if (id) {
        const s = studentsCache.find(st => st.id === id);
        if (s) {
            const studentId = document.getElementById('student-id');
            const studentName = document.getElementById('student-name');
            const studentAge = document.getElementById('student-age');
            const studentGuardian = document.getElementById('student-guardian');
            const studentStartDate = document.getElementById('student-start-date');
            const studentPhone = document.getElementById('student-phone');
            const studentCountryCode = document.getElementById('student-country-code');
            const studentClassSelect = document.getElementById('student-class-select');
            const studentPlanSelect = document.getElementById('student-plan-select');
            const studentJuzStart = document.getElementById('student-juz-start');
            const studentNotesModal = document.getElementById('student-notes-modal');

            if (studentId) studentId.value = s.id;
            if (studentName) studentName.value = s.name;
            if (studentAge) studentAge.value = s.age;
            if (studentGuardian) studentGuardian.value = s.guardianName;
            if (studentStartDate) studentStartDate.value = s.startDate;
            if (studentPhone) studentPhone.value = s.phone; // Corrected to set value
            if (studentCountryCode) studentCountryCode.value = s.countryCode;
            if (studentClassSelect) studentClassSelect.value = s.classId;
            if (studentPlanSelect) studentPlanSelect.value = s.planId;
            if (studentJuzStart) studentJuzStart.value = s.juzStart;
            if (studentNotesModal) studentNotesModal.value = s.notes;
        }
    } else {
         const studentId = document.getElementById('student-id');
         if (studentId) studentId.value = '';
    }
    openModal('student-modal'); // Call global function
};

window.openClassModal = (id = null) => {
    // No role check needed, always admin
    const form = document.getElementById('class-form');
    if (!form) { console.error("Class form not found."); return; }
    form.reset();
    populateTeacherDropdowns(); // Populate teacher dropdown

    const classModalTitle = document.getElementById('class-modal-title');
    if (classModalTitle) classModalTitle.textContent = id ? 'تعديل بيانات الفصل' : 'إنشاء فصل جديد';

    if (id) {
        const c = classesCache.find(cls => cls.id === id);
        if (c) {
            const classId = document.getElementById('class-id');
            const className = document.getElementById('class-name');
            const classSchedule = document.getElementById('class-schedule');
            const classFee = document.getElementById('class-fee');
            const classTeacherSelect = document.getElementById('class-teacher-select'); // Get teacher select
            const classPhoto = document.getElementById('class-photo');

            if (classId) classId.value = c.id;
            if (className) className.value = c.name;
            if (classSchedule) classSchedule.value = c.schedule;
            if (classFee) classFee.value = c.fee;
            if (classTeacherSelect) classTeacherSelect.value = c.teacherId || ''; // Set selected teacher
            if (classPhoto) classPhoto.value = c.photo;
        }
    } else {
        const classId = document.getElementById('class-id');
        if (classId) classId.value = '';
    }
    openModal('class-modal'); // Call global function
};

window.openPlanModal = (id = null) => {
    // No role check needed, always admin
    const form = document.getElementById('plan-form');
    if (!form) { console.error("Plan form not found."); return; }
    form.reset();
    
    const planModalTitle = document.getElementById('plan-modal-title');
    if (planModalTitle) planModalTitle.textContent = id ? 'تعديل الخطة' : 'إنشاء خطة جديدة';

    if (id) {
        const p = plansCache.find(plan => plan.id === id);
        if (p) {
            const planId = document.getElementById('plan-id');
            const planName = document.getElementById('plan-name');
            const planDescription = document.getElementById('plan-description');
            const planPagesPerWeek = document.getElementById('plan-pages-per-week');

            if (planId) planId.value = p.id;
            if (planName) planName.value = p.name;
            if (planDescription) planDescription.value = p.description;
            if (planPagesPerWeek) planPagesPerWeek.value = p.pagesPerWeek; // Set pages per week
        }
    } else {
        const planId = document.getElementById('plan-id');
        if (planId) planId.value = '';
    }
    openModal('plan-modal'); // Call global function
};

window.openAssignClassBulkModal = () => {
    // No role check needed, always admin
    const selected = document.querySelectorAll('.student-checkbox:checked').length;
    if (selected === 0) { customAlert("الرجاء تحديد طالب واحد على الأقل."); return; }
    openModal('assign-class-bulk-modal'); // Call global function
};

// New bulk plan assignment modal functions
window.openAssignPlanBulkModal = () => {
    // No role check needed, always admin
    const bulkAssignPlanSelect = document.getElementById('bulk-assign-plan-select');
    const bulkAssignTargetType = document.getElementById('bulk-assign-target-type');
    const bulkAssignStudentsContainer = document.getElementById('bulk-assign-students-container');
    const bulkAssignClassTargetContainer = document.getElementById('bulk-assign-class-target-container');
    const bulkAssignClassSelectPlan = document.getElementById('bulk-assign-class-select-plan');

    // Populate plan dropdown
    populatePlanDropdown(bulkAssignPlanSelect);

    // Reset target type to students and show/hide containers
    if (bulkAssignTargetType) bulkAssignTargetType.value = 'students';
    if (bulkAssignStudentsContainer) bulkAssignStudentsContainer.classList.remove('hidden');
    if (bulkAssignClassTargetContainer) bulkAssignClassTargetContainer.classList.add('hidden');

    // Populate student checkboxes
    if (bulkAssignStudentsContainer) {
        let studentCheckboxesHtml = '';
        if (studentsCache.length === 0) {
            studentCheckboxesHtml = `<p class="text-gray-500">لا يوجد طلاب لإسناد الخطة إليهم.</p>`;
        } else {
            studentsCache.forEach(student => {
                studentCheckboxesHtml += `
                    <label class="flex items-center gap-2 cursor-pointer mb-2">
                        <input type="checkbox" class="custom-checkbox bulk-plan-student-checkbox" data-student-id="${student.id}">
                        <span>${student.name}</span>
                    </label>`;
            });
        }
        bulkAssignStudentsContainer.innerHTML = studentCheckboxesHtml;
    }

    // Populate class dropdown for class target
    populateClassDropdown(bulkAssignClassSelectPlan);

    openModal('assign-plan-bulk-modal');
};

window.toggleBulkAssignTarget = () => {
    const bulkAssignTargetType = document.getElementById('bulk-assign-target-type');
    const bulkAssignStudentsContainer = document.getElementById('bulk-assign-students-container');
    const bulkAssignClassTargetContainer = document.getElementById('bulk-assign-class-target-container');

    if (!bulkAssignTargetType || !bulkAssignStudentsContainer || !bulkAssignClassTargetContainer) return;

    if (bulkAssignTargetType.value === 'students') {
        bulkAssignStudentsContainer.classList.remove('hidden');
        bulkAssignClassTargetContainer.classList.add('hidden');
    } else {
        bulkAssignStudentsContainer.classList.add('hidden');
        bulkAssignClassTargetContainer.classList.remove('hidden');
    }
};

window.handleBulkAssignPlan = () => {
    // No role check needed, always admin
    const planId = document.getElementById('bulk-assign-plan-select')?.value;
    const targetType = document.getElementById('bulk-assign-target-type')?.value;

    if (!planId) {
        customAlert("الرجاء اختيار خطة.");
        return;
    }

    let studentsToUpdate = [];

    if (targetType === 'students') {
        const selectedStudentIds = Array.from(document.querySelectorAll('.bulk-plan-student-checkbox:checked')).map(cb => cb.dataset.studentId);
        if (selectedStudentIds.length === 0) {
            customAlert("الرجاء تحديد طالب واحد على الأقل.");
            return;
        }
        studentsToUpdate = studentsCache.filter(s => selectedStudentIds.includes(s.id));
    } else if (targetType === 'class') {
        const classId = document.getElementById('bulk-assign-class-select-plan')?.value;
        if (!classId) {
            customAlert("الرجاء اختيار فصل.");
            return;
        }
        studentsToUpdate = studentsCache.filter(s => s.classId === classId);
    }

    if (studentsToUpdate.length === 0) {
        customAlert("لم يتم العثور على طلاب لتطبيق الخطة عليهم.");
        return;
    }

    studentsToUpdate.forEach(student => {
        student.planId = planId;
        // Optionally, set juzStart if not already set and plan has one
        const assignedPlan = plansCache.find(p => p.id === planId);
        if (assignedPlan && assignedPlan.juzStart && !student.juzStart) {
            student.juzStart = assignedPlan.juzStart;
        }
    });

    LocalStore.set('students', studentsCache);
    createNotification(`تم تعيين الخطة لـ ${studentsToUpdate.length} طالب/طلاب.`, "success");
    closeModal('assign-plan-bulk-modal');
    renderAll();
};


window.toggleAllStudentCheckboxes = (checked) => {
    document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = checked);
};

window.generateMonthlyReport = () => {
    // No role check needed, always admin
    const attendanceClassSelect = document.getElementById('attendance-class-select');
    const classId = attendanceClassSelect ? attendanceClassSelect.value : '';
    if (!classId) { customAlert("الرجاء اختيار فصل أولاً."); return; }
    
    const attendanceDate = document.getElementById('attendance-date');
    const date = new Date(attendanceDate ? attendanceDate.value : new Date());
    
    const cls = classesCache.find(c => c.id === classId);
    if (!cls) { customAlert("الفصل المحدد غير موجود."); return; } // Added check for class existence

    const studentsInClass = studentsCache.filter(s => s.classId === classId);
    const year = date.getFullYear(), month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let reportHTML = `<div id="report-content" style="font-family: Cairo, sans-serif; direction: rtl; padding: 20px;"><h2 style="text-align: center;">تقرير الحضور الشهري - ${cls.name}</h2><h3 style="text-align: center;">شهر: ${date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' })}</h3><table style="width: 100%; border-collapse: collapse; font-size: 12px;"><thead><tr style="background-color: #e2e8f0;"><th style="border: 1px solid #ccc; padding: 8px;">الطالب</th>`;
    for(let i = 1; i <= daysInMonth; i++) { reportHTML += `<th style="border: 1px solid #ccc; padding: 4px;">${i}</th>`; }
    reportHTML += `<th style="border: 1px solid #ccc; padding: 8px; background-color: #d1fae5;">حضور</th><th style="border: 1px solid #ccc; padding: 8px; background-color: #fee2e2;">غياب</th></tr></thead><tbody>`;
    studentsInClass.forEach(student => {
        let presentCount = 0, absentCount = 0;
        reportHTML += `<tr><td style="border: 1px solid #ccc; padding: 8px;">${student.name}</td>`;
        for(let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i + 1).toISOString().split('T')[0];
            const status = (attendanceCache[d] || {})[student.id] || '';
            let symbol = '-';
            if (status === 'present') { symbol = '✔'; presentCount++; }
            else if (status === 'absent') { symbol = '✖'; absentCount++; }
            reportHTML += `<td style="border: 1px solid #ccc; padding: 4px; text-align: center;">${symbol}</td>`;
        }
         reportHTML += `<td style="border: 1px solid #ccc; padding: 8px; text-align: center; background-color: #f0fdf4;">${presentCount}</td><td style="border: 1px solid #ccc; padding: 8px; text-align: center; background-color: #fef2f2;">${absentCount}</td></tr>`;
    });
    reportHTML += `</tbody></table></div>`;
    const reportView = document.getElementById('monthly-report-view');
    if (reportView) {
        reportView.innerHTML = reportHTML;
        reportView.classList.remove('hidden');
        html2pdf(document.getElementById('report-content'), { margin: 1, filename: `report-${cls.name}-${month+1}-${year}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'in', format: 'a3', orientation: 'landscape' } });
    }
};

window.generateFinancialReport = () => {
    // No role check needed, always admin
    const financialReportView = document.getElementById('financial-report-view');
    if (!financialReportView) {
        console.error("Financial report view element not found.");
        customAlert("عنصر عرض التقرير المالي غير موجود.");
        return;
    }

    const currentMonth = document.getElementById('financial-month').value;
    const monthName = new Date(currentMonth + '-01').toLocaleString('ar-EG', { month: 'long', year: 'numeric' });

    // Calculate total income for the month
    let totalIncome = 0;
    const monthFinancials = financialsCache[currentMonth] || {};
    for (const studentId in monthFinancials) {
        if (monthFinancials[studentId] === 'paid') {
            const student = studentsCache.find(s => s.id === studentId);
            const cls = student ? classesCache.find(c => c.id === student.classId) : null;
            if (cls) {
                totalIncome += (cls.fee || 0);
            }
        }
    };

    // Calculate total expenses for the month
    let totalExpenses = 0;
    expensesCache.forEach(expense => {
        const expenseMonth = expense.date.substring(0, 7);
        if (expenseMonth === currentMonth) {
            totalExpenses += expense.amount;
        }
    });

    const netBalance = totalIncome - totalExpenses;

    let reportHTML = `<div id="financial-report-content" style="font-family: Cairo, sans-serif; direction: rtl; padding: 20px;">
        <h2 style="text-align: center;">التقرير المالي الشهري</h2>
        <h3 style="text-align: center;">شهر: ${monthName}</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
            <thead>
                <tr style="background-color: #e2e8f0;">
                    <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">البند</th>
                    <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">المبلغ (${settingsCache.currency})</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">إجمالي الدخل من الرسوم</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right; color: #10b981;">${totalIncome.toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">إجمالي المصروفات</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right; color: #ef4444;">${totalExpenses.toLocaleString()}</td>
                </tr>
                <tr style="background-color: #f0fdf4;">
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold;">الرصيد الصافي</td>
                    <td style="border: 1px solid #ccc; padding: 8px; text-align: right; font-weight: bold; color: ${netBalance >= 0 ? '#10b981' : '#ef4444'};">${netBalance.toLocaleString()}</td>
                </tr>
            </tbody>
        </table>

        <h4 style="margin-top: 30px;">تفاصيل الدخل (المدفوعات المستلمة):</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
            <thead>
                <tr style="background-color: #e2e8f0;">
                    <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">الطالب</th>
                    <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">الفصل</th>
                    <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">المبلغ (${settingsCache.currency})</th>
                </tr>
            </thead>
            <tbody>`;
    studentsCache.forEach(student => {
        const status = monthFinancials[student.id];
        if (status === 'paid') {
            const cls = classesCache.find(c => c.id === student.classId);
            const fee = cls ? (cls.fee || 0) : 0;
            reportHTML += `<tr>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${student.name}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${cls ? cls.name : 'غير محدد'}</td>
                <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${fee.toLocaleString()}</td>
            </tr>`;
        }
    });
    reportHTML += `</tbody></table>`;

    reportHTML += `<h4 style="margin-top: 30px;">تفاصيل المصروفات:</h4>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
            <thead>
                <tr style="background-color: #e2e8f0;">
                    <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">الوصف</th>
                    <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">المبلغ (${settingsCache.currency})</th>
                    <th style="border: 1px solid #ccc; padding: 8px; text-align: right;">التاريخ</th>
                </tr>
            </thead>
            <tbody>`;
    expensesCache.filter(expense => expense.date.substring(0, 7) === currentMonth).forEach(expense => {
        reportHTML += `<tr>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${expense.description}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${expense.amount.toLocaleString()}</td>
            <td style="border: 1px solid #ccc; padding: 8px; text-align: right;">${new Date(expense.date).toLocaleDateString()}</td>
        </tr>`;
    });
    reportHTML += `</tbody></table></div>`;

     financialReportView.innerHTML = reportHTML;
    financialReportView.classList.remove('hidden');

    html2pdf(document.getElementById('financial-report-content'), { 
        margin: 1, 
        filename: `financial-report-${currentMonth}.pdf`, 
        image: { type: 'jpeg', quality: 0.98 }, 
        html2canvas: { scale: 2, useCORS: true }, 
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' } 
    });
};