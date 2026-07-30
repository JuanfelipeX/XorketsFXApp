//Este archivo se encargará únicamente de conectarse al WebSocket.
const WebSocket = require("ws");
const { updatePrice } = require("./prices");

const WS_URL = "wss://app.xorketsfx.com/api/websocket/1/all";

let socket = null;

let connected = false;
let lastError = null;
let lastStatus = null;

function connect() {

    console.log("Conectando a:", WS_URL);

    socket = new WebSocket(WS_URL, {
        perMessageDeflate: false,
        handshakeTimeout: 15000
    });

    socket.on("open", () => {

        connected = true;
        lastError = null;
        lastStatus = 101;

        console.log("✅ WebSocket conectado");

    });

    socket.on("message", (data) => {

        try {

            const json = JSON.parse(data.toString());

            if (!json.data || !Array.isArray(json.data))
                return;

            json.data.forEach(asset => {

                if (asset.symbol) {
                    updatePrice(asset.symbol, asset);
                }

            });

        } catch (err) {

            console.error("JSON ERROR:", err.message);

        }

    });

    socket.on("unexpected-response", (req, res) => {

        connected = false;
        lastStatus = res.statusCode;

        console.log("HTTP STATUS:", res.statusCode);

    });

    socket.on("close", (code, reason) => {

        connected = false;

        console.log("CLOSE:", code, reason.toString());

        setTimeout(connect, 5000);

    });

    socket.on("error", (err) => {

        connected = false;
        lastError = err.message;

        console.log("ERROR:", err.message);

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