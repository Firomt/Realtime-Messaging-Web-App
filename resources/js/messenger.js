/**
 *
 * -----------------------------
 *  Global Variables
 * ------------------------------
 */

var temporaryMsgId = 0;

const messageForm = $(".message-form"),
      messageInput = $(".message-input"),
      messageBoxContainer = $(".wsus__chat_area_body"),
      csrf_token = $("meta[name=csrf_token]").attr("content");

const getMessengerId = () => $("meta[name=id]").attr("content");
const setMessengerId = (id) => $("meta[name=id]").attr("content", id);



/**a
 *
 * -----------------------------
 *  Reusable Functions
 * ------------------------------
 *
 */
function enableChatBoxLoader(){
    $(".wsus__message_paceholder").removeClass('d-none');


}

function disableChatBoxLoader(){
    $(".wsus__message_paceholder").addClass('d-none');
    $(".wsus__chat_app").removeClass('show_info');
    $(".wsus__message_paceholder_blank").addClass('d-none');



}


function imagePreview (input, selector){
         if(input.files && input.files[0]){
            var render = new FileReader();

            render.onload = function(e) {
                 $(selector).attr('src', e.target.result)
            }

            render.readAsDataURL(input.files[0]);
         }
}

let searchPage = 1;
let noMoreDataSearch = false;
let searchTempVal = "";
let setSearchLoading = false;
function searchUsers(query){

    if(query != searchTempVal){   /** code logic that enables showing search result for new search queries other than
                                    for the first query note: search result was only working for the first query only */
         searchPage = 1;
         noMoreDataSearch = false;
    }

    searchTempVal = query;


    if( !setSearchLoading && !noMoreDataSearch){
    $.ajax({
        method: 'GET',
        url: '/messenger/search',
        data: {query: query,page:searchPage},
        beforeSend: function(){
            setSearchLoading = true;
            let loader = `
             <div class="text-center search-loader">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>

            `
            $('.user_search_list_result').append(loader);

        },

        success: function(data){
            setSearchLoading = false;
            $('.user_search_list_result').find('.search-loader').remove();
            if(searchPage < 2){
                $('.user_search_list_result').html(data.records)

            }else{
                $('.user_search_list_result').append(data.records)
            }

            noMoreDataSearch = searchPage >= data?.last_page

            if(!noMoreDataSearch) searchPage +=1;

        },

        error: function(xhr, status, error){
            setSearchLoading = false;
            $('.user_search_list_result').find('.search-loader').remove();

        }

    })
}

}
function actionOnScroll(selector,   callback, topScroll = false){
    $(selector).on('scroll', function(){
        let element = $(this).get(0);
        const condition = topScroll ? element.scrollTop == 0 :
        element.scrollTop + element.clientHeight >= element.scrollHeight;

        if(condition){
            callback();
        }
    })

}

function debounce(callback, delay){
    let timerId;
    return function(...args){
        clearTimeout(timerId);
        timerId = setTimeout(()=>{
            callback.apply(this, args);
        }, delay)
    }
 }

 /**
 *
 * -----------------------------
 *  Fetch id data of user and update the view
 * ------------------------------
 */

function IDinfo(id){
    $.ajax({
        method: 'GET',
        url: '/messenger/id-info',
        data: {id:id},
        beforeSend: function(){
            NProgress.start();
            enableChatBoxLoader();

        },
        success: function(data){

           //fetch messages
           fetchMessages(data.fetch.id, true);
           $(".messenger-header").find("img").attr("src", data.fetch.avatar);
           $(".messenger-header").find("h4").text(data.fetch.name);
           $(".messenger-info-view .user_photo").find("img").attr("src",data.fetch.avatar);
           $(".messenger-info-view").find(".user_name").text(data.fetch.name);
           $(".messenger-info-view").find(".user_unique_name").text(data.fetch.user_name);
           NProgress.done();



        },

        error: function(xhr, status, error){
            disableChatBoxLoader();

        }
    });

}

 /**
 *
 * -----------------------------
 *  Send Message
 * ------------------------------
 */

function sendMessage() {
     temporaryMsgId += 1;
     let tempID = `temp_${temporaryMsgId}`;
     let hasAttachment = !!$(".attachment-input").val();
     const inputValue = messageInput.val();

     if (inputValue.length > 0 || hasAttachment ) {
        const formData = new FormData($(".message-form")[0]);
        formData.append("id", getMessengerId());
        formData.append("temporaryMsgId", tempID);
        formData.append("_token", csrf_token);

        $.ajax({
            method: "POST",
            url: "/messenger/send-message",
            data: formData,
            dataType:"JSON",
            processData: false,
            contentType: false,
            beforeSend: function(){

                // add temp message on dom
                if(hasAttachment){
                    messageBoxContainer.append(sendTempMessageCard(inputValue, tempID, true))
                } else {
                    messageBoxContainer.append(sendTempMessageCard(inputValue, tempID))
                }
                scrollToBottom(messageBoxContainer);
               messageFormReset();
            },
            success: function(data){
                const tempMsgCardElement = messageBoxContainer.find(`.message-card[data-id=${data.tempID}]`);

                tempMsgCardElement.before(data.message);
                tempMsgCardElement.remove();
            },
            error: function(xhr, status, error){

            }
        })
     }
}

