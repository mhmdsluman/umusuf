<template>
    <div>
        <h1>Create New User</h1>

        <form @submit.prevent="submit">
            <div>
                <label for="name">Name</label>
                <input type="text" v-model="form.name" id="name" />
            </div>
            <div>
                <label for="email">Email</label>
                <input type="email" v-model="form.email" id="email" />
            </div>
            <div>
                <label for="password">Password</label>
                <input type="password" v-model="form.password" id="password" />
            </div>
            <div>
                <label for="role">Role</label>
                <select v-model="form.role" id="role">
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="student">Student</option>
                    <option value="guardian">Guardian</option>
                </select>
            </div>
            <button type="submit" :disabled="form.processing">Create</button>
        </form>
    </div>
</template>

<script>
import { useForm } from '@inertiajs/vue3';

export default {
    setup() {
        const form = useForm({
            name: '',
            email: '',
            password: '',
            role: 'student',
        });

        function submit() {
            form.post('/admin/users');
        }

        return { form, submit };
    },
};
</script>
