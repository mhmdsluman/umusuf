// js/notifications.js
import { db } from './db.js';
import { saveData } from './db.js';
import { renderIcons } from './utils.js';

/**
 * Requests permission from the user to show notifications and saves the choice.
 * This should be called once when the app starts.
 */
export function requestNotificationPermission() {
    // Check if the user has already denied permission in a previous session
    if (localStorage.getItem('notificationPermission') === 'denied') {
        return;
    }

    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
    } else if (Notification.permission === "default") {
        // Only ask if permission hasn't been granted or denied yet
        Notification.requestPermission().then(permission => {
            // Save the user's choice in localStorage to avoid asking again if denied
            localStorage.setItem('notificationPermission', permission);
            if (permission === "granted") {
                console.log("Notification permission granted.");
                showNativeNotification("الإشعارات مفعلة", "ستتلقى الآن إشعارات من منصة التحفيظ.");
            }
        });
    }
}

/**
 * Shows a native browser notification.
 * @param {string} title - The title of the notification.
 * @param {string} body - The body text of the notification.
 */
function showNativeNotification(title, body) {
    if (Notification.permission === "granted") {
        const options = {
            body: body,
            // You can add an icon here, e.g., icon: './assets/icon.png'
        };
        new Notification(title, options);
    }
}


/**
 * Adds a new notification to the database and shows a flash message.
 * @param {string} message - The notification message.
 * @param {string} type - The type of notification (e.g., 'financial', 'admin', 'class').
 * @param {string} referenceId - An optional unique ID to prevent duplicate system notifications.
 * @param {string} link - An optional hash link for the notification.
 */
export async function addNotification(message, type = 'info', referenceId = null, link = null) {
    if (referenceId) {
        const existing = await db.notifications.where('reference_id').equals(referenceId).first();
        if (existing) {
            return; // Don't add duplicate system notifications for the same event
        }
    }

    const notification = {
        message: message,
        type: type,
        is_read: 0,
        timestamp: new Date().toISOString(),
        reference_id: referenceId,
        link: link
    };
    await db.notifications.add(notification);
    
    // Show both types of notifications
    showFlashNotification(message);
    // Strip HTML for the native notification body
    const plainMessage = message.replace(/<[^>]*>?/gm, '');
    showNativeNotification("تنبيه من منصة التحفيظ", plainMessage);
    
    updateNotificationDot();
}

/**
 * Displays a temporary, non-clickable notification in the corner of the screen.
 * @param {string} message - The message to display.
 */
function showFlashNotification(message) {
    const container = document.getElementById('flash-notification-container');
    if (!container) return;

    const notifElement = document.createElement('div');
    notifElement.className = 'bg-gray-800 text-white text-sm py-2 px-4 rounded-lg shadow-lg animate-fade-in-out';
    notifElement.innerHTML = message; // Use innerHTML to render links

    container.appendChild(notifElement);

    setTimeout(() => {
        notifElement.remove();
    }, 5000); // Notification disappears after 5 seconds
}

/**
 * Runs all automated checks to generate system notifications.
 */
export async function runSystemChecks() {
    console.log("Running system notification checks...");
    await checkPaymentDeadlines();
    await checkMonthlyReportReminders();
    await checkClassStartReminders();
}

async function checkPaymentDeadlines() {
    const settings = await db.settings.get('userSettings') || { feeDueDate: 5 };
    const today = new Date();
    const currentDay = today.getDate();

    if (currentDay > settings.feeDueDate) {
        const currentMonth = today.toISOString().slice(0, 7);
        const students = await db.students.toArray();
        const financials = await db.financials.where('month_year').equals(currentMonth).toArray();
        const studentStatusMap = new Map(financials.map(f => [f.student_id, f.status]));

        for (const student of students) {
            const status = studentStatusMap.get(student.id);
            if (!status || status === 'pending') {
                const referenceId = `payment-reminder-${student.id}-${currentMonth}`;
                await addNotification(`تذكير: الطالب ${student.name} لم يدفع رسوم شهر ${currentMonth}.`, 'financial', referenceId, `#student-profile?id=${student.id}`);
            }
        }
    }
}

