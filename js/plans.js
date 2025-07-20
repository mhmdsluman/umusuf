// js/plans.js
import { db } from './db.js';
import { saveData } from './db.js';
import { showModal, hideModal, showToast, renderIcons, showConfirm } from './utils.js';

let studentsCache = [];

export async function initPlans(container) {
    studentsCache = await db.students.toArray();

    container.innerHTML = `
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-semibold">خطط الحفظ</h2>
            <div class="flex gap-2">
                <button id="add-plan-btn" class="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center">
                    <i data-lucide="plus" class="mr-2"></i> خطة جديدة
                </button>
                <button id="assign-plan-btn" class="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center">
                    <i data-lucide="user-check" class="mr-2"></i> تعيين خطة
                </button>
            </div>
        </div>
        <div id="plans-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <!-- Plan cards will be inserted here -->
        </div>
    `;

    document.getElementById('add-plan-btn').addEventListener('click', () => showPlanModal());
    document.getElementById('assign-plan-btn').addEventListener('click', () => showAssignPlanModal());

    await renderPlans();
    renderIcons();
}

async function renderPlans() {
    const plansContainer = document.getElementById('plans-container');
    const allPlans = await db.plans.toArray();

    if (!allPlans.length) {
        plansContainer.innerHTML = `<p class="text-center col-span-full text-gray-500">لا توجد خطط حفظ. قم بإنشاء خطة جديدة.</p>`;
        return;
    }

    plansContainer.innerHTML = allPlans.map(plan => `
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h3 class="text-xl font-bold">${plan.name}</h3>
            <p class="text-gray-600 dark:text-gray-400 my-2">${plan.description || ''}</p>
            <p class="text-sm text-gray-500">
                <i data-lucide="target" class="inline-block w-4 h-4"></i>
                الصفحات المستهدفة أسبوعياً: ${plan.pages_per_week ? `${plan.pages_per_week} صفحة` : 'غير محدد'}
            </p>
            <div class="mt-4 border-t dark:border-gray-700 pt-4 flex justify-end gap-2">
                <button class="edit-plan-btn p-1" data-id="${plan.id}"><i data-lucide="edit" class="text-blue-500 w-5 h-5"></i></button>
                <button class="delete-plan-btn p-1" data-id="${plan.id}"><i data-lucide="trash-2" class="text-red-500 w-5 h-5"></i></button>
            </div>
        </div>
    `).join('');

    renderIcons();

    plansContainer.querySelectorAll('.edit-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => showPlanModal(e.currentTarget.dataset.id));
    });
    plansContainer.querySelectorAll('.delete-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => deletePlan(e.currentTarget.dataset.id));
    });
}

