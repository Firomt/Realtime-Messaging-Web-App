<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Traits\FileUploadTrait;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class MessengerController extends Controller
{
    use FileUploadTrait;
    //
    function index(): View
    {
        return view('messenger.index');
    }

    /**search user profiles */
    function search(Request $request)
    {
        $getRecords = null;
        $input = $request['query'];
        $records = User::where('id', '!=', Auth::user()->id)
            ->where('name', 'LIKE', "%{$input}%")
            ->orWhere('user_name', 'LIKE', "%{$input}%")
            ->paginate(10);

        if ($records->total() < 1) {
            $getRecords .= "<p class='text-center'>Nothing to show!</p>";
        }
        foreach ($records as $record) {
            $getRecords .= view('messenger.components.search-item', compact('record'))->render();
        }

        return response()->json([
            'records' => $getRecords,
            'last_page' => $records->lastPage()

        ]);
    }

    //fetch user by id
    function fetchIdInfo(Request $request)
    {
        $fetch = User::where('id', $request['id'])->first();

        return response()->json([
            'fetch' => $fetch

        ]);
    }

    function sendMessage(Request $request)
    {
        $request->validate([
            //'message' => ['required'],
            'id' => ['required', 'integer'],
            'attachment' => ['nullable', 'max:1024', 'image']
        ]);

        //store the message in database
        $attachmentPath = $this->uploadFile($request, 'attachment');
        $message = new Message();
        $message->from_id = Auth::user()->id;
        $message->to_id = $request->id;
        $message->body = $request->message;
        if ($attachmentPath) $message->attachment = json_encode($attachmentPath);
        $message->save();

        return response()->json([
            'message' => $message->attachment ? $this->messageCard($message, true) : $this->messageCard($message),
            'tempID' => $request->temporaryMsgId
        ]);
    }

    function messageCard($message, $attachment = false)
    {
        return view('messenger.components.message-card', compact('message', 'attachment'))->render();
    }

    //fetch messages from db
    function fetchMessages(Request $request)
    {
        $messages = Message::where('from_id', Auth::user()->id)->where('to_id', $request->id)
            ->orWhere('from_id', $request->id)->where('to_id', Auth::user()->id)
            ->latest()->paginate(20);

        $response = [
            'last_page' => $messages->lastPage(),
            'last_message' => $messages->last(),
            'messages' => ''
        ];

        if (count($messages) < 1) {
            $response['messages'] = "<div class='d-flex justify-content-center align-items-center h-100'><p>Say 'Hi' to start chatting</p> </div>";
            return response()->json($response);
        }

        $allMessages = '';
        foreach ($messages->reverse() as $message) {
            $allMessages .= $this->messageCard($message, $message->attachment ? true : false);
        }

        $response['messages'] = $allMessages;

        return response()->json($response);
    }

    //fetch contacts from database
    function fetchContacts(Request $request)
    {
        $users = Message::join('users', function ($join) {
            $join->on('messages.from_id', '=', 'users.id')
                ->orOn('messages.to_id', '=', 'users.id');
        })
            ->where(function ($q) {
                $q->where('messages.from_id', Auth::user()->id)
                    ->orWhere('messages.to_id', Auth::user()->id);
            })
            ->where('users.id', '!=', Auth::user()->id)
            ->select('users.*', DB::raw('MAX(messages.created_at) max_created_at'))
            ->orderBy('max_created_at', 'desc')
            ->groupBy('users.id')
            ->paginate(10);

        if(count($users) > 0) {
            $contacts = '';
            foreach($users as $user) {
                $contacts .= $this->getContactItem($user);
            }

             return $contacts;
        }


    }

    function getContactItem($user)
    {
        $lastMessage = Message::where('from_id', Auth::user()->id)->where('to_id', $user->id)
            ->orWhere('from_id', $user->id)->where('to_id', Auth::user()->id)
            ->latest()->first();

        $unseenCounter = Message::where('from_id', $user->id)->where('to_id', Auth::user()->id)->where('seen', 0)
            ->count();


        return view('messenger.components.contact-list-item', compact('lastMessage', 'unseenCounter', 'user'))->render();
    }
}
