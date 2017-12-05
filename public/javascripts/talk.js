var localVideo = document.getElementById('video0');
var localStream = null;
var mediaConstraints = {mandatory: {OfferToReceiveAudio: true,OfferToReceiveVideo: true}};
var IceCandidate = window.mozRTCIceCandidate || window.RTCIceCandidate;

var idNameCountry = {};

// ---- multi people video & audio ----
var videoElementsInUse = {};
var videoElementsStandBy = {};
pushVideoStandBy(getVideoForRemote(1));
pushVideoStandBy(getVideoForRemote(2));
pushVideoStandBy(getVideoForRemote(3));
pushVideoStandBy(getVideoForRemote(4));
pushVideoStandBy(getVideoForRemote(5));

function getVideoForRemote(index) {
    var elementID = 'video' + index;
    var element = document.getElementById(elementID);
    return element;
}

// ---- video element management ---
function pushVideoStandBy(element) {
    videoElementsStandBy[element.id] = element;
}

function popVideoStandBy() {
    var element = null;
    //console.log(videoElementsStandBy);
    var smallestId = "video9";
    for (var id in videoElementsStandBy) {
        if (id < smallestId) {
            smallestId = id;
        }        
    }
    if (smallestId != "video9") {
        element = videoElementsStandBy[smallestId];
        delete videoElementsStandBy[smallestId];
        return element;
    }
    return null;
}

function pushVideoInUse(id, element) {
    videoElementsInUse[id] = element;
}

function popVideoInUse(id) {
    element = videoElementsInUse[id];
    delete videoElementsInUse[id];
    return element;
}

function attachVideo(id, stream) {
    //console.log('try to attach video. id=' + id);
    var videoElement = popVideoStandBy();
    if (videoElement) {
        videoElement.src = window.URL.createObjectURL(stream);
        //console.log(idNameCountry);
        if (videoElement.id.length == 6) {
            var n = videoElement.id.slice(5);
            $("#nickname"+n+" span").html(idNameCountry[id].nickname);
            $("#nickname"+n+" img").attr({"src":"./images/flags/"+idNameCountry[id].country+".png"});
            $("#nickname"+n+" img").show();
            flagImgAddFunc();
            mapReload(); // sing.js
        }
        //console.log("videoElement.src=" + videoElement.src);
        pushVideoInUse(id, videoElement);
        videoElement.style.display = 'block';
    } else {
        //console.error('--- no video element stand by.');
    }
}

function detachVideo(id) {
    //console.log('try to detach video. id=' + id);
    var videoElement = popVideoInUse(id);
    if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
        //console.log("videoElement.src=" + videoElement.src);
        pushVideoStandBy(videoElement);
        if (videoElement.id.length == 6) {
            var n = videoElement.id.slice(-1);
            $("#nickname"+n+" span").html("");
            $("#nickname"+n+" img").attr({"src":""});
            $("#nickname"+n+" img").hide();
            mapReload(); // sing.js
        }
    }
    else {
        //console.warn('warning --- no video element using with id=' + id);
    }
}

function detachAllVideo() {
    var element = null;
    for (var id in videoElementsInUse) {
        detachVideo(id);
    }
}

function getFirstVideoInUse() {
    var element = null;
    for (var id in videoElementsInUse) {
        element = videoElementsInUse[id];
        return element;
    }
    return null;
}

function getVideoCountInUse() {
    var count = 0;
    for (var id in videoElementsInUse) {
        count++;
    }
    return count;
}


function isLocalStreamStarted() {
    if (localStream) {
        return true;
    }
    else {
        return false;
    }
}

// -------------- multi connections --------------------
var MAX_CONNECTION_COUNT = 5;
var connections = {}; // Connection hash
function Connection() { // Connection Class
    var self = this;
    var id = "";  // socket.id of partner
    var peerconnection = null; // RTCPeerConnection instance
    var established = false; // is Already Established
    var iceReady = false;
}

function getConnection(id) {
    var con = null;
    con = connections[id];
    return con;
}

function addConnection(id, connection) {
    connections[id] = connection;
}

