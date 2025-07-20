// js/dashboard.js
import { db } from './db.js';
import { renderIcons } from './utils.js';

let charts = {};

function destroyChart(chartId) {
    if (charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

export async function initDashboard(container) {
    Object.keys(charts).forEach(destroyChart); // Clear previous charts

    try {
        // Fetch data for dashboard stats
        const totalStudents = await db.students.count();
        const activeToday = await db.attendance.where('date').equals(new Date().toISOString().slice(0, 10)).and(record => record.status === 'present' || record.status === 'sick').count();
        const totalMemorizedPages = await db.tasmee3.count();
        const exams = await db.exams.toArray();
        
        let totalScoreSum = 0;
        let totalMaxScoreSum = 0;
        exams.forEach(exam => {
            totalScoreSum += exam.score;
            if (exam.exam_fields && Array.isArray(exam.exam_fields)) {
                totalMaxScoreSum += exam.exam_fields.reduce((sum, field) => sum + field.mark, 0);
            }
        });
        const avgScore = totalMaxScoreSum > 0 ? ((totalScoreSum / totalMaxScoreSum) * 100).toFixed(1) : 0;


        const statsCards = `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-lg text-gray-500 dark:text-gray-400">إجمالي الطلاب</h3>
                    <p class="text-3xl font-bold theme-text">${totalStudents}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-lg text-gray-500 dark:text-gray-400">نشطون اليوم</h3>
                    <p class="text-3xl font-bold text-green-500">${activeToday}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-lg text-gray-500 dark:text-gray-400">إجمالي الصفحات المحفوظة</h3>
                    <p class="text-3xl font-bold text-blue-500">${totalMemorizedPages}</p>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-lg text-gray-500 dark:text-gray-400">متوسط الدرجات</h3>
                    <p class="text-3xl font-bold text-purple-500">${avgScore}%</p>
                </div>
            </div>
        `;

        const chartSection = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-4">معدل الحفظ الأسبوعي (آخر 7 أيام)</h3>
                    <canvas id="weekly-progress-chart"></canvas>
                </div>
                <div class="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-bold mb-4">توزيع الطلاب على الحلقات</h3>
                    <canvas id="class-distribution-chart"></canvas>
                </div>
            </div>
        `;
        
        const topStudentsSection = `
            <div class="mt-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 class="text-xl font-bold mb-4">أفضل 5 طلاب (حسب الحفظ)</h3>
                <div id="top-students-list"></div>
            </div>
        `;

        container.innerHTML = statsCards + chartSection + topStudentsSection;
        renderIcons();

        // Initialize Charts and Top Students List
        renderWeeklyProgressChart();
        renderClassDistributionChart();
        renderTopStudentsList();
    } catch (error) {
        console.error("Error initializing dashboard:", error);
        container.innerHTML = `<p class="text-red-500">حدث خطأ أثناء تحميل لوحة التحكم.</p>`;
    }
}

async function renderWeeklyProgressChart() {
    const ctx = document.getElementById('weekly-progress-chart').getContext('2d');
    destroyChart('weeklyProgress');
    
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateString = d.toISOString().slice(0, 10);
        labels.push(dateString);
        const records = await db.tasmee3.where('timestamp').startsWith(dateString).toArray();
        data.push(records.length);
    }

    charts['weeklyProgress'] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'صفحات تمت مراجعتها',
                data: data,
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderColor: 'rgba(16, 185, 129, 1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

async function renderClassDistributionChart() {
    const ctx = document.getElementById('class-distribution-chart').getContext('2d');
    destroyChart('classDistribution');
    const classes = await db.classes.toArray();
    const studentCounts = await Promise.all(
        classes.map(c => db.students.where('class_id').equals(c.id).count())
    );

    charts['classDistribution'] = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: classes.map(c => c.name),
            datasets: [{
                label: 'عدد الطلاب',
                data: studentCounts,
                backgroundColor: ['#10b981', '#3b82f6', '#ef4444', '#f97316', '#8b5cf6', '#ec4899'],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            }
        }
    });
}

async function renderTopStudentsList() {
    const container = document.getElementById('top-students-list');
    const students = await db.students.toArray();
    const studentScores = await Promise.all(students.map(async (student) => {
        const pages = await db.tasmee3.where('student_id').equals(student.id).count();
        return { name: student.name, score: pages };
    }));

    studentScores.sort((a, b) => b.score - a.score);
    const top5 = studentScores.slice(0, 5);

    if (top5.length === 0) {
        container.innerHTML = '<p class="text-gray-500">لا توجد بيانات لعرضها.</p>';
        return;
    }

    container.innerHTML = top5.map(student => `
        <div class="flex justify-between items-center p-2 border-b dark:border-gray-700">
            <span>${student.name}</span>
            <span class="font-bold theme-text">${student.score} صفحة</span>
        </div>
    `).join('');
}