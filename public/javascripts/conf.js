// テスト
const cookieSecure = "";
const stun_url = "";
var socket;
if ("io" in this) socket = io.connect('http://localhost:8080/');

/*
const cookieSecure = ";secure";
const stun_url = "stun:stun.l.google.com:19302";
var socket;
if ("io" in this) socket = io.connect('https://chample.in:8080/');
*/