// js/parent-portal.js
import { db } from './db.js';
import { showLoader, renderIcons } from './utils.js';
import { JUZ_DATA } from './quran-data.js';

export async function initParentPortal(container) {
    const students = await db.students.toArray();
    const classes = await db.classes.toArray();
    const classMap = new Map(classes.map(c => [c.id, c.name]));

    container.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 class="text-2xl font-semibold">بوابة أولياء الأمور</h2>
            <div class="w-full md:w-1/3 space-y-2">
                <input type="text" id="parent-portal-student-search" placeholder="ابحث عن طالب..." class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                <select id="parent-portal-student-select" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">-- اختر طالباً لعرض ملفه --</option>
                    ${students.map(s => `<option value="${s.id}">${s.name} (${classMap.get(s.class_id) || 'بلا حلقة'})</option>`).join('')}
                </select>
            </div>
        </div>
        <div id="parent-profile-container" class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <p class="text-center text-gray-500">الرجاء اختيار طالب لعرض التفاصيل.</p>
        </div>
    `;

    const studentSelect = document.getElementById('parent-portal-student-select');
    const studentSearch = document.getElementById('parent-portal-student-search');

    studentSelect.addEventListener('change', (e) => {
        renderStudentProfile(e.target.value);
    });

    studentSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        Array.from(studentSelect.options).forEach(option => {
            const studentName = option.textContent.toLowerCase();
            option.style.display = studentName.includes(searchTerm) ? '' : 'none';
        });
    });
}

async function renderStudentProfile(studentId) {
    const container = document.getElementById('parent-profile-container');
    if (!studentId) {
        container.innerHTML = `<p class="text-center text-gray-500">الرجاء اختيار طالب لعرض التفاصيل.</p>`;
        return;
    }

    showLoader(true);
    try {
        const student = await db.students.get(studentId);
        if (!student) {
            container.innerHTML = `<p class="text-center text-red-500">لم يتم العثور على الطالب.</p>`;
            return;
        }

        const studentClass = student.class_id ? await db.classes.get(student.class_id) : null;
        const studentPlan = student.plan_id ? await db.plans.get(student.plan_id) : null;
        const studentExams = await db.exams.where('student_id').equals(studentId).toArray();
        const studentAttendance = await db.attendance.where('student_id').equals(studentId).toArray();

        const totalMemorizedPages = await db.tasmee3.where('student_id').equals(studentId).count();
        const attendanceSummary = {
            present: studentAttendance.filter(a => a.status === 'present').length,
            absent: studentAttendance.filter(a => a.status === 'absent').length,
            late: studentAttendance.filter(a => a.status === 'late').length,
        };

        container.innerHTML = `
            <div class="flex flex-col md:flex-row items-center gap-6 mb-6 pb-6 border-b dark:border-gray-700">
                <div class="w-24 h-24 rounded-full theme-bg text-white flex items-center justify-center text-4xl font-bold">
                    ${student.name.charAt(0)}
                </div>
                <div>
                    <h3 class="text-3xl font-bold">${student.name}</h3>
                    <p class="text-gray-500">الحلقة: ${studentClass?.name || 'غير محدد'}</p>
                    <p class="text-gray-500">خطة الحفظ: ${studentPlan?.name || 'غير محدد'}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-2 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h4 class="text-lg font-semibold mb-4">تقدم الحفظ (إجمالي ${totalMemorizedPages} صفحة)</h4>
                    <div class="max-h-80 overflow-y-auto pr-2">
                        ${await renderMemorizationProgressForParent(student)}
                    </div>
                </div>

                <div class="space-y-6">
                    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 class="text-lg font-semibold mb-2">سجل الاختبارات</h4>
                        <div class="max-h-40 overflow-y-auto">
                            ${studentExams.length ? studentExams.map(e => {
                                const totalMark = e.exam_fields.reduce((sum, f) => sum + f.mark, 0);
                                return `
                                <div class="text-sm py-1 border-b dark:border-gray-600">
                                    <span class="font-semibold">${e.type || 'اختبار'}:</span>
                                    <span class="font-bold float-left">${e.score}/${totalMark}</span>
                                </div>`
                            }).join('') : '<p class="text-xs text-gray-500">لا توجد اختبارات مسجلة.</p>'}
                        </div>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                        <h4 class="text-lg font-semibold mb-2">ملخص الحضور</h4>
                        <p class="text-sm">حاضر: <span class="font-bold text-green-500">${attendanceSummary.present}</span></p>
                        <p class="text-sm">غائب: <span class="font-bold text-red-500">${attendanceSummary.absent}</span></p>
                        <p class="text-sm">متأخر: <span class="font-bold text-yellow-500">${attendanceSummary.late}</span></p>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("Error rendering parent profile:", error);
        container.innerHTML = `<p class="text-center text-red-500">حدث خطأ أثناء تحميل الملف الشخصي.</p>`;
    } finally {
        showLoader(false);
    }
}

async function renderMemorizationProgressForParent(student) {
    // Replaced random numbers with real database queries based on JUZ_DATA
    const memorizedPages = await db.tasmee3.where('student_id').equals(student.id).toArray();
    const memorizedPagesSet = new Set(memorizedPages.map(p => p.page_number));

    let gridHtml = '<div class="space-y-3">';
    JUZ_DATA.forEach(juz => {
        const totalPagesInJuz = (juz.endPage - juz.startPage + 1);
        let memorizedCountInJuz = 0;
        for (let i = juz.startPage; i <= juz.endPage; i++) {
            if (memorizedPagesSet.has(i)) {
                memorizedCountInJuz++;
            }
        }
        const percentage = totalPagesInJuz > 0 ? (memorizedCountInJuz / totalPagesInJuz) * 100 : 0;
        gridHtml += `
            <div>
                <div class="flex justify-between text-sm mb-1">
                    <span>الجزء ${juz.juz}</span>
                    <span>${memorizedCountInJuz}/${totalPagesInJuz}</span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div class="theme-bg h-2.5 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
    gridHtml += '</div>';
    return gridHtml;
}