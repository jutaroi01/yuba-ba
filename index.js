var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var async = require('async');

var app = express();
app.set('port', (process.env.PORT || 5000));
app.use(bodyParser.urlencoded({extended: true}));  // JSONの送信を許可
app.use(bodyParser.json());                        // JSONのパースを楽に（受信時）

app.post('/callback', function(req, res){
    async.waterfall([
            function(next) {
                // リクエストがLINE Platformから送られてきたか確認する
                if (!validate_signature(req.headers['x-line-signature'], req.body)) {
                    return;
                }
                // テキストが送られてきた場合のみ返事をする
                if (req.body['events'][0]['type'] != 'message' ||
                    req.body['events'][0]['message']['type'] != 'text') {
                    return;
                }
            },
            function(next) { // 新しい名前を生成
                // 名前は3～11文字のみ有効
                if (oldName < 3 || oldName > 11) {
                    console.log("名前は3～11文字のみ有効");
                    return;
                }
                // 新しい名前の長さは、最小で2、最大で名前の文字数-2 or 4
                var newNameLen = Math.floor(Math.random() * (oldName.length - 3) ) + 2;
                if (newNameLen > 4) newNameLen = 4;
                // 新しい名前に使う文字のindexの配列
                var array = [];
                for (var i = 0; i < newNameLen; i++) {
                    while (true) {
                        var index = Math.floor(Math.random() * oldName.length);
                        if (array.indexOf(index) < 0) {
                            array.push(index);
                            break;
                        }
                    }
                }
                // 配列を昇順ソートしてから新しい名前を組み立て
                var newName = "";
                array.sort().forEach(function(v, i, a) {
                    newName = newName + oldName.charAt(v);
                })
                // console.log("「" + oldName + "」なんて生意気だね");
                // console.log("今日からあんたは「" + newName + "」だよ");
                next(newName);
            }
        ],
        function(err, newName) {
            if(err){
                return;
            }
            //ヘッダーを定義
            var headers = {
                'Content-Type' : 'application/json; charset=UTF-8',
                'Authorization' : 'Bearer ' + process.env.LINE_CHANNEL_ACCESS_TOKEN
            };
            var data = {
                'replyToken': req.body['events'][0]['replyToken'],
                'messages': [{
                    'type': 'text',
                    'text': 'test: ' + newName
                }]
            };
            //オプションを定義
            var options = {
                url: 'https://api.line.me/v2/bot/message/reply',
                headers: headers,
                json: true,
                body: data
            };
            request.post(options, function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log('success: ' + body);
                } else {
                    console.log('error: ' + JSON.stringify(response));
                }
            });
        });
    });
app.listen(app.get ('port'), function() {
    console.log('Node app is running');
});

// 署名検証
function validate_signature(signature, body) {
    return signature == crypto.createHmac('SHA256', process.env.LINE_CHANNEL_SECRET)
        .update(new Buffer(JSON.stringify(body), 'utf8')).digest('base64');
}