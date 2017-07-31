var express = require('express');
var router = express.Router();

// model
var Restaurant = require('../models/Restaurant');   //식당 회원 정보
var Group = require('../models/Group');             //식당의 메뉴 관리*(category : 모델 생성이 안됨)
var Meal = require('../models/Meal');               //식단 정보

// hash
var crypto = require('crypto');
// sleep
var sleep = require('system-sleep');
// return Page
var httpMsgs = require('../views/appJJam/httpMsgs.js');

// 파일 저장되는 위치 설정
var path = require('path');
var uploadDir = path.join( __dirname , '../uploads' );
var uploadSignUpDir = path.join( __dirname , '../uploadsSignUp' );
var fs = require('fs');

//multer 셋팅
var multer  = require('multer');
//회원 가입 이미지
var storageSignUp = multer.diskStorage({
    destination : function (req, file, callback) {
        callback(null, uploadSignUpDir );
    },
    filename : function (req, file, callback) {
        callback(null, 'file-' + Date.now() + '.'+ file.mimetype.split('/')[1] );
    }
});
var uploadSignUp = multer({ storage: storageSignUp });

//식단 저장 이미지
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
    sleep(500);

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
                var msg = "검색된 식당 정보가 없습니다."
                httpMsgs.sendMessageFound(req, res, msg);
            }
        }        
    });
});

/* GET : 식당 인증 & 공지사항 */
router.get('/restaurantInfo', function(req, res){
    sleep(500);

    Restaurant.find({_id:req.query.restaurant_Id}
            ,{_id:0, certification:1, notice:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                var msg = "선택된 식당은 탈퇴한 상태입니다."
                httpMsgs.sendMessageFound(req, res, msg);
            }
        }        
    });
});

/* GET : 식단 조회 */
router.get('/mealSearch', function(req, res){
    sleep(500);

    //날짜 가져오기
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    var today = year + "-" + month + "-" + day

    //segmentedId 구분 처리
    //dateQuery 는 ',' 로 연결이 안됨 다중 처리시 신규 생성을 해야함용
    var dateQuery1 = {};
    var dateQuery2 = {};
    var msgSegmented = ""
    if (req.query.segmentedId  == 0) {
        dateQuery1 = {mealDate:{$eq:today}};             //오늘
        dateQuery2 = {sort:{$ne:3}};                    //sort
        msgSegmented = "오늘"
    } else if (req.query.segmentedId  == 1) {
        dateQuery1 = {mealDate:{$gt:today}};             //계획
        dateQuery2 = {sort:{$ne:3}};                    //sort
        msgSegmented = "계획"
    } else if (req.query.segmentedId  == 2) {
        dateQuery1 = {mealDate:{$lt:today}};             //과거
        dateQuery2 = {sort:{$ne:3}};                    //sort
        msgSegmented = "과거"
    } else if (req.query.segmentedId  == 3) {
        dateQuery1 = {sort:3};                          //사진식단
        dateQuery2 = {sort:3};                          //sort
        msgSegmented = "사진"
    }
    //console.log(dateQuery1);

    Meal.find({$and:[{restaurant_Id:req.query.restaurant_Id}, dateQuery1, dateQuery2]}
            ,{created_at:0, __v:0, restaurant_Id:0}
            ,{}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                var msg = msgSegmented + " 식단 정보가 없습니다."
                httpMsgs.sendMessageFound(req, res, msg);
                //httpMsgs.sendNoDataFound(req, res);
            }
        }        
    })
    .sort({"mealDate":1,"location":1,"sort":1,"division":1})    //-1:내림 차순, 1:오늘 차순
    .limit(30)                                                  //제한 30
    ;
});

/* GET : 식당 category 항목(Group) 조회 */
router.get('/restaurantGroup', function(req, res){
    sleep(500);

    Restaurant.find({restaurant_Id:req.query.restaurant_Id}
            ,{_id:0, category:1, text:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                var msg = "기본 항목 정보가 없습니다."
                httpMsgs.sendMessageFound(req, res, msg);
            }
        }        
    });
});

