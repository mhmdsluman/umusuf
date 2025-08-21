<template>
    <div>
        <h1>Create New Class</h1>

        <form @submit.prevent="submit">
            <div>
                <label for="name">Class Name</label>
                <input type="text" v-model="form.name" id="name" />
            </div>
            <div>
                <label for="teacher_id">Teacher</label>
                <select v-model="form.teacher_id" id="teacher_id">
                    <option :value="null">-- Select a Teacher --</option>
                    <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                        {{ teacher.user.name }}
                    </option>
                </select>
            </div>
            <button type="submit" :disabled="form.processing">Create</button>
        </form>
    </div>
</template>

<script>
import { useForm } from '@inertiajs/vue3';

export default {
    props: {
        teachers: Array,
    },
    setup() {
        const form = useForm({
            name: '',
            teacher_id: null,
        });

        function submit() {
            form.post('/admin/classes');
        }

        return { form, submit };
    },
};
</script>
