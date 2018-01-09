var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var MealSchema = new Schema({
    restaurant_Id   : String,
    mealDate        : String,
    mealDateLabel   : String,
    location        : String,
    division        : String,
    sort            : String,
    stapleFood1     : String,
    stapleFood2     : String,
    stapleFood3     : String,
    soup1           : String,
    soup2           : String,
    soup3           : String,
    sideDish1       : String,
    sideDish2       : String,
    sideDish3       : String,
    sideDish4       : String,
    sideDish5       : String,
    sideDish6       : String,
    sideDish7       : String,
    sideDish8       : String,
    sideDish9       : String,
    dessert1        : String,
    dessert2        : String,
    dessert3        : String,
    dessert4        : String,
    dessert5        : String,
    remarks         : String,
    foodImage       : String,
    androidRtn      : String,
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

module.exports = mongoose.model('Meal' , MealSchema);