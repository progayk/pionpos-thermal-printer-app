
(function () {
    'use strict';
    // this function is strict...
}());

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Server = require('http').Server;
const server = new Server(app);
// const path = require('path');
const port = 5002;
const cors = require("cors");
const corsOptions = {
    origin: '*',
    // credentials: true,            //access-control-allow-credentials:true
    // optionSuccessStatus: 200,
}

const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

// const chromeLauncher = require('chrome-launcher');

function createPrinter(config) {
    let printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: config.TCP_ADDRESS,
        width: config.width ?? 40,
        characterSet: 'PC857_TURKISH',
    });
    // console.log('created printer ', printer);
    printer.DETAILS = config
    return printer;
}

function print(data) {
    console.log(data.printerConfig.TCP_ADDRESS)
    console.log(data.output);
    const printer = createPrinter(data.printerConfig)
    printer.println(replaceTrChars(data.output));
    printer.cut();

    try {
        let execute = printer.execute();
        printer.beep(); // Sound internal beeper/buzzer (if available)
        console.log("Printing is successful!");
    } catch (error) {
        console.log("Print failed :", error);
    }
    return;
}

function replaceAll(string, search, replace) {
    if (string) {
        return string.split(search).join(replace);
    }
    return ""
}

const replaceTrChars = (temp) => {
    let res = replaceAll(temp, 'İ', "i");
    res = replaceAll(res, "ş", "s");
    res = replaceAll(res, "Ş", "S");
    res = replaceAll(res, "ğ", "g");
    return res
}

// Configuiring simple express routes
app.use(bodyParser.json());
app.use(cors(corsOptions));

app.post('/print', (req, res) => {
    print(req.body);
    return res.send(JSON.stringify("hello"));
});

// Setting up our port
server.listen(port, () => console.log("Server at", port));


// chromeLauncher.launch({
//     startingUrl: 'http://localhost:5002',
//     // chromeFlags: ['--headless', '--disable-gpu']
// }).then(chrome => {
//     console.log(`Chrome debugging port running on ${chrome.port}`);
// });