// js/exams.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showModal, hideModal, showToast, renderIcons, showConfirm } from './utils.js';

let studentsCache = [];
let classesCache = [];
let settingsCache = {};

// --- Main Initialization ---
export async function initExams(container) {
    classesCache = await db.classes.toArray();
    settingsCache = await getSettings();
    
    container.innerHTML = `
        <div id="exams-main-view"></div>
    `;
    
    await renderClassSelectionView();
}

// --- View 1: Class Selection ---
async function renderClassSelectionView() {
    const container = document.getElementById('exams-main-view');
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">الاختبارات: اختر حلقة</h2>
        </div>
        <div id="exam-classes-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${classesCache.map(cls => `
                <div class="class-selection-card bg-white dark:bg-gray-800 p-6 rounded-lg shadow cursor-pointer hover:shadow-lg transition-shadow" data-class-id="${cls.id}">
                    <h3 class="text-xl font-bold theme-text">${cls.name}</h3>
                </div>
            `).join('')}
        </div>
    `;

    document.querySelectorAll('.class-selection-card').forEach(card => {
        card.addEventListener('click', (e) => {
            renderStudentListView(e.currentTarget.dataset.classId);
        });
    });
}

// --- View 2: Student List for a Class ---
async function renderStudentListView(classId) {
    const container = document.getElementById('exams-main-view');
    const selectedClass = classesCache.find(c => c.id === classId);
    const studentsInClass = await db.students.where('class_id').equals(classId).toArray();
    const today = new Date().toISOString().slice(0, 10);
    const examsToday = await db.exams.where('date').equals(today).toArray();
    const testedStudentIds = new Set(examsToday.map(e => e.student_id));

    container.innerHTML = `
        <div class="flex items-center mb-6">
            <button id="back-to-classes-btn" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i data-lucide="arrow-right"></i></button>
            <h2 class="text-2xl font-semibold mr-4">اختر طالباً من حلقة: ${selectedClass.name}</h2>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${studentsInClass.map(student => `
                    <div class="student-selection-card flex justify-between items-center p-4 border dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" data-student-id="${student.id}">
                        <span class="font-semibold">${student.name}</span>
                        ${testedStudentIds.has(student.id) ? 
                            '<span class="text-xs text-green-500 flex items-center"><i data-lucide="check-circle" class="w-4 h-4 ml-1"></i> تم اختباره اليوم</span>' : 
                            '<span class="text-xs text-gray-400">لم يتم اختباره</span>'
                        }
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    renderIcons();

    document.getElementById('back-to-classes-btn').addEventListener('click', renderClassSelectionView);
    document.querySelectorAll('.student-selection-card').forEach(card => {
        card.addEventListener('click', (e) => {
            renderStudentExamProfile(e.currentTarget.dataset.studentId, classId);
        });
    });
}

// --- View 3: Student's Exam Profile ---
async function renderStudentExamProfile(studentId, classId) {
    const container = document.getElementById('exams-main-view');
    const student = await db.students.get(studentId);
    const studentExams = await db.exams.where('student_id').equals(studentId).toArray();
    const totalMemorizedPages = await db.tasmee3.where('student_id').equals(studentId).count();

    container.innerHTML = `
        <div class="flex items-center mb-6">
            <button id="back-to-students-btn" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i data-lucide="arrow-right"></i></button>
            <h2 class="text-2xl font-semibold mr-4">الملف الاختباري: ${student.name}</h2>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-1 space-y-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <h3 class="text-lg text-gray-500">تقدم الحفظ</h3>
                    <p class="text-3xl font-bold theme-text">${totalMemorizedPages} صفحة</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow text-center">
                    <button id="start-test-btn" class="w-full theme-bg text-white px-4 py-3 rounded-lg flex items-center justify-center text-lg">
                        <i data-lucide="file-plus-2" class="mr-2"></i> ابدأ اختبار جديد
                    </button>
                </div>
            </div>
            <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-xl font-bold mb-4">سجل الاختبارات السابق</h3>
                <div class="max-h-96 overflow-y-auto">
                    ${studentExams.length ? studentExams.map(exam => {
                        const totalMark = exam.exam_fields.reduce((sum, field) => sum + field.mark, 0);
                        return `
                            <div class="py-2 border-b dark:border-gray-700 last:border-b-0">
                                <div class="flex justify-between">
                                    <span class="font-semibold">${exam.type}</span>
                                    <span class="font-bold">${exam.score} / ${totalMark}</span>
                                </div>
                                <div class="text-xs text-gray-500">${new Date(exam.date).toLocaleDateString('ar-EG')}</div>
                            </div>
                        `;
                    }).join('') : '<p class="text-sm text-gray-500">لا توجد اختبارات مسجلة.</p>'}
                </div>
            </div>
        </div>
    `;
    renderIcons();

    document.getElementById('back-to-students-btn').addEventListener('click', () => renderStudentListView(classId));
    document.getElementById('start-test-btn').addEventListener('click', () => showExamModal(null, studentId));
}