async function checkMonthlyReportReminders() {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.toISOString().slice(0, 7);

    if (currentDay >= 28) {
        const salaryRefId = `salary-prep-${currentMonth}`;
        await addNotification('تذكير: قم بحساب وتجهيز رواتب الموظفين لهذا الشهر.', 'admin', salaryRefId, '#financials');
        const reportRefId = `financial-report-${currentMonth}`;
        await addNotification('تذكير: قم بإعداد التقرير المالي الشهري.', 'admin', reportRefId, '#financials-dashboard');
    }
}

async function checkClassStartReminders() {
    const now = new Date();
    const currentDay = now.getDay(); // Sunday = 0, Monday = 1, ...
    
    const classesToday = await db.classes.where('schedule_days').equals(currentDay).toArray();

    for (const cls of classesToday) {
        if (cls.time) {
            const [classHour, classMinute] = cls.time.split(':').map(Number);
            
            const classTime = new Date();
            classTime.setHours(classHour, classMinute, 0, 0);

            const diffMinutes = (classTime.getTime() - now.getTime()) / 60000;

            if (diffMinutes > 0 && diffMinutes <= 10) {
                const referenceId = `class-start-${cls.id}-${now.toISOString().slice(0, 10)}`;
                const message = `تنبيه: حلقة <a href="#students?class_id=${cls.id}" class="font-bold underline">${cls.name}</a> ستبدأ خلال 10 دقائق.`;
                await addNotification(message, 'class', referenceId, `#students?class_id=${cls.id}`);
            }
        }
    }
}


/**
 * Initializes the main notifications page.
 */
export async function initNotifications(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">مركز الإشعارات</h2>
            <button id="mark-all-read-btn" class="text-sm text-blue-500 hover:underline">تحديد الكل كمقروء</button>
        </div>
        <div id="notifications-list" class="space-y-4"></div>
    `;

    document.getElementById('mark-all-read-btn').addEventListener('click', markAllAsRead);
    await renderNotifications();
    updateNotificationDot();
}

async function renderNotifications() {
    const listContainer = document.getElementById('notifications-list');
    if (!listContainer) return;

    const notifications = await db.notifications.orderBy('timestamp').reverse().toArray();
    
    if (notifications.length === 0) {
        listContainer.innerHTML = `<div class="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow"><p>لا توجد إشعارات حالياً.</p></div>`;
        return;
    }

    listContainer.innerHTML = notifications.map(n => `
        <div class="notification-item flex items-start p-4 rounded-lg shadow cursor-pointer ${n.is_read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}" data-id="${n.id}" data-link="${n.link || ''}">
            <div class="mr-3 flex-shrink-0">
                <div class="w-10 h-10 rounded-full flex items-center justify-center ${n.is_read ? 'bg-gray-200 dark:bg-gray-600' : 'theme-bg'}">
                    <i data-lucide="bell" class="${n.is_read ? 'text-gray-500' : 'text-white'}"></i>
                </div>
            </div>
            <div class="flex-grow">
                <p class="${n.is_read ? 'text-gray-600 dark:text-gray-400' : 'font-semibold'}">${n.message}</p>
                <small class="text-gray-400 dark:text-gray-500">${new Date(n.timestamp).toLocaleString('ar-EG')}</small>
            </div>
        </div>
    `).join('');
    
    renderIcons();

    listContainer.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', async (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            const link = e.currentTarget.dataset.link;
            await db.notifications.update(id, { is_read: 1 });
            if (link && link !== 'null') {
                window.location.hash = link;
            }
            await renderNotifications();
            await updateNotificationDot();
        });
    });
}

async function markAllAsRead() {
    await db.notifications.where('is_read').equals(0).modify({ is_read: 1 });
    await renderNotifications();
    await updateNotificationDot();
}

export async function updateNotificationDot() {
    const unreadCount = await db.notifications.where('is_read').equals(0).count();
    const dot = document.getElementById('notification-dot');
    if (dot) {
        if (unreadCount > 0) {
            dot.textContent = unreadCount;
            dot.classList.remove('hidden');
        } else {
            dot.classList.add('hidden');
        }
    }
}
