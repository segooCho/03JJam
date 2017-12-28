var express = require('express');
var router = express.Router();

// model
var Restaurant = require('../models/Restaurant');   //식당 회원 정보
var Group = require('../models/Group');             //식당의 메뉴 관리*(category : 모델 생성이 안됨)
var Meal = require('../models/Meal');               //식단 정보
var Like = require('../models/Like');               //좋아요 정보

// hash
var crypto = require('crypto');
// sleep
var sleep = require('system-sleep');
// return Page
var httpMsgs = require('../views/appJJam/httpMsgs.js');

// 파일 저장되는 위치 설정
var path = require('path');
var uploadDir = path.join( __dirname , '../uploads' );
var uploadsSignUpDir = path.join( __dirname , '../uploadsSignUp' );
var fs = require('fs');

//multer 셋팅
var multer  = require('multer');

//회원 가입 이미지
var storageSignUp = multer.diskStorage({
    destination : function (req, file, callback) {
        callback(null, uploadsSignUpDir );
    },
    filename : function (req, file, callback) {
        callback(null, 'file-' + Date.now() + '.'+ file.mimetype.split('/')[1] );
    }
});

var uploadsSignUp = multer({ storage: storageSignUp });

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

/********************************  찾기  ***********************************/

/* POST : 식당 찾기 */
router.post('/restaurantSearch', uploadsSignUp.single(), function(req, res){
    sleep(500);
    //console.log(req.body.searchText);
    //var testJson;

    Restaurant.find({$or:[{companyName:{$regex:req.body.searchText}},{address:{$regex:req.body.searchText}}]}
            ,{_id:1, companyName:1, certification:1, address:1, contactNumber:1, representative:1, androidRtn:1}
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

/* POST : 식당 인증 & 공지사항 */
router.post('/restaurantInfo', uploadsSignUp.single(), function(req, res){
    sleep(500);

    Restaurant.find({_id:req.body.restaurant_Id}
            ,{_id:0, certification:1, notice:1, androidRtn:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                var msg = "정보를 찾을 수 없거나 탈퇴된 상태입니다."
                httpMsgs.sendMessageFound(req, res, msg);
            }
        }        
    });
});

/* POST : 식단 조회 */
router.post('/mealSearch', uploadsSignUp.single(), function(req, res){
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
    //dataQuery 는 ',' 로 연결이 안됨 다중 처리시 신규 생성을 해야함용
    var dataQuery1 = {};
    var dataQuery2 = {};
    var msgSegmented = ""
    if (req.body.segmentedId == 0) {
        dataQuery1 = {mealDate:{$eq:today}};                       //오늘
        dataQuery2 = {division:{$ne:'사진식단'}};                    //sort
        msgSegmented = "오늘"
    } else if (req.body.segmentedId == 1) {
        dataQuery1 = {mealDate:{$gt:today}};                       //계획
        dataQuery2 = {division:{$ne:'사진식단'}};                    //sort
        msgSegmented = "계획"
    } else if (req.body.segmentedId == 2) {
        dataQuery1 = {mealDate:{$lt:today}};                       //과거
        dataQuery2 = {division:{$ne:'사진식단'}};                    //sort
        msgSegmented = "과거"
    } else if (req.body.segmentedId == 3) {
        dataQuery1 = {division:'사진식단'};                          //사진식단
        dataQuery2 = {division:'사진식단'};                          //sort
        msgSegmented = "사진"
    }
    //console.log(dataQuery1);

    Meal.find({$and:[{restaurant_Id:req.body.restaurant_Id}, dataQuery1, dataQuery2]}
            ,{}
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
    .limit(30);                                                  //제한 30

    /*  lookupQuery 방식 
    var lookupQuery = {
        $lookup: {  from: "likes"
                    ,localField: "_id"          //ObjectId 타입이 같아야 됨
                    ,foreignField: "meal_Id"    //meal_Id 스키마를 String => Schema.Types.ObjectId 
                    ,as: "likeDocs" 
                 }
    };
   
    Meal.aggregate([
                    lookupQuery
                    ,{ $match: 
                        {$and:[
                            {restaurant_Id: req.body.restaurant_Id}, dataQuery1, dataQuery2
                              ]
                         }
                     }
                    ,{
                      $project: {
                         restaurant_Id   : 1,
                         mealDate        : 1,
                         mealDateLabel   : 1,
                         location        : 1,
                         division        : 1,
                         sort            : 1,
                         stapleFood      : 1,
                         soup            : 1,
                         sideDish1       : 1,
                         sideDish2       : 1,
                         sideDish3       : 1,
                         sideDish4       : 1,
                         dessert         : 1,
                         remarks         : 1,
                         foodImage       : 1,
                         like            : 1,
                         androidRtn      : 1,
                         likeDocs: {
                            $filter: {
                               input: "$likeDocs",
                               as: "likeDoc",
                               cond: { $eq : ["$$likeDoc.uniqueId", "123"]}
                            }
                         }
                      }
                    }
                    ,{$sort : {"mealDate":1,"location":1,"sort":1,"division":1}}    //-1:내림 차순, 1:오늘 차순
                    ,{ $limit : 30 }                                                //제한 30
                   ]
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            console.log(data)

            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                var msg = msgSegmented + " 식단 정보가 없습니다."
                httpMsgs.sendMessageFound(req, res, msg);
                //httpMsgs.sendNoDataFound(req, res);
            }
        }     
    });
    */

});

/* POST : 식당 항목(Group) 조회 */
router.post('/restaurantGroup', uploadsSignUp.single(), function(req, res){
    sleep(500);

    var dataQuery = {};
    if (req.body.group != '') {
        dataQuery = {group:req.body.group}; 
    }

    //console.log(dataQuery)

    Group.find({$and:[{restaurant_Id:req.body.restaurant_Id},dataQuery]}
            ,{_id:0, restaurant_Id:1, group:1, text:1, androidRtn:1}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                //var msg = "기본 항목 정보가 없습니다."
                //httpMsgs.sendMessageFound(req, res, msg);
                httpMsgs.sendJson(req, res, data);      
            } else {
                var msg = "기본 항목 정보가 없습니다."
                httpMsgs.sendMessageFound(req, res, msg);
            }
        }        
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
                        , {_id:1, androidRtn:1}
                        , function(err, data){
                    if (err) {
                        httpMsgs.show500(req, res, err);
                    } else {
                        if (data.length>0) {
                            httpMsgs.sendJson(req, res, data);      
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


/* POST : 회원 정보 조회 */
router.post('/restaurantMember', uploadsSignUp.single(), function(req, res){
    sleep(500);

    Restaurant.find({_id:req.body.restaurant_Id}
            ,{}
            ,{}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                httpMsgs.sendJson(req, res, data);      
            } else {
                var msg = "회원 정보가 없습니다."
                httpMsgs.sendMessageFound(req, res, msg);
                //httpMsgs.sendNoDataFound(req, res);
            }
        }        
    });
});

/* POST : 식단 맛있어요 카운터  */
router.post('/mealLikeCount', uploadsSignUp.single(), function(req, res){
    //sleep(500);

    console.log(req.body.meal_Id)

    var cnt = 0;
    Like.count({meal_Id: req.body.meal_Id}, function (err, data) {
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            cnt = data;
            console.log(cnt)
        }        
    });

    //카운터 조회 시간이 필요 함???
    sleep(10);

    Like.count({$and:[{meal_Id : req.body.meal_Id}
                    ,{uniqueId: req.body.uniqueId}]}, function (err, data) {
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            //console.log(data);
            if (data > 0) {
                //console.log("y");
                httpMsgs.sendLikeCountFound(req, res, "y", cnt);
            } else {
                //console.log("n");
                httpMsgs.sendLikeCountFound(req, res, "n", cnt);
            }
        }        
    });
    
    //기본 세팅
    //httpMsgs.sendLikeCountFound(req, res, "n", cnt);

});
/********************************  등록  ***********************************/

/* POST : 회원 가입 */
router.post('/restaurantSignUp', uploadsSignUp.single('businessLicenseImage'), function(req, res){
    sleep(500);

    //회원 가입 ID 확인 (회원 아이디 중복 확인용)
    //console.log('req.body.id' , req.body.id); 

    Restaurant.find({id:req.body.id}
            , {}
            , function(err, data){
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            if (data.length>0) {
                //console.log(req.file.filename);
                //파일 삭제                
                if (req.file.filename != "") {
                    //경로 주위 해야 함 
                    //임시 파일이 생성 됨으로 직접 경로를 설정 
                    fs.unlinkSync(uploadsSignUpDir + '/' + req.file.filename);
                }

                var msg = "이미 존재하는 사용자ID 입니다.";
                httpMsgs.sendMessageFound(req, res, msg);
            } else {
                // 식당 등록 : (sha256 : swift 가 Hex만 지원)
                //var hash = crypto.createHash('sha256').update(req.body.password).digest('Hex');
                //console.log('hashed: ' , hash);

                //console.log('password: ' , req.body.password);
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
                    androidRtn              : '0',
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
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'location',       text: '구내식당',     androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'division',       text: '아침',        androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'division',       text: '점심-A',      androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'division',       text: '점심-B',      androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'division',       text: '저녁',        androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'division',       text: '사진식단',     androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'stapleFood',     text: '쌀밥',        androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'stapleFood',     text: '콩밥',       androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'stapleFood',     text: '짜장면',      androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'soup',           text: '된장국',      androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'soup',           text: '미역국',      androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'soup',           text: '소고기국',     androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'sideDish',       text: '김치',        androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'sideDish',       text: '소고기',       androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'sideDish',       text: '수육',        androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'sideDish',       text: '김',          androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'sideDish',       text: '콩나물',       androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'dessert',        text: '과일',        androidRtn: "0"});
                    bulk.insert( {restaurant_Id: restaurant_Id, group: 'dessert',        text: '없음',        androidRtn: "0"});
                    bulk.execute();
                });

                //msg 멘트 변경시 iOS 수정 필요
                var msg = "회원 가입이 완료되었습니다."
                httpMsgs.sendMessageZeroFound(req, res, msg);
            }
        }        
    });
});


