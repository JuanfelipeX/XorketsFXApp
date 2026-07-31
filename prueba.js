const ws = new WebSocket("wss://app.xorketsfx.com/api/websocket/1/all");

ws.onopen = () => {
    console.log("✅ Conectado");
};

ws.onmessage = (e) => {
    console.log(e.data);
};

ws.onerror = (e) => {
    console.log("❌ Error", e);
};

ws.onclose = (e) => {
    console.log("🔴 Cerrado", e.code, e.reason);
};
