<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\User;

class ConversationController extends Controller
{
    public function index()
    {
        $conversations = Auth::user()->conversations()->with('users', 'messages')->latest('updated_at')->get();
        $users = User::where('id', '!=', Auth::id())->get();

        return Inertia::render('Messaging/Index', [
            'conversations' => $conversations,
            'users' => $users,
        ]);
    }

    public function show(Conversation $conversation)
    {
        // Authorize that the user is part of this conversation
        if (!$conversation->users->contains(Auth::user())) {
            abort(403);
        }

        $conversation->load('users', 'messages.user');

        // This could be part of the index view, but we'll prepare for a dedicated show view if needed.
        return Inertia::render('Messaging/Show', [
            'conversation' => $conversation,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'recipient_id' => ['required', 'exists:users,id'],
            'body' => ['required', 'string'],
        ]);

        // Check if a conversation already exists between these two users
        $conversation = Auth::user()->conversations()
            ->whereHas('users', function ($query) use ($request) {
                $query->where('user_id', $request->recipient_id);
            }, '=', 1) // Ensure only two participants
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create();
            $conversation->users()->attach([Auth::id(), $request->recipient_id]);
        }

        $conversation->messages()->create([
            'user_id' => Auth::id(),
            'body' => $request->body,
        ]);

        $conversation->touch();

        return redirect()->route('messages.show', $conversation);
    }
}
