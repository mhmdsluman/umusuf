<template>
    <div>
        <h1>Guardian Dashboard</h1>
        <h2>Welcome, {{ guardian.user.name }}</h2>

        <div v-if="guardian.students && guardian.students.length > 0">
            <h3>Your Children</h3>
            <div v-for="student in guardian.students" :key="student.id" class="student-card">
                <h4>{{ student.user.name }}</h4>

                <p v-if="student.class">
                    <strong>Class:</strong> {{ student.class.name }} <br>
                    <strong>Teacher:</strong> {{ student.class.teacher.user.name }}
                </p>
                <p v-else>Not assigned to a class.</p>

                <h5>Recent Attendance (Last 5)</h5>
                <ul>
                    <li v-for="record in student.attendance" :key="record.id">
                        {{ record.date }}: {{ record.status }}
                    </li>
                </ul>

                <h5>Recent Tasmee3 (Last 5)</h5>
                <ul>
                    <li v-for="record in student.tasmee3" :key="record.id">
                        {{ new Date(record.created_at).toLocaleDateString() }} - {{ record.surah }}: {{ record.ayah_from }}-{{ record.ayah_to }} ({{ record.grade }})
                    </li>
                </ul>
            </div>
        </div>
        <div v-else>
            <p>You have no children linked to your account.</p>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        guardian: Object,
    },
};
</script>

<style scoped>
.student-card {
    border: 1px solid #ccc;
    padding: 16px;
    margin-bottom: 16px;
}
</style>