/*==============================================================================================*/
/* POST : 회원 가입 */
router.post('/restaurantSignUp', uploadSignUp.single('businessLicenseImage'), function(req, res){
    sleep(500);

    //회원 가입 ID 확인 (회원 아이디 중복 확인용)
    console.log('req.body.id' , req.body.id); 

    Restaurant.find({id:req.body.id}
            , {}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                var msg = "이미 존재하는 사용자ID 입니다."
                httpMsgs.sendMessageFound(req, res, msg);

            } else {
                // 식당 등록 : (sha256 : swift 가 Hex만 지원)
                //var hash = crypto.createHash('sha256').update(req.body.password).digest('Hex');
                //console.log('hashed: ' , hash);
                console.log('password: ' , req.body.password);
                var restaurant = new Restaurant({
                    id                      : req.body.id,
                    password                : req.body.password,
                    businessNumber          : req.body.businessNumber,
                    companyName             : req.body.companyName,
                    address                 : req.body.address,
                    contactNumber           : req.body.contactNumber,
                    representative          : req.body.representative,
                    businessLicenseImage    : (req.file) ? req.file.filename : "",
                    certification           : 'n',
                    notice                  : "공지사항",
                });

                restaurant.save(function(err, data){
                    if (err) {
                        httpMsgs.show500(req, res, err);
                    }
                    //ObjectId("xxxxxx")를 벗김
                    var restaurant_Id = data._id.toString() 
                    // 기본 메뉴 & Location(구내식당,학생식당 등) & 구분(아침,점심,저녁,사진식단)
                    // 기본 메뉴 등록
                    // 모든 정보는 하나 이상의 값을 가진다.
                    //-location     : 구내식당,학생식당 등 , 
                    //-division     : 사진식단(필수), ('아침', '점심', '저녁') 의 포함한 값으러 설정한다.
                    //-stapleFood   : 주식(밥,면)
                    //-soup         : 국
                    //-sideDish     : 반찬
                    //-dessert      : 없음(필수) 후식
                    
                    //기본 메뉴 등록(category : 모델 생성이 안됨)
                    var bulk = Group.collection.initializeUnorderedBulkOp();
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'location',       text: '구내식당'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'division',       text: '아침'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'division',       text: '점심'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'division',       text: '저녁'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'division',       text: '사진식단'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'stapleFood',     text: '쌀밥'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'stapleFood',     text: '콩밥'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'soup',           text: '미역국'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'soup',           text: '소고기국'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'sideDish',       text: '김치'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'sideDish',       text: '소고기'});
                    bulk.insert( {restaurant_Id: restaurant_Id, category: 'dessert',        text: '없음'});
                    bulk.execute();
                });

                //msg 멘트 변경시 iOS 수정 필요
                var msg = "회원 가입이 완료되었습니다."
                httpMsgs.sendMessageFound(req, res, msg);
            }
        }        
    });
});

/* POST : 식단 등록 */
router.post('/mealWrite', upload.single('foodImage'), function(req, res){
    sleep(500);

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
        sort = 3
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

/* POST : 식단 공지 수정 */
// upload.single() 이걸 사용해야지만 req.body 값이 들어 온다..!!! 왜???
router.post('/restaurantNoticeEdit', upload.single(), function(req, res){
    sleep(500);

    //console.log(req.body);
    var query = {
        notice : req.body.notice
    };

    Restaurant.update( {restaurant_Id : req.body.restaurant_Id }, { $set : query },
    function(err){
        httpMsgs.sendNoDataFound(req, res);
    });
});

/* POST : 로그인 */
// upload.single() 이걸 사용해야지만 req.body 값이 들어 온다..!!! 왜???
router.post('/restaurantLogin', upload.single(), function(req, res){
    sleep(500);

    //사용자 ID 검사
    Restaurant.find({id:req.body.id}
            , {}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                //패스워드 검사
                Restaurant.find({$and:[{id:req.body.id},{password:req.body.password}]}
                        , {_id:1}
                        , function(err, data){
                    if (err) {
                        httpMsgs.show500(req, res, err);
                    } else {
                        if (data.length>0) {
                            httpMsgs.sendJson(req, res, data);      

                            /*
                            //식당 category 항목(Group) 조회 
                            var restaurant_Id = data[0]._id.toString() 

                            Group.find({restaurant_Id: restaurant_Id}
                                    ,{category:1, text:1}
                                    , function(err, data){
                                if (err) {
                                    httpMsgs.show500(req, res, err);
                                } else {
                                    if (data.length>0) {
                                        httpMsgs.sendJson(req, res, data);      
                                    } else {
                                        var msg = "사용자의 기본 항목 정보가 없습니다. 시스템 운영자에게 문의하세요."
                                        httpMsgs.sendMessageFound(req, res, msg);
                                    }
                                }        
                            });
                            */

                        } else {
                            //로그인 msg 멘트 변경시 iOS 수정 필요
                            var msg = "패스워드가 잘못되었습니다."
                            httpMsgs.sendMessageFound(req, res, msg);
                        }
                    }        
                });
            } else {
                //로그인 msg 멘트 변경시 iOS 수정 필요
                var msg = "존재하는 않는 사용자ID 입니다."
                httpMsgs.sendMessageFound(req, res, msg);
            }
        }        
    });
});
module.exports = router;
