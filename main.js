var j5 = require('johnny-five'),
    HI = require('heat-index'),
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
        console.log(data);
        return;
    }
    if (response.type === 'TH') {
        console.log(response)
    } else if (response.type === 'AC') {
        arduino.emit('AC:toggled', response);
    }
}

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
    console.log('to arduino: sent TH request');
}

arduino.on('ready', function () {
    arduino.on('string', function (data) {
        onString(data);
    });
    setInterval(requestTemperatureHumidity, 1000);
});
