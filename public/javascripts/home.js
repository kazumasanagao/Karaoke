var maxwaiting = 420;
var songInScreen = 10;
var timeoutSec = 30;
var songs = [];
var restTimes = [];
var isZscreen = false;
var ctime;

socket.emit("home");
getSongs();

var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

$(window).load(function(){
    var top = $(window).scrollTop();
    if (top > 0) {
        loadingAnime();
        $("#loading").show();
        setTimeout(function() {
            $('httml,body').scrollTop(0);
            $("#loading").fadeOut(300);
        }, 300);
    }
});

/*
$("#howtoplay").click(function() {
    if ($("#introPics").css("display") == "none") {
        $("#introPics").fadeIn();
        ga('send', 'event', 'howtoplay', 'read');
    }
});
*/

// ------- 曲のロード -------


var restOfSongs = -1;
var cursor = 0;
var countInterval;
var players = {};
var isClick = false;
var addGrayPad = false;

function getSongs() {
    // リクエストが同じだとキャッシュが使われてしまうのでブラウザバックしたときに画面が更新されない。
    // そこで末尾に無意味な数字を付加することによって、別のリクエストだと認識させている。
    var rand = Math.round(Math.random()*1000);
    $.ajax({
        url: '/songs?'+rand,
        type: 'GET',
        success: function(data) {
            songs = data.songs;
            ctime = new Date(data.ctime);
            loadSongs();
            if (countInterval) {
                clearTimeout(countInterval);
                countInterval = null;
            }
            countInterval = setInterval(countdown, 1000);
        }
    });
}

function loadSongs() {
    $("#loadingBar").hide();

    var thisLen;
    if (restOfSongs == -1) restOfSongs = songs.length;
    if (restOfSongs > songInScreen) {
        restOfSongs =  restOfSongs - songInScreen;
        thisLen = songInScreen;
    } else {
        thisLen = restOfSongs;
        restOfSongs = 0;
        if (songs.length % 4 == 1) addGrayPad = true;
    }

    for (var i = cursor; i < cursor + thisLen; i++) {

        $("#song"+i+" .ytImgFrame").attr({"videoId": songs[i].id, "imgIndex": i});
        $("#song"+i+" .ytImgFrame").prepend('<img class="ytImg" width="320" height="180" src="https://img.youtube.com/vi/'+songs[i].id+'/mqdefault.jpg" alt="">');
        $(".songTitle").eq(i).html(songs[i].title);
        $("#song"+i+" .roomInfoPerson .emInfo").html(songs[i].num);
        $(".joinButton").eq(i).attr({"onclick":"joinSong(\""+songs[i].id+"\")"});
        
        var pastTime = Math.floor((ctime - new Date(songs[i].addTime)) / 1000);
        var restTime = maxwaiting - pastTime;
        var min = Math.floor(restTime / 60);
        var sec = restTime % 60;
        if (sec < 10) sec = "0" + sec;
        $("#song"+i+" .roomInfoTime .emInfo").html(min+":"+sec);
        restTimes.push(restTime);

        $("#song"+i).show();
    }

    if (addGrayPad) {
        if (!isMobile) {
            var i = songs.length - 1;
            var h = $("#song"+i).outerHeight()
            if (h > 0) $("#songGrayPad").height(h);
            $("#songGrayPad").show();
        }
    }

    cursor = cursor + thisLen;

    $('.ytImgFrame').click(function() {
        if (!isClick) { // フラグで防がないと一回のクリックで３回くらい発動してしまう。
            isClick = true;
            var i = $(this).attr("imgIndex");
            var video = '<iframe id="player'+i+'" class="player" src="https://www.youtube.com/embed/'+ $(this).attr('videoId') +'?autoplay=1&controls=2&rel=0&showinfo=0&fs=0&autohide=1&enablejsapi=1" frameborder="0" width="320" height="180"></iframe>';
            $(this).replaceWith(video);
            players[i] = new YT.Player("player"+i, { 
                events: { 
                    'onReady': onPlayerReady,
                    'onStateChange': onPlayerStateChange
                } 
            });
        }
    });

    if (isReloading) {
        isReloading = false;
        setTimeout(function() {
            $("#loading").fadeOut(500);
        }, 500); 
    }

    if (restOfSongs == 0) {
        if (isMobile) {
            if (songs.length % 2 == 0) $("#reload").css({"background":"#f2f2f2"});
        } else {
            if (songs.length % 4 == 3 || songs.length % 4 == 0) $("#reload").css({"background":"#f2f2f2"});
        }
        $("#reload").show();
    } else {
        $("#loadingBar").show();
    }
}

