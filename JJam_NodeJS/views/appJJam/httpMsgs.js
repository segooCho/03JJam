var settings = require('./settings');

exports.show500 = function (req, res, err) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(500, "Internal error occured", { "Content-Type": "text/html" });
        res.write("<html><head><title>500</title></head><body> 500: Internal Error. Details: " + err + "</body></html>")
    }
    else {
        res.writeHead(500, "Internal error occured", { "Content-Type": "application/json" });
        res.write(JSON.stringify({ data: "ERROR occured:" + err }));
    }
    res.end();
};

exports.sendJson = function (req, res, data) {
    res.writeHead(200, { "Content-Type": "application/json" });
    if (data) {
        res.write(JSON.stringify(data));
    }
    res.end();
};

exports.sendNoDataFound = function (req, res) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(200,  { "Content-Type": "text/html" });
        res.write("<html><head><title>No Data</title></head><body> No Data.</body></html>")
    }
    else {
        res.writeHead(200,  { "Content-Type": "application/json" });
        res.write(JSON.stringify({ data: "No Data" }));
    }
    res.end();
};

exports.sendLikeCountFound = function (req, res, check, cnt) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(200,  { "Content-Type": "text/html" });
        res.write("<html><head><title>" + check + "</title></head><body>" + check + "</body></html>")
    }
    else {
        res.writeHead(200,  { "Content-Type": "application/json" });
        res.write(JSON.stringify([{ androidRtn: '-1' , check: check, cnt: cnt }]));
    }
    res.end();
};

exports.sendMealBannerCheckFound = function (req, res, check) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(200,  { "Content-Type": "text/html" });
        res.write("<html><head><title>" + check + "</title></head><body>" + check + "</body></html>")
    }
    else {
        res.writeHead(200,  { "Content-Type": "application/json" });
        res.write(JSON.stringify([{ androidRtn: '0' , bannerCheck: check}]));
    }
    res.end();
};


exports.sendMessageFound = function (req, res, msg) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(200,  { "Content-Type": "text/html" });
        res.write("<html><head><title>" + msg + "</title></head><body>" + msg + "</body></html>")
    }
    else {
        res.writeHead(200,  { "Content-Type": "application/json" });
        res.write(JSON.stringify([{ androidRtn: '-1' , message: msg }]));
    }
    res.end();
};

//안드로이드 Message 정상 처리
exports.sendMessageZeroFound = function (req, res, msg) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(200,  { "Content-Type": "text/html" });
        res.write("<html><head><title>" + msg + "</title></head><body>" + msg + "</body></html>")
    }
    else {
        res.writeHead(200,  { "Content-Type": "application/json" });
        res.write(JSON.stringify([{ androidRtn: '0' , message: msg }]));
    }
    res.end();
};

exports.show400 = function (req, res) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(400, "Bad Request", { "Content-Type": "text/html" });
        res.write("<html><head><title>405</title></head><body> 400: Wrong id or Wrong password.</body></html>")

    }
    else {
        res.writeHead(400, "Bad Request", { "Content-Type": "application/json" });
        res.write(JSON.stringify({ data: "400: Wrong id or Wrong password." }));
    }
    res.end();
};

exports.show405 = function (req, res) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(405, "Method not supported", { "Content-Type": "text/html" });
        res.write("<html><head><title>405</title></head><body> 405: Method not supported.</body></html>")
    }
    else {
        res.writeHead(405, "Method not supported", { "Content-Type": "application/json" });
        res.write(JSON.stringify({ data: "405: Method not supported." }));
    }
    res.end();
};

exports.show404 = function (req, res) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(404, "Resource not found", { "Content-Type": "text/html" });
        res.write("<html><head><title>404</title></head><body> 404: Resource not found.</body></html>")
    }
    else {
        res.writeHead(404, "Resource not found", { "Content-Type": "application/json" });
        res.write(JSON.stringify({ data: "404: Resource not found." }));
    }
    res.end();
};

exports.show413 = function (req, res) {
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(413, "Request Entity Too Lange", { "Content-Type": "text/html" });
        res.write("<html><head><title>413</title></head><body> 413: Request Entity Too Lange.</body></html>")
    }
    else {
        res.writeHead(413, "Request Entity Too Lange", { "Content-Type": "application/json" });
        res.write(JSON.stringify({ data: "413: Request Entity Too Lange." }));
    }
    res.end();
};

exports.send200 = function (req, res) {   
        res.writeHead(200, { "Content-Type": "application/json" });      
        res.end();
};

exports.showHome = function (req, res){
    if (settings.httpMsgFormat === "HTML") {
        res.writeHead(200,  { "Content-Type": "text/html" });
        res.write("<html><head><title>Home</title></head><body><h2>Welcome to Nodejs and MS-SQL Home Page</h2><br> <h3>Valid endpoints:</h3><br> <ul><li>/employees - GET - To list all employee.</li> <li>/employees/<empno> - GET - Get a employee.</li></ul> </body></html>");
    }
    else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.write(JSON.stringify([{ url: '/eployees', operation: 'GET', description: 'To list all employees' },
                                  { url: '/eployees/id', operation: 'GET', description: 'Get a employee' }]));
    }
    res.end();


}






