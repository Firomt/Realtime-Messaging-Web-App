<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use Illuminate\Contracts\View\View;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MessengerController extends Controller
{
    //
    function index() : View {
        return view('messenger.index');

    }

    /**search user profiles */
    function search(Request $request){
        $getRecords= null;
        $input = $request['query'];
        $records = User::where('id', '!=',Auth::user()->id)
                ->where('name', 'LIKE', "%{$input}%")
                ->orWhere('user_name', 'LIKE', "%{$input}%")
                ->paginate(10);

        if($records->total() < 1){
            $getRecords .= "<p class='text-center'>Nothing to show!</p>";

        }
        foreach($records as $record){
            $getRecords .= view('messenger.components.search-item', compact('record'))->render();
        }

        return response()->json([
            'records' => $getRecords,
            'last_page' => $records->lastPage()

        ]);
    }

    //fetch user by id
    function fetchIdInfo(Request $request){
        $fetch = User::where('id', $request['id'])->first();

        return response()->json([
            'fetch' => $fetch

        ]);

    }

    function sendMessage(Request $request){
        $request->validate([
            'message' => ['required'],
            'id' => ['required', 'integer'],
            'temporaryMsgId' => ['required']
        ]);

        //store the message in database
        $message = new Message();
        $message->from_id = Auth::user()->id;
        $message->to_id =$request->id;
        $message->body = $request->message;
        $message->save();

        return response()->json([
            'message' => $this->messageCard($message),
            'tempID' => $request->temporaryMsgId
        ]);
    }

   function messageCard($message){
        return view('messenger.components.message-card', compact('message'))->render();
   }
}
