// js/student-profile.js
import { db } from './db.js';
import { showLoader, renderIcons } from './utils.js';
import { JUZ_DATA, SURA_DATA } from './quran-data.js';

export async function initStudentProfile(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const studentId = params.get('id');

    if (!studentId) {
        container.innerHTML = `<p class="text-center text-red-500">لم يتم تحديد هوية الطالب.</p>`;
        return;
    }

    showLoader(true);
    try {
        const student = await db.students.get(studentId);
        if (!student) {
            container.innerHTML = `<p class="text-center text-red-500">الطالب غير موجود.</p>`;
            return;
        }

        const studentClass = student.class_id ? await db.classes.get(student.class_id) : null;
        const studentPlan = student.plan_id ? await db.plans.get(student.plan_id) : null;
        const studentExams = await db.exams.where('student_id').equals(studentId).toArray();
        const memorizedPages = await db.tasmee3.where('student_id').equals(studentId).toArray();
        const totalMemorizedPages = memorizedPages.length;
        const settings = await db.settings.get('userSettings') || {};

        let teacherName = 'غير محدد';
        if (studentClass && studentClass.teacher_id) {
            const teacher = await db.teachers.get(studentClass.teacher_id);
            teacherName = teacher?.name || 'غير محدد';
        }

        const profileColor = student.sex === 'female' ? 'bg-pink-500' : 'bg-blue-500';
        
        let contactButtons = '';
        if (student.phone && student.country_code) {
            let phoneNumber = student.phone.startsWith('0') ? student.phone.substring(1) : student.phone;
            const fullNumber = `${student.country_code.replace('+', '')}${phoneNumber}`;
            contactButtons = `
                <div class="flex justify-center md:justify-start gap-2 mt-4">
                    <a href="https://wa.me/${fullNumber}" target="_blank" class="bg-green-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                        <i data-lucide="message-circle" class="w-4 h-4"></i> WhatsApp
                    </a>
                    <a href="https://t.me/+${fullNumber}" target="_blank" class="bg-sky-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                        <i data-lucide="send" class="w-4 h-4"></i> Telegram
                    </a>
                </div>
            `;
        }


        container.innerHTML = `
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
                <div class="flex flex-col md:flex-row items-center gap-6">
                    <div class="w-24 h-24 rounded-full ${profileColor} text-white flex items-center justify-center text-4xl font-bold flex-shrink-0">
                        ${student.name.charAt(0)}
                    </div>
                    <div class="text-center md:text-right">
                        <h2 class="text-3xl font-bold">${student.name}</h2>
                        <p class="text-gray-500 dark:text-gray-400">الحلقة: ${studentClass?.name || 'غير محدد'}</p>
                        <p class="text-gray-500 dark:text-gray-400">اسم المعلم: ${teacherName}</p>
                        <p class="text-gray-500 dark:text-gray-400">خطة الحفظ: ${studentPlan?.name || 'غير محدد'}</p>
                        ${contactButtons}
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
                    <h4 class="text-lg text-gray-500">الصفحات المحفوظة</h4>
                    <p class="text-2xl font-bold theme-text">${totalMemorizedPages}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
                    <h4 class="text-lg text-gray-500">متوسط الدرجات</h4>
                    <p class="text-2xl font-bold theme-text">${calculateAverageScore(studentExams, settings.passingScore)}%</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow text-center">
                    <h4 class="text-lg text-gray-500">الترتيب في الحلقة</h4>
                    <p class="text-2xl font-bold theme-text">#${await calculateRank(student, studentClass?.id)}</p>
                </div>
            </div>
            
            <div class="flex justify-end gap-4 mb-6">
                <button id="print-progress-report-btn" class="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center"><i data-lucide="printer" class="mr-2"></i> طباعة تقرير التقدم</button>
                <button id="print-exams-report-btn" class="bg-purple-500 text-white px-4 py-2 rounded-lg flex items-center"><i data-lucide="file-text" class="mr-2"></i> طباعة تقرير الاختبارات</button>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-semibold mb-4">المعلومات الشخصية</h3>
                    <div class="space-y-2 text-sm">
                        <p><strong>الجنس:</strong> ${student.sex === 'male' ? 'ذكر' : 'أنثى'}</p>
                        <p><strong>العمر:</strong> ${student.age || 'غير محدد'}</p>
                        <p><strong>ولي الأمر:</strong> ${student.guardian_name || 'غير محدد'}</p>
                        <p><strong>رقم الهاتف:</strong> ${student.country_code || ''} ${student.phone || 'غير محدد'}</p>
                        <p><strong>تاريخ الانضمام:</strong> ${new Date(student.join_date).toLocaleDateString('ar-EG')}</p>
                        <p><strong>يبدأ من جزء:</strong> ${student.juz_start || '1'}</p>
                        <p><strong>ملاحظات:</strong> ${student.notes || 'لا يوجد'}</p>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-semibold mb-4">سجل الاختبارات</h3>
                    <div class="max-h-60 overflow-y-auto">
                        ${renderExamsList(studentExams)}
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-semibold mb-4">ملخص الحضور (الشهر الحالي)</h3>
                    ${await renderAttendanceSummary(student.id)}
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-semibold mb-4">الحالة المالية (الشهر الحالي)</h3>
                    ${await renderFinancialSummary(student, studentClass)}
                </div>
            </div>
            
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-xl font-semibold mb-4">تقدم الحفظ التفصيلي</h3>
                <div class="max-h-96 overflow-y-auto pr-2">
                    ${renderMemorizationProgress(memorizedPages)}
                </div>
            </div>
        `;
        renderIcons();
        document.getElementById('print-progress-report-btn').addEventListener('click', () => printProgressReport(studentId));
        document.getElementById('print-exams-report-btn').addEventListener('click', () => printExamsReport(studentId));

    } catch (error) {
        console.error("Failed to render student profile:", error);
        container.innerHTML = `<p class="text-center text-red-500">حدث خطأ أثناء تحميل ملف الطالب.</p>`;
    } finally {
        showLoader(false);
    }
}