function getConnectionCount() {
    var count = 0;
    for (var id in connections) {
        count++;
    }

    //console.log('getConnectionCount=' + count);
    return count;
}

function isConnectPossible() {
    if (getConnectionCount() < MAX_CONNECTION_COUNT)
        return true;
    else
        return false;
}

function getConnectionIndex(id_to_lookup) {
    var index = 0;
    for (var id in connections) {
        if (id == id_to_lookup) {
            return index;
        }
        index++;
    }
    // not found
    return -1;
}

function deleteConnection(id) {
    delete connections[id];
}

function stopAllConnections() {
    for (var id in connections) {
        var conn = connections[id];
        conn.peerconnection.close();
        conn.peerconnection = null;
        delete connections[id];
    }
}

function stopConnection(id) {
    var conn = connections[id];
    if(conn) {
        //console.log('stop and delete connection with id=' + id);
        conn.peerconnection.close();
        conn.peerconnection = null;
        delete connections[id];
    } else {
        //console.log('try to stop connection, but not found id=' + id);
    }
}

function isPeerStarted() {
    if (getConnectionCount() > 0) {
        return true;
    }
    else {
        return false;
    }
}


// ---- socket ------
// create socket
var socketReady = false;

// socket: channel connected
socket.on('message', onMessage);

// socket: accept connection request
function onMessage(evt) {
    var id = evt.from;
    var target = evt.sendto;
    var conn = getConnection(id);

    if (evt.type === 'call') {
        if (! isLocalStreamStarted()) {
            return;
        }
        if (conn) {
            return;  // already connected
        }

        if (isConnectPossible()) {
            //socket.json.send({type: "response", sendto: id });
            sendOffer(id);
        } else {
            //console.warn('max connections. so ignore call'); 
        }
        return;
    }/* else if (evt.type === 'response') {
        sendOffer(id);
        return;
    }*/ else if (evt.type === 'offer') {
        //console.log("Received offer, set offer, sending answer....")
        onOffer(evt);
        if (evt.nickname && evt.country) idNameCountry[id] = {nickname: evt.nickname, country: evt.country};
    } else if (evt.type === 'answer' && isPeerStarted()) {  // **
        //console.log('Received answer, settinng answer SDP');
        onAnswer(evt);
        if (evt.nickname && evt.country) idNameCountry[id] = {nickname: evt.nickname, country: evt.country};
    } else if (evt.type === 'candidate' && isPeerStarted()) { // **
        //console.log('Received ICE candidate...');
        onCandidate(evt);
    } else if (evt.type === 'user disconnected' && isPeerStarted()) { // **
        //console.log("disconnected");
        detachVideo(id); // force detach video
        stopConnection(id);
    }
}

function onOffer(evt) {
    //console.log("Received offer...")
    //console.log(evt);
    setOffer(evt);
    sendAnswer(evt);
}

function onAnswer(evt) {
    //console.log("Received Answer...")
    //console.log(evt);
    setAnswer(evt);
}

function onCandidate(evt) {
    var id = evt.from;
    var conn = getConnection(id);
    if (!conn) {
        //console.error('peerConnection not exist!');
        return;
    }

    // --- check if ice ready ---
    if (!conn.iceReady) {
        //console.warn("PeerConn is not ICE ready, so ignore");
        return;
    }

    var candidate = new IceCandidate({sdpMLineIndex:evt.sdpMLineIndex, sdpMid:evt.sdpMid, candidate:evt.candidate});
    //console.log("Received Candidate...")
    //console.log(candidate);
    conn.peerconnection.addIceCandidate(candidate);
}

function sendSDP(sdp) {
    var text = JSON.stringify(sdp);
    //console.log("---sending sdp text ---");
    //console.log(text);
    
    socket.json.send(sdp);
}

function sendCandidate(candidate) {
    var text = JSON.stringify(candidate);
    //console.log("---sending candidate text ---");
    //console.log(text);
    
    socket.json.send(candidate);
}

