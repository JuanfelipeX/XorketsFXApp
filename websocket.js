//Este archivo se encargará únicamente de conectarse al WebSocket.
const WebSocket = require("ws");
const { updatePrice } = require("./prices");

const WS_URL = "wss://app.xorketsfx.com/api/websocket/1/all";

let socket = null;

function connect() {

    console.log("Conectando a Xorkets...");

    socket = new WebSocket(WS_URL);

    socket.on("open", () => {

        console.log("✅ WebSocket conectado");

    });

    socket.on("message", (message) => {

        try {

            const json = JSON.parse(message);

            if (!json.data)
                return;

            json.data.forEach(asset => {

                updatePrice(asset.symbol, {

                    bid: asset.bid,
                    ask: asset.ask,
                    close: asset.close,
                    high: asset.high,
                    low: asset.low,
                    amount: asset.amount,
                    timestamp: asset.timestamp

                });

            });

        } catch (err) {

            console.error(err);

        }

    });

    socket.on("close", () => {

        console.log("WebSocket desconectado");

        setTimeout(connect, 5000);

    });

    socket.on("error", err => {

        console.error(err);

    });

}

module.exports = {
    connect
};