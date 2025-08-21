<template>
    <div>
        <h1>Student Dashboard</h1>
        <div v-if="student">
            <h2>Welcome, {{ student.user.name }}</h2>

            <div class="card">
                <h3>My Class</h3>
                <p v-if="student.class">
                    <strong>Class:</strong> {{ student.class.name }} <br>
                    <strong>Teacher:</strong> {{ student.class.teacher.user.name }}
                </p>
                <p v-else>Not assigned to a class.</p>
            </div>

            <div class="card">
                <h3>My Plan</h3>
                <p v-if="student.plan">
                    <strong>Plan:</strong> {{ student.plan.name }} <br>
                    <strong>Description:</strong> {{ student.plan.description }}
                </p>
                <p v-else>No plan assigned.</p>
            </div>

            <div class="card">
                <h3>My Attendance</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="record in student.attendance" :key="record.id">
                            <td>{{ record.date }}</td>
                            <td>{{ record.status }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h3>My Tasmee3 History</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Surah</th>
                            <th>Ayahs</th>
                            <th>Grade</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="record in student.tasmee3" :key="record.id">
                            <td>{{ new Date(record.created_at).toLocaleDateString() }}</td>
                            <td>{{ record.surah }}</td>
                            <td>{{ record.ayah_from }} - {{ record.ayah_to }}</td>
                            <td>{{ record.grade }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        student: Object,
    },
};
</script>

<style scoped>
.card {
    border: 1px solid #ccc;
    padding: 16px;
    margin-bottom: 16px;
}
</style>
