var j5 = require('johnny-five'),
    HI = require('heat-index'),
    post = require('./lib/http_post'),
    conf = require('./app-conf.json'),
    arduino = new j5.Board(),
    COMMAND = {
        TH: {
            GET: 'TH:get'
        },
        AP: {
            GET: 'AP:get'
        }
    };

// SysEx STRING_DATA handler
function onString(data) {
    var response = parseStringMessage(data);
    if (response.type === 'XX') {
        return;
    }
    if (response.type === 'TH') {
        arduino.emit('TH', response, conf, '/api/thermohygros');
    } else if (response.type === 'AP') {
        arduino.emit('AP', response, conf, '/api/pressures');
    }
    //console.log(data);
}

arduino.on('TH', post);
arduino.on('AP', post);
arduino.on('IL', post);

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
    } else if (response.type === 'AP') {
        response.pressure = parseFloat(response.body.split(',', 2)[1]);
    }
    return response;
}

function notConnected() {
    if (! arduino.io) {
        console.error('not connected to arduino.');
        return true;
    }
    return false;
}
// send Temperature and Humidity request to Arduino
function requestTemperatureHumidity() {
    if (notConnected()) {
        return;
    }
    arduino.io.sendString(COMMAND.TH.GET);
}

function requestPressure() {
    if (notConnected()) {
        return;
    }
    arduino.io.sendString(COMMAND.AP.GET);
}

function requestIlluminance() {
    var sensor = new j5.Sensor({
        pin: 'A2',
        freq: conf.requestInterval
    });
    sensor.on('data', function (err, value) {
        arduino.emit('IL', { illuminance: value }, conf, '/api/illuminances');
    });
}

arduino.on('ready', function () {
    arduino.on('string', function (data) {
        onString(data);
    });
    requestIlluminance();

    setInterval(requestTemperatureHumidity, conf.requestInterval);
    setTimeout(function(){
        setInterval(requestPressure, conf.requestInterval)
    }, conf.requestInterval / 2);
});
