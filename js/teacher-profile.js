// js/teacher-profile.js
import { db } from './db.js';
import { showLoader, renderIcons } from './utils.js';

export async function initTeacherProfile(container) {
    const params = new URLSearchParams(window.location.hash.split('?')[1]);
    const teacherId = params.get('id');

    if (!teacherId) {
        container.innerHTML = `<p class="text-center text-red-500">لم يتم تحديد هوية المعلم.</p>`;
        return;
    }

    showLoader(true);
    try {
        const teacher = await db.teachers.get(teacherId);
        if (!teacher) {
            container.innerHTML = `<p class="text-center text-red-500">المعلم غير موجود.</p>`;
            return;
        }

        const assignedClasses = await db.classes.where('teacher_id').equals(teacherId).toArray();
        const settings = await db.settings.get('userSettings') || {};
        
        let contactButtons = '';
        if (teacher.phone && teacher.country_code) {
            let phoneNumber = teacher.phone.startsWith('0') ? teacher.phone.substring(1) : teacher.phone;
            const fullNumber = `${teacher.country_code.replace('+', '')}${phoneNumber}`;
            contactButtons = `
                <div class="flex justify-center md:justify-start gap-2 mt-4">
                    <a href="https://wa.me/${fullNumber}" target="_blank" class="bg-green-500 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                        <i data-lucide="message-circle" class="w-4 h-4"></i> WhatsApp
                    </a>
                </div>
            `;
        }

        container.innerHTML = `
            <!-- Profile Header -->
            <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
                <div class="flex flex-col md:flex-row items-center gap-6">
                    <img src="${teacher.photo || `https://placehold.co/96x96/0d9488/ffffff?text=${teacher.name.charAt(0)}`}" 
                         alt="${teacher.name}" 
                         class="w-24 h-24 rounded-full object-cover flex-shrink-0"
                         onerror="this.onerror=null;this.src='https://placehold.co/96x96/cccccc/ffffff?text=Error';">
                    <div class="text-center md:text-right">
                        <h2 class="text-3xl font-bold">${teacher.name}</h2>
                        <p class="text-gray-500 dark:text-gray-400">${teacher.specialization || 'معلم تحفيظ'}</p>
                        ${contactButtons}
                    </div>
                </div>
            </div>

            <!-- Detailed Information -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-semibold mb-4">المعلومات الشخصية والمالية</h3>
                    <div class="space-y-2 text-sm">
                        <p><strong>رقم الهاتف:</strong> ${teacher.country_code || ''} ${teacher.phone || 'غير محدد'}</p>
                        <p><strong>الراتب الشهري:</strong> ${teacher.salary || 0} ${settings.currency || 'SDG'}</p>
                    </div>
                </div>
                <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-semibold mb-4">المؤهلات والإجازات</h3>
                    <p class="text-sm whitespace-pre-wrap">${teacher.qualifications || 'لم تسجل مؤهلات.'}</p>
                </div>
                <div class="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <h3 class="text-xl font-semibold mb-4">الحلقات المسندة (${assignedClasses.length})</h3>
                    <div class="max-h-60 overflow-y-auto">
                        ${assignedClasses.length ? assignedClasses.map(cls => `
                            <div class="py-2 border-b dark:border-gray-700 last:border-b-0">
                                <a href="#students?class_id=${cls.id}" class="font-semibold text-blue-600 hover:underline">${cls.name}</a>
                            </div>
                        `).join('') : '<p class="text-sm text-gray-500">لم يتم إسناد أي حلقات لهذا المعلم.</p>'}
                    </div>
                </div>
            </div>
        `;
        renderIcons();
    } catch (error) {
        console.error("Failed to render teacher profile:", error);
        container.innerHTML = `<p class="text-center text-red-500">حدث خطأ أثناء تحميل ملف المعلم.</p>`;
    } finally {
        showLoader(false);
    }
}