/* POST : 식단 등록 */
router.post('/mealWrite', upload.single('foodImage'), function(req, res){
    sleep(500);
    
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
    } else if (req.body.division.indexOf('사진식단') > -1) {
        sort = 3
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
        like            : 0,
        foodImage       : (req.file) ? req.file.filename : "",
        androidRtn      : "0"
    });
    meal.save(function(err){
        //로그인 msg 멘트 변경시 iOS 수정 필요
        var msg = "식단 저장이 완료되었습니다."
        httpMsgs.sendMessageZeroFound(req, res, msg);
    });
});


/* POST : 식당 항목(Group) 추가  */
// upload.single() 이걸 사용해야지만 req.body 값이 들어 온다..!!! 왜???
router.post('/restaurantGroupAdd', upload.single(), function(req, res){
    sleep(500);

    //console.log(req.body)

    var group = new Group({
        restaurant_Id   : req.body.restaurant_Id,
        group           : req.body.group,
        text            : req.body.text,
        androidRtn      : '0',
    });

    group.save(function(err){
        //msg 멘트 변경시 iOS 수정 필요
        var msg = "저장이 완료되었습니다."
        httpMsgs.sendMessageZeroFound(req, res, msg);
    });
});


/********************************  수정  ***********************************/

/* POST : 회원 수정 */
router.post('/restaurantEdit', uploadsSignUp.single('businessLicenseImage'), function(req, res) {
    sleep(500);
   
    //console.log(req.body)

    var query;
    Restaurant.findOne({_id : req.body.restaurant_Id}
        , function(err, data){

        if (data == null) {
            var msg = "존재하지 않는 Oid 입니다."
            httpMsgs.sendMessageFound(req, res, msg);
        } else {
            //암호를 우선 처리
            if (req.body.password != '') {
                //암호 먼저 업데이트
                query = {password : req.body.password};
                Restaurant.update({_id : req.body.restaurant_Id}
                    , { $set : query }
                    , function(err){
                        if (err) {
                            httpMsgs.show500(req, res, err);
                        }                        
                        //console.log("암호 업데이트")
                });
            }

            
            if(req.file || req.body.editImage == 'NoImageFound.jpg'){  //요청중에 파일이 존재 할시 기존 businessLicenseImage 지운다.
                if (data.businessLicenseImage != "") {
                    //console.log('=> 파일 삭제');
                    fs.unlinkSync(uploadsSignUpDir + '/' + data.businessLicenseImage);
                    //fs.unlink(uploadDir + '/' + data.businessLicenseImage);
                //} else {
                    //console.log('=>등록된 파일은 없음');
                }
                //console.log('=> 등록 요청 파일 있음');
                query = {
                    businessNumber          : req.body.businessNumber,
                    companyName             : req.body.companyName,
                    address                 : req.body.address,
                    contactNumber           : req.body.contactNumber,
                    representative          : req.body.representative,
                    certification           : 'n',
                    businessLicenseImage    : (req.file) ? req.file.filename : "",
                };

                Restaurant.update({_id : req.body.restaurant_Id}
                    , { $set : query }
                    , function(err){
                        //로그인 msg 멘트 변경시 iOS 수정 필요
                        var msg = "회원 수정이 완료되었습니다.\n로그인 페이지로 이동합니다."
                        httpMsgs.sendMessageZeroFound(req, res, msg);
                });


            } else {
                //console.log('=> 등록 요청 파일 없음');
                query = {
                    businessNumber          : req.body.businessNumber,
                    companyName             : req.body.companyName,
                    address                 : req.body.address,
                    contactNumber           : req.body.contactNumber,
                    representative          : req.body.representative,
                };
                Restaurant.update({_id : req.body.restaurant_Id}
                    , { $set : query }
                    , function(err){
                        //로그인 msg 멘트 변경시 iOS 수정 필요
                        var msg = "회원 수정이 완료되었습니다.\n로그인 페이지로 이동합니다."
                        httpMsgs.sendMessageZeroFound(req, res, msg);
                });
            }
        }
    });

});

