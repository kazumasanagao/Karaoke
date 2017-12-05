var Videos = require('./dbModel.js').Videos;
/*
var officialVideos = [[  
    {id: "H7HmzwI67ec", title: "Owl City & Carly Rae Jepsen - Good Time", viewCount: "9999000000"}, // 212000000 //8
    {id: "KQ6zr6kCPj8", title: "LMFAO - Party Rock Anthem ft. Lauren Bennett, GoonRock", viewCount: "1105000000"}, // 1分半から //6
    {id: "HL1UzIK-flA", title: "Rihanna - Work (Explicit) ft. Drake", viewCount: "401000000"}, //2
    {id: "VUjdiDeJ0xg", title: "Taio Cruz - Dynamite (Int'l Version)", viewCount: "154000000"},
    {id: "dsUXAEzaC3Q", title: "Michael Jackson - Bad", viewCount: "153000000"},
    {id: "-tJYN-eG1zk", title: "Queen - We Will Rock You (Official Video)", viewCount: "98000000"}
],[
    {id: "nfWlot6h_JM", title: "Taylor Swift - Shake It Off", viewCount: "1496000000"},　//1
    {id: "tg00YEETFzg", title: "Rihanna - We Found Love ft. Calvin Harris", viewCount: "607000000"}, // 40秒 //7
    {id: "yd8jh9QYfEs", title: "Rihanna - Don't Stop The Music", viewCount: "287000000"},
    {id: "3mC2ixOAivA", title: "Chris Brown - Yeah 3x", viewCount: "195000000"},
    {id: "qV5lzRHrGeg", title: "Carly Rae Jepsen - I Really Like You", viewCount: "142000000"}, //9
    {id: "4apHuWytLko", title: "Kevin Lyttle - Turn Me On (video) featuring Spraga Benz", viewCount: "5000000"}
],[
    {id: "fWNaR-rxAic", title: "Carly Rae Jepsen - Call Me Maybe", viewCount: "9999000000"}, // 834000000 //4
    {id: "kffacxfA7G4", title: "Justin Bieber - Baby ft. Ludacris", viewCount: "1387000000"}, //5
    {id: "HBxt_v0WF6Y", title: "Rihanna - Where Have You Been", viewCount: "356000000"},
    {id: "dLhFDYQHDQY", title: "Taio Cruz - Hangover ft. Flo Rida", viewCount: "96000000"},
    {id: "CR8logunPzQ", title: "Yolanda Be Cool Vrs DCup - We No Speak Americano (Official Music Video)", viewCount: "49000000"},
    {id: "9bZkp7q19f0", title: "PSY - GANGNAM STYLE(강남스타일) M/V", viewCount: "1000000"} // 2586000000 //3
]];
*/
var officialVideos = [[
    {id: "nfWlot6h_JM", title: "Taylor Swift - Shake It Off", viewCount: "1496000000"},
    {id: "fWNaR-rxAic", title: "Carly Rae Jepsen - Call Me Maybe", viewCount: "834000000"},
    {id: "tg00YEETFzg", title: "Rihanna - We Found Love ft. Calvin Harris", viewCount: "607000000"},
    {id: "dsUXAEzaC3Q", title: "Michael Jackson - Bad", viewCount: "153000000"}    
],[
    {id: "HL1UzIK-flA", title: "Rihanna - Work (Explicit) ft. Drake", viewCount: "1400000000"}, // 401000000
    {id: "kffacxfA7G4", title: "Justin Bieber - Baby ft. Ludacris", viewCount: "1387000000"},
    {id: "H7HmzwI67ec", title: "Owl City & Carly Rae Jepsen - Good Time", viewCount: "212000000"},
    {id: "-tJYN-eG1zk", title: "Queen - We Will Rock You (Official Video)", viewCount: "98000000"}
],[
    {id: "9bZkp7q19f0", title: "PSY - GANGNAM STYLE(강남스타일) M/V", viewCount: "2586000000"},
    {id: "KQ6zr6kCPj8", title: "LMFAO - Party Rock Anthem ft. Lauren Bennett, GoonRock", viewCount: "1105000000"},
    {id: "qV5lzRHrGeg", title: "Carly Rae Jepsen - I Really Like You", viewCount: "1000000000"}, // 142000000
    {id: "HBxt_v0WF6Y", title: "Rihanna - Where Have You Been", viewCount: "356000000"}   
]];

var ovc = -1; // officialVideoCounter 

makeOfficialRooms();
setInterval(makeOfficialRooms, 360000);

function makeOfficialRooms() {
    ovc++;
    ovc = ovc % 3;

    var i = officialVideos[ovc].length - 1;
    searchMongo();
    function searchMongo() {
        Videos.find({id: officialVideos[ovc][i].id},{room:1,member:1},{sort:{room: -1}}, function(err, videos) {
            if (!err) {
                var maxRoomNum = 0;
                for (var j in videos) {
                    if (videos[j].member.length == 0) {
                        videos[j].remove();
                    } else {
                        if (maxRoomNum < videos[j].room) maxRoomNum = videos[j].room;
                    }
                }
                var video = new Videos();
                video.id = officialVideos[ovc][i].id;
                video.room = maxRoomNum + 1;
                video.title = officialVideos[ovc][i].title;
                video.addTime = new Date();
                video.isOfficial = true;
                video.viewCount = officialVideos[ovc][i].viewCount;
                video.save();
                i--;
                if (i >= 0) searchMongo();
            } else {
                console.log(err);
            }
        });
    }
}