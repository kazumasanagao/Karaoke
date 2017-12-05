var express = require('express');
var router = express.Router();
var request = require('request');
var Videos = require('./dbModel.js').Videos;
var getLang = require('./lang.js').getLang;
var googleApiKey = require('./conf.js').googleApiKey;

router.get('/', function(req, res, next) {
    var l = getLang(req);
    res.render('home', lang[l]);
});

router.get('/songs', function(req, res, next) {
    // 6分以内のもの
    var past6min = new Date(new Date() - 360000);
    Videos.find({addTime:{$gt:past6min}, $where: "this.member.length < 6"},{_id:0,room:0},{sort:{viewCount: -1,addTime: -1},limit:30}, function(err, videos) {
        var data = [];
        for (var v in videos) {
            var id = videos[v].id;
            var title = videos[v].title;
            var addTime = videos[v].addTime;
            var num = videos[v].member.length;
            data.push({id:id,title:title,addTime:addTime,num:num});
        }
        var ctime = new Date();
        res.json({"songs":data,"ctime": ctime});
    });
});

router.post('/checksong', function(req, res, next) {
    var id = req.body.id;
    Videos.find({id: id},{},{sort:{room: -1},limit:1}, function(err, duplicate) {
        if (!err) {
            // 6分30秒以内かつメンバーが1~5人だったら既存のroomを提示
            if (duplicate[0] && ((new Date() - new Date(duplicate[0].addTime))/1000 < 390) && duplicate[0].member && duplicate[0].member.length < 6) {
                var data = {};
                var thisid = duplicate[0].id;
                var addTime = duplicate[0].addTime;
                var num = duplicate[0].member.length;
                data = {id:thisid,addTime:addTime,num:num};
                var ctime = new Date();
                return res.json({"stat":"ok", "data": data, "ctime": ctime});
            } else {
                return res.json({"stat":"ok"});
            }
        } else {
            return res.json({"stat":"ng"});
        }
    });
});

router.post('/persons', function(req, res, next) {
    var id = req.body.id;
    Videos.find({id: id},{member:1},{sort:{room: -1},limit:1}, function(err, mem) {
        if (!err) {
            var data = [];
            if (mem[0] && mem[0].member) {
                for (var m in mem[0].member) {
                    data.push([mem[0].member[m].nickname, mem[0].member[m].country])
                }
                return res.json({"stat":"ok", "persons": data});
            } else {
                return res.json({"stat":"ng"});
            }
        } else {
            return res.json({"stat":"ng"});
        }
    });
});

router.post('/addsong', function(req, res, next) {
    var id = req.body.id;
    var url = 'https://www.googleapis.com/youtube/v3/videos?id='+id+'&key='+googleApiKey+'&fields=items(id,snippet(title),statistics(viewCount))&part=snippet,statistics';
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body)
            if (data && data.items && data.items.length > 0 && data.items[0].id && data.items[0].snippet.title && data.items[0].statistics.viewCount) {
                Videos.find({id: id},{},{sort:{room: -1},limit:1}, function(err, duplicate) {
                    if (!err) {
                        // 6分40秒以内かつメンバーが1~5人だったら既存のroomに参加
                        if (duplicate[0] && ((new Date() - new Date(duplicate[0].addTime))/1000 < 400) && duplicate[0].member && duplicate[0].member.length < 6) {
                            return res.json({"stat":"ok"});
                        } else {
                            var room = 1;
                            if (duplicate[0]) room = duplicate[0].room + 1;
                            var video = new Videos();
                            video.id = id;
                            video.room = room;
                            video.title = data.items[0].snippet.title;
                            video.addTime = new Date();
                            video.viewCount = data.items[0].statistics.viewCount;
                            video.save();
                            return res.json({"stat":"ok"});
                        }
                    } else {
                        return res.json({"stat":"ng"});
                    }
                });       
            } else {
                return res.json({"stat":"ng"}); 
            }
        } else {
            return res.json({"stat":"ng"});
        }
    });
});

