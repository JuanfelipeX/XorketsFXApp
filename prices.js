// prices.js
// Guarda el último precio de cada símbolo en memoria.

const prices = {};

/**
 * Guarda o actualiza el precio de un símbolo.
 */
function updatePrice(symbol, data) {
    prices[symbol.toLowerCase()] = {
        symbol: symbol.toLowerCase(),
        ...data,
        updatedAt: Date.now()
    };
}

/**
 * Obtiene el precio de un símbolo.
 */
function getPrice(symbol) {
    return prices[symbol.toLowerCase()] || null;
}

/**
 * Obtiene todos los precios.
 */
function getAllPrices() {
    return prices;
}

module.exports = {
    updatePrice,
    getPrice,
    getAllPrices
};