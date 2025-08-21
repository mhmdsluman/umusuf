<template>
    <div>
        <h1>{{ class_prop.name }}</h1>
        <p>Date: {{ today }}</p>

        <h2>Students</h2>
        <div v-for="student in class_prop.students" :key="student.id" class="student-card">
            <h3>{{ student.user.name }}</h3>
            <div>
                <strong>Attendance:</strong>
                <span v-if="getAttendanceStatus(student)">{{ getAttendanceStatus(student) }}</span>
                <span v-else>Not Marked</span>
                <button @click="markAttendance(student.id, 'present')">P</button>
                <button @click="markAttendance(student.id, 'absent')">A</button>
                <button @click="markAttendance(student.id, 'late')">L</button>
            </div>
            <div>
                <h4>Tasmee3 History</h4>
                <button @click="openTasmee3Modal(student)">Add Tasmee3 Record</button>
                <ul>
                    <li v-for="record in student.tasmee3" :key="record.id">
                        {{ record.surah }}: {{ record.ayah_from }} - {{ record.ayah_to }} ({{ record.grade }})
                    </li>
                </ul>
            </div>
        </div>

        <!-- Tasmee3 Modal -->
        <div v-if="isModalOpen" class="modal">
            <div class="modal-content">
                <span class="close" @click="closeModal">&times;</span>
                <h2>Add Tasmee3 for {{ selectedStudent.user.name }}</h2>
                <form @submit.prevent="submitTasmee3">
                    <div>
                        <label>Surah</label>
                        <input v-model="tasmee3Form.surah" type="text" />
                    </div>
                    <div>
                        <label>From Ayah</label>
                        <input v-model="tasmee3Form.ayah_from" type="number" />
                    </div>
                    <div>
                        <label>To Ayah</label>
                        <input v-model="tasmee3Form.ayah_to" type="number" />
                    </div>
                    <div>
                        <label>Grade</label>
                        <select v-model="tasmee3Form.grade">
                            <option>excellent</option>
                            <option>good</option>
                            <option>average</option>
                            <option>poor</option>
                        </select>
                    </div>
                    <button type="submit" :disabled="tasmee3Form.processing">Save</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import { useForm } from '@inertiajs/vue3';
import { ref } from 'vue';

export default {
    props: {
        class_prop: Object,
        today: String,
    },
    setup(props) {
        const attendanceForm = useForm({
            student_id: null,
            status: '',
            date: props.today,
        });

        const isModalOpen = ref(false);
        const selectedStudent = ref(null);

        const tasmee3Form = useForm({
            student_id: null,
            surah: '',
            ayah_from: null,
            ayah_to: null,
            grade: 'good',
        });

        function markAttendance(studentId, status) {
            attendanceForm.student_id = studentId;
            attendanceForm.status = status;
            attendanceForm.post(route('teacher.attendance.store'), {
                preserveState: true,
                preserveScroll: true,
            });
        }

        function getAttendanceStatus(student) {
            if (student.attendance && student.attendance.length > 0) {
                return student.attendance[0].status;
            }
            return null;
        }

        function openTasmee3Modal(student) {
            selectedStudent.value = student;
            tasmee3Form.student_id = student.id;
            isModalOpen.value = true;
        }

        function closeModal() {
            isModalOpen.value = false;
            selectedStudent.value = null;
            tasmee3Form.reset();
        }

        function submitTasmee3() {
            tasmee3Form.post(route('teacher.tasmee3.store'), {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
        }

        return {
            markAttendance,
            getAttendanceStatus,
            isModalOpen,
            selectedStudent,
            tasmee3Form,
            openTasmee3Modal,
            closeModal,
            submitTasmee3,
        };
    },
};
</script>

<style scoped>
.modal {
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.4);
}
.modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
}
.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}
.student-card {
    border: 1px solid #ccc;
    padding: 16px;
    margin-bottom: 16px;
}
</style>
