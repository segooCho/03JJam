var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var autoIncrement = require('mongoose-auto-increment');

var RestaurantSchema = new Schema({
    id                      : String,
    password                : String,
    businessNumber          : String,
    companyName             : String,
    address                 : String,
    contactNumber           : String,
    representative          : String,
    certification           : String,
    businessLicenseImage    : String,
    created_at : {
        type                : Date,
        default             : Date.now()
    }
});


RestaurantSchema.virtual('getDate').get(function(){
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

//RestaurantSchema.plugin( autoIncrement.plugin , { model : "task", field : "id" , startAt : 1 } );
module.exports = mongoose.model('Restaurant' , RestaurantSchema);