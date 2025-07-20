// js/settings.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showToast, showLoader, renderIcons } from './utils.js';

// Define the default structure for all settings
const defaultSettings = {
    appName: 'منصة التحفيظ',
    adminName: 'مدير النظام',
    themeColor: '#10b981',
    fontSize: 'medium', // small, medium, large
    currency: 'SDG',
    defaultFee: 100,
    feeDueDate: 5, // 5th of the month
    enableLateFees: false,
    lateFeeAmount: 10,
    passingScore: 50, // Percentage
    examFields: [
        { name: 'جودة الحفظ', mark: 50 },
        { name: 'أحكام التجويد', mark: 30 },
        { name: 'جمال الصوت', mark: 20 }
    ],
    notifyOnNewStudent: true,
    notifyOnFeePaid: false,
    enableParentPortal: true,
    parentPortalMessage: 'مرحباً بكم في بوابة متابعة الأبناء.'
};

async function getSettings() {
    let settings = await db.settings.get('userSettings');
    if (!settings) {
        // If no settings exist, create with defaults
        settings = { key: 'userSettings', ...defaultSettings };
        await db.settings.put(settings);
    }
    // Ensure all default keys exist on loaded settings
    return { ...defaultSettings, ...settings };
}

export async function initSettings(container) {
    const settings = await getSettings();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">الإعدادات</h2>
            <button id="save-settings-btn" class="theme-bg text-white px-6 py-2 rounded-lg flex items-center">
                <i data-lucide="save" class="mr-2"></i> حفظ جميع الإعدادات
            </button>
        </div>

        <div class="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md">
            <!-- Tabs Navigation -->
            <div class="flex border-b dark:border-gray-700">
                <button class="settings-tab-btn active-tab p-4" data-tab="general">عام</button>
                <button class="settings-tab-btn p-4" data-tab="appearance">المظهر</button>
                <button class="settings-tab-btn p-4" data-tab="financials">المالية</button>
                <button class="settings-tab-btn p-4" data-tab="exams">الاختبارات</button>
                <button class="settings-tab-btn p-4" data-tab="data">البيانات</button>
            </div>

            <!-- Tabs Content -->
            <div class="p-6">
                <!-- General Settings -->
                <div id="general-settings-tab" class="settings-tab-content space-y-4">
                    <div>
                        <label class="block mb-1 font-semibold">اسم التطبيق</label>
                        <input type="text" id="setting-appName" value="${settings.appName}" class="w-full p-2 border rounded dark:bg-gray-700">
                    </div>
                    <div>
                        <label class="block mb-1 font-semibold">اسم المدير</label>
                        <input type="text" id="setting-adminName" value="${settings.adminName}" class="w-full p-2 border rounded dark:bg-gray-700">
                    </div>
                </div>

                <!-- Appearance Settings -->
                <div id="appearance-settings-tab" class="settings-tab-content hidden space-y-4">
                    <div>
                        <label class="block mb-1 font-semibold">اللون الأساسي</label>
                        <input type="color" id="setting-themeColor" value="${settings.themeColor}" class="p-1 h-10 w-full block border rounded-lg cursor-pointer">
                    </div>
                    <div>
                        <label class="block mb-1 font-semibold">حجم الخط</label>
                        <select id="setting-fontSize" class="w-full p-2 border rounded dark:bg-gray-700">
                            <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>صغير</option>
                            <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>متوسط</option>
                            <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>كبير</option>
                        </select>
                    </div>
                </div>
                
                <!-- Financials Settings -->
                <div id="financials-settings-tab" class="settings-tab-content hidden space-y-4">
                    <div>
                        <label class="block mb-1 font-semibold">العملة</label>
                        <select id="setting-currency" class="w-full p-2 border rounded dark:bg-gray-700">
                            <option value="SDG" ${settings.currency === 'SDG' ? 'selected' : ''}>جنيه سوداني (SDG)</option>
                            <option value="USD" ${settings.currency === 'USD' ? 'selected' : ''}>دولار أمريكي (USD)</option>
                            <option value="SAR" ${settings.currency === 'SAR' ? 'selected' : ''}>ريال سعودي (SAR)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block mb-1 font-semibold">الرسوم الشهرية الافتراضية</label>
                        <input type="number" id="setting-defaultFee" value="${settings.defaultFee}" class="w-full p-2 border rounded dark:bg-gray-700">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="setting-enableLateFees" class="w-4 h-4" ${settings.enableLateFees ? 'checked' : ''}>
                        <label for="setting-enableLateFees" class="mr-2">تفعيل رسوم التأخير</label>
                    </div>
                </div>

                <!-- Exams Settings -->
                <div id="exams-settings-tab" class="settings-tab-content hidden space-y-4">
                     <div>
                        <label class="block mb-1 font-semibold">درجة النجاح (%)</label>
                        <input type="number" id="setting-passingScore" value="${settings.passingScore}" min="0" max="100" class="w-full p-2 border rounded dark:bg-gray-700">
                    </div>
                    <div>
                        <label class="block mb-1 font-semibold">حقول الاختبارات المخصصة</label>
                        <div id="exam-fields-container" class="space-y-2"></div>
                        <div class="flex gap-2 mt-2">
                            <input type="text" id="new-exam-field-name" placeholder="اسم الحقل" class="w-1/2 p-2 border rounded dark:bg-gray-700">
                            <input type="number" id="new-exam-field-mark" placeholder="الدرجة" class="w-1/4 p-2 border rounded dark:bg-gray-700">
                            <button id="add-exam-field-btn" class="w-1/4 theme-bg text-white rounded">إضافة</button>
                        </div>
                    </div>
                </div>

                <!-- Data Settings -->
                <div id="data-settings-tab" class="settings-tab-content hidden space-y-6">
                    <div>
                        <h4 class="font-semibold mb-2">النسخ الاحتياطي والاستعادة</h4>
                        <div class="flex gap-4">
                            <button id="backup-data-btn" class="bg-blue-500 text-white px-4 py-2 rounded-lg">تصدير نسخة احتياطية</button>
                            <label class="bg-green-500 text-white px-4 py-2 rounded-lg cursor-pointer">
                                استعادة من ملف
                                <input type="file" id="restore-file-input" class="hidden" accept=".json">
                            </label>
                        </div>
                    </div>
                     <div>
                        <h4 class="font-semibold mb-2 text-red-500">منطقة الخطر</h4>
                        <button id="clear-local-data-btn" class="bg-red-600 text-white px-4 py-2 rounded-lg">مسح جميع البيانات المحلية</button>
                        <p class="text-xs text-gray-500 mt-1">تحذير: لا يمكن التراجع عن هذا الإجراء.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderIcons();
    setupTabs();
    renderExamFields();

    // Event Listeners
    document.getElementById('save-settings-btn').addEventListener('click', saveAllSettings);
    document.getElementById('add-exam-field-btn').addEventListener('click', addExamField);
    document.getElementById('backup-data-btn').addEventListener('click', backupData);
    document.getElementById('restore-file-input').addEventListener('change', handleRestoreFile);
    document.getElementById('clear-local-data-btn').addEventListener('click', clearLocalData);
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    const tabContents = document.querySelectorAll('.settings-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active-tab', 'theme-text'));
            button.classList.add('active-tab', 'theme-text');

            tabContents.forEach(content => {
                if (content.id === `${button.dataset.tab}-settings-tab`) {
                    content.classList.remove('hidden');
                } else {
                    content.classList.add('hidden');
                }
            });
        });
    });
}

