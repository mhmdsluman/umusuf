// js/financials.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showToast, renderIcons, showConfirm } from './utils.js';

let studentsCache = [];
let classesCache = [];
let settingsCache = {};

async function getSettings() {
    let settings = await db.settings.get('userSettings');
    if (!settings) {
        settings = { currency: 'SDG', defaultFee: 100 }; // Default fallback
    }
    return settings;
}

export async function initFinancials(container) {
    studentsCache = await db.students.toArray();
    classesCache = await db.classes.toArray();
    settingsCache = await getSettings();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">السجلات المالية</h2>
        </div>
        
        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
            <h3 class="text-xl font-semibold mb-4">رسوم الطلاب الشهرية</h3>
            <div class="flex items-center gap-4 mb-4">
                <label for="financial-month">اختر الشهر:</label>
                <input type="month" id="financial-month" value="${new Date().toISOString().slice(0, 7)}" class="p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-right">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th class="p-3">الطالب</th>
                            <th class="p-3">الرسوم المقررة</th>
                            <th class="p-3">الحالة</th>
                            <th class="p-3">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="financials-table-body"></tbody>
                </table>
            </div>
             <div class="flex justify-end mt-4">
                <button id="save-financials-btn" class="theme-bg text-white px-4 py-2 rounded-lg">حفظ التغييرات</button>
            </div>
        </div>

        <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h3 class="text-xl font-semibold mb-4">إدارة المصروفات العامة</h3>
            <form id="expense-form" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 items-end">
                <input id="expense-id" type="hidden">
                <div>
                    <label for="expense-description" class="block text-sm mb-1">الوصف</label>
                    <input id="expense-description" type="text" placeholder="مثال: إيجار، فواتير..." required class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div>
                    <label for="expense-amount" class="block text-sm mb-1">المبلغ</label>
                    <input id="expense-amount" type="number" min="0" placeholder="0.00" required class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
                <div>
                    <label for="expense-date" class="block text-sm mb-1">التاريخ</label>
                    <input id="expense-date" type="date" value="${new Date().toISOString().slice(0,10)}" required class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                </div>
                <button type="submit" class="bg-purple-600 text-white px-4 py-2 rounded-lg h-10">إضافة مصروف</button>
            </form>
            <div id="expenses-list-container" class="overflow-x-auto"></div>
        </div>
    `;
    
    document.getElementById('financial-month').addEventListener('change', renderFinancialsTable);
    document.getElementById('save-financials-btn').addEventListener('click', saveFinancials);
    document.getElementById('expense-form').addEventListener('submit', handleExpenseFormSubmit);

    await renderFinancialsTable();
    await renderExpensesList();
}

async function renderFinancialsTable() {
    const month = document.getElementById('financial-month').value;
    const tableBody = document.getElementById('financials-table-body');
    if (!month || !tableBody) return;

    const classFeeMap = new Map(classesCache.map(c => [c.id, c.fee]));
    const financialsForMonth = await db.financials.where('month_year').equals(month).toArray();
    const financialStatusMap = new Map(financialsForMonth.map(f => [f.student_id, f.status]));

    tableBody.innerHTML = studentsCache.map(student => {
        const fee = classFeeMap.get(student.class_id) ?? settingsCache.defaultFee;
        const formattedFee = Math.round(fee).toLocaleString('en-US');
        const status = financialStatusMap.get(student.id) || 'pending';
        return `
            <tr class="border-b dark:border-gray-700">
                <td class="p-3">${student.name}</td>
                <td class="p-3">${formattedFee} ${settingsCache.currency}</td>
                <td class="p-3">
                    <select class="financial-status-select p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" data-student-id="${student.id}">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>لم يدفع</option>
                        <option value="paid" ${status === 'paid' ? 'selected' : ''}>دفع</option>
                        <option value="exempt" ${status === 'exempt' ? 'selected' : ''}>معفى</option>
                    </select>
                </td>
                <td class="p-3">
                    ${status === 'paid' ? `<button class="print-receipt-btn" data-id="${student.id}" data-name="${student.name}"><i data-lucide="printer" class="text-blue-500"></i></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
    
    renderIcons();
    document.querySelectorAll('.print-receipt-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.currentTarget.dataset.id;
            const studentName = e.currentTarget.dataset.name;
            const month = document.getElementById('financial-month').value;
            printPaymentReceipt(studentId, studentName, month);
        });
    });
}

async function saveFinancials() {
    const month = document.getElementById('financial-month').value;
    const selects = document.querySelectorAll('.financial-status-select');
    const recordsToUpdate = [];
    
    for (const select of selects) {
        const student_id = select.dataset.studentId;
        const status = select.value;
        recordsToUpdate.push({
            student_id,
            month_year: month,
            status
        });
    }

    try {
        await db.financials.bulkPut(recordsToUpdate);
        showToast('تم حفظ البيانات المالية بنجاح.', 'success');
        window.dispatchEvent(new CustomEvent('datachanged'));
    } catch (error) {
        console.error("Failed to save financials:", error);
        showToast('فشل حفظ البيانات المالية.', 'error');
    }
}

async function printPaymentReceipt(studentId, studentName, month) {
    const student = await db.students.get(studentId);
    const studentClass = student.class_id ? await db.classes.get(student.class_id) : null;
    const settings = await db.settings.get('userSettings');
    const financialRecord = await db.financials.where({ student_id: studentId, month_year: month }).first();
    const fee = studentClass?.fee || settings.defaultFee;
    
    const formattedFee = Math.round(fee).toLocaleString('en-US');

    const receiptHtml = `
        <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 24px; font-weight: bold; color: #10b981;">منصة أم يوسف لتحفيظ القران الكريم</h1>
                <img src="https://i.ibb.co/60qG0vM/Holy-Quran-Icon.png" alt="Holy Quran Icon" style="height: 50px;">
            </div>
            
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333;">إيصال رسوم شهرية</h2>
            
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <tr><td style="padding: 8px; border: 1px solid #ccc; background-color: #f2f2f2;">اسم الطالب:</td><td style="padding: 8px; border: 1px solid #ccc;">${studentName}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ccc; background-color: #f2f2f2;">الحلقة:</td><td style="padding: 8px; border: 1px solid #ccc;">${studentClass?.name || 'غير محدد'}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ccc; background-color: #f2f2f2;">الشهر:</td><td style="padding: 8px; border: 1px solid #ccc;">${month}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ccc; background-color: #f2f2f2;">المبلغ المدفوع:</td><td style="padding: 8px; border: 1px solid #ccc; font-weight: bold;">${formattedFee} ${settings.currency}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ccc; background-color: #f2f2f2;">تاريخ الإيصال:</td><td style="padding: 8px; border: 1px solid #ccc;">${new Date().toLocaleDateString('ar-EG')}</td></tr>
                <tr><td style="padding: 8px; border: 1px solid #ccc; background-color: #f2f2f2;">الحالة:</td><td style="padding: 8px; border: 1px solid #ccc; color: #10b981;">مدفوع</td></tr>
            </table>

            <p style="text-align: center; margin-top: 30px; font-size: 14px; color: #666;">شكراً لاستخدامكم منصتنا.</p>
        </div>
    `;

    html2pdf().from(receiptHtml).set({
        filename: `receipt-${studentName}-${month}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' }
    }).save();
}

