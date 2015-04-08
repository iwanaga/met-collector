var j5 = require('johnny-five'),
    HI = require('heat-index'),
    post = require('./lib/http_post'),
    conf = require('./app-conf.json'),
    arduino = new j5.Board(),
    COMMAND = {
        TH: {
            GET: 'TH:get'
        },
        AC: {
            TOGGLE: 'AC:toggle'
        }
    };

// SysEx STRING_DATA handler
function onString(data) {
    var response = parseStringMessage(data);
    if (response.type === 'XX') {
        //console.log(data);
        return;
    }
    if (response.type === 'TH') {
        arduino.emit('TH', response, conf);
    } else if (response.type === 'AC') {
        arduino.emit('AC:toggled', response);
    }
}

arduino.on('TH', post);

// format string data to object
function parseStringMessage(data) {
    var response = {
        type : data.split(':', 2)[0],
        body : data.split(':', 2)[1]
    };
    if (response.type === 'TH') {
        response.temperature = parseFloat(response.body.split(',', 2)[0]);
        response.humidity = parseFloat(response.body.split(',', 2)[1]);
        response.heatIndex = HI.heatIndex(response);
    }
    return response;
}

// send Temperature and Humidity request to Arduino
function requestTemperatureHumidity() {
    if (! arduino.io) {
        console.error('not connected to arduino.');
        return;
    }
    arduino.io.sendString(COMMAND.TH.GET);
}

arduino.on('ready', function () {
    arduino.on('string', function (data) {
        onString(data);
    });
    setInterval(requestTemperatureHumidity, conf.requestInterval);
});
