/*set up variables*/
var notification_interval;
var tile_updaters = {};
var _csrfToken = $('meta[name=_csrfToken]').attr('content');

/*
Function called by index.php on load.
Loads all components and sets up the interface
*/

function init(){
    window.location = '#';
    replace_setInterval();
    replace_AJAX();
    notification_handler();
    setup_key_handerls();
    load_tiles();
    setup_window_listeners();
    populate_hidden_tiles();
}




/**
* Function to send a notification
* @param  {string} message The notification text
* @param  {string} sender  optional: infusion name
* @param  {string} color   optional: highlight color
* @return {boolean}         [description]
*/
function notify(message, sender, color){
    $.post("/includes/api/statusbar_handler.php?action=send_notification", {notification: message});
    console.log(sender + " " + color);
    if(sender !== undefined){
        if(color !== undefined){
            $("div[id='"+sender+"']").css('box-shadow', '2px 2px 50px 2px '+color+' inset');
        }else{
            $("div[id='"+sender+"']").css('box-shadow', '2px 2px 50px 2px green inset');  
        }
    }
    return true;
}

/*
Function to clear notifications
*/
function clear_notifications(){
    toggle_notifications();
    $.get('/includes/api/statusbar_handler.php?action=clear_notifications', function(){
        $(".notification_img").hide();
        $(".notifications").html("");
        $("#num_notifications").text("-");   
    });
}


/*
Function to handle notifications
and update the status bar.
*/
function notification_handler(){
    clearInterval(notification_interval);
    notification_interval = setInterval(function(){
        $.get("/includes/api/statusbar_handler.php", {action: "get_status_bar"}, function(data){
            data = JSON.parse(data);
            $(".statusBar_clock").html(data[0]);

            var notifications = data[1];
            if (notifications.length == 0){
                $("#num_notifications").text("-");
                $(".notification_img").css('visibility', 'hidden');;
            }else{
                if (notifications.length != $("#num_notifications").text()) {
                    $(".notification_img").css('visibility', 'visible');;
                }
                $("#num_notifications").text(notifications.length);
                $(".notifications").html("");
                for (var i = 0; i < notifications.length; i++) {
                    $(".notifications").prepend("<div class='notification'>"+notifications[i]['notification']+"</div>");
                }
            }
        });
    }, 2800);

}



function load_tiles(){

    $.get("/includes/api/tile_handler.php", {action: "get_tiles"})
    .done(function( data ) {
        if(data != "none"){
            var tiles = jQuery.parseJSON(data);
            for (var tile in tiles) {
                draw_small_tile(tile, tiles[tile]);
            }  
        }
    })
    .fail(function(){load_tiles();});
}


/*
Function to draw small tiles by name.
This also sets up click handlers and updaters.
*/
function draw_small_tile(name, type){
    var present = false;
    $(".tile").each(function(){
        if($(this).attr('id') == name) present = true;
    });
    if(present) return false;
    $(".tiles_wrapper").append('<div class="tile" id="'+name+'"></div>');

    $.get('/components/'+type+'/'+name+'/handler.php', {action: "get_small_tile"}, function(return_data){
        var data = jQuery.parseJSON(return_data);

        $("div[id='"+name+"']").append('<div class="tile_title_wrapper"><span class="tile_title" id="'+name+'_title"><b>'+data['title']+'</b></span><span class="tile_remove" id="'+name+'_remove">[-]</span></div>');
        $("div[id='"+name+"']").append('<div class="tile_content"></div>');
        update_tile(name, type);

        $("[id='"+name+"_remove']").bind('click', function() {
            hide_small_tile(name, true);
        });

        $("[id='"+name+"_title']").bind('click', function() {
            if($('.tile_expanded').css('visibility') == 'hidden'){
                draw_large_tile(name, type);
            }
        });

        //Setup updaters
        clearInterval(tile_updaters[name]);
        if(data['update'] == 'true'){
            $("div[id='"+name+"']").bind('focusin', function(){
                var updater = tile_updaters[name];
                window.clearInterval(updater);
            });

            $("div[id='"+name+"']").bind('focusout', function(){
                clearInterval(tile_updaters[name]);
                tile_updaters[name] = setInterval(function(){
                    update_tile(name, type);
                }, 5000);
            });

            clearInterval(tile_updaters[name]);
            tile_updaters[name] = setInterval(function(){
                update_tile(name, type);
            }, 5000);
        }
    });
    return true;
}


