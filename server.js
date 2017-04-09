var express = require("express");
var bodyParser = require("body-parser");
var fs = require("fs");

var Pageres = require('pageres');

var app = express();

app.set("views", __dirname + '/public');
app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser());

app.engine("html", require("ejs").renderFile);

var httpServer = app.listen(80, function () {
    console.log('connected http server.');

    (function () { /* Routers */
        app.get("/", function (req, res) {
            res.status(200).render("main.html");
            return 0;
        });

        app.post("/api/get/documents/", function (req, res) {
            var body = req.body;
            var table = JSON.parse(fs.readFileSync('table.json').toString());

            var result = [];

            function outputResult() {
                res.status(200).end(JSON.stringify(result));
            }

            if (body.keyword === "") {
                outputResult();
                return -1;
            }

            for (var i = 0; i < table.length; i++) {

                var doc = table[i];
                var title = doc.title;

                if (title.kor.indexOf(body.keyword) !== -1 || title.eng.indexOf(body.keyword) !== -1) {
                    result.push(doc);
                }
            }

            outputResult();
            return 0;
        });

        app.post("/api/insert/document", function (req, res) {
            var body = req.body;
            /*
                title:{
                    kor:
                    eng:
                }
                url:
                thumbnail:{
                    pc:
                    mobile
                }
            */
            var result;

            var checkStr = {
                normal: function (str) {
                    return typeof str === "string" && str.length > 1;
                },
                url: function (str) {
                    var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
                        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
                        '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
                        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
                        '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
                        '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
                    if (!pattern.test(str)) {
                        return false;
                    } else {
                        return true;
                    }
                }
            };

            if (typeof body.title === "object" && checkStr.normal(body.title.kor) && checkStr.normal(body.title.eng) && checkStr.url(body.url)) {
                var table = JSON.parse(fs.readFileSync('table.json').toString());

                function extractHostname(url) {
                    var hostname;
                    //find & remove protocol (http, ftp, etc.) and get the hostname
                    if (url.indexOf("://") > -1) {
                        hostname = url.split('/')[2];
                    }
                    else {
                        hostname = url.split('/')[0];
                    }

                    //find & remove port number
                    hostname = hostname.split(':')[0];

                    return hostname;
                }

                function extractRootDomain(url) {
                    var domain = extractHostname(url),
                        splitArr = domain.split('.'),
                        arrLen = splitArr.length;

                    //extracting the root domain here
                    if (arrLen > 2) {
                        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
                    }
                    return domain;
                }

                body.url = extractRootDomain(body.url);

                var wide = {
                    pc: "1600x900"
                };
                var pageres = new Pageres().
                    src(body.url, [wide.pc])
                    .dest(__dirname + "/public/capture")
                    .run()
                    .then(() => function () {
                        console.log('done');
                    });

                for (var i = 0; i < table.length; i++) {
                    if (table[i].url === body.url) {
                        res.status(200).end(JSON.stringify({
                            result: "error",
                            errorMsg: "이미 존재하는 페이지입니다."
                        }));
                        return;
                    }
                }
                body.thumbnail = {
                    pc: "/capture/" + body.url + '-' + wide.pc + '.png'
                };
                table.push(body);

                fs.writeFileSync("./table.json", JSON.stringify(table));

                result = {
                    result: "success"
                    //errorCode:0000
                };
            } else {
                result = {
                    result: "error"
                    //errorCode:0000
                };
            }
            res.status(200).end(JSON.stringify(result));
            return 0;
        });
    })();

});