module.exports.serialport = {};

global.isCallApi = true;

function callServe(cardName) {
    if (isCallApi) {
        global.isCallApi = false;
        Player.serve({
            card: cardName
        }, function (err, data) {
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
                    return console.log('Error opening port: ', err.message);
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
            port.on('error', function (error) {
                red("Error Opening Port");
                beep(5);
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
                    console.log(newCard);
                    string = "";
                    Card.getCard(newCard, function (err, data) {
                        if (err) {
                            console.log(err);
                        } else if (_.isEmpty(data)) {
                            console.log("No Such Card Found");
                        } else {
                            if (data.name.length == 2) {
                                beep();
                                callServe(data.name);
                            } else {
                                beep(5);
                            }
                        }
                    });
                }
            });
        } else {
            red("Card Reader Not Connected");
        }
    }
});