function onPlayerReady(event) {
    isClick = false;
}

function onPlayerStateChange(event) {
    if (event.data == YT.PlayerState.PLAYING) {
        for (var i in players) {
            if (players[i] != event.target && players[i].pauseVideo  && players[i].getPlayerState() == YT.PlayerState.PLAYING) {
                players[i].pauseVideo();
            } 
        }
    }
}

var countdown = function() {
    for (var r in restTimes) {
        restTimes[r] = restTimes[r] - 1;
        if (restTimes[r] < timeoutSec) restTimes[r] = timeoutSec;
        if (restTimes[r] > timeoutSec && $("#song"+r+" .roomInfoTime .emInfo").html() != "-:--") {
            var min = Math.floor(restTimes[r] / 60);
            var sec = restTimes[r] % 60;
            if (sec < 10) sec = "0" + sec;
            $("#song"+r+" .roomInfoTime .emInfo").html(min +":"+sec);
        } else {
            if ($("#song"+r+" .roomInfoTime .emInfo").html() != "-:--") {
                $("#song"+r+" .roomInfoTime .emInfo").html("-:--");
                if ($("#song"+r+" .maskEmpty").css("display") == "none" && $("#song"+r+" .maskFull").css("display") == "none") {
                    $(".maskTimeout").eq(r).show(500);
                    if (players[r] && players[r].getPlayerState() == YT.PlayerState.PLAYING) players[r].pauseVideo();
                    alltimeoutReload();
                }
            }
        }
    }
}

function alltimeoutReload() {
    for (var i in restTimes) {
        if (restTimes[i] != timeoutSec) return; 
    }
    setTimeout(function() {
        reloadVideos();
    }, 3000);
}


// ------- 画面下部までスクロールしたときの読み込み -------


var addingNow = false;

$(window).scroll(function() {
    var imgPos = $("#loadingBar").offset().top;    
    var scroll = $(window).scrollTop();
    var windowHeight = $(window).height();
    if (scroll > imgPos - windowHeight && !addingNow && $("#loadingBar").css("display") == "block") addSongs();
});

function addSongs() {
    addingNow = true;
    loadSongs();
    addingNow = false;
}


// ------- リロード -------

var isReloading = false;

$("#reload").click(function() {
    reloadVideos();
});

function reloadVideos() {
    if (!isReloading) {
        isReloading = true;
        loadingAnime();
        if (players.preview) {
            var tmp = players.preview;
            players = {preview: tmp}
        } else {
            players = {};
        }
        $(".oneSong").hide();
        $("#reload").hide();
        $(".mask").hide();
        $("#loading").show();
        $('html,body').animate({ scrollTop: 0 }, '0');
        var ytImg = '<div class="ytImgFrame"><img class="ytImg" width="300" height="169"><div class="ytButton"><img width="42" height="30" src="./images/ytButton.png"></div></div>';
        $(".player").replaceWith(ytImg);
        restTimes = [];
        restOfSongs = -1;
        cursor = 0;
        getSongs();   
    }
}

function loadingAnime() {
    $({deg:0}).animate({deg:-720}, {
        duration: 3000,
        progress: function() {
            $('#loading img').css({ transform:'rotate('+this.deg+'deg)' });
        }
    });
}

// ------- ソケットで情報を受け取る -------


socket.on("delVideo", function(data) {
    for (var s in songs) {
        if (data.id == songs[s].id) {
            // マスクが重複しないように、まず有無を確認してから。
            if ($("#song"+s+" .maskTimeout").css("display") == "none" && $("#song"+s+" .maskFull").css("display") == "none") {
                $(".maskEmpty").eq(s).show(500);
                $("#song"+s+" .roomInfoTime .emInfo").html("-:--");
            }
            return;
        }
    }
});

