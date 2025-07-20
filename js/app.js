// js/app.js

// Import core modules
import { db } from './db.js';
import { renderIcons, showLoader } from './utils.js';
import { countryCodes } from './countries.js';
import { SURA_DATA, JUZ_DATA } from './quran-data.js';

// Import page modules
import { initDashboard } from './dashboard.js';
import { initFinancialsDashboard } from './financials-dashboard.js';
import { initStudents } from './students.js';
import { initStudentProfile } from './student-profile.js';
import { initClasses } from './classes.js';
import { initPlans } from './plans.js';
import { initTeachers } from './teachers.js';
import { initTeacherProfile } from './teacher-profile.js';
import { initAttendance } from './attendance.js';
import { initTasmee3 } from './tasmee3.js';
import { initExams } from './exams.js';
import { initFinancials } from './financials.js';
import { initParentPortal } from './parent-portal.js';
import { initNotifications, runSystemChecks, updateNotificationDot, requestNotificationPermission } from './notifications.js';
import { initSettings } from './settings.js';

// Get DOM elements
const mainContent = document.getElementById('main-content');
const pageTitle = document.getElementById('page-title');
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// Define the routes for the single-page application
const routes = {
    '#dashboard': { title: 'اللوحة الرئيسية', init: initDashboard },
    '#financials-dashboard': { title: 'لوحة المالية', init: initFinancialsDashboard },
    '#students': { title: 'إدارة الطلاب', init: initStudents },
    '#student-profile': { title: 'ملف الطالب', init: initStudentProfile },
    '#classes': { title: 'إدارة الحلقات', init: initClasses },
    '#plans': { title: 'خطط الحفظ', init: initPlans },
    '#teachers': { title: 'إدارة المعلمين', init: initTeachers },
    '#teacher-profile': { title: 'ملف المعلم', init: initTeacherProfile },
    '#attendance': { title: 'الحضور والغياب', init: initAttendance },
    '#tasmee3': { title: 'متابعة التسميع', init: initTasmee3 },
    '#exams': { title: 'إدارة الاختبارات', init: initExams },
    '#financials': { title: 'الأمور المالية', init: initFinancials },
    '#parent-portal': { title: 'بوابة أولياء الأمور', init: initParentPortal },
    '#notifications': { title: 'الإشعارات', init: initNotifications },
    '#settings': { title: 'الإعدادات', init: initSettings },
};

// --- Sidebar Logic ---
function openSidebar() {
    sidebar.classList.remove('translate-x-full');
    sidebarOverlay.classList.remove('hidden');
}

function closeSidebar() {
    sidebar.classList.add('translate-x-full');
    sidebarOverlay.classList.add('hidden');
}

function toggleSidebar() {
    sidebar.classList.toggle('translate-x-full');
    sidebarOverlay.classList.toggle('hidden');
}

// --- Core App Logic ---

// Function to handle routing
async function router() {
    // Auto-hide sidebar on navigation in mobile view
    if (window.innerWidth < 1024) {
        closeSidebar();
    }
    
    showLoader(true);
    try {
        const hash = window.location.hash.split('?')[0] || '#dashboard';
        const route = routes[hash];

        if (route) {
            pageTitle.textContent = route.title;
            mainContent.innerHTML = ''; // Clear previous content
            await route.init(mainContent);

            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.toggle('theme-bg', link.getAttribute('href') === hash);
                link.classList.toggle('text-white', link.getAttribute('href') === hash);
            });
        } else {
            // If no route matches, default to dashboard
            window.location.hash = '#dashboard';
        }
        renderIcons();
    } catch (error) {
        console.error("Error during routing:", error);
        mainContent.innerHTML = `<p class="text-red-500">حدث خطأ أثناء عرض هذه الصفحة.</p>`;
    } finally {
        showLoader(false);
    }
}

// Function to setup theme toggle
async function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const darkIcon = document.querySelector('.dark-icon');
    const lightIcon = document.querySelector('.light-icon');

    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            darkIcon.classList.add('hidden');
            lightIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            darkIcon.classList.remove('hidden');
            lightIcon.classList.add('hidden');
        }
    };

    // Load theme from DB settings first, then fallback to localStorage
    const settings = await db.settings.get('userSettings');
    const savedTheme = settings?.theme || localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    themeToggle.addEventListener('click', async () => {
        const currentTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Save to both DB and localStorage
        localStorage.setItem('theme', newTheme);
        const currentSettings = await db.settings.get('userSettings') || { key: 'userSettings' };
        currentSettings.theme = newTheme;
        await db.settings.put(currentSettings);

        applyTheme(newTheme);
    });
}

// --- Authentication ---

// Handles the login form submission.
function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    if (username === 'admin' && password === 'admin') {
        sessionStorage.setItem('isLoggedIn', 'true');
        errorDiv.classList.add('hidden');
        location.reload();
    } else {
        errorDiv.classList.remove('hidden');
    }
}

// Handles logout.
function handleLogout() {
    sessionStorage.removeItem('isLoggedIn');
    location.reload();
}

// --- App Initialization ---

// Sets up and displays the main application interface.
async function startApp() {
    loginScreen.classList.add('hidden');
    appContainer.classList.remove('hidden');
    
    await setupThemeToggle(); // Await theme setup
    window.addEventListener('hashchange', router);
    document.getElementById('logout-button').addEventListener('click', handleLogout);
    
    // Setup sidebar controls
    document.getElementById('sidebar-toggle').addEventListener('click', toggleSidebar);
    document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);
    
    // Request notification permission and start system checks
    requestNotificationPermission();
    updateNotificationDot();
    runSystemChecks();
    setInterval(runSystemChecks, 60000); // Run checks every 60 seconds
    
    router(); // Initial page load
}

// Main application entry point
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await db.open();
        console.log("Database opened successfully.");

        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            await startApp();
        } else {
            loginScreen.classList.remove('hidden');
            document.getElementById('login-form').addEventListener('submit', handleLogin);
            showLoader(false);
        }
    } catch (error) {
        console.error("Failed to open database:", error);
        document.body.innerHTML = `<div class="text-center p-8 text-red-500">
            <h1 class="text-2xl font-bold mb-4">حدث خطأ فادح في قاعدة البيانات</h1>
            <p>لا يمكن تشغيل التطبيق. قد يكون هذا بسبب تحديث غير متوافق.</p>
            <p class="mt-2">الرجاء محاولة مسح بيانات الموقع من إعدادات المتصفح ثم إعادة تحميل الصفحة.</p>
            <p class="mt-4 text-xs text-gray-400">Error: ${error.message}</p>
        </div>`;
        showLoader(false);
    }
});