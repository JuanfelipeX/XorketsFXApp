const WebSocket = require("ws");
const { updatePrice } = require("./prices");

const WS_URL = "wss://app.xorketsfx.com/api/websocket/1/all";

let connected = false;
let lastError = null;
let lastStatus = null;

function connect() {

    console.log("Conectando a:", WS_URL);

    const socket = new WebSocket(WS_URL, {
        handshakeTimeout: 15000,
        perMessageDeflate: false
    });

    socket.on("open", () => {

        connected = true;
        lastError = null;
        lastStatus = 101;

        console.log("✅ CONECTADO");

    });

    socket.on("message", data => {

        try {

            const json = JSON.parse(data.toString());

            if (!json.data)
                return;

            json.data.forEach(asset => {

                updatePrice(asset.symbol, asset);

            });

        } catch (e) {

            console.log("JSON ERROR:", e.message);

        }

    });

    socket.on("unexpected-response", (req, res) => {

        connected = false;
        lastStatus = res.statusCode;

        console.log("HTTP STATUS:", res.statusCode);

        console.log("HEADERS:");

        console.log(res.headers);

        let body = "";

        res.on("data", chunk => body += chunk);

        res.on("end", () => {

            console.log("BODY:");

            console.log(body);

        });

    });

    socket.on("error", err => {

        connected = false;

        lastError = err.message;

        console.log("ERROR:", err.message);

    });

    socket.on("close", (code, reason) => {

        connected = false;

        console.log("CLOSE:", code, reason.toString());

        setTimeout(connect, 5000);

    });

}

function getStatus() {

    return {

        connected,

        lastError,

        lastStatus

    };

}

module.exports = {

    connect,

    getStatus

};