socket.on("addMember", function(data) {
    for (var s in songs) {
        if (data.id == songs[s].id) {
            songs[s].num = songs[s].num + 1;
            if ($("#song"+s).css("display") == "block") {
                $("#song"+s+" .roomInfoPerson .emInfo").html(songs[s].num);
            }
            return;
        }
    }
});

socket.on("delMember", function(data) {
    for (var s in songs) {
        if (data.id == songs[s].id) {
            songs[s].num = songs[s].num - 1;
            if ($("#song"+s).css("display") == "block") {
                $("#song"+s+" .roomInfoPerson .emInfo").html(songs[s].num);
            }
            return;
        }
    }
});


// ------- 歌うボタンをおした時 -------

var tmpSongId;

function joinSong(id) {
    if (checkBrowser()) {
        if (isCookies()) {
            location.href = "/sing?q="+id;
        } else {
            tmpSongId = id;
            originRequest = "singsong";
            setUserInfo();
        } 
    }
}


// ------- メンバーの情報 -------


$('.roomInfoPerson').click(function() {
    var index = $('.roomInfoPerson').index(this);
    var id;

    if (index > songs.length - 1 && addSongId) {
        id = addSongId;
    } else if (index > songs.length - 1 && !addSongId) {
        return;
    } else {
        id = songs[index].id;
    }

    $.ajax({
        url: "/persons",
        type: 'POST',
        success: function(data) {
            if (data.stat == "ok") {
                showPersonsInfo(data.persons);
            } else {
                toast("#toastError");
            }
        },
        error: function() { toast("#toastError"); },
        data: {id: id},
        dataType: "json"
    });
});

function showPersonsInfo(info) {
    $(".pinfo").html("");
    $(".pinfo").hide();
    for (var i in info) {
        if (info[i][0] && info[i][1]) {
            $(".pinfo").eq(i).html('<img class="flagImg" src=./images/flags/'+info[i][1]+'.png><span>'+info[i][0]+'</span>');
            $(".pinfo").eq(i).show();
        }
    }
    flagImgAddFunc(true);
    if (isZscreen) {
        $("#graypanel2").show();
        $("#personsInfo").css({"z-index":"5"});
    } else {
        $("#graypanel").show();
        isZscreen = true;
    }
    $("#personsInfo").show(400);    
}

$("#graypanel2").click(function() {
    $("#graypanel2").hide();
    $("#personsInfo").css({"z-index":"3"});
    $("#personsInfo").hide(400);
});


// ------- 曲の追加 -------

var addSongId = "";
var previewRestTime;
var previewCountdownInterval;

$(".addSongFunc").click(function() {
    if(!isCookies()) {
        setUserInfo();
        originRequest = "addsong";
    } else {
        if (checkBrowser()) {
            if (!isZscreen) {
                if ($("#inputSongUrl").val() && !players.preview) inputSongUrl();
                setExampleText();
                $("#graypanel").show();
                $("#addSong").show(400);
                isZscreen = true;
            } else {
                $("#graypanel").hide();
                $(".zscreen").hide(400);
                if (players['preview'] && players['preview'].pauseVideo && players['preview'].getPlayerState() == YT.PlayerState.PLAYING) players['preview'].pauseVideo();
                isZscreen = false;
            }
        }
    }
});

function setExampleText() {
    var exUrl = $("#exampleUrl").html();
    if (isMobile) {
        exUrl = exUrl.replace("www.","m.");
    } else {
        exUrl = exUrl.replace("m.","www.");
    }
    $("#exampleUrl").html(exUrl);
}

function isCookies() {
    if (getCookie("ni") && getCookie("co")) {return true;} else {return false;}
}

