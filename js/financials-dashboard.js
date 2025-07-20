// js/financials-dashboard.js
import { db } from './db.js';
import { renderIcons } from './utils.js';

let charts = {};

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

    // Filter records for the current month and create a lookup map for quick access
    const monthlyFinancials = financials.filter(f => f.month_year === currentMonth);
    const studentStatusMap = new Map(monthlyFinancials.map(f => [f.student_id, f.status]));

    let totalIncome = 0;
    let pendingPayments = 0;

    // Iterate over ALL students to check their payment status for the current month
    for (const student of students) {
        const fee = classFeeMap.get(student.class_id) || 0;
        const status = studentStatusMap.get(student.id); // Can be 'paid', 'pending', 'exempt', or undefined

        if (status === 'paid') {
            // If the student has paid, add their fee to the total income
            totalIncome += fee;
        } else if (status === 'exempt') {
            // If the student is exempt, their fee is not counted as pending or income
        } else {
            // If the student's status is 'pending' or they have no record for the month, their fee is due
            pendingPayments += fee;
        }
    }

    const totalExpenses = expenses
        .filter(e => e.date.startsWith(currentMonth))
        .reduce((sum, e) => sum + e.amount, 0);

    const netBalance = totalIncome - totalExpenses;

    return { totalIncome, totalExpenses, netBalance, pendingPayments };
}


export async function initFinancialsDashboard(container) {
    Object.keys(charts).forEach(destroyChart);

    const summary = await getFinancialSummary();
    const settings = await db.settings.get('userSettings') || { currency: 'SDG' };

    const statsCards = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-lg text-gray-500 dark:text-gray-400">الدخل الشهري</h3>
                <p class="text-3xl font-bold text-green-500">${summary.totalIncome.toFixed(2)} ${settings.currency}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-lg text-gray-500 dark:text-gray-400">المصروفات الشهرية</h3>
                <p class="text-3xl font-bold text-red-500">${summary.totalExpenses.toFixed(2)} ${settings.currency}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-lg text-gray-500 dark:text-gray-400">الرصيد الصافي</h3>
                <p class="text-3xl font-bold text-blue-500">${summary.netBalance.toFixed(2)} ${settings.currency}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-lg text-gray-500 dark:text-gray-400">الرسوم المعلقة</h3>
                <p class="text-3xl font-bold text-yellow-500">${summary.pendingPayments.toFixed(2)} ${settings.currency}</p>
            </div>
        </div>
    `;

    const chartSection = `
        <div class="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 class="text-xl font-bold mb-4">الدخل والمصروفات (آخر 6 أشهر)</h3>
            <canvas id="income-expense-chart"></canvas>
        </div>
    `;

    container.innerHTML = statsCards + chartSection;
    renderIcons();
    renderIncomeExpenseChart();
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