var lang = {
    en: {
        title: "Chample - Free Online Karaoke",
        // 要素のタグに値を入れるときは、空白があったらダメ。タグごと突っ込めばOK。
        description: 'content="Sing with people from all over the world. You can add your favorite songs. Enjoy Singing!"',
        keywords: "sing,together,chample",

        freeonline: "Free Online Karaoke",
        h1: "Sing together",
        h1disc: "with people around the world.",
        h2: "Any songs you want",
        h2disc: "Add your favorite songs (Free)",
        howtoplay: "How to Play ?",
        contactUs: "Contact",
        setting: "Setting",

        joinButton: "Sing this song（Free）",
        persons: " persons",
        arein: " are in.",
        startsinging: "Start singing ",
        later: " later.",
        maskFull: "FULL",
        maskEmpty: "EMPTY",
        maskTimeout: "TIMEOUT",

        setinfo: "Set your Info.",
        nicknameph: 'placeholder="Nickname (Alphabet)"',
        optionCountry: "Country",
        byusing: "By using Chample, you agree to<br/>our ",
        termsof: "Terms of Service",
        andstr: " and ",
        privacy: "Privacy Policy",
        hituyou: "",
        errorAlpha: "Nickname must be alphabets.",
        errorWithin: "Nickname must be within 10 leters.",
        errorCountry: "Select country.",

        addSongHead: "Add your favorite song.",
        addSongStep: "Only 3 steps",
        step1h: "1.Find a song in ",
        step1f: ".",
        step2: "2.Copy a URL.",
        step3: "3.Paste a URL here.",
        example: "e.g.",
        incorrectUrl: "Incorrect URL. Please check again.",

        member: "Member",

        feelFree: "Feel free to contact us.",
        locatedIn: "Chample Inc. is located in Okinawa, Japan.",

        toastError: "Error. Please try again later.",
        toastSaved: "Successfully Saved.",

        iosUnable: "iOS is not available in this app.\nPlease use PC or Android.",
        browserUnable: "Chrome, Firefox and Opere are available.\nPlease use these browser.",
        language: "en"
    },
    ja: {
        title: "Chample - 無料オンラインカラオケ",
        description: 'content="Champleでは世界中の人と一緒にカラオケが楽しめます。自分の好きな曲を追加することも可能です。"',
        keywords: "歌う,一緒に,chample",

        freeonline: "無料オンラインカラオケ",
        h1: "さあ歌おう",
        h1disc: "世界中の人たちと一緒に",
        h2: "大好きな曲を",
        h2disc: '好きな曲を追加する (無料)',
        howtoplay: "遊び方の説明",
        contactUs: "連絡先",
        setting: "設定",

        joinButton: "この曲を歌う（無料）",
        persons: "人",
        arein: "が待機中",
        startsinging: "あと ",
        later: " でスタート",
        maskFull: "満席",
        maskEmpty: "空室",
        maskTimeout: "締め切り",

        setinfo: "ユーザー情報の設定",
        nicknameph: 'placeholder="ニックネーム(半角英字)"',
        optionCountry: "国を選択",
        byusing: "Champleのご利用にあたっては、",
        termsof: "利用規約",
        andstr: "と",
        privacy: "プライバシーポリシー",
        hituyou: "にご同意いただく必要があります。",
        errorAlpha: "ニックネームは半角英数でご入力ください",
        errorWithin: "ニックネームは10文字以内でご入力ください",
        errorCountry: "出身国をご選択ください",

        addSongHead: "好きな曲を追加する",
        addSongStep: "たったの３ステップです",
        step1h: "1.",
        step1f: "で好きな曲を探す",
        step2: "2.URLをコピーする",
        step3: "3.ここにURLをペーストする",
        example: "例)",
        incorrectUrl: "URLが正確ではありません。",

        member: "メンバー",

        feelFree: "お気軽に、どうぞ",
        locatedIn: "Chample Inc. は沖縄の会社です",

        toastError: "サーバーに不具合が発生しています。時間をおいて再度お試しください。",
        toastSaved: "設定に成功しました。",

        iosUnable: "iOSは未対応です。\nPCかAndroidをご使用ください。",
        browserUnable: "Chrome, Firefox, Opereに対応しています。\nこれらのブラウザをご使用下さい。",
        language: "ja"
    }
};

module.exports = router;