async function renderExpensesList() {
    const container = document.getElementById('expenses-list-container');
    const expenses = await db.expenses.orderBy('date').reverse().toArray();

    if (expenses.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 py-4">لا توجد مصروفات مسجلة.</p>`;
        return;
    }

    container.innerHTML = `
        <table class="w-full text-right">
            <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th class="p-3">الوصف</th>
                    <th class="p-3">المبلغ</th>
                    <th class="p-3">التاريخ</th>
                    <th class="p-3">إجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${expenses.map(e => `
                    <tr class="border-b dark:border-gray-700">
                        <td class="p-3">${e.description}</td>
                        <td class="p-3">${Math.round(e.amount).toLocaleString('en-US')} ${settingsCache.currency}</td>
                        <td class="p-3">${new Date(e.date).toLocaleDateString('ar-EG')}</td>
                        <td class="p-3">
                            <button class="delete-expense-btn" data-id="${e.id}"><i data-lucide="trash-2" class="text-red-500"></i></button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    renderIcons();
    container.querySelectorAll('.delete-expense-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deleteExpense(e.currentTarget.dataset.id));
    });
}

async function handleExpenseFormSubmit(e) {
    e.preventDefault();
    const expenseData = {
        id: document.getElementById('expense-id').value,
        description: document.getElementById('expense-description').value,
        amount: parseFloat(document.getElementById('expense-amount').value),
        date: document.getElementById('expense-date').value,
    };
    await saveData('expenses', expenseData);
    showToast('تم إضافة المصروف بنجاح.', 'success');
    e.target.reset(); // Reset the form
    document.getElementById('expense-date').value = new Date().toISOString().slice(0,10);
    await renderExpensesList();
    window.dispatchEvent(new CustomEvent('datachanged'));
}

async function deleteExpense(expenseId) {
    showConfirm('هل أنت متأكد من حذف هذا المصروف؟', async () => {
        await db.expenses.delete(expenseId);
        showToast('تم حذف المصروف بنجاح.', 'success');
        await renderExpensesList();
        window.dispatchEvent(new CustomEvent('datachanged'));
    });
}