<template>
    <div class="messaging-layout">
        <div class="conversation-list">
            <h2>Conversations</h2>
            <button @click="showNewConversationModal = true">New Message</button>
            <ul>
                <li v-for="conversation in conversations" :key="conversation.id" @click="selectConversation(conversation)">
                    {{ conversation.users.map(u => u.name).join(', ') }}
                </li>
            </ul>
        </div>
        <div class="message-view">
            <div v-if="activeConversation">
                <h3>Messages with {{ activeConversation.users.map(u => u.name).join(', ') }}</h3>
                <div class="messages">
                    <div v-for="message in activeConversation.messages" :key="message.id" class="message">
                        <strong>{{ message.user.name }}:</strong> {{ message.body }}
                    </div>
                </div>
                <form @submit.prevent="submitReply">
                    <textarea v-model="replyForm.body" placeholder="Type your message..."></textarea>
                    <button type="submit" :disabled="replyForm.processing">Send</button>
                </form>
            </div>
            <div v-else>
                <p>Select a conversation to view messages.</p>
            </div>
        </div>

        <!-- New Conversation Modal -->
        <div v-if="showNewConversationModal" class="modal">
            <div class="modal-content">
                <span class="close" @click="showNewConversationModal = false">&times;</span>
                <h2>New Conversation</h2>
                <form @submit.prevent="submitNewConversation">
                    <div>
                        <label>Recipient</label>
                        <select v-model="newConversationForm.recipient_id">
                            <option :value="null">-- Select a user --</option>
                            <option v-for="user in users" :key="user.id" :value="user.id">
                                {{ user.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label>Message</label>
                        <textarea v-model="newConversationForm.body"></textarea>
                    </div>
                    <button type="submit" :disabled="newConversationForm.processing">Start Conversation</button>
                </form>
            </div>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue';
import { useForm } from '@inertiajs/vue3';

export default {
    props: {
        conversations: Array,
        users: Array,
    },
    setup(props) {
        const activeConversation = ref(null);
        const showNewConversationModal = ref(false);

        const replyForm = useForm({
            body: '',
        });

        const newConversationForm = useForm({
            recipient_id: null,
            body: '',
        });

        function selectConversation(conversation) {
            activeConversation.value = conversation;
            replyForm.reset();
        }

        function submitReply() {
            if (!activeConversation.value) return;
            replyForm.post(route('messages.reply.store', activeConversation.value.id), {
                onSuccess: () => replyForm.reset(),
                preserveState: true,
                preserveScroll: true,
            });
        }

        function submitNewConversation() {
            newConversationForm.post(route('messages.store'), {
                onSuccess: () => {
                    newConversationForm.reset();
                    showNewConversationModal.value = false;
                },
            });
        }

        return {
            activeConversation,
            showNewConversationModal,
            selectConversation,
            replyForm,
            submitReply,
            newConversationForm,
            submitNewConversation,
        };
    },
};
</script>

<style scoped>
.messaging-layout {
    display: flex;
    height: 90vh;
}
.conversation-list {
    width: 30%;
    border-right: 1px solid #ccc;
    padding: 10px;
}
.message-view {
    width: 70%;
    padding: 10px;
}
</style>
