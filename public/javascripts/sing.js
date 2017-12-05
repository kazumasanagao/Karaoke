var maxwaiting = 420;
var isPlayerReady = false;


// ------- PCのときは右列の名前とビデオを入れ替える -------


if (!isMobile) {
    $("#nickname3").insertBefore("#video3");
    $("#nickname4").insertBefore("#video4");
    $("#nickname5").insertBefore("#video5");
}

function changeToPC() {
    $("#nickname3").insertBefore("#video3");
    $("#nickname4").insertBefore("#video4");
    $("#nickname5").insertBefore("#video5");
}

function changeToMobile() {
    $("#video3").insertBefore("#nickname3");
    $("#video4").insertBefore("#nickname4");
    $("#video5").insertBefore("#nickname5");
}


// ------- 自分の情報を読み込み -------


var myNickname = getCookie("ni");
var myCountry = getCookie("co");
$("#nickname0 span").html(myNickname);
$("#nickname0 img").attr({"src":"./images/flags/"+myCountry+".png"});
flagImgAddFunc();
$("#nickname0 img").show();


// ------- ビデオの読み込み -------


var player;
var isPlayed = false;

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onYouTubeIframeAPIReady() {
    player = new YT.Player("player",{
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady(event) {
    player.setVolume(20);
    showClickToPlay();
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.ENDED && isPlayed) {
        $(".leaveButton").fadeIn();
        player.setVolume(0);
        $("#volume").val(0);
        isPlayed = false;
    }
}

socket.on('start', function() {
    $("#countdownFrame").hide(400);
    if (player.isMuted()) {
        player.unMute();
        player.setVolume(40);   
    }
    player.seekTo(0);
    isPlayed = true;
});


// ------- ビデオの再生とカメラの起動 -------


var queries = getQueryString();
var isClickToPlay = false; // 1回だけ発動

$({deg:0}).animate({deg:-4800}, {
    duration: 15000,
    progress: function() {
        $('#loadingVideo img').css({ transform:'rotate('+this.deg+'deg)' });
    }
});

function showClickToPlay() {
    $("#loadingVideo").fadeOut(function() {
        $("#clickToPlay p").fadeIn();
        isPlayerReady = true;
    });
}

$("#clickToPlay").click(function() {
    if (!isClickToPlay && isPlayerReady) {
        isClickToPlay = true;
        $("#clickToPlay").fadeOut();
        player.playVideo();
        startVideo();
    }
});

function showYouNeed() {
    var alertMes = $("#needCamera").html();
    alert(alertMes);
    player.stopVideo();
}


// ------- プレーヤーコントロールの表示 --------


var settimeouter;

$("#popupMenu").click(function() {
    showPlayerControl();
});

$("#countdownBiggerTen").click(function() {
    showPlayerControl();
});

function showPlayerControl() {
    if ($("#playerControl").css("display") == "none") {
        var currentVol = player.getVolume();
        if (currentVol) $("#volume").val(currentVol);
        if (player.isMuted()) $("#volume").val(0);
        $("#playerControl").fadeIn(400);
        hideVolume();
    }
}

function hideVolume() {
    settimeouter = setTimeout(function() {
        $("#playerControl").fadeOut(400, function() {
            $(".playPause").hide();
        });
    }, 3000);
}

function timeoutCancelAndSet() {
    if (settimeouter) {
        clearTimeout(settimeouter);
        settimeouter = null;
    }
    hideVolume();
}


// ------- プレーヤーコントロールの操作 -------


function setVolume(val) {
    if (val != 0) {
        player.unMute();
        player.setVolume(val);
    } else {
        player.mute();
    }
    timeoutCancelAndSet();
}


// ------- 下部のボタン -------


var songTitle;

$("#closeButton").click(function() {
    closeButtonClick();
});
$("#topicsButton").click(function() {
    closeButtonClick();
    $("#closeButton").fadeIn();
    $("#topics").fadeIn();
});
$("#mapButton").click(function() {
    closeButtonClick();
    $("#closeButton").fadeIn();
    mapFadeIn();
});
$("#lyricButton").click(function() {
    closeButtonClick();
    $("#closeButton").fadeIn();
    $("#lyric").fadeIn();
});

function closeButtonClick() {
    $("#closeButton").fadeOut();
    $(".subscreen").fadeOut();
    $("#world").html("");
    $(".nicknames").css({"background": "transparent"});
}


function mapFadeIn() {
    $("#map").fadeIn();

    var colorsCandidates = ["#1e90ff"/*青*/,"#FF6D1E"/*オレンジ*/,"#1EFF35"/*緑*/,"#FFE81E"/*黄色*/,"#A81EFF"/*紫*/,"#FF1E2D"/*赤*/];
    var colors = {};
    var colorsInt = 0;
    
    $('.nicknames img').each(function(i, ele) {
        var imgUrl = $(ele).attr("src");
        var co;
        if (imgUrl && imgUrl.slice(-4) == ".png") {
            co = imgUrl.slice(-6,-4);
        }
        if (co) {
            if (!colors[co]) {
                colors[co] = colorsCandidates[colorsInt];
                colorsInt++;
            }
            $('.nicknames').eq(i).css({"background": colors[co]});
        }
    });

    var enableZoom = (isMobile) ? false : true;

    $('#world').vectorMap({
        map: 'world_en',
        backgroundColor: 'lightgray',
        color: '#ffffff',
        colors: colors,
        hoverOpacity: 0.5,
        selectedColor: null,
        enableZoom: enableZoom,
        showTooltip: false
    });
}

function mapReload() {
    if ($("#map").css("display") == "block") {
        $("#world").html("");
        $(".nicknames").css({"background": "transparent"});
        mapFadeIn();
    }
}

$('#world').bind('regionMouseOver.jqvmap', function(event, code, region) {
    $("#toastMap").html(region);
    toast("#toastMap");
});


function setMusixUrl() { // 入室できたときに、タイトルをセットする
    if (songTitle) {
        var musixUrl;
        if (musixSearchIndex[songTitle]) {
            musixUrl = "https://www.musixmatch.com/lyrics/" + musixSearchIndex[songTitle];
        } else {
            musixUrl = "https://www.musixmatch.com/search/"+songTitle;
        }
        $("#lyric a").attr({"href": musixUrl});
    }
}

var musixSearchIndex = {
    "Taylor Swift - Shake It Off": "Taylor-Swift/Shake-It-Off-2",
    "Carly Rae Jepsen - Call Me Maybe": "Carly-Rae-Jepsen/Call-Me-Maybe",
    "Rihanna - We Found Love ft. Calvin Harris": "Calvin-Harris-feat-Rihanna/We-Found-Love",
    "Michael Jackson - Bad": "Michael-Jackson/Bad",   
    "Rihanna - Work (Explicit) ft. Drake": "Rihanna-feat-Drake/Work",
    "Justin Bieber - Baby ft. Ludacris": "Justin-Bieber/Baby",
    "Owl City & Carly Rae Jepsen - Good Time": "Owl-City-feat-Carly-Rae-Jepsen/Good-Time",
    "Queen - We Will Rock You (Official Video)": "lyrics/Queen/We-Will-Rock-You",
    "PSY - GANGNAM STYLE(강남스타일) M/V": "싸이/Gangnam-Style",
    "LMFAO - Party Rock Anthem ft. Lauren Bennett, GoonRock": "Lmfao-ft-Lauren-Bennett-GoonRock/Party-Rock-Anthem",
    "Carly Rae Jepsen - I Really Like You": "Carly-Rae-Jepsen/I-Really-Like-You",
    "Rihanna - Where Have You Been": "Rihanna/Where-Have-You-Been"
};


// ------- 入室に成功したとき -------


var interval;
var rest;

socket.on('enterOK', function(data) {
    rest = maxwaiting - Math.floor((new Date(data.ctime) - new Date(data.time)) / 1000);
    interval = setInterval(countdown, 1000);

    setTimeout(function() {
        $("#singStat1").fadeIn();
    }, 3000);
    setTimeout(function() {
        $("#singStat2").fadeIn();
    }, 5000);
    setTimeout(function() {
        $("#startAtMes").fadeOut(function() {
            $("#countdownBiggerTen").fadeIn();
        });
    }, 10000);

    songTitle = data.title;
    setMusixUrl();
});

var countdown = function() {
    rest--;
    if (rest > 0 && rest < 11) {
        $("#countdownBiggerTen").fadeOut(500, function() {
            $("#countdownFrame").fadeIn(500);
        });
        closeButtonClick();
        $("#topicsFrame").fadeOut();
        $("#countdown").html(rest);
    } else if (rest > 0) {
        var min = Math.floor(rest / 60);
        var sec = rest % 60;
        if (sec < 10) sec = "0" + sec;
        $("#singStat .emInfo").html(min +":"+sec);
        $("#countdownBiggerTen").html(rest);
    } else {
        clearInterval(interval);
        $("#countdownFrame").fadeOut(400);
        socket.emit("start");
    }
}


// ------- 入室に失敗したとき -------


socket.on('enterFail', function(data) {
    if (data.type && data.type.length > 1) {
        $("#" + data.type).show();
    }
    $("#enterFail").fadeIn(400);
});

$(".leaveButton").click(function() {
    $(window).off('beforeunload');
    location.href = "/";
});


// ------- 途中退室するときに確認 -------


$(function(){
    $(window).on('beforeunload', function() {
        return "You're about to leave this room.";
    });
});

$(function(){
    $(window).on('unload', function() {
        hangUp();
    });
});


// ------- クエリの文字列を取得 -------


function getQueryString()　{
    var result = {};
    if (1 < window.location.search.length) {
        var query = window.location.search.substring( 1 );
        var parameters = query.split('&');
        for (var i = 0; i < parameters.length; i++) {
            var element = parameters[ i ].split('=');
            var paramName = decodeURIComponent(element[ 0 ]);
            var paramValue = decodeURIComponent(element[ 1 ]);
            result[paramName] = paramValue;
        }
    }
    return result;
}