// ---------------------- video handling -----------------------
// start local video
function startVideo() {
    var videoObj = {video: {
        mandatory : {
            minWidth: 160,minHeight: 120,
            maxWidth   : 160,maxHeight  : 120   
        }
    }, audio: true};
    if(!navigator.getUserMedia){
        var alertMes = $("#browserUnable").html();
        alert(alertMes);
        player.stopVideo();
    } else {
        navigator.getUserMedia(videoObj,
            function (stream) {
                if (stream.getVideoTracks().length > 0 && stream.getAudioTracks().length > 0) {
                    localStream = stream;
                    track = stream.getTracks();
                    attachMediaStream(localVideo, stream);
                    localVideo.play();
                    localVideo.volume = 0;
                    socketReady = true;
                    var songId = queries.q;
                    var nickname = getCookie("ni");
                    var country = getCookie("co");
                    socket.emit('enter', songId, nickname, country);
                    call();
                } else {
                    showYouNeed(); // sing.js
                }
            }, function (error) {
                //console.error('An error occurred:');
                //console.error(error);
                showYouNeed();
                return;
            }
        );
    }
}

// stop local video
function stopVideo() {
    localVideo.src = "";
    localStream.stop();
}

// ---------------------- connection handling -----------------------
function prepareNewConnection(id) {
    var pc_config = {"iceServers":[
        {"url": stun_url}
    ]};
    var options = {optional: [{DtlsSrtpKeyAgreement: true},{RtpDataChannels: true}]};
    var peer = null;
    try {
        if (stun_url) { // 本番
            peer = new RTCPeerConnection(pc_config, options);
        } else { // テスト
            peer = new RTCPeerConnection();
        }
    } catch (e) {
        //console.log("Failed to create PeerConnection, exception: " + e.message);
    }
    var conn = new Connection();
    conn.id = id;
    conn.peerconnection = peer;
    peer.id = id;
    addConnection(id, conn);

// send any ice candidates to the other peer
    peer.onicecandidate = function (evt) {
        if (evt.candidate) {
            //console.log(evt.candidate);
            sendCandidate({type: "candidate", 
                      sendto: conn.id,
                      sdpMLineIndex: evt.candidate.sdpMLineIndex,
                      sdpMid: evt.candidate.sdpMid,
                      candidate: evt.candidate.candidate});
        } else {
            //console.log("End of candidates. ------------------- phase=" + evt.eventPhase);
            conn.established = true;
        }
    };

    //console.log('Adding local stream...');
    peer.addStream(localStream);

    peer.addEventListener("addstream", onRemoteStreamAdded, false);
    peer.addEventListener("removestream", onRemoteStreamRemoved, false)

    // when remote adds a stream, hand it on to the local video element
    function onRemoteStreamAdded(event) {
        //console.log("Added remote stream");
        attachVideo(this.id, event.stream);
    }

    // when remote removes a stream, remove it from the local video element
    function onRemoteStreamRemoved(event) {
        //console.log("Remove remote stream");
        detachVideo(this.id);
    }
    return conn;
}

function sendOffer(id) {
    var conn = getConnection(id);
    if (!conn) {
        conn = prepareNewConnection(id);
    }

    conn.peerconnection.createOffer(function (sessionDescription) { // in case of success
        conn.iceReady = true;
        conn.peerconnection.setLocalDescription(sessionDescription);
        sessionDescription.sendto = id;
        sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
        //console.log(sessionDescription.sdp);
        sendSDP(sessionDescription);
    }, function () { // in case of error
        //console.log("Create Offer failed");
    }, mediaConstraints);
    conn.iceReady = true;
}

function setOffer(evt) {
    var id = evt.from;
    var conn = getConnection(id);
    //conn = prepareNewConnection(id);
    //conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt));
    if (! conn) {
        conn = prepareNewConnection(id);
        conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt));
    }
    else {
        //console.error('peerConnection alreay exist!');
    }
}

