module.exports.serialport = {

};
var port = new SerialPort('/dev/tty.usbmodem1411', {
    baudRate: 9600
});

function callApi(cardName) {

    var options = {
        method: 'POST',
        url: env.realHost + '/api/Player/serve',
        headers: {
            'content-type': 'application/json'
        },
        body: {
            card: cardName
        },
        json: true
    };
    request(options, function (error, response, body) {
        if (error) {
            console.log(error);
        } else {
            if (body.value) {
                green(body.data);
            } else {
                red(body.error);
            }
        }
    });

}



var string = "";


port.open(function (err) {
    if (err) {
        // return console.log('Error opening port: ', err.message);
    }
});

// The open event is always emitted
port.on('open', function () {
    console.log("Guessing Cards");
});

port.on('data', function (data) {
    string += data.toString("binary");
    var stringArr = _.split(string, "\n");
    if (stringArr.length > 1) {
        var newCard = _.chain(stringArr).head().split(" ").join("").trim().value();
        string = "";
        var cardSelected = _.find(sails.config.cards, function (n) {
            return n.value == newCard;
        });
        if (cardSelected) {
            if (cardSelected.name.length == 2) {
                beep();
            } else {
                beep(5);
            }
            console.log("The Card is " + cardSelected.name);
            callApi(cardSelected.name);
        }
    }
});