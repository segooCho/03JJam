var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// 운영자가 공지사는 내용
// division : 일반 : 0 , 사업자 : 1
// text : 공지 내용
// 히스토리 관리는 하지 않고 2 Row만 존재 한다.

var ManagerNoticeSchema = new Schema({
    division        : String,
    text            : String,
    androidRtn      : String
});

module.exports = mongoose.model('ManagerNotice' , ManagerNoticeSchema);