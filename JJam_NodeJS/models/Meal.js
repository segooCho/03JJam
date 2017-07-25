var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var autoIncrement = require('mongoose-auto-increment');

var MealSchema = new Schema({
    restaurant_Id   : String,
    mealDate        : String,
    mealDateLabel   : String,
    location        : String,
    division        : String,
    sort            : String,
    stapleFood      : String,
    soup            : String,
    sideDish1       : String,
    sideDish2       : String,
    sideDish3       : String,
    sideDish4       : String,
    dessert         : String,
    remarks         : String,
    foodImage       : String,
    created_at : {
        type        : Date,
        default     : Date.now()
    }
});

MealSchema.virtual('getDate').get(function(){
    var date = new Date(this.created_at);
    return {
        year : date.getFullYear(),
        month : date.getMonth()+1,
        day : date.getDate()
    };
});

//MealSchema.plugin( autoIncrement.plugin , { model : "task", field : "id" , startAt : 1 } );
module.exports = mongoose.model('Meal' , MealSchema);