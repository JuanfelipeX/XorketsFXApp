// browser.js
// En lugar de conectarnos "a mano" al WebSocket (lo cual xorketsfx bloquea
// por protección anti-bot / Cloudflare), abrimos la página real dentro de
// un Chromium controlado por Playwright. La propia página abre su WebSocket
// de forma normal, y nosotros solo "escuchamos" los frames que recibe.

const { chromium } = require("playwright");
const { updatePrice } = require("./prices");

const PAGE_URL = "https://app.xorketsfx.com/"; // Ajusta si el WS se abre desde otra ruta/subpágina
const WS_URL_MATCH = "xorketsfx.com/api/websocket";

let browser = null;
let context = null;
let page = null;

let connected = false;
let lastError = null;
let restarting = false;

async function startBrowser() {
    try {
        console.log("Lanzando navegador...");

        browser = await chromium.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        context = await browser.newContext({
            userAgent:
                "Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36"
        });

        page = await context.newPage();

        page.on("websocket", (ws) => {
            console.log("WebSocket detectado:", ws.url());

            if (!ws.url().includes(WS_URL_MATCH)) return;

            connected = true;
            lastError = null;

            ws.on("framereceived", (event) => {
                handleMessage(event.payload);
            });

            ws.on("close", () => {
                console.log("WebSocket cerrado dentro del navegador");
                connected = false;
                scheduleRestart();
            });

            ws.on("socketerror", (err) => {
                console.log("Error de WebSocket:", err);
                lastError = String(err);
                connected = false;
            });
        });

        page.on("close", () => {
            console.log("Página cerrada inesperadamente");
            connected = false;
            scheduleRestart();
        });

        await page.goto(PAGE_URL, {
            waitUntil: "domcontentloaded",
            timeout: 60000
        });

        console.log("Página cargada, esperando datos del WebSocket...");
    } catch (err) {
        console.error("Error iniciando el navegador:", err.message);
        lastError = err.message;
        connected = false;
        scheduleRestart();
    }
}

function handleMessage(raw) {
    try {
        const json = JSON.parse(raw);

        if (!json.data || !Array.isArray(json.data)) return;

        json.data.forEach((asset) => {
            if (asset.symbol) {
                updatePrice(asset.symbol, asset);
            }
        });
    } catch (err) {
        // No todos los frames son el mensaje que buscamos; se ignoran los que no parseen.
    }
}

function scheduleRestart() {
    if (restarting) return;
    restarting = true;

    console.log("Reiniciando navegador en 10 segundos...");

    setTimeout(async () => {
        try {
            if (browser) await browser.close();
        } catch (e) {}

        restarting = false;
        startBrowser();
    }, 10000);
}

function getStatus() {
    return {
        connected,
        lastError
    };
}

module.exports = {
    startBrowser,
    getStatus
};