/*
Function to hide the small tiles.
Also adds the tile to the bottom bar.
*/
function hide_small_tile(name, persistent){
    clearInterval(tile_updaters[name]);
    $("#"+name).remove();
    if(persistent == true){
        add_hidden_tile(name);
        $.get("/includes/api/tile_handler.php?action=hide_tile&tile="+name);
    }
}


/*
Populate the hidden bar with hidden tiles.
*/
function populate_hidden_tiles(){

    $.get("/includes/api/tile_handler.php", {action: "get_hidden_tiles"})
    .done(function( data ) {
        if(data != "none"){
            var tiles = jQuery.parseJSON(data);
            tiles.forEach(function(tile){
                add_hidden_tile(tile);
            });  
        }
    })
    .fail(function(){populate_hidden_tiles();});
}


/*
TODO
*/
function add_hidden_tile(tile){
    if($("#"+tile+"_hidden").length != 0){
        return false;
    }
    if (!$('.hidden_bar').children().length) {
        $('.hidden_bar_link').html('&#9650;');
        if (!$('.hidden_bar_link').is(':visible')) {
            $('.hidden_bar').show();
        }
    }
    $(".hidden_bar").append("<div class='hidden_bar_item' id='"+tile+"_hidden'>"+tile+"</div>");
    $("[id='"+tile+"_hidden']").bind('click', function() {
        $.ajaxSetup({async:false});
        $.get("/includes/api/tile_handler.php?action=unhide_tile&tile="+tile);
        $.ajaxSetup({async:true});
        $("[id='"+tile+"_hidden']").remove();
        if (!$('.hidden_bar').children().length) {
            $('.hidden_bar').hide();
            $('.hidden_bar_link').html('');
        }
        load_tiles();
    });
    return true;
}


/*
Function to load and update a tiles content
*/
function update_tile(name, type, data){
    $.get('/components/'+type+'/'+name+'/handler.php', {action: "update_small_tile"}, function(data){
        $("div[id='"+name+"'] .tile_content").html(data);
    });
}


/**
* Refreshes the small tile of an infusion
* given it's name.
* @param  {string} name Name of the infusion 
* @param  {string} type optional: only for system infusions
*/
function refresh_small(name, type){
    update_tile(name, (type == 'sys' ? "system" : "infusions"), "");
}


/**
* Creates a popup with a given message.
* The message may contain html, javascript,
* and css.
* @param  {string} message Message to popup
*/
function popup(message){
    $('.popup_content').html(message);
    $('.popup').css('visibility', 'visible');
}


/*
TODO
*/
function close_popup(){
    $('.popup').css('visibility', 'hidden');
    $('.popup_content').html('');
}


/*
TODO
*/
function draw_large_tile(name, type, data){
    $("div[id='"+name+"']").css('box-shadow', 'none');
    $('.tile_expanded').css('visibility', 'visible');
    $('.tile_expanded').html('<center><div class="entropy">Entropy bunny is working..</div><div class="entropy" id="1"><pre>(\\___/)\n(=\'.\'=)\n(")_(")</div><div class="entropy" id="2" style="display: none"><pre> /)___(\\ \n(=\'.\'=)\n(")_(")</div><script type="text/javascript">$(function (){interval = setInterval(function(){$(".entropy#1").toggle(); $(".entropy#2").toggle();}, 200);});</script>');
    $.get('/components/'+type+'/'+name+'/handler.php?'+data, {action: "get_large_tile"}, function(data){
        clearInterval(interval);
        $('.tile_expanded').html('<a id="close" href="JAVASCRIPT: hide_large_tile()">[X]</a>'+data);
    });
}

/*
TODO
*/
function hide_large_tile(){
    $('.tile_expanded').html(' ');
    $('.tile_expanded').css('visibility', 'hidden');
}


/*
TODO
*/
function setup_key_handerls(){
//This handler listens for the escape key
$(document).keyup(function(e){
    if(e.keyCode == 27){
        if($(".popup").css('visibility') !== 'hidden'){
            close_popup();
        }else{
            hide_large_tile();
        }
    }
});
}


