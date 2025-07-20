// js/tasmee3.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showToast, renderIcons } from './utils.js';

let classesCache = [];

// Accurate Quran data: Surah number, Arabic name, and page count
const QURAN_DATA = [
    {sura: 1, name: 'الفاتحة', pages: 1}, {sura: 2, name: 'البقرة', pages: 48}, {sura: 3, name: 'آل عمران', pages: 27},
    {sura: 4, name: 'النساء', pages: 29}, {sura: 5, name: 'المائدة', pages: 24}, {sura: 6, name: 'الأنعام', pages: 27},
    {sura: 7, name: 'الأعراف', pages: 31}, {sura: 8, name: 'الأنفال', pages: 12}, {sura: 9, name: 'التوبة', pages: 21},
    {sura: 10, name: 'يونس', pages: 18}, {sura: 11, name: 'هود', pages: 18}, {sura: 12, name: 'يوسف', pages: 18},
    {sura: 13, name: 'الرعد', pages: 9}, {sura: 14, name: 'ابراهيم', pages: 9}, {sura: 15, name: 'الحجر', pages: 8},
    {sura: 16, name: 'النحل', pages: 20}, {sura: 17, name: 'الإسراء', pages: 16}, {sura: 18, name: 'الكهف', pages: 16},
    {sura: 19, name: 'مريم', pages: 11}, {sura: 20, name: 'طه', pages: 16}, {sura: 21, name: 'الأنبياء', pages: 14},
    {sura: 22, name: 'الحج', pages: 14}, {sura: 23, name: 'المؤمنون', pages: 12}, {sura: 24, name: 'النور', pages: 16},
    {sura: 25, name: 'الفرقان', pages: 11}, {sura: 26, name: 'الشعراء', pages: 15}, {sura: 27, name: 'النمل', pages: 12},
    {sura: 28, name: 'القصص', pages: 16}, {sura: 29, name: 'العنكبوت', pages: 12}, {sura: 30, name: 'الروم', pages: 10},
    {sura: 31, name: 'لقمان', pages: 7}, {sura: 32, name: 'السجدة', pages: 5}, {sura: 33, name: 'الأحزاب', pages: 15},
    {sura: 34, name: 'سبأ', pages: 11}, {sura: 35, name: 'فاطر', pages: 9}, {sura: 36, name: 'يس', pages: 9},
    {sura: 37, name: 'الصافات', pages: 10}, {sura: 38, name: 'ص', pages: 8}, {sura: 39, name: 'الزمر', pages: 14},
    {sura: 40, name: 'غافر', pages: 15}, {sura: 41, name: 'فصلت', pages: 10}, {sura: 42, name: 'الشورى', pages: 11},
    {sura: 43, name: 'الزخرف', pages: 10}, {sura: 44, name: 'الدخان', pages: 6}, {sura: 45, name: 'الجاثية', pages: 7},
    {sura: 46, name: 'الأحقاف', pages: 8}, {sura: 47, name: 'محمد', pages: 7}, {sura: 48, name: 'الفتح', pages: 7},
    {sura: 49, name: 'الحجرات', pages: 4}, {sura: 50, name: 'ق', pages: 4}, {sura: 51, name: 'الذاريات', pages: 4},
    {sura: 52, name: 'الطور', pages: 4}, {sura: 53, name: 'النجم', pages: 4}, {sura: 54, name: 'القمر', pages: 5},
    {sura: 55, name: 'الرحمن', pages: 5}, {sura: 56, name: 'الواقعة', pages: 5}, {sura: 57, name: 'الحديد', pages: 7},
    {sura: 58, name: 'المجادلة', pages: 5}, {sura: 59, name: 'الحشر', pages: 5}, {sura: 60, name: 'الممتحنة', pages: 4},
    {sura: 61, name: 'الصف', pages: 3}, {sura: 62, name: 'الجمعة', pages: 2}, {sura: 63, name: 'المنافقون', pages: 2},
    {sura: 64, name: 'التغابن', pages: 3}, {sura: 65, name: 'الطلاق', pages: 3}, {sura: 66, name: 'التحريم', pages: 3},
    {sura: 67, name: 'الملك', pages: 4}, {sura: 68, name: 'القلم', pages: 4}, {sura: 69, name: 'الحاقة', pages: 3},
    {sura: 70, name: 'المعارج', pages: 3}, {sura: 71, name: 'نوح', pages: 3}, {sura: 72, name: 'الجن', pages: 3},
    {sura: 73, name: 'المزمل', pages: 3}, {sura: 74, name: 'المدثر', pages: 3}, {sura: 75, name: 'القيامة', pages: 2},
    {sura: 76, name: ' الانسان', pages: 3}, {sura: 77, name: 'المرسلات', pages: 3}, {sura: 78, name: 'النبأ', pages: 2},
    {sura: 79, name: 'النازعات', pages: 2}, {sura: 80, name: 'عبس', pages: 2}, {sura: 81, name: 'التكوير', pages: 1},
    {sura: 82, name: 'الانفطار', pages: 1}, {sura: 83, name: 'المطففين', pages: 2}, {sura: 84, name: 'الانشقاق', pages: 2},
    {sura: 85, name: 'البروج', pages: 1}, {sura: 86, name: 'الطارق', pages: 1}, {sura: 87, name: 'الأعلى', pages: 1},
    {sura: 88, name: 'الغاشية', pages: 1}, {sura: 89, name: 'الفجر', pages: 2}, {sura: 90, name: 'البلد', pages: 1},
    {sura: 91, name: 'الشمس', pages: 1}, {sura: 92, name: 'الليل', pages: 1}, {sura: 93, name: 'الضحى', pages: 1},
    {sura: 94, name: 'الشرح', pages: 1}, {sura: 95, name: 'التين', pages: 1}, {sura: 96, name: 'العلق', pages: 1},
    {sura: 97, name: 'القدر', pages: 1}, {sura: 98, name: 'البينة', pages: 1}, {sura: 99, name: 'الزلزلة', pages: 1},
    {sura: 100, name: 'العاديات', pages: 1}, {sura: 101, name: 'القارعة', pages: 1}, {sura: 102, name: 'التكاثر', pages: 1},
    {sura: 103, name: 'العصر', pages: 1}, {sura: 104, name: 'الهمزة', pages: 1}, {sura: 105, name: 'الفيل', pages: 1},
    {sura: 106, name: 'قريش', pages: 1}, {sura: 107, name: 'الماعون', pages: 1}, {sura: 108, name: 'الكوثر', pages: 1},
    {sura: 109, name: 'الكافرون', pages: 1}, {sura: 110, name: 'النصر', pages: 1}, {sura: 111, name: 'المسد', pages: 1},
    {sura: 112, name: 'الإخلاص', pages: 1}, {sura: 113, name: 'الفلق', pages: 1}, {sura: 114, name: 'الناس', pages: 1}
];

