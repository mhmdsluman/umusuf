<template>
    <div>
        <h1>Link Guardian to Students</h1>

        <form @submit.prevent="submit">
            <div>
                <label for="guardian_id">Guardian</label>
                <select v-model="form.guardian_id" id="guardian_id">
                    <option :value="null">-- Select a Guardian --</option>
                    <option v-for="guardian in guardians" :key="guardian.id" :value="guardian.id">
                        {{ guardian.user.name }}
                    </option>
                </select>
            </div>
            <div>
                <label for="student_ids">Students</label>
                <select multiple v-model="form.student_ids" id="student_ids">
                    <option v-for="student in students" :key="student.id" :value="student.id">
                        {{ student.user.name }}
                    </option>
                </select>
            </div>
            <button type="submit" :disabled="form.processing">Link</button>
        </form>
    </div>
</template>

<script>
import { useForm } from '@inertiajs/vue3';

export default {
    props: {
        guardians: Array,
        students: Array,
    },
    setup() {
        const form = useForm({
            guardian_id: null,
            student_ids: [],
        });

        function submit() {
            form.post('/admin/guardian-student');
        }

        return { form, submit };
    },
};
</script>
