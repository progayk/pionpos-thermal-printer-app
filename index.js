
(function () {
    'use strict';
    // this function is strict...
}());

// Setting up our app requirements

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const Server = require('http').Server;
const server = new Server(app);
const path = require('path');
const port = 5002;

const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

const ORDER_TYPE = "ORDER"
const RECEIPT_TYPE = "RECEIPT"


function print(data) {

    let printers = []
    data.SELECTED_PRINTERS.forEach(function (item) {
        let printer = new ThermalPrinter({
            type: PrinterTypes.EPSON,
            interface: item.TCP_ADDRESS,
            width: 40,
            characterSet: 'PC857_TURKISH',
        });
        console.log('created printer ', printer);
        printer.DETAILS = item
        console.log('printer with details', printer.DETAILS)
        printers.push(printer)
    })

    if (data.TYPE === RECEIPT_TYPE) {
        console.log('printing with new printer recipet')
        let printer = printers.find(function (p) {
            return p.DETAILS.roles.RECEIPT === true
        })

        if (!printer) {
            console.log('no printer')
            return
        }

        printer.println(replaceTrChars(data.OUTPUT));
        printer.cut();

        try {
            let execute = printer.execute();
            printer.beep(); // Sound internal beeper/buzzer (if available)
            console.log("Print done receipt, bar!i with new");
            // await printer.printImage(".touch.png"); // Print PNG image
        } catch (error) {
            console.log("Print failed with new:", error);
        }


    } else if (data.TYPE === ORDER_TYPE) {


        if (data.ORDERS.bar) {

            let printer = printers.find(function (p) {
                return p.DETAILS.roles.ORDER === true &&
                    p.DETAILS.sectionRef === 'bar'
            })

            if (!printer) {
                console.log("no printer available for bar")
                return
            }

            printer.println(replaceTrChars(data.ORDERS.bar));
            printer.cut();

            try {
                let execute = printer.execute();
                printer.beep(); // Sound internal beeper/buzzer (if available)
                console.log("Print done bar with new!");
                // await printer.printImage(".touch.png"); // Print PNG image
            } catch (error) {
                console.log("Print failed with new:", error);
            }
        }

        if (data.ORDERS.kitchen) {
            let printer = printers.find(function (p) {
                console.log(p.DETAILS.sectionRef)
                return p.DETAILS.roles.ORDER === true &&
                    p.DETAILS.sectionRef === 'mutfak'
            })

            if (!printer) {
                console.log("no printer available for kitchen")
                return
            }

            // printer.setTextDoubleHeight();                              // Set text to double height
            // printer.setTextDoubleWidth();

            console.log(data.ORDERS.kitchen)
            printer.println(replaceTrChars(data.ORDERS.kitchen));
            printer.cut();

            try {
                printer.beep(); // Sound internal beeper/buzzer (if available)
                let execute = printer.execute();
                console.log("Print done kitchen with new!");
                // await printer.printImage(".touch.png"); // Print PNG image
            } catch (error) {
                console.log("Print failed with new:", error);
            }
        }

    }

    return (data)
}


function replaceAll(string, search, replace) {
    if (string) {
        return string.split(search).join(replace);
    }
    return ""
}

const replaceTrChars = (temp) => {
    // const searchRegExp = /\s/g;
    // replaceWith = '-';

    let res = replaceAll(temp, 'İ', "i");
    // console.log(res)
    res = replaceAll(res, "ş", "s");
    res = replaceAll(res, "Ş", "S");
    res = replaceAll(res, "ğ", "g");
    // console.log(res)
    return res
}


// Setting up our port
server.listen(port, () => console.log("Server at", port));

// Configuiring simple express routes
// getDir() function is used here along with package.json.pkg.assets
app.use(bodyParser.json());
app.use('/', express.static(getDir() + '/views'));

app.get('/', function (req, res) {
    res.sendFile(getDir() + '/views/index.html');
});

app.post('/print', (req, res) => {
    console.dir(req.body);
    print(req.body);
    return res.send(JSON.stringify("hello"));
});


// Using a function to set default app path
function getDir() {
    if (process.pkg) {
        return path.resolve(process.execPath + "/..");
    } else {
        return path.join(require.main ? require.main.path : process.cwd());
    }
}