/* POST : 식단 수정 */
router.post('/mealEdit', upload.single('foodImage'), function(req, res){
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

    var query;
    Meal.findOne({_id : req.body.meal_Id}
        , function(err, data){

        if (data == null) {
            var msg = "존재하지 않는 Oid 입니다."
            httpMsgs.sendMessageFound(req, res, msg);
        } else {
            if(req.file || req.body.editImage == 'NoImageFound.jpg'){  //요청중에 파일이 존재 할시 기존 foodImage 지운다.
                if (data.foodImage != "") {
                    //console.log('=> 파일 삭제');
                    fs.unlinkSync(uploadDir + '/' + data.foodImage);
                    //fs.unlink(uploadDir + '/' + data.foodImage);
                //} else {
                    //console.log('=>등록된 파일은 없음');
                }
                //console.log('=> 등록 요청 파일 있음');
                query = {
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
                };
            } else {
                //console.log('=> 등록 요청 파일 없음');
                query = {
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
                    remarks         : req.body.remarks
                };
            }

            Meal.update({_id : req.body.meal_Id}, 
                        { $set : query },
            function(err){
                //로그인 msg 멘트 변경시 iOS 수정 필요
                var msg = "식단 저장이 완료되었습니다."
                httpMsgs.sendMessageZeroFound(req, res, msg);
            });
        }
    });
});

