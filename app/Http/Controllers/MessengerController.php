<?php

namespace App\Http\Controllers;

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
                ->get();
        foreach($records as $record){
            $getRecords .= view('messenger.components.search-item', compact('record'))->render();
        }

        return response()->json([
            'records'=>$getRecords

        ]);
    }
}
