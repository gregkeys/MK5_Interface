// set up namespace for sharing across multiple files
var Pineapple = Pineapple || {};

(function (window, $, exports, undefined) {
    'use strict';

    /*set up variables*/
    var notification_interval,
        tile_updaters = [],
        _csrfToken = $('meta[name=_csrfToken]').attr('content'),
        infusions = {};

    $(document).ready(function () {
        /*
         Loads all components and sets up the interface
         */
        window.location = '#';
        replace_setInterval();
        replace_AJAX();
        notification_handler();
        setup_key_handerls();
        load_tiles();
        setup_window_listeners();
        populate_hidden_tiles();
    });


    /******* Start Internal Private Functions *******/

    /*
     Function to handle notifications
     and update the status bar.
     */
    function notification_handler() {
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


    /*
     TODO
     */
    function setup_key_handerls() {
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
    function setup_window_listeners() {
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


    /**
     * jQuery function to send any form over AJAX.
     * This function must be called in the form
     * of $(this).AJAXifyForm(callback)
     * @param {[type]} funct [description]
     */
    $.fn.AJAXifyForm = function(callback){
        this.each(function(i,el){
            var formData = new FormData(),
                checkbox_array = new Array(),
                x;

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
    };


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
            success: callback
        });
    };


    /******* Start External Public Functions *******/


    /*
     Function to get all time details.
     */
     exports.load_tiles = function() {
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
    };

    /*
     Populate the hidden bar with hidden tiles.
     */
     exports.populate_hidden_tiles = function() {
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
    };


    /** TODO
     * [show_help description]
     * @param  {[type]} infusion [description]
     * @param  {[type]} key      [description]
     * @return {[type]}          [description]
     */
     exports.show_help = function(infusion, key) {
        var load_failed = [],
            help_json;
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
        };
        if (infusion != undefined && key != undefined) {
            $.get('/components/system/' + infusion + '/help.json?nocache=' + (new Date).getTime(), get_help);
            $.get('/components/infusions/' + infusion + '/help.json?nocache=' + (new Date).getTime(), get_help);
        } else {
            popup('<center>Malformed help link</center>');
        }
    };


    /**
     * Register Infusion
     */
    exports.register = function(name, infusion){
        if(infusion.hasOwnProperty(name) === false){
            infusion[name] = infusion;
        }
    };


    /*
     Function to set notifications.
     */
    exports.notify = function (message, sender, color) {
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
    };


    /*
     Function to clear notifications
     */
     exports.clear_notifications = function(){
        toggle_notifications();
        $.get('/includes/api/statusbar_handler.php?action=clear_notifications', function(){
            $(".notification_img").hide();
            $(".notifications").html("");
            $("#num_notifications").text("-");
        });
    };


    /*
     Function to draw small tiles by name.
     This also sets up click handlers and updaters.
     */
    exports.draw_small_tile = function (name, type) {
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
    };


    /*
     Function to hide the small tiles.
     Also adds the tile to the bottom bar.
     */
    exports.hide_small_tile = function (name, persistent) {
        clearInterval(tile_updaters[name]);
        $("#"+name).remove();
        if(persistent == true){
            add_hidden_tile(name);
            $.get("/includes/api/tile_handler.php?action=hide_tile&tile="+name);
        }
    };


    /*
     TODO
     */
    exports.add_hidden_tile = function (tile) {
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
    };


    /*
     Function to load and update a tiles content
     */
    exports.update_tile = function (name, type, data) {
        $.get('/components/'+type+'/'+name+'/handler.php', {action: "update_small_tile"}, function(data){
            $("div[id='"+name+"'] .tile_content").html(data);
        });
    };


    /*
     TODO
     */
    exports.refresh_small = function (name, type) {
        update_tile(name, (type == 'sys' ? "system" : "infusions"), "");
    };


    /*
     TODO
     */
    exports.popup = function (message) {
        $('.popup_content').html(message);
        $('.popup').css('visibility', 'visible');
    };


    /*
     TODO
     */
    exports.close_popup = function () {
        $('.popup').css('visibility', 'hidden');
        $('.popup_content').html('');
    };


    /*
     TODO
     */
    exports.draw_large_tile = function (name, type, data) {
        $("div[id='"+name+"']").css('box-shadow', 'none');
        $('.tile_expanded').css('visibility', 'visible');
        $('.tile_expanded').html('<center><div class="entropy">Entropy bunny is working..</div><div class="entropy" id="1"><pre>(\\___/)\n(=\'.\'=)\n(")_(")</div><div class="entropy" id="2" style="display: none"><pre> /)___(\\ \n(=\'.\'=)\n(")_(")</div><script type="text/javascript">$(function (){interval = setInterval(function(){$(".entropy#1").toggle(); $(".entropy#2").toggle();}, 200);});</script>');
        $.get('/components/'+type+'/'+name+'/handler.php?'+data, {action: "get_large_tile"}, function(data){
            clearInterval(interval);
            $('.tile_expanded').html('<a id="close" href="JAVASCRIPT: hide_large_tile()">[X]</a>'+data);
        });
    };


    /*
     TODO
     */
    exports.hide_large_tile = function () {
        $('.tile_expanded').html(' ');
        $('.tile_expanded').css('visibility', 'hidden');
    };


    /*
     TODO
     */
    exports.handle_hash_change = function (hashValue) {
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
    };


     exports.toggle_notifications = function(){
        if($(".notification_center").is(":visible")){
            $("#notification_toggle").html("&#x25B6;");
            $(".notification_center").fadeOut("fast");
        } else {
            $(".notification_img").hide();
            $("#notification_toggle").html("&#x25BC;");
            $(".notification_center").fadeIn("fast");
        }
    };


     exports.get_tab = function(link, callback) {
        $(".tabContainer").css({top: ($("#tabs_wrapper").position().top+62), left: 0});
        $.get(atob(link), function(data){
            $(".tabContainer").html(data);
            if (callback !== undefined) {
                callback();
            }
        });
    };


     exports.select_tab_content = function(tab) {
        $(".tabContainer").scrollTop(0);
        $('#tabs li a').addClass('inactive');
        tab.removeClass('inactive');
        get_tab(tab.attr('id'));
    }


     exports.refresh_current_tab = function(callback) {
        get_tab($("#tabs li a[class='']").attr("id"), callback);
    };


     exports.toggle_views = function(){
        if ($(".view_selection").is(":visible")) {
            $("#views_toggle").html("&#x25B6;");
            $(".view_selection").fadeOut("fast");
        } else {
            $("#views_toggle").html("&#x25BC;");
            $(".view_selection").fadeIn("fast");
        }
    };


     exports.select_view = function(view){
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
    };


     exports.toggle_hidden_bar_mobile = function() {
        if ($('.hidden_bar').is(':visible')) {
            $(".hidden_bar_link").html('&#9650;');
        } else {
            $(".hidden_bar_link").html('&#9660;');
        }
        $('.hidden_bar').slideToggle('fast');
     };

})(window, jQuery, Pineapple);
