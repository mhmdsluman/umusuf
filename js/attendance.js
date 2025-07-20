// js/attendance.js
import { db } from './db.js';
import { saveData } from './db.js';
import { renderIcons } from './utils.js';

export async function initAttendance(container) {
    const classes = await db.classes.toArray();
    container.innerHTML = `
        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h2 class="text-2xl font-semibold">تسجيل الحضور والغياب</h2>
            <div class="flex items-center gap-4">
                <select id="attendance-class-filter" class="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <option value="">-- اختر حلقة --</option>
                    ${classes.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                </select>
                <input type="date" id="attendance-date" value="${new Date().toISOString().slice(0, 10)}" class="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
        </div>
        <div id="attendance-table-container" class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p class="text-center text-gray-500">الرجاء اختيار حلقة لعرض الطلاب.</p>
        </div>
    `;

    document.getElementById('attendance-date').addEventListener('change', renderAttendanceTable);
    document.getElementById('attendance-class-filter').addEventListener('change', renderAttendanceTable);

    renderIcons();
}

async function renderAttendanceTable() {
    const classId = document.getElementById('attendance-class-filter').value;
    const selectedDate = document.getElementById('attendance-date').value;
    const container = document.getElementById('attendance-table-container');

    if (!classId) {
        container.innerHTML = `<p class="text-center text-gray-500">الرجاء اختيار حلقة لعرض الطلاب.</p>`;
        return;
    }

    const studentsInClass = await db.students.where('class_id').equals(classId).toArray();
    if (studentsInClass.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500">لا يوجد طلاب في هذه الحلقة.</p>`;
        return;
    }
    
    const attendanceForDate = await db.attendance.where('date').equals(selectedDate).toArray();
    const attendanceMap = new Map(attendanceForDate.map(r => [r.student_id, r.status]));

    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let tableHtml = `
        <div class="overflow-x-auto">
            <table class="w-full text-right">
                <thead class="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th class="p-3">#</th>
                        <th class="p-3">اسم الطالب</th>
                        <th class="p-3 text-center">حالة اليوم</th>
                        <th class="p-3 text-center">إحصائيات الشهر</th>
                        <th class="p-3 text-center">نسبة الحضور</th>
                    </tr>
                </thead>
                <tbody id="attendance-table-body">`;

    let studentNumber = 1;
    for (const student of studentsInClass) {
        const monthlyRecords = await db.attendance.where('student_id').equals(student.id)
            .and(record => record.date >= firstDay && record.date <= lastDay)
            .toArray();
        
        let presentCount = 0;
        let absentCount = 0;
        let attendanceScore = 0;

        monthlyRecords.forEach(rec => {
            if (rec.status === 'present' || rec.status === 'sick') {
                presentCount++;
                attendanceScore += 1;
            } else if (rec.status === 'late') {
                presentCount++; // Still counts as present
                attendanceScore += 0.5;
            } else if (rec.status === 'absent') {
                absentCount++;
            }
        });
        
        const attendancePercentage = daysInMonth > 0 ? (attendanceScore / daysInMonth) * 100 : 0;
        const statusForToday = attendanceMap.get(student.id) || 'absent';

        tableHtml += `
            <tr class="border-b dark:border-gray-700">
                <td class="p-3">${studentNumber++}</td>
                <td class="p-3 font-semibold">
                    <a href="#student-profile?id=${student.id}" class="text-blue-600 hover:underline">${student.name}</a>
                </td>
                <td class="p-3">
                    <div class="flex justify-center gap-1" data-student-id="${student.id}">
                        <button class="status-btn p-2 rounded text-xs ${statusForToday === 'present' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}" data-status="present">حاضر</button>
                        <button class="status-btn p-2 rounded text-xs ${statusForToday === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}" data-status="absent">غائب</button>
                        <button class="status-btn p-2 rounded text-xs ${statusForToday === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}" data-status="late">متأخر</button>
                        <button class="status-btn p-2 rounded text-xs ${statusForToday === 'sick' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}" data-status="sick">مرضي</button>
                    </div>
                </td>
                <td class="p-3 text-center text-sm">
                    <span class="text-green-500">ح: ${presentCount}</span> / 
                    <span class="text-red-500">غ: ${absentCount}</span>
                </td>
                <td class="p-3">
                    <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div class="bg-green-600 h-2.5 rounded-full" style="width: ${attendancePercentage.toFixed(0)}%" title="${attendancePercentage.toFixed(1)}%"></div>
                    </div>
                </td>
            </tr>
        `;
    }

    tableHtml += `</tbody></table></div>`;
    container.innerHTML = tableHtml;

    container.querySelectorAll('.status-btn').forEach(btn => {
        btn.addEventListener('click', handleStatusChange);
    });
}

async function handleStatusChange(event) {
    const button = event.currentTarget;
    const buttonGroup = button.parentElement;
    const studentId = buttonGroup.dataset.studentId;
    const status = button.dataset.status;
    const date = document.getElementById('attendance-date').value;

    // Update UI immediately
    buttonGroup.querySelectorAll('.status-btn').forEach(btn => {
        btn.classList.remove('bg-green-500', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'text-white');
        btn.classList.add('bg-gray-200', 'dark:bg-gray-600');
    });
    button.classList.remove('bg-gray-200', 'dark:bg-gray-600');
    if (status === 'present') button.classList.add('bg-green-500', 'text-white');
    if (status === 'absent') button.classList.add('bg-red-500', 'text-white');
    if (status === 'late') button.classList.add('bg-yellow-500', 'text-white');
    if (status === 'sick') button.classList.add('bg-blue-500', 'text-white');

    // Save to database
    const existingRecord = await db.attendance.where({student_id: studentId, date: date}).first();
    const record = {
        id: existingRecord?.id,
        student_id: studentId,
        date: date,
        status: status
    };
    
    await saveData('attendance', record);
    // Debounce the re-render to avoid flashing
    setTimeout(renderAttendanceTable, 500);
}