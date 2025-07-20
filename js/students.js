// js/students.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showModal, hideModal, showToast, renderIcons, showConfirm } from './utils.js';
import { countryCodes } from './countries.js'; // Import the country codes

let classesCache = [];
let plansCache = [];

export async function initStudents(container) {
    // Cache classes and plans for dropdowns
    classesCache = await db.classes.toArray();
    plansCache = await db.plans.toArray();

    container.innerHTML = `
        <div class="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h2 class="text-2xl font-semibold">قائمة الطلاب</h2>
            <button id="add-student-btn" class="theme-bg text-white px-4 py-2 rounded-lg flex items-center">
                <i data-lucide="plus" class="mr-2"></i> إضافة طالب جديد
            </button>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <!-- Filters and Bulk Actions -->
            <div class="flex flex-wrap gap-4 items-center mb-4">
                <input type="text" id="student-search" placeholder="ابحث عن طالب..." class="flex-grow p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <select id="class-filter" class="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">كل الحلقات</option>
                    ${classesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
                <button id="bulk-assign-class-btn" class="bg-blue-500 text-white px-3 py-2 rounded-lg text-sm flex items-center">
                    <i data-lucide="users" class="mr-2 w-4 h-4"></i> تعيين لفصل
                </button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-right">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="p-3 text-center"><input type="checkbox" id="select-all-students"></th>
                            <th class="p-3">الاسم</th>
                            <th class="p-3">الحلقة</th>
                            <th class="p-3">الصفحات المحفوظة</th>
                            <th class="p-3">العمر</th>
                            <th class="p-3">الجنس</th>
                            <th class="p-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="students-table-body">
                        <!-- Student rows will be inserted here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Handle incoming filter from URL
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const classIdFromUrl = params.get('class_id');
    if (classIdFromUrl) {
        document.getElementById('class-filter').value = classIdFromUrl;
    }

    document.getElementById('add-student-btn').addEventListener('click', () => showStudentModal());
    document.getElementById('student-search').addEventListener('input', renderStudentsTable);
    document.getElementById('class-filter').addEventListener('change', renderStudentsTable);
    document.getElementById('select-all-students').addEventListener('change', toggleAllStudentCheckboxes);
    document.getElementById('bulk-assign-class-btn').addEventListener('click', showBulkAssignClassModal);

    renderIcons();
    await renderStudentsTable();
}

async function renderStudentsTable() {
    const searchInput = document.getElementById('student-search').value.toLowerCase();
    const classFilter = document.getElementById('class-filter').value;

    let query = db.students;
    if (classFilter) {
        query = query.where('class_id').equals(classFilter);
    }
    
    let students = await query.toArray();

    if (searchInput) {
        students = students.filter(s => s.name.toLowerCase().includes(searchInput));
    }

    const tableBody = document.getElementById('students-table-body');
    if (!tableBody) return;
    
    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" class="text-center p-4 text-gray-500">لا يوجد طلاب لعرضهم.</td></tr>`;
        return;
    }

    let tableHtml = '';
    for (const student of students) {
        const className = classesCache.find(c => c.id === student.class_id)?.name || 'غير محدد';
        const pagesMemorized = await db.tasmee3.where('student_id').equals(student.id).count();
        tableHtml += `
            <tr class="border-b dark:border-gray-700">
                <td class="p-3 text-center"><input type="checkbox" class="student-checkbox" data-id="${student.id}"></td>
                <td class="p-3 font-semibold">
                    <a href="#student-profile?id=${student.id}" class="text-blue-600 hover:underline">${student.name}</a>
                </td>
                <td class="p-3">${className}</td>
                <td class="p-3">${pagesMemorized}</td>
                <td class="p-3">${student.age || '-'}</td>
                <td class="p-3">${student.sex === 'male' ? 'ذكر' : student.sex === 'female' ? 'أنثى' : '-'}</td>
                <td class="p-3">
                    <button class="edit-student-btn" data-id="${student.id}"><i data-lucide="edit" class="text-blue-500"></i></button>
                    <button class="delete-student-btn" data-id="${student.id}"><i data-lucide="trash-2" class="text-red-500"></i></button>
                </td>
            </tr>
        `;
    }
    tableBody.innerHTML = tableHtml;

    renderIcons();
    
    tableBody.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showStudentModal(e.currentTarget.dataset.id));
    });
    tableBody.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteStudent(e.currentTarget.dataset.id));
    });
}