function sendAnswer(evt) {
    //console.log('sending Answer. Creating remote session description...' );
    var id = evt.from;
    var conn = getConnection(id);
    if (! conn) {
        //console.error('peerConnection not exist!');
        return
    }

    conn.peerconnection.createAnswer(function (sessionDescription) { 
    // in case of success
        conn.iceReady = true;
        conn.peerconnection.setLocalDescription(sessionDescription);
        sessionDescription.sendto = id;
        sessionDescription.sdp = setBandwidth(sessionDescription.sdp);
        //console.log(sessionDescription.sdp);
        sendSDP(sessionDescription);
    }, function () { // in case of error
        //console.log("Create Answer failed");
    }, mediaConstraints);
    conn.iceReady = true;
}

function setAnswer(evt) {
    var id = evt.from;
    var conn = getConnection(id);
    if (!conn) {
        //console.error('peerConnection not exist!');
        return
    }
    conn.peerconnection.setRemoteDescription(new RTCSessionDescription(evt));
}

// call others before connecting peer
function call() {
    if (! isLocalStreamStarted()) {
        //alert("Local stream not running yet. Please [Start Video] or [Start Screen].");
        return;
    }
    if (! socketReady) {
        //alert("Socket is not connected to server. Please reload and try again.");
        return;
    }
    // call others, in same room
    //console.log("call others in same room, before offer");
    socket.json.send({type: "call"});
}

// stop the connection upon user request
function hangUp() {
    //console.log("Hang up.");
    detachAllVideo();
    stopAllConnections();

    localVideo.src = "";
    for (var i = 0; i < track.length; i++) {
        track[i].stop();
    }
}





function setBandwidth(sdp) {

    var bandwidth = {
        screen: 200, // 300kbits minimum
        audio: 50,   // 50kbits  minimum
        video: 200   // 256kbits (both min-max)
    };
    var isScreenSharing = false;

    sdp = BandwidthHandler.setApplicationSpecificBandwidth(sdp, bandwidth, isScreenSharing);
    sdp = BandwidthHandler.setVideoBitrates(sdp, {
        min: bandwidth.video,
        max: bandwidth.video
    });
    sdp = BandwidthHandler.setOpusAttributes(sdp);

    return sdp;

}

