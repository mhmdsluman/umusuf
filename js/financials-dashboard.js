// js/financials-dashboard.js
import { db } from './db.js';
import { renderIcons, showLoader } from './utils.js';

let charts = {};

// Define the default structure for all settings
const defaultSettings = {
    key: 'userSettings',
    appName: 'منصة التحفيظ',
    theme: 'light',
    themeColor: '#10b981',
    currency: 'SDG',
    defaultFee: 100,
    feeDueDate: 5,
    enableLateFees: false,
    lateFeeAmount: 10,
    passingScore: 50,
    examFields: [
        { name: 'جودة الحفظ', mark: 50 },
        { name: 'أحكام التجويد', mark: 30 },
        { name: 'جمال الصوت', mark: 20 }
    ],
    notifyOnNewStudent: true,
    notifyOnFeePaid: false,
    enableParentPortal: true,
    parentPortalMessage: 'مرحباً بكم في بوابة متابعة الأبناء.'
};

async function getSettings() {
    let settings = await db.settings.get('userSettings');
    if (!settings) {
        settings = defaultSettings;
        await db.settings.put(settings);
    }
    return { ...defaultSettings, ...settings };
}

function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

async function getFinancialSummary() {
    const students = await db.students.toArray();
    const classes = await db.classes.toArray();
    const expenses = await db.expenses.toArray();
    const financials = await db.financials.toArray();
    
    const classFeeMap = new Map(classes.map(c => [c.id, c.fee || 0]));
    const currentMonth = new Date().toISOString().slice(0, 7);

    const monthlyFinancials = financials.filter(f => f.month_year === currentMonth);
    const studentStatusMap = new Map(monthlyFinancials.map(f => [f.student_id, f.status]));

    let totalIncome = 0;
    let pendingPayments = 0;

    for (const student of students) {
        const fee = classFeeMap.get(student.class_id) || 0;
        const status = studentStatusMap.get(student.id);

        if (status === 'paid') {
            totalIncome += fee;
        } else if (status !== 'exempt') {
            pendingPayments += fee;
        }
    }

    const totalExpenses = expenses
        .filter(e => e.date.startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netBalance, pendingPayments };
}

