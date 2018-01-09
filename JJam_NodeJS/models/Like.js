var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var LikeSchema = new Schema({
    restaurant_Id         : String,
    meal_Id         : String,
    uniqueId        : String,
    androidRtn      : String,
    created_at : {
        type        : Date,
        default     : Date.now()
    }
});

LikeSchema.virtual('getDate').get(function(){
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

module.exports = mongoose.model('Like' , LikeSchema);