var express = require('express');
var router = express.Router();
var getLang = require('./lang.js').getLang;

router.get('/', function(req, res, next) {
    var l = getLang(req);
    var strs = lang[l];
    strs.url = req.query.q;
    res.render('sing', strs);
});

var lang = {
    en: {
        language: "en",
        title: "Singing",

        startSinging: "Start singing ",
        later: " later.",
        enjoyTalking: "Enjoy talking until then.",

        clickToPlay: "Click to Play",

        failEmpty: "Sorry. This room is empty.",
        failFull: "Sorry. This room is full.",
        failTimeout: "Sorry. This room is time out.",
        failOther: "Sorry. Our server has some troubles.",
        leaveRoom: "Leave this Room",

        topics: "Topic",
        map: "Map",
        lyric: "Lyric",
        topicsExample: "Conversation Topics Example",
        lyricMes: "If you need lyric, this site is very helpful.",

        browserUnable: "Chrome, Firefox and Opere are available.\nPlease use these browser.",
        needCamera: "You need both camera and microphone."
    },
    ja: {
        language: "ja",
        title: "シンギング",

        startSinging: "スタートまで ",
        later: "",
        enjoyTalking: "交流をお楽しみください",

        clickToPlay: "タップして始める",

        failEmpty: "エラー。この部屋は空室です。",
        failFull: "エラー。この部屋は満室です。",
        failTimeout: "エラー。締め切り時間を過ぎました。",
        failOther: "エラー。サーバーに問題が発生しています。",
        leaveRoom: "退室する",

        topics: "話題",
        map: "地図",
        lyric: "歌詞",
        topicsExample: "話題の例",
        lyricMes: "歌詞の検索には、こちらのサイトが便利です。",

        browserUnable: "Chrome, Firefox, Opereに対応しています。\nこれらのブラウザをご使用下さい。",
        needCamera: "カメラとマイクが必要です。"
    }
}

module.exports = router;
