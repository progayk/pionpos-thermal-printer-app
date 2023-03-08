const express = require("express");
const cors = require("cors");
const app = express();

let processedIdList = [];
let printActionLogs = [];

app.get("/", (req, res) => {
    res.send("PIONPOS printer app server!");
});

const port = 5002;
const corsOptions = {
    origin: "*",
};

const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

function createPrinter(config) {
    let printer = new ThermalPrinter({
        type: PrinterTypes.EPSON,
        interface: config.TCP_ADDRESS,
        width: config.width ?? 40,
        characterSet: "PC857_TURKISH",
    });
    printer.DETAILS = config;
    return printer;
}

async function print(data) {
    try {
        const { SELECTED_PRINTER, imgBuffer } = data;

        const printer = createPrinter(SELECTED_PRINTER);

        await printer.printImageBuffer(imgBuffer);
        printer.cut();

        await printer.execute();
        printer.beep();

        return { SUCCESS: true, id: data.id, data };
    } catch (error) {
        processedIdList = processedIdList.filter((item) => item !== data.id);
        return { ERROR: true, data, id: data.id };
    }
}

app.use(cors(corsOptions));
app.use(express.json());

app.post("/print", async (req, res) => {
    if (processedIdList.includes(req.body.id)) {
        return;
    }

    processedIdList.push(req.body.id);
    processedIdList = processedIdList.slice(-10);

    const printAction = await print(req.body);

    res.send(printAction);

    printActionLogs.push(printAction);
    printActionLogs = printActionLogs.slice(-10);

});


app.post("/test", async (req, res) => {
    try {
        const { image, printer } = req.body
        const buffer = Buffer.from(image.split(',')[1], 'base64');

        const result = await print({
            SELECTED_PRINTER: printer,
            imgBuffer: buffer,
        });

        res.send(result);
    } catch (error) {
        console.log(error)
        throw new Error("Error occured while printing", error);
    }
});

app.post("/health-check", async (req, res) => {
    const printer = createPrinter(req.body);
    const isConnected = await printer.isPrinterConnected(); // Check if printer is connected, return bool of status
    res.send({
        ...req.body,
        isConnected,
    });
});

app.listen(port, () => {
    console.log(`
    
██████╗ ██╗ ██████╗ ███╗   ██╗██████╗  ██████╗ ███████╗
██╔══██╗██║██╔═══██╗████╗  ██║██╔══██╗██╔═══██╗██╔════╝
██████╔╝██║██║   ██║██╔██╗ ██║██████╔╝██║   ██║███████╗
██╔═══╝ ██║██║   ██║██║╚██╗██║██╔═══╝ ██║   ██║╚════██║
██║     ██║╚██████╔╝██║ ╚████║██║     ╚██████╔╝███████║
╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝      ╚═════╝ ╚══════╝
                                                       

            PRINTER SERVER @2023
            
    `)

    console.log("Server running at", `localhost:${port}`);
});