function sendTempMessageCard(message, tempId, attachment = false) {

    if(attachment){
        return `
              <div class="wsus__single_chat_area message-card" data-id="${tempId}">
                <div class="wsus__single_chat chat_right">
                    <div class="pre_loader">
                        <div class="spinner-border text-light" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </div>
                    ${message.length > 0 ? `<p class="messages">${message}</p>`: ''}

                    <span class="clock"><i class="fas fa-clock"></i> now</span>
                    <a class="action" href="#"><i class="fas fa-trash"></i></a>
                </div>
            </div>
        `
    } else{

        return `
        <div class="wsus__single_chat_area message-card" data-id="${tempId}">
                <div class="wsus__single_chat chat_right">
                    <p class="messages">${message}</p>
                    <a class="venobox" data-gall="gallery01" href="images/chat_img.png">
                        <img src="images/chat_img.png" alt="gallery1" class="img-fluid w-100">
                    </a>
                    <span class="clock"><i class="fas fa-clock"></i> now</span>
                    <a class="action" href="#"><i class="fas fa-trash"></i></a>
                </div>
            </div>
    `
    }


}

function messageFormReset(){
    $('.attachment-block').addClass('d-none');
    $('.emojionearea-editor').text("");
    messageForm.trigger("reset");
}

/**
 *
 * -----------------------------
 *  Fetch messages from database
 * ------------------------------
 */
let messagesPage = 1;
let noMoreMessages = false;
let messagesLoading = false;
function fetchMessages(id, newFetch = false){
    if(newFetch){
        messagesPage = 1;
        noMoreMessages = false;
    }
    if(!noMoreMessages && !messagesLoading){
    $.ajax({
        method: "GET",
        url: "/messenger/fetch-messages",
        data: {
            _token: csrf_token,
            id: id,
            page: messagesPage
        },
        beforeSend: function(){
            messagesLoading = true;
            let loader = `
             <div class="text-center messages-loader">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            `;
            messageBoxContainer.prepend(loader);
        },
        success: function(data) {
            messagesLoading = false;
            messageBoxContainer.find(".messages-loader").remove();   //remove loader


            if(messagesPage == 1){
                messageBoxContainer.html(data.messages);
                scrollToBottom(messageBoxContainer);
            }
            else{
                const lastMsg = $(messageBoxContainer).find(".message-card").first();
                const curOffset = lastMsg.offset().top - messageBoxContainer.scrollTop();
                messageBoxContainer.prepend(data.messages);
                messageBoxContainer.scrollTop(lastMsg.offset().top- curOffset);
            }


            //pagination lock and page increment
            noMoreMessages = messagesPage >= data?.last_page;
            if(!noMoreMessages) messagesPage += 1;

            disableChatBoxLoader();

        },
        error: function(xhr, status, error) {
            console.log(error);
        }
    })

}
}


/**
 *
 * -----------------------------
 *  Fetch contact list from database
 * ------------------------------
 */
let contactsPage = 1;
let noMoreContacts = false;
let contactLoading = false;
function getContacts() {
    if (!contactLoading && !noMoreContacts){
    $.ajax({
        method: "GET",
        url: "messenger/fetch-contacts",
        data: {page: contactsPage},
        success: function(data) {

        },
        error: function(xhr, status, error){

        }
    })
}
}

/**
 *
 * -----------------------------
 *  Slide to bottom on action
 * ------------------------------
 */
function scrollToBottom(container){
    $(container).stop().animate({
        scrollTop: $(container)[0].scrollHeight
    });
}




/**
 *
 * -----------------------------
 *  On Dom Load
 * ------------------------------
 */

getContacts();

 $(document).ready(function(){
    $('#select_file').change(function(){
           imagePreview(this, '.profile-image-preview');

    });


    //search action on keyup
    const debouncedSearch = debounce(function(){
        const value = $('.user_search').val();
        searchUsers(value);

    },500);
    $('.user_search').on('keyup', function(){
        let query = $(this).val();
        if(query.length > 0){
            debouncedSearch();
        }

    })

    //search pagination
    actionOnScroll(".user_search_list_result", function(){
        let value = $('.user_search').val();
        searchUsers(value);


    })

    //click action
    $("body").on("click", ".messenger-list-item", function(){
         const dataId = $(this).attr("data-id");
         setMessengerId(dataId);
         IDinfo(dataId);
    })

    //send message
    $(".message-form").on("submit", function(e) {
        e.preventDefault();
        sendMessage();

    })

    // send attachment
    $('.attachment-input').change(function(){
        imagePreview(this, '.attachment-preview');
        $('.attachment-block').removeClass('d-none');

    });

    $(".cancel-attachment").on('click', function(){
        messageFormReset();
    });

    // message pagination
    actionOnScroll(".wsus__chat_area_body", function(){
        fetchMessages(getMessengerId());
    }, true)

 });
