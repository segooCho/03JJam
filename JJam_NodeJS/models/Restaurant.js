var mongoose = require('mongoose');
var Schema = mongoose.Schema;

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
    notice                  : String,
    androidRtn              : String,
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

module.exports = mongoose.model('Restaurant' , RestaurantSchema);