async function saveAllSettings() {
    showLoader(true);
    try {
        const currentSettings = await getSettings();
        
        // Collect exam fields
        const examFields = [];
        document.querySelectorAll('.exam-field-row').forEach(row => {
            const name = row.querySelector('input[type="text"]').value;
            const mark = parseInt(row.querySelector('input[type="number"]').value);
            if (name && mark) {
                examFields.push({ name, mark });
            }
        });

        const newSettings = {
            ...currentSettings,
            appName: document.getElementById('setting-appName').value,
            adminName: document.getElementById('setting-adminName').value,
            themeColor: document.getElementById('setting-themeColor').value,
            fontSize: document.getElementById('setting-fontSize').value,
            currency: document.getElementById('setting-currency').value,
            defaultFee: parseFloat(document.getElementById('setting-defaultFee').value) || 0,
            enableLateFees: document.getElementById('setting-enableLateFees').checked,
            passingScore: parseInt(document.getElementById('setting-passingScore').value) || 50,
            examFields: examFields,
        };

        await db.settings.put(newSettings);
        showToast('تم حفظ الإعدادات بنجاح!', 'success');
        
        // Apply visual changes immediately
        document.documentElement.style.setProperty('--theme-color', newSettings.themeColor);

    } catch (error) {
        console.error("Failed to save settings:", error);
        showToast('فشل حفظ الإعدادات.', 'error');
    } finally {
        showLoader(false);
    }
}

// --- Exam Fields Logic ---
async function renderExamFields() {
    const container = document.getElementById('exam-fields-container');
    const settings = await getSettings();
    container.innerHTML = settings.examFields.map((field, index) => `
        <div class="exam-field-row flex gap-2 items-center">
            <input type="text" value="${field.name}" class="w-1/2 p-2 border rounded dark:bg-gray-700">
            <input type="number" value="${field.mark}" class="w-1/4 p-2 border rounded dark:bg-gray-700">
            <button class="remove-exam-field-btn text-red-500 p-2" data-index="${index}"><i data-lucide="trash-2"></i></button>
        </div>
    `).join('');

    renderIcons();
    document.querySelectorAll('.remove-exam-field-btn').forEach(btn => {
        btn.addEventListener('click', (e) => removeExamField(parseInt(e.currentTarget.dataset.index)));
    });
}

async function addExamField() {
    const nameInput = document.getElementById('new-exam-field-name');
    const markInput = document.getElementById('new-exam-field-mark');
    if (!nameInput.value || !markInput.value) {
        showToast('الرجاء إدخال اسم الحقل والدرجة.', 'error');
        return;
    }
    const settings = await getSettings();
    settings.examFields.push({ name: nameInput.value, mark: parseInt(markInput.value) });
    await db.settings.put(settings);
    nameInput.value = '';
    markInput.value = '';
    await renderExamFields();
}

async function removeExamField(index) {
    const settings = await getSettings();
    settings.examFields.splice(index, 1);
    await db.settings.put(settings);
    await renderExamFields();
}


// --- Data Management Logic ---
async function backupData() { /* ... existing backup logic ... */ }
function handleRestoreFile(event) { /* ... existing restore logic ... */ }
async function clearLocalData() { /* ... existing clear data logic ... */ }

