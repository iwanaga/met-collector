var http = require('http');

function onResponse(res) {
    /*
    console.log('STATUS: ' + res.statusCode);
    console.log('HEADERS: ' + JSON.stringify(res.headers));
    */
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
        //console.log('BODY: ' + chunk);
    });
}

function onError(e) {
    console.log('problem with request: ' + e.message);
}

function post(reqObj, conf) {
    var postData = JSON.stringify(reqObj);
    var options = {
        hostname: conf.hostname,
        port: conf.port,
        path: conf.path,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    var req = http.request(options, onResponse);
    req.on('error', onError);

    req.write(postData);
    req.end();
}

module.exports = post;
