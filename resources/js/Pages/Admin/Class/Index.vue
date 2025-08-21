<template>
    <div>
        <h1>Class Management</h1>

        <a href="/admin/classes/create">Create Class</a>

        <table>
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Teacher</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="classItem in classes.data" :key="classItem.id">
                    <td>{{ classItem.name }}</td>
                    <td>{{ classItem.teacher ? classItem.teacher.user.name : 'Unassigned' }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
export default {
    props: {
        classes: Object,
    },
};
</script>
