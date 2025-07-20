// js/classes.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showModal, hideModal, showToast, renderIcons, showConfirm } from './utils.js';

export async function initClasses(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">إدارة الحلقات</h2>
            <button id="add-class-btn" class="theme-bg text-white px-4 py-2 rounded-lg flex items-center">
                <i data-lucide="plus" class="mr-2"></i> إضافة حلقة جديدة
            </button>
        </div>
        <div id="classes-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            </div>
    `;

    document.getElementById('add-class-btn').addEventListener('click', () => showClassModal());
    
    renderIcons();
    await renderClassesGrid();
}

async function renderClassesGrid() {
    const gridContainer = document.getElementById('classes-grid');
    const allClasses = await db.classes.toArray();
    const settings = await db.settings.get('userSettings') || { currency: 'SDG', themeColor: '#10b981' };
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    if (!allClasses.length) {
        gridContainer.innerHTML = '<p class="text-center col-span-full text-gray-500">لا توجد حلقات. قم بإنشاء حلقة جديدة.</p>';
        return;
    }

    let gridHtml = '';
    for (const cls of allClasses) {
        const studentCount = await db.students.where('class_id').equals(cls.id).count();
const placeholderColor = (settings.themeColor && settings.themeColor.startsWith('#') ? settings.themeColor : '#10b981').slice(1);
        const placeholderText = encodeURIComponent(cls.name);
        const scheduleDays = cls.schedule_days?.map(d => daysOfWeek[d]).join(', ') || 'غير محدد';
        
        let groupLinks = '';
        if (cls.whatsapp_link) {
            groupLinks += `<a href="${cls.whatsapp_link}" target="_blank" class="bg-green-500 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1 z-10 relative"><i data-lucide="message-circle" class="w-3 h-3"></i> WhatsApp</a>`;
        }
        if (cls.telegram_link) {
            groupLinks += `<a href="${cls.telegram_link}" target="_blank" class="bg-sky-500 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1 z-10 relative"><i data-lucide="send" class="w-3 h-3"></i> Telegram</a>`;
        }

        gridHtml += `
            <div class="class-card bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden">
                <div class="relative">
                    <img src="${cls.photo || `https://placehold.co/600x400/${placeholderColor}/ffffff?text=${placeholderText}`}" 
                         alt="${cls.name}" 
                         class="w-full h-40 object-cover cursor-pointer"
                         data-class-id="${cls.id}"
                         onerror="this.onerror=null;this.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found';">
                    <div class="absolute bottom-2 left-2 flex gap-2">
                        ${groupLinks}
                    </div>
                </div>
                <div class="p-4 flex flex-col flex-grow">
                    <h3 class="text-xl font-bold theme-text">${cls.name}</h3>
                    <p class="text-gray-600 dark:text-gray-400 mt-2"><i data-lucide="users" class="inline-block w-4 h-4 ml-1"></i>${studentCount} طالب</p>
                    <p class="text-gray-600 dark:text-gray-400 mt-1"><i data-lucide="calendar" class="inline-block w-4 h-4 ml-1"></i>${scheduleDays}</p>
                    <p class="text-gray-600 dark:text-gray-400 mt-1"><i data-lucide="clock" class="inline-block w-4 h-4 ml-1"></i>${cls.time || 'غير محدد'}</p>
                    <p class="text-gray-600 dark:text-gray-400 mt-1 font-semibold"><i data-lucide="dollar-sign" class="inline-block w-4 h-4 ml-1"></i>${cls.fee || 0} ${settings.currency}</p>
                    <div class="mt-auto pt-4 flex justify-end gap-2">
                        <button class="edit-class-btn p-1 z-10 relative" data-id="${cls.id}"><i data-lucide="edit" class="text-blue-500 w-5 h-5"></i></button>
                        <button class="delete-class-btn p-1 z-10 relative" data-id="${cls.id}"><i data-lucide="trash-2" class="text-red-500 w-5 h-5"></i></button>
                    </div>
                </div>
            </div>
        `;
    }
    gridContainer.innerHTML = gridHtml;
    
    renderIcons();

    gridContainer.querySelectorAll('.class-card img').forEach(cardImage => {
        cardImage.addEventListener('click', (e) => {
            window.location.hash = `#students?class_id=${cardImage.dataset.classId}`;
        });
    });

    gridContainer.querySelectorAll('.edit-class-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showClassModal(e.currentTarget.dataset.id));
    });
    gridContainer.querySelectorAll('.delete-class-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteClass(e.currentTarget.dataset.id));
    });
}

