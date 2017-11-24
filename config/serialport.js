module.exports.serialport = {

};

global.isCallApi = true;

function callApi(cardName) {

    if (isCallApi) {
        global.isCallApi = false;
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
            global.isCallApi = true;
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
    } else {
        blue("API in progress");
    }
}


SerialPort.list(function (err, allSerial) {
    if (err) {
        red("Error Finding Serial Port");
    } else {
        var cardReaderSerial = _.find(allSerial, function (n) {
            return (n.manufacturer && n.manufacturer.search("Arduino") >= 0);
        });
        if (cardReaderSerial) {
            var port = new SerialPort(cardReaderSerial.comName, {
                baudRate: 9600
            });

            var string = "";


            port.open(function (err) {
                if (err) {
                    // return console.log('Error opening port: ', err.message);
                }
            });

            // The open event is always emitted
            port.on('open', function () {
                console.log();
                console.log();
                console.log();
                console.log();
                console.log();
                green("Card Reader Connected");
                console.log();
                console.log();
                console.log();
                console.log();
                console.log();
            });
            port.on('close', function () {
                red("Card Reader Disconnected");
                beep(3);
            });

            port.on('data', function (data) {
                string += data.toString("binary");
                var stringArr = _.split(string, "\n");
                if (stringArr.length > 1) {
                    var newCard = _.chain(stringArr).head().split(" ").join("").trim().value();
                    string = "";
                    var cardSelected = _.find(sails.config.cards, function (n) {
                        var retVal = false;
                        if (_.isArray(n.value)) {
                            var findVal = _.find(n.value, function (m) {
                                return m == newCard;
                            });
                            if (findVal) {
                                retVal = true;
                            }
                        } else {
                            retVal = (n.value == newCard);
                        }
                        return retVal;
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
        } else {
            red("Card Reader Not Connected");
        }
    }
});