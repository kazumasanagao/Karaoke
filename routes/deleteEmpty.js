var Videos = require('./dbModel.js').Videos;

deleteEmptyRooms();
setInterval(deleteEmptyRooms, 3600000); // 1時間ごとにチェック

function deleteEmptyRooms() {
    var ctime = new Date();
    var past60min = new Date(ctime - 3600000);
    var past240min = new Date(ctime - 14400000);

    // 60分以上経っているメンバー０のルームが残っていれば消去する
    Videos.find({addTime:{$lt:past60min}, $where: "this.member.length == 0"},{id:1},{}, function(err, videos) {
        for (var i in videos) {
            videos[i].remove();
        }
    });

    // 240分以上経っているルームはメンバーがいても消去する
    Videos.find({addTime:{$lt:past240min}},{id:1},{}, function(err, videos) {
        for (var i in videos) {
            videos[i].remove();
        }
    });
}