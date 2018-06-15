var nowplay;
var widgets = [];
var playbutton;
var titlescrolltimer;
var $span;
var scrollParam;
const panelClass = jQuery("#dn_ctrp_sndcld_CtrPanel").attr("class");

/* 初期化処理 */
jQuery(function($){
    /* SoundCloudWidgetを探して、イベント登録をする */
    playbutton = $("#dn_ctrp_sndcld_playbutton");
    $("iframe[src*='soundcloud.com']").each(function(i,elem){
        var w = SC.Widget(elem);
        widgets.push(w);
        w.bind(SC.Widget.Events.PLAY,dn_ctrp_sndcld_played);
        w.bind(SC.Widget.Events.PAUSE,dn_ctrp_sndcld_paused);
        w.bind(SC.Widget.Events.FINISH,dn_ctrp_sndcld_finished);
    });

    /* 再生パネルの各ボタンのイベント登録 */
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
    $span = $("#dn_ctrp_sndcld_title span");
    scrollParam = "margin-left";
    if(panelClass == "dn_ctrp_sndcld_cls_left" || panelClass == "dn_ctrp_sndcld_cls_right"){
        scrollParam = "margin-top";
    }
});

/* playイベントのコールバック */
function dn_ctrp_sndcld_played(){
    playbutton.removeClass("stop").addClass("play");
    nowplay = this;
    /* タイトル、アートワーク取得 */
    nowplay.getCurrentSound(function(s){
        jQuery(function($){
            $("#dn_ctrp_sndcld_artwork").css(
                {backgroundImage:'url("' + s.artwork_url + '")'}
            );
            $("#dn_ctrp_sndcld_title span").html(s.title + ' (via <a href="' + s.user.permalink_url + '" target="_blank">' + s.user.username + '</a>) ');

            // タイトルスクロールの開始
            dn_ctrp_sndcld_titlescroll();
        });
    });
}

function dn_ctrp_sndcld_titlescroll(){
    clearInterval(titlescrolltimer);
    titlescrolltimer = setInterval( (function timerfunc(){
        dn_ctrp_sndcld_stoptimer();
        if(panelClass == "dn_ctrp_sndcld_cls_left" || panelClass == "dn_ctrp_sndcld_cls_right"){
            scrollLen = $span.height();
            $span.animate({ "margin-top" : "0"} , 3000 , "linear").animate({ "margin-top" : "-" + (scrollLen + 20) + "px"} , 10000 , "linear");
        }else{
            let scrollLen = $span.width();
            $span.animate({ "margin-left": "0"} , 3000 , "linear").animate({ "margin-left" : "-" + (scrollLen + 20) + "px"} , 10000 , "linear");
        }
        return timerfunc;
    }() ),13000);
}

function dn_ctrp_sndcld_stoptimer(isclearinterval = false){
    if(isclearinterval) clearInterval(titlescrolltimer);
    $span.stop(true, true);
    $span.css( scrollParam ,'0');
}

/* pauseイベントのコールバック */
function dn_ctrp_sndcld_paused(){
    if(this === nowplay){
        playbutton.removeClass("play").addClass("stop");
        dn_ctrp_sndcld_stoptimer();
    }
}

/* finishイベントのコールバック */
function dn_ctrp_sndcld_finished(){
    dn_ctrp_sndcld_go_next();
}

/* 再生、停止ボタンクリック時動作 */
function play_pause(){
    if( ! nowplay ){
        widgets[0].play();
    }
    else{
        nowplay.isPaused(function(flg){
            if(flg) nowplay.play();
            else nowplay.pause();
        });
    }
}

/* prevボタンクリック時動作 */
function dn_ctrp_sndcld_go_prev(){
    if( nowplay ){
        widgets.forEach(function(elem,i){
            if(nowplay === elem){
                if(i>0) widgets[i-1].play();
            }
        });
    }
}

/* nextボタンクリック時動作 */
function dn_ctrp_sndcld_go_next(){
    if( nowplay ){
        widgets.forEach(function(elem,i){
            if(nowplay === elem){
                if(i+1 < widgets.length) widgets[i+1].play();
            }
        });
    }
}

/* ×ボタンクリック時動作 */
function dn_ctrp_sndcld_hideSC(){
    jQuery(function($){
        $("#dn_ctrp_sndcld_CtrPanel").hide("fast");
    });
}
