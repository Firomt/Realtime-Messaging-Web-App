
<div class="wsus__single_chat_area">
    <div class="wsus__single_chat chat_right">
        <p class="messages">{{ $message->body }}</p>
        <span class="time"> {{ timeAgo($message->created_at)}}</span>
        <a class="venobox" data-gall="gallery01" href="images/chat_img.png">
            <img src="images/chat_img.png" alt="gallery1" class="img-fluid w-100">
        </a>
        
    </div>
</div>