function inputSongUrl() {
    var inputVal = $("#inputSongUrl").val();
    var inputNumPart;
    if (inputVal.match(/https:\/\/www.youtube.com\/watch\?v=.+/)) {
        inputNumPart = inputVal.replace(/https:\/\/www.youtube.com\/watch\?v=/, "");
    } else if (inputVal.match(/https:\/\/m.youtube.com\/watch\?v=.+/)) {
        inputNumPart = inputVal.replace(/https:\/\/m.youtube.com\/watch\?v=/, "");
    }
    
    if (inputNumPart) {
        $.ajax({
            url: "/checksong",
            type: 'POST',
            success: function(d) {
                if (d.stat == "ok") {
                    if (d.data) {
                        var num = d.data.num;
                        var pastTime = (Math.floor((new Date(d.ctime) - new Date(d.data.addTime)) / 1000));
                        var restTime = maxwaiting - pastTime;
                        previewRestTime = restTime;
                        if (previewCountdownInterval) clearTimeout(previewCountdownInterval);
                        previewCountdownInterval = setInterval(previewCountdown, 1000);
                        var min = Math.floor(restTime / 60);
                        var sec = restTime % 60;
                        if (sec < 10) sec = "0" + sec;
                        $("#correctUrl .roomInfoPerson .emInfo").html(num);
                        $("#correctUrl .roomInfoTime .emInfo").html(min+":"+sec);
                        $("#correctUrl .roomInfo").show();
                    } else {
                        $("#correctUrl .roomInfo").hide();
                    }
                    addSongId = inputNumPart;
                    var previewHTML = '<div id="playerPreview"></div>';
                    $("#playerPreview").replaceWith(previewHTML);
                    delete players.preview;
                    players['preview'] = new YT.Player("playerPreview", {
                        width: '300',
                        height: '169',
                        videoId: inputNumPart,
                        playerVars: {
                            controls: 2,
                            rel: 0,
                            fs: 0,
                            autohide: 1,
                            enablejsapi: 1
                        },
                        events: {
                            'onStateChange': onPlayerStateChange
                        }
                    });
                    $("#correctUrl").show();
                    $("#incorrectUrl").hide();
                } else {
                    toast("#toastError");
                }
            },
            error: function() {
                toast("#toastError");
            },
            data: {id: inputNumPart},
            dataType: "json"
        });
    } else {
        $("#correctUrl").hide();
        $("#incorrectUrl").show();
        addSongId = "";
        var previewHTML = '<div id="playerPreview"></div>';
        $("#playerPreview").replaceWith(previewHTML);
        delete players.preview;
    }
}

$("#addSongOK").click(function() {
    if (addSongId) {
        $.ajax({
            url: "/addsong",
            type: 'POST',
            success: function(data) {
                if (data.stat == "ok") {
                    location.href = "/sing?q="+addSongId;
                } else {
                    toast("#toastError");
                }
            },
            error: function() {
                toast("#toastError");
            },
            data: {id: addSongId},
            dataType: "json"
        });
    }
});

function previewCountdown() {
    previewRestTime--;
    if (previewRestTime < 20) {
        $("#addSong .roomInfo").fadeOut();
        clearTimeout(previewCountdownInterval);
    } else {
        var min = Math.floor(previewRestTime / 60);
        var sec = previewRestTime % 60;
        if (sec < 10) sec = "0" + sec;
        $("#correctUrl .roomInfoTime .emInfo").html(min+":"+sec);
    }
}

// ------- ユーザー情報 -------


var originRequest = "";
var isCountryHTML = false;

$("#setInfoButton").click(function() {
    setUserInfo();
});

function setUserInfo() {
    if (checkBrowser()) {
        if (!isZscreen) {
            $.getScript("./javascripts/pulldown.js", function() {
            $.getScript("./javascripts/countryMap.js", function() {

                if (!isCountryHTML) {
                    $("#selectCountry").append(countriesHTML);
                    isCountryHTML = true; // 何回もappendしないようフラグをたてる
                }

                if (getCookie("ni")) $("#inputNickname").val(getCookie("ni"));

                if (countryMap[getCookie("co")]) $('#selectCountry option[value='+ getCookie("co") +']').attr("selected","selected");

                if (getCookie("ge") == "f") {
                    $("#radioFemale").attr("checked","checked");
                } else if (getCookie("ge") == "m") {
                    $("#radioMale").attr("checked","checked");
                }

                $("#graypanel").show();
                $("#addUserInfo").show(400);
                isZscreen = true;
            }); });
        } else {
            $("#graypanel").hide();
            $(".zscreen").hide(400);
            if (players['preview'] && players['preview'].pauseVideo && players['preview'].getPlayerState() == YT.PlayerState.PLAYING) players['preview'].pauseVideo();
            isZscreen = false;
            originRequest = "";
        }
    }
}