async function showPlanModal(planId = null) {
    const plan = planId ? await db.plans.get(planId) : {};
    const title = planId ? 'تعديل خطة الحفظ' : 'إنشاء خطة جديدة';
    const preinstalledPlans = [
        "الأحد، الثلاثاء، الخميس",
        "السبت، الإثنين، الأربعاء",
        "أسبوع كامل",
        "٣ أيام تسميع، ٣ أيام تفسير"
    ];

    const formContent = `
        <form id="plan-form" class="space-y-4">
            <input type="hidden" id="plan-id" value="${plan.id || ''}">
            <div>
                <label for="plan-name" class="block mb-2">اسم الخطة</label>
                <input type="text" id="plan-name" value="${plan.name || ''}" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required>
            </div>
            <div>
                <label for="plan-description-select" class="block mb-2">وصف الخطة</label>
                <select id="plan-description-select" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    ${preinstalledPlans.map(p => `<option value="${p}">${p}</option>`).join('')}
                    <option value="other">أخرى</option>
                </select>
            </div>
            <div id="custom-plan-description-wrapper" class="hidden">
                <label for="plan-description-custom" class="block mb-2">الوصف المخصص</label>
                <input type="text" id="plan-description-custom" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
            </div>
            <div>
                <label for="plan-pages-per-week" class="block mb-2">الصفحات المستهدفة أسبوعياً</label>
                <div class="flex items-center">
                    <input type="number" id="plan-pages-per-week" value="${plan.pages_per_week || ''}" min="1" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                    <span class="mr-3 text-gray-500 dark:text-gray-400">صفحة</span>
                </div>
            </div>
        </form>
    `;
    
    const formContainer = document.createElement('div');
    formContainer.innerHTML = formContent;

    const descriptionSelect = formContainer.querySelector('#plan-description-select');
    const customDescriptionWrapper = formContainer.querySelector('#custom-plan-description-wrapper');
    const customDescriptionInput = formContainer.querySelector('#plan-description-custom');

    // Logic to set the initial state when editing a plan
    if (plan.description && preinstalledPlans.includes(plan.description)) {
        descriptionSelect.value = plan.description;
    } else if (plan.description) {
        descriptionSelect.value = 'other';
        customDescriptionInput.value = plan.description;
        customDescriptionWrapper.classList.remove('hidden');
    }

    // Event listener to show/hide the custom input field
    descriptionSelect.addEventListener('change', (e) => {
        if (e.target.value === 'other') {
            customDescriptionWrapper.classList.remove('hidden');
        } else {
            customDescriptionWrapper.classList.add('hidden');
        }
    });

    showModal(title, formContainer, async () => {
        const descriptionSelect = document.getElementById('plan-description-select');
        let description = descriptionSelect.value;
        if (description === 'other') {
            description = document.getElementById('plan-description-custom').value;
        }

        const planData = {
            id: document.getElementById('plan-id').value,
            name: document.getElementById('plan-name').value,
            description: description,
            pages_per_week: parseInt(document.getElementById('plan-pages-per-week').value) || null
        };
        
        if (!planData.name) {
            showToast('الرجاء إدخال اسم الخطة.', 'error');
            return;
        }

        await saveData('plans', planData);
        showToast(planId ? 'تم تحديث الخطة بنجاح' : 'تم إضافة الخطة بنجاح', 'success');
        hideModal();
        await renderPlans();
    });
}

async function deletePlan(planId) {
    showConfirm('هل أنت متأكد من رغبتك في حذف هذه الخطة؟ سيتم إزالتها من جميع الطلاب المسجلين بها.', async () => {
        await db.plans.delete(planId);
        // Unassign from students
        const studentsWithPlan = await db.students.where('plan_id').equals(planId).toArray();
        for (const student of studentsWithPlan) {
            await db.students.update(student.id, { plan_id: null });
        }
        showToast('تم حذف الخطة بنجاح.', 'success');
        await renderPlans();
    });
}

async function showAssignPlanModal() {
    const allPlans = await db.plans.toArray();
    const allStudents = await db.students.toArray();

    const formContent = `
        <form id="assign-plan-form" class="space-y-4">
             <div>
                <label for="assign-plan-select" class="block mb-2">اختر الخطة</label>
                <select id="assign-plan-select" class="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required>
                    <option value="">-- اختر خطة --</option>
                    ${allPlans.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
            </div>
            <div>
                <label class="block mb-2">اختر الطلاب</label>
                <div class="max-h-60 overflow-y-auto border dark:border-gray-600 rounded-lg p-2 space-y-2">
                    ${allStudents.map(s => `
                        <div>
                            <label class="flex items-center">
                                <input type="checkbox" class="assign-plan-student-checkbox" value="${s.id}">
                                <span class="mr-2">${s.name}</span>
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        </form>
    `;

    showModal('تعيين خطة للطلاب', formContent, async () => {
        const planId = document.getElementById('assign-plan-select').value;
        if (!planId) {
            showToast('الرجاء اختيار خطة أولاً.', 'error');
            return;
        }

        const selectedStudentIds = Array.from(document.querySelectorAll('.assign-plan-student-checkbox:checked')).map(cb => cb.value);
        if (selectedStudentIds.length === 0) {
            showToast('الرجاء اختيار طالب واحد على الأقل.', 'error');
            return;
        }

        for (const studentId of selectedStudentIds) {
            await db.students.update(studentId, { plan_id: planId });
        }

        showToast(`تم تعيين الخطة لـ ${selectedStudentIds.length} طالب بنجاح.`, 'success');
        hideModal();
    });
}
