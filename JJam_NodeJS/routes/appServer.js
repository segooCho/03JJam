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


/* GET : 관심 식당 찾기 */
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
                
                /*
                testJson =  
                                {"'_id'": "59719bd1aac67b1171fb460a",
                                "companyName": "벽산",
                                "address": " 경기도 성남시 중원구 둔촌대로 549 벽산밸리 101호",
                                "contactNumber": "031-111-2222",
                                "representative": "벽산",
                                "certification": "y"}
                            ;

                httpMsgs.sendJson(req, res, testJson);
                */
                
            } else {
                httpMsgs.sendNoDataFound(req, res);
            }
        }        
    });
});

/* GET : 오늘의 식단 */
router.get('/mealSearch', function(req, res){
    //console.log(req.query.searchText);
    //segmentedId 처리 필요
    Meal.find({$and:[{restaurant_Id:req.query.restaurant_Id},{dateString:req.query.dateString}]}
            ,{created_at:0, __v:0, restaurant_Id:0}
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

/* GET : 오늘의 식단: 다중 처리 */
router.get('/businessUsersMealSearch', function(req, res){
    //인증 
    var certification;
    Restaurant.find({_id:req.query.restaurant_Id}
            ,{_id:0, certification:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            //인증 값은 항상 존재 (y,n)            
            certification = data;
            //certification = [{'certification':'n'}];
        }        
    });

    //식당 공지
    var restaurantNotice;
    RestaurantNotice.find({restaurant_Id:req.query.restaurant_Id}
            , {_id:0, notice:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            //공지 값은 항상 존재 (y,n)            
            restaurantNotice = data;
            //restaurantNotice = [{'notice':'등록된 공지 사항이 없습니다.'}];
        }        
    });

    //TODO: segmentedId 처리 필요
    Meal.find({$and:[{restaurant_Id:req.query.restaurant_Id},{dateString:req.query.dateString}]}
            ,{created_at:0, __v:0, restaurant_Id:0}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                data.push(certification);              //인증
                data.push(restaurantNotice);          //공지 사항
                httpMsgs.sendJson(req, res, data);      //식단
            } else {
                httpMsgs.sendNoDataFound(req, res);
            }
        }        
    });
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
    var meal = new Meal({
        restaurant_Id   : req.body.restaurant_Id,
        dateString      : req.body.dateString,
        division        : req.body.division,
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
