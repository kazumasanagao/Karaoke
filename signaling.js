var port = 8080;
var io = require('socket.io').listen(port);
console.log((new Date()) + " Server is listening on port " + port);

/*
var port = 8080;
var https = require('https');
var fs = require('fs');
var options = {
        key: fs.readFileSync(__dirname + '/bin/keys/privkey.pem'),
        cert: fs.readFileSync(__dirname + '/bin/keys/cert.pem'),
        ca: fs.readFileSync(__dirname + '/bin/keys/chain.pem')
};
var server = https.createServer(options);
io = require('socket.io').listen(server);
server.listen(8080);
console.log((new Date()) + " Server is listening on port " + port);

// 本番で使用。エラーが起きても、サーバー落ちないように。
var http = require("http");
var fs = require("fs");
process.on('uncaughtException', function(err) {
    console.log(err);
});
*/

var Videos = require('./routes/dbModel.js').Videos;

io.sockets.on('connection', function(socket) {

    socket.on('home', function() {
        socket.roomname = "home";
        socket.join("home");
    });

    socket.on('enter', function(songId, nickname, country) {
        if (nickname.match(/^[a-zA-z¥s]+$/) && nickname.length <= 10) socket.nickname = nickname;
        if (country.match(/^[a-zA-z¥s]+$/) && country.length == 2) socket.country = country;
        addMember(songId);
    });

    socket.on('message', function(message) {
        message.from = socket.id;
        if (message.type == "offer" || message.type == "answer") {
            message.nickname = socket.nickname;
            message.country = socket.country;
        }
        var target = message.sendto;
        if (target) {
            socket.to(target).emit('message', message);
        } else {
            emitMessage('message', message);
        }
    });

    socket.on('disconnect', function() {
        if (socket.roomname != "home") {
            var message = {};
            message.type = 'user disconnected';
            message.from = socket.id;
            emitMessage('message', message);
            delMember();
        }
    });

    socket.on('start', function() {
        emitMessage('start');
        emitMessageMeOnly('start');
    });

    function addMember(songId) {
        Videos.find({id:songId},{addTime:1, room:1, member:1, title:1},{sort:{room: -1},limit:1},function(err, video) {
            if (!err) {
                if (video[0] && video[0].addTime && ((new Date() - new Date(video[0].addTime))/1000 < 400)) { // 生成から400秒以内
                    if (video[0].member.length < 6) {
                        video[0].member.push({socketId: socket.id, nickname: socket.nickname, country: socket.country});
                        video[0].markModified('member');
                        video[0].save();
                        socket.roomname = songId + "_" + video[0].room;
                        socket.join(socket.roomname);
                        var ctime = new Date();
                        emitMessageMeOnly("enterOK", {time: video[0].addTime, ctime: ctime, title: video[0].title});
                        socket.broadcast.to("home").emit("addMember", {id: songId});
                        return;
                    } else {
                        emitMessageMeOnly("enterFail", {type: "full"});
                        return;
                    }
                } else {
                    if (video[0]) {
                        emitMessageMeOnly("enterFail", {type: "timeout"});
                    } else {
                        emitMessageMeOnly("enterFail", {type: "empty"});
                    }
                    return;
                }
            } else {
                emitMessageMeOnly("enterFail", {type: "others"});
                return;
            }
        });
    }

    function delMember() {
        if (socket.roomname) {
            var lastIndex = socket.roomname.lastIndexOf("_");
            var roomInfo;
            if (lastIndex > 0) roomInfo = [socket.roomname.slice(0,lastIndex), socket.roomname.slice(lastIndex+1)];
            if (roomInfo.length == 2 && roomInfo) {
                Videos.find({id:roomInfo[0],room:roomInfo[1]},{id:1, room:1, member:1, isOfficial:1},{limit:1},function(err, video) {
                    if (!err) {
                        if (video[0] && video[0].member) {
                            for (var m in video[0].member) {
                                if (video[0].member[m].socketId == socket.id) {
                                    video[0].member.splice(m,1);
                                    var id = video[0].id;
                                    if (video[0].member.length == 0 && !video[0].isOfficial) {
                                        setTimeout(function() {
                                            socket.broadcast.to("home").emit("delVideo", {id: id});
                                        }, 1500);
                                        socket.broadcast.to("home").emit("delMember", {id: id});
                                        video[0].remove();
                                        return;
                                    } else {
                                        socket.broadcast.to("home").emit("delMember", {id: id});
                                        video[0].markModified('member');
                                        video[0].save();
                                        return;
                                    }
                                }
                            }
                        }

                    }
                });
            }
        }
    }

    function emitMessage(type, message) {
        var roomname;
        roomname = socket.roomname;
        if (roomname) {
            socket.broadcast.to(roomname).emit(type, message);
        }
    }
    function emitMessageMeOnly(type, message) {
        socket.emit(type, message);
    }  
});