// --- Main Initialization ---
export async function initTasmee3(container) {
    classesCache = await db.classes.toArray();
    container.innerHTML = `<div id="tasmee3-main-view"></div>`;
    await renderClassSelectionView();
}

// --- View 1: Class Selection ---
async function renderClassSelectionView() {
    const container = document.getElementById('tasmee3-main-view');
    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">التسميع: اختر حلقة</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    const container = document.getElementById('tasmee3-main-view');
    const selectedClass = classesCache.find(c => c.id === classId);
    const studentsInClass = await db.students.where('class_id').equals(classId).toArray();
    const today = new Date().toISOString().slice(0, 10);
    const tasmee3Today = await db.tasmee3.where('timestamp').startsWith(today).toArray();
    const reviewedStudentIds = new Set(tasmee3Today.map(t => t.student_id));

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
                        ${reviewedStudentIds.has(student.id) ? 
                            '<span class="text-xs text-green-500 flex items-center"><i data-lucide="check-circle" class="w-4 h-4 ml-1"></i> تم التسميع اليوم</span>' : 
                            '<span class="text-xs text-gray-400">لم يسمّع</span>'
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
            renderStudentTasmee3Profile(e.currentTarget.dataset.studentId, classId);
        });
    });
}

// --- View 3: Student's Tasmee3 Profile ---
async function renderStudentTasmee3Profile(studentId, classId) {
    const container = document.getElementById('tasmee3-main-view');
    const student = await db.students.get(studentId);

    const memorizedPages = await db.tasmee3.where('student_id').equals(studentId).toArray();
    const memorizedSet = new Set(memorizedPages.map(p => `${p.sura}-${p.page}`));

    let gridHtml = '<div class="space-y-6">';
    QURAN_DATA.forEach(sura => {
        gridHtml += `
            <div>
                <h3 class="font-semibold mb-2 text-lg">${sura.sura}. ${sura.name}</h3>
                <div class="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1 text-xs">
                    ${Array.from({ length: sura.pages }, (_, i) => i + 1).map(page => `
                        <div class="page-square w-8 h-8 flex items-center justify-center rounded border cursor-pointer 
                            ${memorizedSet.has(`${sura.sura}-${page}`) ? 'theme-bg text-white' : 'bg-gray-200 dark:bg-gray-600'}"
                            data-student-id="${studentId}" data-sura="${sura.sura}" data-page="${page}"
                            title="صفحة ${page}">
                            ${page}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    gridHtml += '</div>';

    container.innerHTML = `
        <div class="flex items-center mb-6">
            <button id="back-to-students-btn" class="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"><i data-lucide="arrow-right"></i></button>
            <h2 class="text-2xl font-semibold mr-4">متابعة الحفظ للطالب: ${student.name}</h2>
        </div>
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            ${gridHtml}
        </div>
    `;

    renderIcons();

    document.getElementById('back-to-students-btn').addEventListener('click', () => renderStudentListView(classId));
    container.querySelectorAll('.page-square').forEach(square => {
        square.addEventListener('click', toggleMemorizationStatus);
    });
}

async function toggleMemorizationStatus(event) {
    const square = event.currentTarget;
    const { studentId, sura, page } = square.dataset;

    const record = {
        student_id: studentId,
        sura: parseInt(sura),
        page: parseInt(page),
        timestamp: new Date().toISOString()
    };

    const isMemorized = square.classList.contains('theme-bg');

    try {
        if (isMemorized) {
            // Unmark as memorized - delete the record
            const recordsToDelete = await db.tasmee3.where({
                student_id: studentId,
                sura: record.sura,
                page: record.page
            }).toArray();

            if(recordsToDelete.length > 0) {
                 await db.tasmee3.bulkDelete(recordsToDelete.map(r => r.id));
            }
           
            square.classList.remove('theme-bg', 'text-white');
            square.classList.add('bg-gray-200', 'dark:bg-gray-600');
            showToast('تم تحديث حالة الصفحة', 'info');
        } else {
            // Mark as memorized - add the record
            await saveData('tasmee3', record);
            square.classList.add('theme-bg', 'text-white');
            square.classList.remove('bg-gray-200', 'dark:bg-gray-600');
            showToast('تم تسجيل حفظ الصفحة بنجاح', 'success');
        }
    } catch (error) {
        console.error("Failed to update tasmee3 status:", error);
        showToast('فشل تحديث الحالة', 'error');
    }
}
