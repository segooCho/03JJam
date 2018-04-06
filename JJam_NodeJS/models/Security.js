var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SecuritySchema = new Schema({
    type            : String,
    text            : String,
    androidRtn      : String,

});

module.exports = mongoose.model('Security' , SecuritySchema);