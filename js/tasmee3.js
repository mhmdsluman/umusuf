// js/tasmee3.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showToast, renderIcons } from './utils.js';
import { SURA_DATA } from './quran-data.js';

let classesCache = [];

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

    // Use page_number for correct lookup
    const memorizedPages = await db.tasmee3.where('student_id').equals(studentId).toArray();
    const memorizedPageNumbers = new Set(memorizedPages.map(p => p.page_number));

    let gridHtml = '<div class="space-y-6">';
    SURA_DATA.forEach(sura => {
        const startPage = sura.startPage;
        const nextPageSura = SURA_DATA.find(s => s.sura === sura.sura + 1);
        const endPage = nextPageSura ? nextPageSura.startPage - 1 : 604;
        const pageCount = endPage - startPage + 1;
        
        gridHtml += `
            <div>
                <h3 class="font-semibold mb-2 text-lg">${sura.sura}. ${sura.name}</h3>
                <div class="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1 text-xs">
                    ${Array.from({ length: pageCount }, (_, i) => i + startPage).map(pageNumber => `
                        <div class="page-square w-8 h-8 flex items-center justify-center rounded border cursor-pointer 
                            ${memorizedPageNumbers.has(pageNumber) ? 'theme-bg text-white' : 'bg-gray-200 dark:bg-gray-600'}"
                            data-student-id="${studentId}" data-page="${pageNumber}"
                            title="صفحة ${pageNumber}">
                            ${pageNumber}
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
    const { studentId, page } = square.dataset;
    const pageNumber = parseInt(page);

    const record = {
        student_id: studentId,
        page_number: pageNumber,
        timestamp: new Date().toISOString()
    };

    const isMemorized = square.classList.contains('theme-bg');

    try {
        if (isMemorized) {
            // Unmark as memorized - delete the record
            const recordsToDelete = await db.tasmee3.where({
                student_id: studentId,
                page_number: pageNumber
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