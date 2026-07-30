//Este archivo será el encargado de guardar el último precio de cada símbolo.
// prices.js

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

/**ñ
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