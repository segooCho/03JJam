var express = require('express');
var router = express.Router();

// Model
var Restaurant = require('../models/Restaurant');
var Meal = require('../models/Meal');
var RestaurantNotice = require('../models/RestaurantNotice');


// Return Page
var httpMsgs = require('../views/appJJam/httpMsgs.js');

// 파일 저장되는 위치 설정
var path = require('path');
var uploadDir = path.join( __dirname , '../uploads' );
var fs = require('fs');

 //multer 셋팅
var multer  = require('multer');
var storage = multer.diskStorage({
    destination : function (req, file, callback) {
        callback(null, uploadDir );
    },
    filename : function (req, file, callback) {
        callback(null, 'file-' + Date.now() + '.'+ file.mimetype.split('/')[1] );
    }
});
var upload = multer({ storage: storage });


/* GET : 식당 찾기 */
router.get('/restaurantSearch', function(req, res){
    console.log(req.query.searchText);
    var testJson;
    Restaurant.find({$or:[{companyName:{$regex:req.query.searchText}},{address:{$regex:req.query.searchText}}]}
            ,{_id:1, companyName:1, certification:1, address:1, contactNumber:1, representative:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);
            } else {
                httpMsgs.sendNoDataFound(req, res);
            }
        }        
    });
});

/* GET : 식당 인증 */
router.get('/restaurantCertification', function(req, res){
    Restaurant.find({_id:req.query.restaurant_Id}
            ,{_id:0, certification:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                httpMsgs.sendNoDataFound(req, res);
            }
        }        
    });
});

/* GET : 식당 공지 사항 */
router.get('/restaurantNotice', function(req, res){
    RestaurantNotice.find({restaurant_Id:req.query.restaurant_Id}
            , {_id:0, notice:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                httpMsgs.sendNoDataFound(req, res);
            }
        }        
    });
});

/* GET : 식단 조회 */
router.get('/mealSearch', function(req, res){
    //날짜 가져오기
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var today = year + "-" + month + "-" + day

    //segmentedId 구분 처리
    var dateQuery = {};
    if (req.query.segmentedId  == 0) {
        dateQuery = {mealDate:{$eq:today}};      //오늘
    } else if (req.query.segmentedId  == 1) {
        dateQuery = {mealDate:{$gt:today}};      //계획
    } else if (req.query.segmentedId  == 2) {
        dateQuery = {mealDate:{$lt:today}};      //과거
    }
    //console.log(dateQuery);

    Meal.find({$and:[{restaurant_Id:req.query.restaurant_Id},dateQuery]}
            ,{created_at:0, __v:0, restaurant_Id:0}
            ,{}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                httpMsgs.sendNoDataFound(req, res);
            }
        }        
    }).sort({"mealDate":1,"location":1,"sort":1,"division":1}); //-1:내림 차순, 1:오늘 차순
});

/* GET : 식당 공지 찾기 */
router.get('/restaurantNoticeSearch', function(req, res){
    RestaurantNotice.find({restaurant_Id:req.query.restaurant_Id}
            ,{_id:0, notice:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);
            } else {
                httpMsgs.sendNoDataFound(req, res);
            }
        }        
    });
});

/*==============================================================================================*/

/* POST : 회원 가입 */
router.post('/restaurantSignUp', upload.single('businessLicenseImage'), function(req, res){
    //console.log(req.body);
    // 식당 등록
    var restaurant = new Restaurant({
        password                : req.body.password,
        businessNumber          : req.body.businessNumber,
        companyName             : req.body.companyName,
        address                 : req.body.address,
        contactNumber           : req.body.contactNumber,
        representative          : req.body.representative,
        certification           : req.body.certification,
        businessLicenseImage    : (req.file) ? req.file.filename : ""
    });
    restaurant.save(function(err){
        httpMsgs.sendNoDataFound(req, res);
        /*TODO : restaurant_Id 받아 오기
        // 식당 등록
        var tmpNotice = "공지사항"
        var restaurantNotice = new RestaurantNotice({
            restaurant_Id   : req.body.restaurant_Id,
            notice          : tmpNotice
        });
        restaurantNotice.save(function(err){
            httpMsgs.sendNoDataFound(req, res);
        });
        */
        // 기본 메뉴 등록

    });
});

/* POST : 식단 등록 */
router.post('/mealWrite', upload.single('foodImage'), function(req, res){
    //console.log(req.body);

    //요일 찾기
    var weekName = new Array('일','월','화','수','목','금','토'); 
    var year = req.body.mealDate.substring(0,4);
    var month = req.body.mealDate.substring(5,7);
    var day = req.body.mealDate.substring(8,10);
    var week = new Date(year, month-1, day, 0,0,0,0);               //month는 0~11까지임 
    week = weekName[week.getDay()]; 
  
    //아침,점심,저녁으로 구분
    var sort
    if (req.body.division.indexOf('아침') > -1) {
        sort = 0
    } else if (req.body.division.indexOf('점심') > -1) {
        sort = 1
    } else if (req.body.division.indexOf('저녁') > -1) {
        sort = 2
    } else {
        sort = 4
    }



    var meal = new Meal({
        restaurant_Id   : req.body.restaurant_Id,
        mealDate        : req.body.mealDate,
        mealDateLabel   : week,
        location        : req.body.location,
        division        : req.body.division,
        sort            : sort,
        stapleFood      : req.body.stapleFood,
        soup            : req.body.soup,
        sideDish1       : req.body.sideDish1,
        sideDish2       : req.body.sideDish2,
        sideDish3       : req.body.sideDish3,
        sideDish4       : req.body.sideDish4,
        dessert         : req.body.dessert,
        remarks         : req.body.remarks,
        foodImage       : (req.file) ? req.file.filename : ""
    });
    meal.save(function(err){
        httpMsgs.sendNoDataFound(req, res);
    });
});

/* POST : 식단 공지 */
// upload.single() 이걸 사용해야지만 req.body 값이 들어 온다..!!! 왜???
router.post('/restaurantNoticeEdit', upload.single(), function(req, res){
    console.log(req.body);
    RestaurantNotice.findOne({restaurant_Id:req.body.restaurant_Id}, function(err, data){
        if (data.notice == "") {
            //기존 등록된 공지가 없다면 Save       
            console.log("Save");
            var restaurantNotice = new RestaurantNotice({
                restaurant_Id   : req.body.restaurant_Id,
                notice          : req.body.notice,
            });
            restaurantNotice.save(function(err){
                httpMsgs.sendNoDataFound(req, res);
            });

        } else {
            //기존 등록된 공지가 있다면 Update        
            console.log("Update");
            var query = {
                notice : req.body.notice
            };

            RestaurantNotice.update( {restaurant_Id : req.body.restaurant_Id }, { $set : query },
            function(err){
                httpMsgs.sendNoDataFound(req, res);
            });
        }
    });

});

module.exports = router;
