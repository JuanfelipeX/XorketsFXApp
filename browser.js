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
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
                "(KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
            viewport: { width: 1366, height: 768 },
            locale: "es-ES"
        });

        // Oculta las señales más obvias de automatización antes de que
        // cualquier script de la página se ejecute.
        await context.addInitScript(() => {
            Object.defineProperty(navigator, "webdriver", { get: () => undefined });
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

        // Le damos tiempo a cualquier challenge anti-bot (Cloudflare, etc.)
        // de resolverse antes de que la página intente abrir su WebSocket.
        await page.waitForTimeout(6000);

        try {
            await page.screenshot({ path: "debug_screenshot.png" });
            console.log("Screenshot de diagnóstico guardado en debug_screenshot.png");
        } catch (e) {
            console.log("No se pudo tomar screenshot:", e.message);
        }

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