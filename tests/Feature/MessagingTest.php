<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MessagingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_a_new_conversation()
    {
        $sender = User::factory()->create();
        $recipient = User::factory()->create();

        $response = $this->actingAs($sender)->post(route('messages.store'), [
            'recipient_id' => $recipient->id,
            'body' => 'This is the first message.',
        ]);

        $this->assertDatabaseCount('conversations', 1);
        $this->assertDatabaseCount('messages', 1);
        $this->assertDatabaseHas('messages', [
            'user_id' => $sender->id,
            'body' => 'This is the first message.',
        ]);

        $conversation = Conversation::first();
        $this->assertTrue($conversation->users->contains($sender));
        $this->assertTrue($conversation->users->contains($recipient));

        $response->assertRedirect(route('messages.show', $conversation));
    }

    public function test_user_can_reply_to_an_existing_conversation()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $conversation = Conversation::factory()->create();
        $conversation->users()->attach([$user1->id, $user2->id]);

        $response = $this->actingAs($user1)->post(route('messages.reply.store', $conversation), [
            'body' => 'This is a reply.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseCount('messages', 1);
        $this->assertDatabaseHas('messages', [
            'conversation_id' => $conversation->id,
            'user_id' => $user1->id,
            'body' => 'This is a reply.',
        ]);
    }

    public function test_user_cannot_reply_to_a_conversation_they_are_not_part_of()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        $outsider = User::factory()->create();
        $conversation = Conversation::factory()->create();
        $conversation->users()->attach([$user1->id, $user2->id]);

        $response = $this->actingAs($outsider)->post(route('messages.reply.store', $conversation), [
            'body' => 'I am an outsider.',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_user_can_view_their_conversations()
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $conversation = Conversation::factory()->create();
        $conversation->users()->attach([$user->id, $otherUser->id]);

        $response = $this->actingAs($user)->get(route('messages.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Messaging/Index')
            ->has('conversations', 1)
        );
    }
}