/*
TODO
*/
function setup_window_listeners(){
    //This handler listens for any change in the URLs hash values
    handle_hash_change(window.location.hash);
    $(window).on('hashchange', function() {
        handle_hash_change(location.href.split("#")[1]);
    });

    $(document).on("click", "help", function(){
        var help = $(this).attr('id').split(':');
        show_help(help[0], help[1]);
    });
}


/** TODO
 * [show_help description]
 * @param  {[type]} infusion [description]
 * @param  {[type]} key      [description]
 * @return {[type]}          [description]
 */
function show_help(infusion, key) {
    var load_failed = [];
    var get_help = function(help_data) {
        try {
            help_json = JSON.parse(help_data);
        } catch (e) {
            load_failed.push(true);
            if (load_failed[0] && load_failed[1]) {
                popup("<center><span class='error'>Failed to parse JSON. Either the help file is missing or it has a syntax error.<span></center>");
            }
            return;
        }
        if (help_json.hasOwnProperty(key)) {
            popup('<p>' + help_json[key]);
        } else {
            popup("<center><span class='error'>Help entry not found<span></center>");
        }
    }
    if (infusion != undefined && key != undefined) {
        $.get('/components/system/' + infusion + '/help.json?nocache=' + (new Date).getTime(), get_help);
        $.get('/components/infusions/' + infusion + '/help.json?nocache=' + (new Date).getTime(), get_help);
    } else {
        popup('<center>Malformed help link</center>');
    }
}