/* PUT : 식당 공지사항 수정 */
// upload.single() 이걸 사용해야지만 req.body 값이 들어 온다..!!! 왜???
router.put('/restaurantNoticeEdit', upload.single(), function(req, res){
    sleep(500);

    //console.log(req.body.restaurant_Id)
    //console.log(req.body.notice)

    var query = {
        notice        : req.body.notice
    };

    Restaurant.update({_id : req.body.restaurant_Id}, 
                { $set : query },
    function(err){
        //httpMsgs.sendNoDataFound(req, res);
        var msg = "저장 완료되었습니다."
        httpMsgs.sendMessageZeroFound(req, res, msg);
    });

});

/* PUT : 식단 맛있어요 설정/해제 */
// upload.single() 이걸 사용해야지만 req.body 값이 들어 온다..!!! 왜???
router.put('/mealLike', upload.single(), function(req, res){
    sleep(500);

    //console.log(req.body.meal_Id)
    
    Like.findOne({$and:[{meal_Id : req.body.meal_Id}
                ,{uniqueId: req.body.uniqueId}]}
                ,function(err, data){
        //like    
        if (data == null) {
            // 신규 등록
            var like = new Like({
                meal_Id         : req.body.meal_Id,
                uniqueId        : req.body.uniqueId,
                androidRtn      : '0',
            });

            like.save(function(err){
                //console.log("save")
                //msg 멘트 변경시 iOS 수정 필요
                var msg = "맛있어요 설정되었습니다."
                httpMsgs.sendMessageZeroFound(req, res, msg);
            });
        } else {
            Like.remove({$and:[{meal_Id : req.body.meal_Id}
                              ,{uniqueId: req.body.uniqueId}]}
                , function(err){
                //console.log("remove")
                    //msg 멘트 변경시 iOS 수정 필요
                    var msg = "맛있어요 해제되었습니다."
                    httpMsgs.sendMessageZeroFound(req, res, msg);
            });
        }
    });

    /*
    sleep(500);

    var cnt = 0;
    Like.count({meal_Id: req.body.meal_Id}, function (err, data) {
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            cnt = data;
        }        
    });

    Like.count({$and:[{meal_Id : req.body.meal_Id}
                    ,{uniqueId: req.body.uniqueId}]}, function (err, data) {
        if (err) {
            httpMsgs.show500(req, res, err);
        } else {
            //console.log(data);
            if (data > 0) {
                //console.log("y");
                httpMsgs.sendLikeCountFound(req, res, "y", cnt);
            } else {
                //console.log("n");
                httpMsgs.sendLikeCountFound(req, res, "n", cnt);
            }
        }        
    });
    */

    /*
    if (req.body.like == 'y') {
        Like.findOne({$and:[{meal_Id : req.body.meal_Id}
                    ,{uniqueId: req.body.uniqueId}]}
                    ,function(err, data){
            //like    
            if (data == null) {
                // 신규 등록
                var like = new Like({
                    meal_Id         : req.body.meal_Id,
                    uniqueId        : req.body.uniqueId,
                    androidRtn      : '0',
                });

                like.save(function(err){
                    //msg 멘트 변경시 iOS 수정 필요
                    var msg = "맛있어요 설정되었습니다."
                    httpMsgs.sendMessageFound(req, res, msg);
                });
            } else {
                var msg = "맛있어요 설정되었습니다."
                httpMsgs.sendMessageFound(req, res, msg);
            }
        });
    } else {
            Like.remove({$and:[{meal_Id : req.body.meal_Id}
                              ,{uniqueId: req.body.uniqueId}]}
                , function(err){
                    //msg 멘트 변경시 iOS 수정 필요
                    var msg = "맛있어요 해제되었습니다."
                    httpMsgs.sendMessageFound(req, res, msg);
            });
    }
    */

    /*
    Like.findOne({$and:[{meal_Id : req.body.meal_Id}
                ,{uniqueId: req.body.uniqueId}]}
                ,function(err, data){
        //like    
        if (data == null) {
            // 신규 등록
            var like = new Like({
                meal_Id         : req.body.meal_Id,
                uniqueId        : req.body.uniqueId,
                androidRtn      : '0',
            });

            like.save(function(err){
                //msg 멘트 변경시 iOS 수정 필요
                var msg = "맛있어요 설정되었습니다."
                httpMsgs.sendMessageFound(req, res, msg);
            });

        } else {
        //UnLike           
            Like.remove({$and:[{meal_Id : req.body.meal_Id}
                              ,{uniqueId: req.body.uniqueId}]}
                , function(err){
                    //msg 멘트 변경시 iOS 수정 필요
                    var msg = "맛있어요 해제되었습니다."
                    httpMsgs.sendMessageFound(req, res, msg);
            });

        }

    });
    */

});
/********************************  삭제  ***********************************/

