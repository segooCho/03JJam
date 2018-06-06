var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// MongoDB 연결 Start
var mongoose = require('mongoose');
mongoose.Promise = global.Promise;
//이거 왜 오류 나는지 모르겠음 설치 문제???
//var autoIncrement = require('mongoose-auto-increment');

var db = mongoose.connection;
db.on( 'error' , console.error );
db.once( 'open' , function(){
    console.log("MongoDB connect");
});

var connect = mongoose.connect('mongodb://127.0.0.1/JJam'); 
//autoIncrement.initialize(connect);
// MongoDB 연결 End

var appServer = require('./routes/appServer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//업로드 path 추가
app.use('/uploads', express.static('uploads'));
app.use('/uploadsSignUp', express.static('uploadsSignUp'));

app.use('/', appServer);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
