var dn_ctrp_sndcld_nowplay_widget;
var dn_ctrp_sndcld_widgets = [];
var dn_ctrp_sndcld_play_button;
var dn_ctrp_sndcld_scroll_timer;
var $dn_ctrp_sndcld_title_span;
var dn_ctrp_sndcld_scroll_param;
const dn_ctrp_sndcld_panel_class = jQuery("#dn_ctrp_sndcld_CtrPanel").attr("class");

/* 初期化処理 */
jQuery(function($){
    /* SoundCloudWidgetを探して、イベント登録をする */
    dn_ctrp_sndcld_play_button = $("#dn_ctrp_sndcld_playbutton");
    $("iframe[src*='soundcloud.com']").each(function(i,elem){
        var w = SC.Widget(elem);
        dn_ctrp_sndcld_widgets.push(w);
        w.bind(SC.Widget.Events.PLAY,dn_ctrp_sndcld_played);
        w.bind(SC.Widget.Events.PAUSE,dn_ctrp_sndcld_paused);
        w.bind(SC.Widget.Events.FINISH,dn_ctrp_sndcld_finished);
    });

    /* 再生パネルの各ボタンのイベント登録 */
    dn_ctrp_sndcld_play_button.on('click' , function(){
        dn_ctrp_sndcld_push_play_pause();
    });
    $("#dn_ctrp_sndcld_prevbutton").on('click' , function(){
        dn_ctrp_sndcld_go_prev();
    });
    $("#dn_ctrp_sndcld_nextbutton").on('click' , function(){
        dn_ctrp_sndcld_go_next();
    });
    $("#dn_ctrp_sndcld_hidebutton").on('click' , function(){
        dn_ctrp_sndcld_hideSC();
    });

    /* タイトルスクロール用変数の取得 */
    $dn_ctrp_sndcld_title_span = $("#dn_ctrp_sndcld_title span");
    dn_ctrp_sndcld_scroll_param = "margin-left";
    if(dn_ctrp_sndcld_panel_class == "dn_ctrp_sndcld_cls_left" || dn_ctrp_sndcld_panel_class == "dn_ctrp_sndcld_cls_right"){
        dn_ctrp_sndcld_scroll_param = "margin-top";
    }
});

/* playイベントのコールバック */
function dn_ctrp_sndcld_played(){
    dn_ctrp_sndcld_play_button.removeClass("stop").addClass("play");
    dn_ctrp_sndcld_nowplay_widget = this;
    /* タイトル、アートワーク取得・表示 */
    dn_ctrp_sndcld_nowplay_widget.getCurrentSound(function(s){
        jQuery(function($){
            if('artwork_url' in s){
                $("#dn_ctrp_sndcld_artwork").css(
                    {backgroundImage:'url("' + s.artwork_url + '")'}
                );
            }
            try{
                //読み込み切れてないタイミングで、user.permalink_urlが取得できないパターンがあるのでtry catchしとく
                $("#dn_ctrp_sndcld_title span").html(s.title + ' (via <a href="' + s.user.permalink_url + '" target="_blank">' + s.user.username + '</a>) ');
            }catch( e ){
                $("#dn_ctrp_sndcld_title span").html(s.title);
            }

            // タイトルスクロールの開始
            dn_ctrp_sndcld_titlescroll();
        });
    });
}

/* タイトルをスクロールする関数 */
function dn_ctrp_sndcld_titlescroll(){
    clearInterval(dn_ctrp_sndcld_scroll_timer);
    dn_ctrp_sndcld_scroll_timer = setInterval( (function timerfunc(){
        dn_ctrp_sndcld_stoptimer();
        if(dn_ctrp_sndcld_panel_class == "dn_ctrp_sndcld_cls_left" || dn_ctrp_sndcld_panel_class == "dn_ctrp_sndcld_cls_right"){
            let scrollLen = $dn_ctrp_sndcld_title_span.height();
            $dn_ctrp_sndcld_title_span.animate({ "margin-top" : "0"} , 3000 , "linear").animate({ "margin-top" : "-" + (scrollLen + 20) + "px"} , 10000 , "linear");
        }else{
            let scrollLen = $dn_ctrp_sndcld_title_span.width();
            $dn_ctrp_sndcld_title_span.animate({ "margin-left": "0"} , 3000 , "linear").animate({ "margin-left" : "-" + (scrollLen + 20) + "px"} , 10000 , "linear");
        }
        return timerfunc;
    }() ),13000);
}

