var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var autoIncrement = require('mongoose-auto-increment');

var RestaurantNoticeSchema = new Schema({
    restaurant_Id           : String,
    notice                  : String,
    created_at : {
        type                : Date,
        default             : Date.now()
    }
});


RestaurantNoticeSchema.virtual('getDate').get(function(){
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

//RestaurantNoticeSchema.plugin( autoIncrement.plugin , { model : "task", field : "id" , startAt : 1 } );
module.exports = mongoose.model('RestaurantNotice' , RestaurantNoticeSchema);