// Function to render all parts of the dashboard
async function renderDashboard() {
    showLoader(true);
    Object.keys(charts).forEach(destroyChart);
    const summary = await getFinancialSummary();
    const settings = await getSettings();

    const formattedIncome = Math.round(summary.totalIncome).toLocaleString('en-US');
    const formattedExpenses = Math.round(summary.totalExpenses).toLocaleString('en-US');
    const formattedNetBalance = Math.round(summary.netBalance).toLocaleString('en-US');
    const formattedPending = Math.round(summary.pendingPayments).toLocaleString('en-US');

    const statsCards = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-lg text-gray-500 dark:text-gray-400">الدخل الشهري</h3>
                <p class="text-3xl font-bold text-green-500">${formattedIncome} ${settings.currency}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-lg text-gray-500 dark:text-gray-400">المصروفات الشهرية</h3>
                <p class="text-3xl font-bold text-red-500">${formattedExpenses} ${settings.currency}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-lg text-gray-500 dark:text-gray-400">الرصيد الصافي</h3>
                <p class="text-3xl font-bold text-blue-500">${formattedNetBalance} ${settings.currency}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-lg text-gray-500 dark:text-gray-400">الرسوم المعلقة</h3>
                <p class="text-3xl font-bold text-yellow-500">${formattedPending} ${settings.currency}</p>
            </div>
        </div>
    `;

    const chartSection = `
        <div class="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4">الدخل والمصروفات (آخر 6 أشهر)</h3>
            <canvas id="income-expense-chart"></canvas>
        </div>
    `;

    const printButton = `
        <div class="flex justify-end mt-6">
            <button id="print-financial-report-btn" class="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">
                <i data-lucide="printer" class="mr-2"></i> طباعة التقرير المالي
            </button>
        </div>
    `;

    document.getElementById('financials-dashboard-content').innerHTML = statsCards + chartSection + printButton;
    renderIcons();
    await renderIncomeExpenseChart();
    showLoader(false);
    
    document.getElementById('print-financial-report-btn').addEventListener('click', printFinancialReport);
}


export async function initFinancialsDashboard(container) {
    container.innerHTML = `<div id="financials-dashboard-content"></div>`;
    
    window.addEventListener('datachanged', renderDashboard);
    
    await renderDashboard();
}

async function renderIncomeExpenseChart() {
    const ctx = document.getElementById('income-expense-chart').getContext('2d');
    destroyChart('incomeExpense');

    const labels = [];
    const incomeData = [];
    const expenseData = [];
    
    const students = await db.students.toArray();
    const classes = await db.classes.toArray();
    const classFeeMap = new Map(classes.map(c => [c.id, c.fee || 0]));

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const month = d.toISOString().slice(0, 7);
        labels.push(month);

        const financials = await db.financials.where('month_year').equals(month).toArray();
        const paidStudents = new Set(financials.filter(f => f.status === 'paid').map(f => f.student_id));
        
        let monthIncome = 0;
        students.forEach(student => {
             if (paidStudents.has(student.id)) {
                monthIncome += classFeeMap.get(student.class_id) || 0;
            }
        });
        incomeData.push(monthIncome);

        const expenses = await db.expenses.where('date').startsWith(month).toArray();
        const monthExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        expenseData.push(monthExpenses);
    }

    charts['incomeExpense'] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'الدخل',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)', // emerald-500
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1
                },
                {
                    label: 'المصروفات',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)', // red-500
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

async function printFinancialReport() {
    showLoader(true);
    const summary = await getFinancialSummary();
    const settings = await getSettings();
    const chartCanvas = document.getElementById('income-expense-chart');
    const chartImage = chartCanvas ? chartCanvas.toDataURL('image/png') : '';
    
    const formattedIncome = Math.round(summary.totalIncome).toLocaleString('en-US');
    const formattedExpenses = Math.round(summary.totalExpenses).toLocaleString('en-US');
    const formattedNetBalance = Math.round(summary.netBalance).toLocaleString('en-US');
    const formattedPending = Math.round(summary.pendingPayments).toLocaleString('en-US');

    const expensesList = await db.expenses.orderBy('date').reverse().toArray();

    const reportHtml = `
        <div style="font-family: Arial, sans-serif; text-align: right; direction: rtl; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10b981; padding-bottom: 10px; margin-bottom: 20px;">
                <h1 style="font-size: 24px; font-weight: bold; color: #10b981;">منصة أم يوسف لتحفيظ القران الكريم</h1>
                <img src="https://i.ibb.co/60qG0vM/Holy-Quran-Icon.png" alt="Holy Quran Icon" style="height: 50px;">
            </div>
            
            <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #333;">التقرير المالي الشهري</h2>

            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
                <div style="background-color: #f0fdf4; padding: 15px; border-radius: 8px; border: 1px solid #d1fae5;">
                    <h3 style="color: #10b981; margin: 0;">الدخل الشهري</h3>
                    <p style="font-size: 24px; font-weight: bold; color: #10b981;">${formattedIncome} ${settings.currency}</p>
                </div>
                <div style="background-color: #fef2f2; padding: 15px; border-radius: 8px; border: 1px solid #fee2e2;">
                    <h3 style="color: #ef4444; margin: 0;">المصروفات الشهرية</h3>
                    <p style="font-size: 24px; font-weight: bold; color: #ef4444;">${formattedExpenses} ${settings.currency}</p>
                </div>
                <div style="background-color: #eef2ff; padding: 15px; border-radius: 8px; border: 1px solid #c7d2fe;">
                    <h3 style="color: #3b82f6; margin: 0;">الرصيد الصافي</h3>
                    <p style="font-size: 24px; font-weight: bold; color: #3b82f6;">${formattedNetBalance} ${settings.currency}</p>
                </div>
                <div style="background-color: #fffbeb; padding: 15px; border-radius: 8px; border: 1px solid #fde68a;">
                    <h3 style="color: #f59e0b; margin: 0;">الرسوم المعلقة</h3>
                    <p style="font-size: 24px; font-weight: bold; color: #f59e0b;">${formattedPending} ${settings.currency}</p>
                </div>
            </div>

            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">المصروفات التفصيلية</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 8px; border: 1px solid #ccc;">الوصف</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">المبلغ</th>
                        <th style="padding: 8px; border: 1px solid #ccc;">التاريخ</th>
                    </tr>
                </thead>
                <tbody>
                    ${expensesList.map(e => `
                        <tr>
                            <td style="padding: 8px; border: 1px solid #ccc;">${e.description}</td>
                            <td style="padding: 8px; border: 1px solid #ccc;">${Math.round(e.amount).toLocaleString('en-US')} ${settings.currency}</td>
                            <td style="padding: 8px; border: 1px solid #ccc;">${e.date}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <h3 style="font-size: 18px; font-weight: bold; margin-bottom: 10px; color: #333;">الدخل والمصروفات (آخر 6 أشهر)</h3>
            <div style="text-align: center;">
                <img src="${chartImage}" alt="Income and Expense Chart" style="max-width: 100%;">
            </div>
            
            <p style="text-align: center; margin-top: 40px; font-size: 14px; color: #666;">تم إعداد هذا التقرير في ${new Date().toLocaleDateString('ar-EG')}.</p>
        </div>
    `;

    html2pdf().from(reportHtml).set({
        filename: `financial-report-${new Date().toISOString().slice(0, 7)}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait' }
    }).save().finally(() => showLoader(false));
}