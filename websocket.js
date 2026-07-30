//Este archivo se encargará únicamente de conectarse al WebSocket.
const WebSocket = require("ws");
const { updatePrice } = require("./prices");

const WS_URL = "wss://app.xorketsfx.com/api/websocket/1/all";

let socket = null;

let connected = false;
let lastError = null;
let lastStatus = null;

function connect() {

    console.log("Conectando a Xorkets...");

    socket = new WebSocket(WS_URL, {
        headers: {
            Origin: "https://app.xorketsfx.com",
            "User-Agent": "Mozilla/5.0"
        }
    });

    socket.on("open", () => {

        connected = true;
        lastError = null;

        console.log("✅ WebSocket conectado");

    });

    socket.on("message", (message) => {

        try {

            const json = JSON.parse(message);

            if (!json.data)
                return;

            json.data.forEach(asset => {

                updatePrice(asset.symbol, asset);

            });

        } catch (err) {

            console.error("JSON ERROR:", err);

        }

    });

    socket.on("unexpected-response", (req, res) => {

        connected = false;

        lastStatus = res.statusCode;

        console.log("STATUS:", res.statusCode);

        console.log("HEADERS:", res.headers);

    });

    socket.on("close", () => {

        connected = false;

        console.log("WebSocket desconectado");

        setTimeout(connect, 5000);

    });

    socket.on("error", err => {
        connected = false;
        lastError = err.message;
        console.error("WS ERROR:", err.message);
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