async function showStudentModal(studentId = null) {
    const student = studentId ? await db.students.get(studentId) : {};
    const title = studentId ? 'تعديل بيانات طالب' : 'إضافة طالب جديد';

    const formContent = `
        <form id="student-form" class="space-y-4">
            <input type="hidden" id="student-id" value="${student.id || ''}">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block mb-1 text-sm">اسم الطالب</label>
                    <input type="text" id="student-name" value="${student.name || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required>
                </div>
                <div>
                    <label class="block mb-1 text-sm">الجنس</label>
                    <select id="student-sex" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="male" ${student.sex === 'male' ? 'selected' : ''}>ذكر</option>
                        <option value="female" ${student.sex === 'female' ? 'selected' : ''}>أنثى</option>
                    </select>
                </div>
                <div>
                    <label class="block mb-1 text-sm">العمر</label>
                    <input type="number" id="student-age" value="${student.age || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div>
                    <label class="block mb-1 text-sm">اسم ولي الأمر</label>
                    <input type="text" id="student-guardian" value="${student.guardian_name || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
                 <div class="flex gap-2">
                    <div class="w-2/3">
                        <label class="block mb-1 text-sm">رقم ولي الأمر</label>
                        <input type="tel" id="student-phone" value="${student.phone || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    </div>
                    <div class="w-1/3">
                         <label class="block mb-1 text-sm">الرمز الدولي</label>
                        <select id="student-country-code" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            ${countryCodes.map(c => `<option value="${c.dial_code}" ${student.country_code === c.dial_code ? 'selected' : ''}>${c.name} (${c.dial_code})</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block mb-1 text-sm">الحلقة</label>
                    <select id="student-class" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="">-- اختر حلقة --</option>
                        ${classesCache.map(c => `<option value="${c.id}" ${student.class_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block mb-1 text-sm">خطة الحفظ</label>
                    <select id="student-plan" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        <option value="">-- اختر خطة --</option>
                        ${plansCache.map(p => `<option value="${p.id}" ${student.plan_id === p.id ? 'selected' : ''}>${p.name}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block mb-1 text-sm">يبدأ من جزء</label>
                    <input type="number" id="student-juz-start" value="${student.juz_start || '1'}" min="1" max="30" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div class="md:col-span-2">
                    <label class="block mb-1 text-sm">ملاحظات</label>
                    <textarea id="student-notes" rows="3" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">${student.notes || ''}</textarea>
                </div>
            </div>
        </form>
    `;

    showModal(title, formContent, async () => {
        const studentData = {
            id: document.getElementById('student-id').value,
            name: document.getElementById('student-name').value,
            sex: document.getElementById('student-sex').value,
            age: parseInt(document.getElementById('student-age').value) || null,
            guardian_name: document.getElementById('student-guardian').value,
            phone: document.getElementById('student-phone').value,
            country_code: document.getElementById('student-country-code').value,
            class_id: document.getElementById('student-class').value || null,
            plan_id: document.getElementById('student-plan').value || null,
            juz_start: parseInt(document.getElementById('student-juz-start').value) || 1,
            notes: document.getElementById('student-notes').value,
            join_date: student.join_date || new Date().toISOString().slice(0, 10),
        };

        if (!studentData.name) {
            showToast('الرجاء إدخال اسم الطالب.', 'error');
            return;
        }

        await saveData('students', studentData);
        showToast(studentId ? 'تم تحديث الطالب بنجاح' : 'تم إضافة الطالب بنجاح', 'success');
        hideModal();
        await renderStudentsTable();
    });
}

async function deleteStudent(studentId) {
    showConfirm('هل أنت متأكد من رغبتك في حذف هذا الطالب؟ سيتم حذف جميع سجلاته المرتبطة.', async () => {
        try {
            await db.students.delete(studentId);
            await db.attendance.where('student_id').equals(studentId).delete();
            await db.exams.where('student_id').equals(studentId).delete();
            await db.tasmee3.where('student_id').equals(studentId).delete();
            
            showToast('تم حذف الطالب بنجاح', 'success');
            await renderStudentsTable();
        } catch (error) {
            console.error('Failed to delete student:', error);
            showToast('فشل حذف الطالب', 'error');
        }
    });
}

function toggleAllStudentCheckboxes(event) {
    document.querySelectorAll('.student-checkbox').forEach(checkbox => {
        checkbox.checked = event.target.checked;
    });
}

function showBulkAssignClassModal() {
    const selectedStudents = document.querySelectorAll('.student-checkbox:checked');
    if (selectedStudents.length === 0) {
        showToast('الرجاء تحديد طالب واحد على الأقل.', 'error');
        return;
    }

    const formContent = `
        <div class="space-y-4">
            <p>سيتم تعيين ${selectedStudents.length} طالب إلى الفصل المحدد.</p>
            <div>
                <label for="bulk-assign-class-select" class="block mb-2">اختر الفصل</label>
                <select id="bulk-assign-class-select" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">-- اختر حلقة --</option>
                    ${classesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
            </div>
        </div>
    `;

    showModal('تعيين فصل للطلاب', formContent, async () => {
        const classId = document.getElementById('bulk-assign-class-select').value;
        if (!classId) {
            showToast('الرجاء اختيار فصل.', 'error');
            return;
        }

        const studentIds = Array.from(selectedStudents).map(cb => cb.dataset.id);
        for (const studentId of studentIds) {
            await db.students.update(studentId, { class_id: classId });
        }

        showToast(`تم تعيين ${studentIds.length} طالب للفصل بنجاح.`, 'success');
        hideModal();
        await renderStudentsTable();
    });
}
