const express = require("express");

const { connect, getStatus } = require("./websocket");

const {
    getPrice,
    getAllPrices
} = require("./prices");

const app = express();

const PORT = process.env.PORT || 3000;

connect();

app.get("/", (req, res) => {

    res.json({
        status: "ok",
        service: "Market Feed API"
    });

});

app.get("/status", (req, res) => {

    res.json({

        websocket: getStatus(),

        symbols: Object.keys(getAllPrices()).length,

        prices: getAllPrices()

    });

});

app.get("/prices", (req, res) => {

    res.json(getAllPrices());

});

app.get("/price/:symbol", (req, res) => {

    const price = getPrice(req.params.symbol);

    if (!price) {

        return res.status(404).json({
            error: "Símbolo no encontrado"
        });

    }

    res.json(price);

});

app.listen(PORT, () => {

    console.log(`Servidor iniciado en puerto ${PORT}`);

});