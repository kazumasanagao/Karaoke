var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compression = require('compression')

var home = require('./routes/home');
var sing = require('./routes/sing');
var privacy = require('./routes/privacy');
var terms = require('./routes/terms');

var official = require('./routes/official');
var deleteEmpty = require('./routes/deleteEmpty');

var signaling = require('./signaling');

var app = express();

app.use(compression());

/*
app.use(function(req, res, next) {
    if(!(req.secure)) {
        res.redirect('https://' + req.get('Host') + req.url);
    } else {
        next();
    }
});

// エラーが起きてもサーバーが落ちないように(開発中はエラー知りたいので、コメントアウト)
process.on('uncaughtException', function(err) {
    console.log(err);
});
*/

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', home);
app.use('/sing', sing);
app.use('/privacy', privacy);
app.use('/terms', terms);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: "Error. Please try again later.",
      error: {}
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: "Error. Please try again later.",
    error: {}
  });
});

module.exports = app;