/* タイトルスクロール用のタイマーを止める関数。clearIntervalを呼ぶ必要があればtrueを引数に渡す */
function dn_ctrp_sndcld_stoptimer(isclearinterval = false){
    if(isclearinterval) clearInterval(dn_ctrp_sndcld_scroll_timer);
    $dn_ctrp_sndcld_title_span.stop(true, true);
    $dn_ctrp_sndcld_title_span.css( dn_ctrp_sndcld_scroll_param ,'0');
}

/* pauseイベントのコールバック */
function dn_ctrp_sndcld_paused(){
    if(this === dn_ctrp_sndcld_nowplay_widget){
        dn_ctrp_sndcld_play_button.removeClass("play").addClass("stop");
        dn_ctrp_sndcld_stoptimer(true);
    }
}

/* finishイベントのコールバック */
function dn_ctrp_sndcld_finished(){
    dn_ctrp_sndcld_stoptimer(true);
    /* playlistだと、widgetが自動で次を再生するため、JSで次を再生する必要がない */
    dn_ctrp_sndcld_hasNextInList(function(res){
        if(!res) dn_ctrp_sndcld_go_next();
    });
}

/* 再生、停止ボタンクリック時動作 */
function dn_ctrp_sndcld_push_play_pause(){
    if( ! dn_ctrp_sndcld_nowplay_widget ){
        dn_ctrp_sndcld_widgets[0].play();
    }
    else{
        dn_ctrp_sndcld_nowplay_widget.isPaused(function(flg){
            if(flg) dn_ctrp_sndcld_nowplay_widget.play();
            else dn_ctrp_sndcld_nowplay_widget.pause();
        });
    }
}

/* prevボタンクリック時動作 */
function dn_ctrp_sndcld_go_prev(){
    if( dn_ctrp_sndcld_nowplay_widget ){
        dn_ctrp_sndcld_nowplay_widget.getCurrentSoundIndex(function(index){
            if(index == 0){
                dn_ctrp_sndcld_widgets.forEach(function(elem,i){
                    if(dn_ctrp_sndcld_nowplay_widget === elem){
                        if(i>0) dn_ctrp_sndcld_widgets[i-1].play();
                    }
                });
            }else{
                dn_ctrp_sndcld_nowplay_widget.prev();
            }
        });
    }
}

/* nextボタンクリック時動作 */
function dn_ctrp_sndcld_go_next(){
    if( dn_ctrp_sndcld_nowplay_widget ){
        dn_ctrp_sndcld_hasNextInList(function(res){
            if(res){
                dn_ctrp_sndcld_nowplay_widget.next();
            }else{
                dn_ctrp_sndcld_widgets.forEach(function(elem,i){
                    if(dn_ctrp_sndcld_nowplay_widget === elem){
                        if(i+1 < dn_ctrp_sndcld_widgets.length) dn_ctrp_sndcld_widgets[i+1].play();
                    }
                });
            }
        })
    }
}

/*
 * 現在のウィジェットがplaylistで、かつ次の曲があるかどうか
 * コールバック関数"func"の引数にtrue, falseを返す。
 */
function dn_ctrp_sndcld_hasNextInList(func){
    let result = true;
    dn_ctrp_sndcld_nowplay_widget.getCurrentSoundIndex(function(index){
        dn_ctrp_sndcld_nowplay_widget.getSounds(function(list){
            if(index >= list.length-1){
                result = false;
            }
            func(result);
        });
    });
}

/* ×ボタンクリック時動作 */
function dn_ctrp_sndcld_hideSC(){
    jQuery(function($){
        $("#dn_ctrp_sndcld_CtrPanel").hide("fast");
    });
}
