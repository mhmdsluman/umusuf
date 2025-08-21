<template>
    <div>
        <h1>Teacher Dashboard</h1>
        <p>Welcome, Teacher!</p>

        <h2>My Classes</h2>
        <ul>
            <li v-for="classItem in classes" :key="classItem.id">
                <Link :href="`/teacher/classes/${classItem.id}`">
                    {{ classItem.name }}
                </Link>
            </li>
        </ul>
    </div>
</template>

<script>
import { Link } from '@inertiajs/vue3';

export default {
    components: {
        Link,
    },
    props: {
        classes: Array,
    },
};
</script>
