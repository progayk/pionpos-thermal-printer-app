
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

async function print(data) {
    console.log(data.printerConfig.TCP_ADDRESS)
    const printer = createPrinter(data.printerConfig)
    const output = replaceTrChars(data.output);

    printer.println(output);
    printer.cut();

    console.log(output);

    try {
        let execute = await printer.execute();
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
    res = replaceAll(res, "ı", "i");
    res = replaceAll(res, "ş", "s");
    res = replaceAll(res, "Ş", "S");
    res = replaceAll(res, "ü", "u");
    res = replaceAll(res, "ö", "o");
    res = replaceAll(res, "Ö", "O");
    res = replaceAll(res, "ç", "c");
    res = replaceAll(res, "Ç", "C");
    res = replaceAll(res, "ğ", "g");
    res = replaceAll(res, "Ğ", "G");
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
server.listen(port, () => {
    console.log(`
+-----------------------------------------+
|  PIONPOS THERMAL PRINTER SERVER v0.0.2  |
+-----------------------------------------+
    `)
    console.log("Server running at: ", `localhost:${port}`);
});


// chromeLauncher.launch({
//     startingUrl: 'http://localhost:5002',
//     // chromeFlags: ['--headless', '--disable-gpu']
// }).then(chrome => {
//     console.log(`Chrome debugging port running on ${chrome.port}`);
// });