// --- Modal for Adding/Editing Exam ---
async function showExamModal(examId = null, studentId = null) {
    const exam = examId ? await db.exams.get(examId) : {};
    const student = studentId ? await db.students.get(studentId) : (examId ? await db.students.get(exam.student_id) : {});
    
    const title = 'إضافة نتيجة اختبار';
    const examFields = settingsCache.examFields;

    const formContent = `
        <form id="exam-form" class="space-y-4">
            <input type="hidden" id="exam-id" value="${exam.id || ''}">
            <input type="hidden" id="exam-student-id" value="${student.id || ''}">
            <div class="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <label class="block text-sm">الطالب</label>
                <p class="font-bold text-lg">${student.name}</p>
            </div>
            <div>
                <label class="block mb-1 text-sm">نوع الاختبار</label>
                <input type="text" id="exam-type" value="${exam.type || 'اختبار شهري'}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
            <hr class="dark:border-gray-600">
            <h4 class="font-semibold">إدخال الدرجات</h4>
            <div id="custom-exam-fields" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${examFields.map(field => `
                    <div>
                        <label class="block mb-1 text-sm">${field.name} (من ${field.mark})</label>
                        <input type="number" class="exam-score-field w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                               data-field-name="${field.name}" 
                               max="${field.mark}" 
                               min="0"
                               value="${exam.scores?.[field.name] || ''}"
                               required>
                    </div>
                `).join('')}
            </div>
        </form>
    `;
    
    showModal(title, formContent, async () => {
        const scores = {};
        let totalScore = 0;
        let isValid = true;

        document.querySelectorAll('.exam-score-field').forEach(field => {
            const fieldName = field.dataset.fieldName;
            const maxMark = parseInt(field.max);
            const value = parseInt(field.value);
            if (isNaN(value) || value < 0 || value > maxMark) {
                isValid = false;
            }
            scores[fieldName] = value;
            totalScore += value;
        });

        if (!isValid) {
            showToast('الرجاء إدخال درجات صالحة لجميع الحقول.', 'error');
            return;
        }

        const examData = {
            id: document.getElementById('exam-id').value,
            student_id: document.getElementById('exam-student-id').value,
            type: document.getElementById('exam-type').value,
            date: exam.date || new Date().toISOString().slice(0, 10),
            scores: scores,
            score: totalScore,
            exam_fields: examFields
        };

        if (!examData.student_id) {
            showToast('خطأ: لم يتم تحديد الطالب.', 'error');
            return;
        }

        await saveData('exams', examData);
        showToast(examId ? 'تم تحديث الاختبار بنجاح' : 'تم إضافة الاختبار بنجاح', 'success');
        hideModal();
        // Refresh the student list view to show the new status
        const studentForRefresh = await db.students.get(examData.student_id);
        if (studentForRefresh) {
            renderStudentListView(studentForRefresh.class_id);
        }
    });
}

// --- Utility Functions ---
async function getSettings() {
    let settings = await db.settings.get('userSettings');
    if (!settings) {
        settings = { examFields: [], passingScore: 50 }; // Default fallback
    }
    return settings;
}