async function showClassModal(classId = null) {
    const cls = classId ? await db.classes.get(classId) : {};
    const teachers = await db.teachers.toArray();
    const title = classId ? 'تعديل بيانات الحلقة' : 'إضافة حلقة جديدة';
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    const formContent = `
        <form id="class-form" class="space-y-4">
            <input type="hidden" id="class-id" value="${cls.id || ''}">
            <div>
                <label for="class-name" class="block mb-1 text-sm">اسم الحلقة</label>
                <input type="text" id="class-name" value="${cls.name || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required>
            </div>
            <div>
                <label for="class-teacher" class="block mb-1 text-sm">المعلم المسؤول</label>
                <select id="class-teacher" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">-- اختر معلمًا --</option>
                    ${teachers.map(t => `<option value="${t.id}" ${cls.teacher_id === t.id ? 'selected' : ''}>${t.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block mb-2 text-sm">أيام الحلقة</label>
                <div class="flex flex-wrap gap-2">
                    ${daysOfWeek.map((day, index) => `
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" name="schedule_days" value="${index}" class="form-checkbox" ${cls.schedule_days?.includes(index) ? 'checked' : ''}>
                            <span>${day}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
            <div>
                <label for="class-time" class="block mb-1 text-sm">وقت الحلقة</label>
                <input type="time" id="class-time" value="${cls.time || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
            <div>
                <label for="class-fee" class="block mb-1 text-sm">الرسوم الشهرية</label>
                <input type="number" id="class-fee" value="${cls.fee || ''}" min="0" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
            <div>
                <label for="class-whatsapp" class="block mb-1 text-sm">رابط مجموعة WhatsApp (اختياري)</label>
                <input type="text" id="class-whatsapp" value="${cls.whatsapp_link || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
            <div>
                <label for="class-telegram" class="block mb-1 text-sm">رابط مجموعة Telegram (اختياري)</label>
                <input type="text" id="class-telegram" value="${cls.telegram_link || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
            <div>
                <label for="class-photo" class="block mb-1 text-sm">رابط صورة الحلقة (اختياري)</label>
                <input type="text" id="class-photo" value="${cls.photo || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
        </form>
    `;

    showModal(title, formContent, async () => {
        const scheduleDays = Array.from(document.querySelectorAll('input[name="schedule_days"]:checked')).map(cb => parseInt(cb.value));
        const classData = {
            id: document.getElementById('class-id').value,
            name: document.getElementById('class-name').value,
            teacher_id: document.getElementById('class-teacher').value || null,
            schedule_days: scheduleDays,
            time: document.getElementById('class-time').value,
            fee: parseFloat(document.getElementById('class-fee').value) || 0,
            whatsapp_link: document.getElementById('class-whatsapp').value,
            telegram_link: document.getElementById('class-telegram').value,
            photo: document.getElementById('class-photo').value,
        };

        if (!classData.name) {
            showToast('الرجاء إدخال اسم الحلقة.', 'error');
            return;
        }

        await saveData('classes', classData);
        showToast(classId ? 'تم تحديث الحلقة بنجاح' : 'تم إضافة الحلقة بنجاح', 'success');
        hideModal();
        await renderClassesGrid();
    });
}

async function deleteClass(classId) {
    const studentCount = await db.students.where('class_id').equals(classId).count();
    if (studentCount > 0) {
        showToast('لا يمكن حذف الحلقة لأن بها طلاب مسجلين.', 'error');
        return;
    }

    showConfirm('هل أنت متأكد من رغبتك في حذف هذه الحلقة؟', async () => {
        try {
            await db.classes.delete(classId);
            showToast('تم حذف الحلقة بنجاح', 'success');
            await renderClassesGrid();
        } catch (error) {
            console.error('Failed to delete class:', error);
            showToast('فشل حذف الحلقة', 'error');
        }
    });
}