// ... (other functions remain the same)

async function printProgressReport(studentId) {
    showLoader(true);
    const student = await db.students.get(studentId);
    const studentClass = student.class_id ? await db.classes.get(student.class_id) : null;
    const memorizedPages = await db.tasmee3.where('student_id').equals(studentId).toArray();
    const totalMemorizedPages = memorizedPages.length;
    
    const reportHtml = `
        <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 24px; font-weight: bold; color: #10b981;">منصة أم يوسف لتحفيظ القران الكريم</h1>
                <img src="https://i.ibb.co/60qG0vM/Holy-Quran-Icon.png" alt="Holy Quran Icon" style="height: 50px;">
            </div>
            
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333;">تقرير تقدم الطالب: ${student.name}</h2>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px; border: 1px solid #ccc; padding: 10px; border-radius: 8px;">
                <div><strong style="color: #666;">الاسم:</strong> ${student.name}</div>
                <div><strong style="color: #666;">الحلقة:</strong> ${studentClass?.name || 'غير محدد'}</div>
                <div><strong style="color: #666;">الصفحات المحفوظة:</strong> ${totalMemorizedPages}</div>
                <div><strong style="color: #666;">تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-EG')}</div>
            </div>

            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">تقدم الحفظ التفصيلي</h3>
            <div style="margin-bottom: 30px;">
                ${await renderMemorizationProgressForParent(student)}
            </div>

            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">ملخص الحضور (الشهر الحالي)</h3>
            <div style="margin-bottom: 30px; border: 1px solid #ccc; padding: 10px; border-radius: 8px;">
                ${await renderAttendanceSummary(student.id)}
            </div>
            
            <p style="text-align: center; margin-top: 40px; font-size: 14px; color: #666;">نتمنى للطالب دوام التوفيق والنجاح.</p>
        </div>
    `;

    html2pdf().from(reportHtml).set({
        filename: `progress-report-${student.name}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' }
    }).save().finally(() => showLoader(false));
}

async function printExamsReport(studentId) {
    showLoader(true);
    const student = await db.students.get(studentId);
    const studentExams = await db.exams.where('student_id').equals(studentId).toArray();

    const examsListHtml = studentExams.length ? `
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th style="padding: 8px; border: 1px solid #ccc;">نوع الاختبار</th>
                    <th style="padding: 8px; border: 1px solid #ccc;">الدرجة</th>
                    <th style="padding: 8px; border: 1px solid #ccc;">تاريخ الاختبار</th>
                </tr>
            </thead>
            <tbody>
                ${studentExams.map(exam => `
                    <tr>
                        <td style="padding: 8px; border: 1px solid #ccc;">${exam.type}</td>
                        <td style="padding: 8px; border: 1px solid #ccc;">${exam.score} / ${exam.exam_fields.reduce((sum, f) => sum + f.mark, 0)}</td>
                        <td style="padding: 8px; border: 1px solid #ccc;">${new Date(exam.date).toLocaleDateString('ar-EG')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    ` : `<p>لا توجد اختبارات مسجلة لهذا الطالب.</p>`;

    const reportHtml = `
        <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 24px; font-weight: bold; color: #10b981;">منصة أم يوسف لتحفيظ القران الكريم</h1>
                <img src="https://i.ibb.co/60qG0vM/Holy-Quran-Icon.png" alt="Holy Quran Icon" style="height: 50px;">
            </div>
            
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333;">تقرير نتائج الاختبارات: ${student.name}</h2>
            
            <div style="margin-bottom: 20px;">
                <p><strong>تاريخ التقرير:</strong> ${new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            
            ${examsListHtml}
            
            <p style="text-align: center; margin-top: 40px; font-size: 14px; color: #666;">نتمنى للطالب دوام التوفيق والنجاح.</p>
        </div>
    `;

    html2pdf().from(reportHtml).set({
        filename: `exams-report-${student.name}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' }
    }).save().finally(() => showLoader(false));
}

function calculateAverageScore(exams, passingScore) {
    if (!exams.length) return 0;
    const totalScore = exams.reduce((sum, exam) => {
        const totalMark = exam.exam_fields.reduce((s, f) => s + f.mark, 0);
        return sum + (totalMark > 0 ? (exam.score / totalMark) * 100 : 0);
    }, 0);
    return (totalScore / exams.length).toFixed(1);
}

async function calculateRank(student, classId) {
    if (!classId) return '-';
    const studentsInClass = await db.students.where('class_id').equals(classId).toArray();
    const studentScores = await Promise.all(studentsInClass.map(async (s) => {
        const pages = await db.tasmee3.where('student_id').equals(s.id).count();
        return { id: s.id, score: pages };
    }));
    studentScores.sort((a, b) => b.score - a.score);
    const rank = studentScores.findIndex(s => s.id === student.id) + 1;
    return rank > 0 ? rank : '-';
}

function renderExamsList(exams) {
    if (!exams.length) {
        return '<p class="text-sm text-gray-500">لا توجد اختبارات مسجلة.</p>';
    }
    return exams.map(exam => {
        const totalMark = exam.exam_fields.reduce((sum, f) => sum + f.mark, 0);
        return `
            <div class="py-2 border-b dark:border-gray-700 last:border-b-0">
                <div class="flex justify-between">
                    <span class="font-semibold">${exam.type}</span>
                    <span class="font-bold">${exam.score} / ${totalMark}</span>
                </div>
                <div class="text-xs text-gray-500">${new Date(exam.date).toLocaleDateString('ar-EG')}</div>
            </div>
        `;
    }).join('');
}

async function renderAttendanceSummary(studentId) {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const monthlyRecords = await db.attendance.where('student_id').equals(studentId)
        .and(record => record.date >= firstDay && record.date <= lastDay)
        .toArray();

    let present = 0, absent = 0, late = 0, sick = 0, score = 0;
    monthlyRecords.forEach(rec => {
        if (rec.status === 'present') { present++; score += 1; }
        if (rec.status === 'absent') { absent++; }
        if (rec.status === 'late') { late++; score += 0.5; }
        if (rec.status === 'sick') { sick++; score += 1; }
    });

    const percentage = daysInMonth > 0 ? (score / daysInMonth) * 100 : 0;

    return `
        <div class="space-y-2 text-sm">
            <p><strong>حاضر:</strong> ${present}</p>
            <p><strong>غائب:</strong> ${absent}</p>
            <p><strong>متأخر:</strong> ${late}</p>
            <p><strong>مرضي:</strong> ${sick}</p>
        </div>
        <div class="mt-4">
            <div class="flex justify-between text-sm mb-1">
                <span>نسبة الحضور</span>
                <span>${percentage.toFixed(1)}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                <div class="theme-bg h-2.5 rounded-full" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}

async function renderFinancialSummary(student, studentClass) {
    const settings = await db.settings.get('userSettings') || {};
    const fee = studentClass?.fee || settings.defaultFee || 0;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const financialRecord = await db.financials.get({ student_id: student.id, month_year: currentMonth });
    const status = financialRecord?.status || 'pending';

    let statusText, statusColor;
    switch (status) {
        case 'paid':
            statusText = 'مدفوع';
            statusColor = 'text-green-500';
            break;
        case 'exempt':
            statusText = 'معفى';
            statusColor = 'text-blue-500';
            break;
        default:
            statusText = 'معلق';
            statusColor = 'text-yellow-500';
    }

    return `
        <div class="space-y-2 text-sm">
            <p><strong>الرسوم الشهرية المقررة:</strong> ${fee} ${settings.currency || 'SDG'}</p>
            <p><strong>حالة الدفع لهذا الشهر:</strong> <span class="font-bold ${statusColor}">${statusText}</span></p>
        </div>
    `;
}

function renderMemorizationProgress(memorizedPages) {
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