<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessageController extends Controller
{
    public function store(Request $request, Conversation $conversation)
    {
        $request->validate([
            'body' => ['required', 'string'],
        ]);

        // Authorize that the user is part of this conversation
        if (!$conversation->users->contains(Auth::user())) {
            abort(403);
        }

        $conversation->messages()->create([
            'user_id' => Auth::id(),
            'body' => $request->body,
        ]);

        // Touch the conversation to update its updated_at timestamp
        $conversation->touch();

        return back();
    }
}