$("#addUserInfoOK").click(function() {
    var nickname = $("#inputNickname").val();
    var country = $("#selectCountry").val();

    if (nickname.length <= 10) {
        if (nickname.match(/^[a-zA-z]+$/)) {
            nickname = nickname.charAt(0).toUpperCase() + nickname.slice(1).toLowerCase();
        } else {
            $("#addUserInfo span").hide();
            $("#addUserInfoErrorAlpha").show(); return;
        }
    } else {
        $("#addUserInfo span").hide();
        $("#addUserInfoErrorWithin").show(); return;
    }

    if (!countryMap[country]) {
        $("#addUserInfo span").hide();
        $("#addUserInfoErrorCountry").show(); return;
    }

    $("#addUserInfo span").hide();

    document.cookie = "ni=" + nickname + ";max-age=31536000;" + cookieSecure;
    document.cookie = "co=" + country + ";max-age=31536000;" + cookieSecure;

    toast("#toastSaved");

    $("#graypanel").hide();
    $("#addUserInfo").hide(400);
    isZscreen = false;

    if (originRequest == "addsong") {
        $("#graypanel").show();
        $("#addSong").show(400);
        isZscreen = true;
        originRequest = "";
    }

    if (originRequest == "singsong") {
        originRequest = "";
        if (tmpSongId) location.href = "/sing?q="+tmpSongId;
    }
});


// ------- ボトムメニュー関係 -------


var lang = $("#lang").html();

if (lang == "ja") {
    $(".privacyButton").attr({"href":"/privacy?hl=ja"});
    $(".termsButton").attr({"href":"/terms?hl=ja"});
}

$("#contactUsButton").click(function() {
    if (!isZscreen) {
        $("#graypanel").show();
        $("#contactUs").show(400);
        isZscreen = true;
    }
});


// ------- PCとMobileの切替え時の対応 -------


function changeToPC() {
    if (songs.length % 4 == 3 || songs.length % 4 == 0) {
        $("#reload").css({"background":"#f2f2f2"});
    } else {
        $("#reload").css({"background":"#ffffff"});
    }

    if (addGrayPad) {
        $("#songGrayPad").show();
    }
}

function changeToMobile() {
    if (songs.length % 2 == 0) {
        $("#reload").css({"background":"#f2f2f2"});
    } else {
        $("#reload").css({"background":"#ffffff"});
    }

    if ($("#songGrayPad").css("display") == "block") {
        $("#songGrayPad").hide();
    }
}


// ------- その他 -------


function checkBrowser() {
    var ua = window.navigator.userAgent.toLowerCase();
    if (ua.indexOf('iphone') != -1) {
        var alertMes = $("#iosUnable").html();
        alert(alertMes);
        return false;
    } else if (ua.indexOf('chrome') == -1 && ua.indexOf('opera') == -1 && ua.indexOf('firefox') == -1) {
        var alertMes = $("#browserUnable").html();
        alert(alertMes);
        return false;
    } else {
        return true;
    }
}

$("#graypanel").click(function() {
    if (isZscreen) {
        $("#graypanel").hide();
        $(".zscreen").hide(400);
        if (players['preview'] && players['preview'].pauseVideo && players['preview'].getPlayerState() == YT.PlayerState.PLAYING) {
            players['preview'].pauseVideo();
        }
        isZscreen = false;
    }
});

$(".songTitle").hover(function() {
    if ($(this).outerWidth() < $(this)[0].scrollWidth) {
        $(this).css({"cursor": "pointer"});
        $(this).click(function() {
            var fullTitle = $(this).html();
            $("#toastSongTitle").html(fullTitle);
            toast("#toastSongTitle");
        });
    }
});