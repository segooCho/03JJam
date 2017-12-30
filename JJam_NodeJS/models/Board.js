var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// 문의 또는 식당요청 게시판
// restaurant_Id : 사업자 일때만 등록 
// uniqueId : 일반 사용자 일때만 등록 
// division : 식당요청 : 0, 문의 : 1
// title    : 제목
// contents : 문의 / 식당 요청 내용
// answer   : 답변

var BoardSchema = new Schema({
    restaurant_Id   : String,
    uniqueId        : String,
    division        : String,
    title           : String,
    contents        : String,
    answer          : String,
    androidRtn      : String,
    created_at : {
        type        : Date,
        default     : Date.now()
    }
});

BoardSchema.virtual('getDate').get(function(){
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

module.exports = mongoose.model('Board' , BoardSchema);