/* DELETE : 식단 삭제 */
// upload.single() 이걸 사용해야지만 req.body 값이 들어 온다..!!! 왜???
router.delete('/mealDel', function(req, res){
    sleep(500);
    //console.log(req.query.meal_Id)

    Meal.findOne({_id : req.query.meal_Id}
        , function(err, data){
            if (err) {
                httpMsgs.show500(req, res, err);
            } else {
                    if (data == null) {
                        var msg = "존재하지 않는 Oid 입니다."
                        httpMsgs.sendMessageFound(req, res, msg);
                    } else {
                        if (data.foodImage != "") {
                            //console.log('=> 파일 삭제');
                            fs.unlinkSync(uploadDir + '/' + data.foodImage);
                        }
                        Meal.remove({_id : req.query.meal_Id}
                            , function(err){
                                //로그인 msg 멘트 변경시 iOS 수정 필요
                                var msg = "식단 삭제가 완료되었습니다."
                                httpMsgs.sendMessageZeroFound(req, res, msg);
                        });

                    }
            } 
    });
});

/* DELETE : 식당 항목 (Group) 삭제  */
// upload.single() 이걸 사용해야지만 req.body 값이 들어 온다..!!! 왜???
router.delete('/restaurantGroupDel', upload.single(), function(req, res){
    sleep(500);

    //console.log(req.body)

    Group.remove({$and:[{restaurant_Id : req.query.restaurant_Id}
                       ,{group: req.query.group}
                       ,{text: req.query.text}]}
        , function(err){
            //msg 멘트 변경시 iOS 수정 필요
            var msg = "삭제가 완료되었습니다."
            httpMsgs.sendMessageZeroFound(req, res, msg);
    });
});
module.exports = router;
