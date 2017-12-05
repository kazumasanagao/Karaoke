var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var conf = require('./conf.js');

var videoSchema = new Schema({
    id: String,
    room: Number,
    title: String,
    addTime: Date,
    member: [new Schema({
        socketId: String,
        nickname: String,
        country: String
    }, {_id: false})],
    isOfficial: {type: Boolean, default: false},
    viewCount: {type: Number, default: 0}
});
mongoose.model('videos', videoSchema);

mongoose.Promise = global.Promise;
var dbVideos = mongoose.createConnection(conf.mongoVideos);
var Videos = dbVideos.model('videos');

module.exports = {
    Videos: Videos
}
