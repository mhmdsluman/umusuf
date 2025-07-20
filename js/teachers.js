// js/teachers.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showModal, hideModal, showToast, renderIcons, showConfirm } from './utils.js';
import { countryCodes } from './countries.js';

export async function initTeachers(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">إدارة المعلمين</h2>
            <button id="add-teacher-btn" class="theme-bg text-white px-4 py-2 rounded-lg flex items-center">
                <i data-lucide="plus" class="mr-2"></i> إضافة معلم جديد
            </button>
        </div>
        <div id="teachers-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Teacher cards will be inserted here -->
        </div>
    `;

    document.getElementById('add-teacher-btn').addEventListener('click', () => showTeacherModal());
    
    renderIcons();
    await renderTeachersGrid();
}

async function renderTeachersGrid() {
    const gridContainer = document.getElementById('teachers-grid');
    const allTeachers = await db.teachers.toArray();

    if (!allTeachers.length) {
        gridContainer.innerHTML = '<p class="text-center col-span-full text-gray-500">لا يوجد معلمين. قم بإضافة معلم جديد.</p>';
        return;
    }

    let gridHtml = '';
    for (const teacher of allTeachers) {
        const classCount = await db.classes.where('teacher_id').equals(teacher.id).count();
        gridHtml += `
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden">
                <div class="p-4 flex items-center gap-4">
                    <img src="${teacher.photo || `https://placehold.co/80x80/0d9488/ffffff?text=${teacher.name.charAt(0)}`}" 
                         alt="${teacher.name}" 
                         class="w-20 h-20 rounded-full object-cover"
                         onerror="this.onerror=null;this.src='https://placehold.co/80x80/cccccc/ffffff?text=Error';">
                    <div>
                        <h3 class="text-xl font-bold theme-text">${teacher.name}</h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm">${teacher.specialization || 'معلم تحفيظ'}</p>
                        <p class="text-gray-500 dark:text-gray-500 text-xs">${classCount} حلقة</p>
                    </div>
                </div>
                <div class="border-t dark:border-gray-700 p-2 flex justify-end gap-2">
                    <a href="#teacher-profile?id=${teacher.id}" class="text-sm text-blue-500 hover:underline">عرض الملف</a>
                    <button class="edit-teacher-btn p-1" data-id="${teacher.id}"><i data-lucide="edit" class="text-blue-500 w-4 h-4"></i></button>
                    <button class="delete-teacher-btn p-1" data-id="${teacher.id}"><i data-lucide="trash-2" class="text-red-500 w-4 h-4"></i></button>
                </div>
            </div>
        `;
    }
    gridContainer.innerHTML = gridHtml;
    
    renderIcons();

    gridContainer.querySelectorAll('.edit-teacher-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showTeacherModal(e.currentTarget.dataset.id));
    });
    gridContainer.querySelectorAll('.delete-teacher-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteTeacher(e.currentTarget.dataset.id));
    });
}

async function showTeacherModal(teacherId = null) {
    const teacher = teacherId ? await db.teachers.get(teacherId) : {};
    const title = teacherId ? 'تعديل بيانات معلم' : 'إضافة معلم جديد';

    const formContent = `
        <form id="teacher-form" class="space-y-4">
            <input type="hidden" id="teacher-id" value="${teacher.id || ''}">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block mb-1 text-sm">اسم المعلم</label>
                    <input type="text" id="teacher-name" value="${teacher.name || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required>
                </div>
                <div>
                    <label class="block mb-1 text-sm">التخصص</label>
                    <input type="text" id="teacher-specialization" value="${teacher.specialization || 'معلم قرآن كريم'}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div class="flex gap-2">
                    <div class="w-2/3">
                        <label class="block mb-1 text-sm">رقم الهاتف</label>
                        <input type="tel" id="teacher-phone" value="${teacher.phone || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    </div>
                    <div class="w-1/3">
                         <label class="block mb-1 text-sm">الرمز الدولي</label>
                        <select id="teacher-country-code" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            ${countryCodes.map(c => `<option value="${c.dial_code}" ${teacher.country_code === c.dial_code ? 'selected' : ''}>${c.name} (${c.dial_code})</option>`).join('')}
                        </select>
                    </div>
                </div>
                 <div>
                    <label class="block mb-1 text-sm">الراتب الشهري</label>
                    <input type="number" id="teacher-salary" value="${teacher.salary || ''}" min="0" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div class="md:col-span-2">
                    <label class="block mb-1 text-sm">المؤهلات (إجازات، قراءات)</label>
                    <textarea id="teacher-qualifications" rows="3" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">${teacher.qualifications || ''}</textarea>
                </div>
                 <div class="md:col-span-2">
                    <label class="block mb-1 text-sm">رابط الصورة الشخصية (اختياري)</label>
                    <input type="text" id="teacher-photo" value="${teacher.photo || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
            </div>
        </form>
    `;

    showModal(title, formContent, async () => {
        const teacherData = {
            id: document.getElementById('teacher-id').value,
            name: document.getElementById('teacher-name').value,
            specialization: document.getElementById('teacher-specialization').value,
            phone: document.getElementById('teacher-phone').value,
            country_code: document.getElementById('teacher-country-code').value,
            salary: parseFloat(document.getElementById('teacher-salary').value) || 0,
            qualifications: document.getElementById('teacher-qualifications').value,
            photo: document.getElementById('teacher-photo').value,
        };

        if (!teacherData.name) {
            showToast('الرجاء إدخال اسم المعلم.', 'error');
            return;
        }

        await saveData('teachers', teacherData);
        showToast(teacherId ? 'تم تحديث بيانات المعلم' : 'تم إضافة المعلم بنجاح', 'success');
        hideModal();
        await renderTeachersGrid();
    });
}

async function deleteTeacher(teacherId) {
    showConfirm('هل أنت متأكد من رغبتك في حذف هذا المعلم؟ سيتم إلغاء تعيينه من جميع الحلقات.', async () => {
        try {
            // Unassign teacher from any classes
            const assignedClasses = await db.classes.where('teacher_id').equals(teacherId).toArray();
            for (const cls of assignedClasses) {
                await db.classes.update(cls.id, { teacher_id: null });
            }
            
            await db.teachers.delete(teacherId);
            showToast('تم حذف المعلم بنجاح.', 'success');
            await renderTeachersGrid();
        } catch (error) {
            console.error('Failed to delete teacher:', error);
            showToast('فشل حذف المعلم.', 'error');
        }
    });
}
