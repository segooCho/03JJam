var mongoose = require('mongoose');
var Schema = mongoose.Schema;

//TODO : 기본 메뉴 & Location(구내식당,학생식당 등) & 구분(아침,점심,저녁,사진식단)
// 기본 메뉴 등록
// 모든 정보는 하나 이상의 값을 가진다.
//-location     : 구내식당,학생식당 등 , 
//-division     : 사진식단(필수), ('아침', '점심', '저녁')이 포함한 값으로 설정한다.
//-stapleFood   : 주식(밥,면)
//-soup         : 국
//-sideDish     : 반찬
//-dessert      : 없음(필수) 후식
//기본 메뉴 등록('category' 명칭으로 생성이 안됨)

var GroupSchema = new Schema({
    restaurant_Id   : String,
    group           : String,
    text            : String,
    androidRtn      : String,
});

module.exports = mongoose.model('Group' , GroupSchema);