/*
TODO
*/
function handle_hash_change(hashValue){
    //[0]:type - [1]:infusion_name - [2]:action - [3]:data - [4]:callback_function 
    var hash_array = hashValue.replace(/#/g, '').split('/');
    if(hash_array.length == 5){
    //Correct size, carry on
    $.ajaxSetup({async:false});
    if(hash_array[0] == "usr"){
        $.get('/components/infusions/'+hash_array[1]+'/functions.php?'+hash_array[2]+'='+hash_array[3], function(data){
            try{
                window[hash_array[4]](data);
            }catch(err){
                console.log("Function not found");
            }
        });
    }else if(hash_array[0] == "sys"){
        $.get('/components/system/'+hash_array[1]+'/functions.php?'+hash_array[2]+'='+hash_array[3], function(data){
            try{
                window[hash_array[4]](data);
            }catch(err){
                console.log("Function not found");
            }
        });
    }
    $.ajaxSetup({async:true});
    }

    //reset url so that we can call the same link again.
    window.location='#';
}


function toggle_notifications(){
    if($(".notification_center").is(":visible")){
        $("#notification_toggle").html("&#x25B6;");
        $(".notification_center").fadeOut("fast");
    } else {
        $(".notification_img").hide();
        $("#notification_toggle").html("&#x25BC;");
        $(".notification_center").fadeIn("fast");
    }
}


function get_tab(link, callback) {
    $(".tabContainer").css({top: ($("#tabs_wrapper").position().top+62), left: 0});
    $.get(atob(link), function(data){
        $(".tabContainer").html(data);
        if (callback !== undefined) {
            callback();
        }
    });
}

function select_tab_content(tab) {
    $(".tabContainer").scrollTop(0);
    $('#tabs li a').addClass('inactive');
    tab.removeClass('inactive');
    get_tab(tab.attr('id'));
}

function refresh_current_tab(callback) {
    get_tab($("#tabs li a[class='']").attr("id"), callback);
}


function toggle_views(){
    if ($(".view_selection").is(":visible")) {
        $("#views_toggle").html("&#x25B6;");
        $(".view_selection").fadeOut("fast");
    } else {
        $("#views_toggle").html("&#x25BC;");
        $(".view_selection").fadeIn("fast");
    }
}

function select_view(view){
    toggle_views();
    if(view == "overlay"){
        if ($('.tiles').length){
            load_overlay();
            $('#views_text').text('Recon Mode');
        }
    }else if (view == "infusions"){
        if ($('.overlay').length){
            unload_overlay();
            $('#views_text').text('Infusions');
        }
    }
}


function load_overlay(){
    //remove updaters
    for (var key in tile_updaters) {
        clearInterval(tile_updaters[key]);
    }
    $('.tiles').remove();
    $('.hidden_bar').remove();
    $('.hidden_bar_mobile').remove();
    $('body').append('<div class="overlay"></div>');
    $.get('/overlay/overlay.php', function(data){
        $('.overlay').html(data);
        window.location = "#overlay";
    });
}

function unload_overlay(){
    $.ajaxSetup({async:true});
    $(".overlay").remove();
    $("body").append('<div class="tiles"> <div class="tiles_wrapper"> <div class="tile_expanded"></div> </div> </div> \
        <div class="hidden_bar"></div> <div class="hidden_bar_mobile"> <a href="#" onClick="toggle_hidden_bar_mobile()" class="hidden_bar_link"></a> </div>');
    window.location='#';
    load_tiles();
    populate_hidden_tiles();
}

function toggle_hidden_bar_mobile() {
    if ($('.hidden_bar').is(':visible')) {
        $(".hidden_bar_link").html('&#9650;');
    } else {
        $(".hidden_bar_link").html('&#9660;');
    }
    $('.hidden_bar').slideToggle('fast');
}

/**
* jQuery function to send any form over AJAX.
* This function must be called in the form
* of $(this).AJAXifyForm(callback)
* @param {[type]} funct [description]
*/
$.fn.AJAXifyForm = function(callback){
    this.each(function(i,el){
        var formData = new FormData();
        var checkbox_array = new Array();
        
        $("input,select,textarea",el).each(function(i,formEl){
            if(formEl.type == "file"){
                for(x=0; x<formEl.files.length; x++){
                    formData.append(formEl.name,formEl.files[x]);
                }
            }else if(formEl.type == "checkbox"){
                if(typeof checkbox_array[formEl.name] === "undefined"){
                    if(formEl.checked){
                        checkbox_array[formEl.name] = new Array();
                        checkbox_array[formEl.name].push(formEl.value);
                    }
                }else{
                    if(formEl.checked){
                        checkbox_array[formEl.name].push(formEl.value);
                    }
                }
            }else if(formEl.type == "radio"){
                if($(formEl).is(':checked')){
                    formData.append(formEl.name, formEl.value);
                }
            }else{
                formData.append(formEl.name, formEl.value);
            }
        });

        if(Object.keys(checkbox_array).length != 0){
            for (var key in checkbox_array) {
                formData.append(key,checkbox_array[key]);
            }
        }

        function ajaxify(url, data, type, success){
            $.ajax({
                statusCode: {
                    502: function() {
                        setTimeout(function () {
                            ajaxify(url, data, type, success);
                        }, 750);
                    }
                },
                url: url,
                data: data,
                cache: false,
                contentType: false,
                processData: false,
                async: false,
                type: type,
                success: callback
            });
        }

        ajaxify(el.action, formData, el.method, callback);

    });

return this;
}


/*
TODO
*/
function replace_setInterval(){
    window.old_setInterval = window.setInterval;

    window.setInterval = function(funct, time, type){
        switch(type){
            case 'large_tile':
                var condition = "$('.tile_expanded').css('visibility') == 'hidden'";
                break;
            case 'popup':
                var condition = "$('.popup').css('visibility') == 'hidden'";
                break;
            case 'overlay':
                var condition = "$('.overlay').length == 0";
                break;
            default:
                var condition = false;
        }

        return (function(){
            var id = window.old_setInterval(function(){
                if(eval(condition)) {
                    clearInterval(id);
                    return;
                }
                funct();
            }, time);
            return id;
        })();
    }
}


function replace_AJAX() {
    jQuery.ajax_orig = jQuery.ajax;
    jQuery.ajax = function(settings) {
        switch ($.type(settings.data)) {
            case 'object':
                if (settings.data.constructor === FormData) {
                    settings.data.append("_csrfToken", _csrfToken);
                } else {
                    settings.data._csrfToken = _csrfToken;    
                }
                break;
            case 'string':
                settings.data += "&_csrfToken=" + _csrfToken;
                break;
            default:
                settings.data = {};
                settings.data._csrfToken = _csrfToken;
        }
        return jQuery.ajax_orig(settings);
    }
}


/*
Function overriding jQuery's GET function. Handles 502 automatically.
*/
$.get=function ( url, data, callback, type ) {

    if ( jQuery.isFunction( data ) ) {
        type = type || callback;
        callback = data;
        data = undefined;
    }

    return jQuery.ajax({
        statusCode: {
            502: function() {
                setTimeout(function () {
                    $.get(url, data, callback, type);
                }, 750);
            }
        },
        url: url,
        type: 'GET',
        dataType: type,
        data: data,
        success: callback,
    });
}