var BandwidthHandler = (function() {
    function setBAS(sdp, bandwidth, isScreen) {
        if (!!navigator.mozGetUserMedia || !bandwidth) {
            return sdp;
        }

        if (isScreen) {
            if (!bandwidth.screen) {
                //console.warn('It seems that you are not using bandwidth for screen. Screen sharing is expected to fail.');
            } else if (bandwidth.screen < 300) {
                //console.warn('It seems that you are using wrong bandwidth value for screen. Screen sharing is expected to fail.');
            }
        }

        // if screen; must use at least 300kbs
        if (bandwidth.screen && isScreen) {
            sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
            sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + bandwidth.screen + '\r\n');
        }

        // remove existing bandwidth lines
        if (bandwidth.audio || bandwidth.video || bandwidth.data) {
            sdp = sdp.replace(/b=AS([^\r\n]+\r\n)/g, '');
        }

        if (bandwidth.audio) {
            sdp = sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + bandwidth.audio + '\r\n');
        }

        if (bandwidth.video) {
            sdp = sdp.replace(/a=mid:video\r\n/g, 'a=mid:video\r\nb=AS:' + (isScreen ? bandwidth.screen : bandwidth.video) + '\r\n');
        }

        return sdp;
    }

    // Find the line in sdpLines that starts with |prefix|, and, if specified,
    // contains |substr| (case-insensitive search).
    function findLine(sdpLines, prefix, substr) {
        return findLineInRange(sdpLines, 0, -1, prefix, substr);
    }

    // Find the line in sdpLines[startLine...endLine - 1] that starts with |prefix|
    // and, if specified, contains |substr| (case-insensitive search).
    function findLineInRange(sdpLines, startLine, endLine, prefix, substr) {
        var realEndLine = endLine !== -1 ? endLine : sdpLines.length;
        for (var i = startLine; i < realEndLine; ++i) {
            if (sdpLines[i].indexOf(prefix) === 0) {
                if (!substr ||
                    sdpLines[i].toLowerCase().indexOf(substr.toLowerCase()) !== -1) {
                    return i;
                }
            }
        }
        return null;
    }

    // Gets the codec payload type from an a=rtpmap:X line.
    function getCodecPayloadType(sdpLine) {
        var pattern = new RegExp('a=rtpmap:(\\d+) \\w+\\/\\d+');
        var result = sdpLine.match(pattern);
        return (result && result.length === 2) ? result[1] : null;
    }

    function setVideoBitrates(sdp, params) {
        params = params || {};
        var xgoogle_min_bitrate = params.min;
        var xgoogle_max_bitrate = params.max;

        var sdpLines = sdp.split('\r\n');

        // VP8
        var vp8Index = findLine(sdpLines, 'a=rtpmap', 'VP8/90000');
        var vp8Payload;
        if (vp8Index) {
            vp8Payload = getCodecPayloadType(sdpLines[vp8Index]);
        }

        if (!vp8Payload) {
            return sdp;
        }

        var rtxIndex = findLine(sdpLines, 'a=rtpmap', 'rtx/90000');
        var rtxPayload;
        if (rtxIndex) {
            rtxPayload = getCodecPayloadType(sdpLines[rtxIndex]);
        }

        if (!rtxIndex) {
            return sdp;
        }

        var rtxFmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + rtxPayload.toString());
        if (rtxFmtpLineIndex !== null) {
            var appendrtxNext = '\r\n';
            appendrtxNext += 'a=fmtp:' + vp8Payload + ' x-google-min-bitrate=' + (xgoogle_min_bitrate || '228') + '; x-google-max-bitrate=' + (xgoogle_max_bitrate || '228');
            sdpLines[rtxFmtpLineIndex] = sdpLines[rtxFmtpLineIndex].concat(appendrtxNext);
            sdp = sdpLines.join('\r\n');
        }

        return sdp;
    }

    function setOpusAttributes(sdp, params) {
        params = params || {};

        var sdpLines = sdp.split('\r\n');

        // Opus
        var opusIndex = findLine(sdpLines, 'a=rtpmap', 'opus/48000');
        var opusPayload;
        if (opusIndex) {
            opusPayload = getCodecPayloadType(sdpLines[opusIndex]);
        }

        if (!opusPayload) {
            return sdp;
        }

        var opusFmtpLineIndex = findLine(sdpLines, 'a=fmtp:' + opusPayload.toString());
        if (opusFmtpLineIndex === null) {
            return sdp;
        }

        var appendOpusNext = '';
        appendOpusNext += '; stereo=' + (typeof params.stereo != 'undefined' ? params.stereo : '1');
        appendOpusNext += '; sprop-stereo=' + (typeof params['sprop-stereo'] != 'undefined' ? params['sprop-stereo'] : '1');

        if (typeof params.maxaveragebitrate != 'undefined') {
            appendOpusNext += '; maxaveragebitrate=' + (params.maxaveragebitrate || 128 * 1024 * 8);
        }

        if (typeof params.maxplaybackrate != 'undefined') {
            appendOpusNext += '; maxplaybackrate=' + (params.maxplaybackrate || 128 * 1024 * 8);
        }

        if (typeof params.cbr != 'undefined') {
            appendOpusNext += '; cbr=' + (typeof params.cbr != 'undefined' ? params.cbr : '1');
        }

        if (typeof params.useinbandfec != 'undefined') {
            appendOpusNext += '; useinbandfec=' + params.useinbandfec;
        }

        if (typeof params.usedtx != 'undefined') {
            appendOpusNext += '; usedtx=' + params.usedtx;
        }

        if (typeof params.maxptime != 'undefined') {
            appendOpusNext += '\r\na=maxptime:' + params.maxptime;
        }

        sdpLines[opusFmtpLineIndex] = sdpLines[opusFmtpLineIndex].concat(appendOpusNext);

        sdp = sdpLines.join('\r\n');
        return sdp;
    }

    return {
        setApplicationSpecificBandwidth: function(sdp, bandwidth, isScreen) {
            return setBAS(sdp, bandwidth, isScreen);
        },
        setVideoBitrates: function(sdp, params) {
            return setVideoBitrates(sdp, params);
        },
        setOpusAttributes: function(sdp, params) {
            return setOpusAttributes(sdp, params);
        }
    };
})();