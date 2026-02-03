#!/usr/bin/env ts-node
"use strict";
/**
 * BCV API - Web scraping for Venezuelan Central Bank exchange rates
 * Retrieves exchange rates for USD, EUR, Yuan, Turkish Lira, and Russian Ruble
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var cheerio = require("cheerio");
var BCVScraper = /** @class */ (function () {
    function BCVScraper() {
        this.baseUrl = 'https://www.bcv.org.ve/';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
    }
    /**
     * Scrape exchange rates from BCV website
     * @returns {Promise<ExchangeRatesResponse>} Exchange rates in JSON format
     */
    BCVScraper.prototype.getExchangeRates = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, $, rates, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, axios_1.default.get(this.baseUrl, {
                                headers: this.headers,
                                timeout: 10000
                            })];
                    case 1:
                        response = _a.sent();
                        $ = cheerio.load(response.data);
                        rates = this.parseRates($);
                        return [2 /*return*/, {
                                status: 'success',
                                timestamp: new Date().toISOString(),
                                source: 'BCV (Banco Central de Venezuela)',
                                rates: rates
                            }];
                    case 2:
                        error_1 = _a.sent();
                        return [2 /*return*/, {
                                status: 'error',
                                message: "Failed to fetch data from BCV: ".concat(error_1.message),
                                timestamp: new Date().toISOString()
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse exchange rates from the HTML
     * @param {cheerio.CheerioAPI} $ - Cheerio instance with loaded HTML
     * @returns {Object} Parsed exchange rates
     */
    BCVScraper.prototype.parseRates = function ($) {
        var _this = this;
        var rates = {};
        var currencyMap = {
            'Dólar': 'USD',
            'Euro': 'EUR',
            'Yuan': 'CNY',
            'Lira': 'TRY',
            'Rublo': 'RUB'
        };
        // Try to find exchange rates in tables
        $('table').each(function (_, table) {
            $(table).find('tr').each(function (_, row) {
                var cells = $(row).find('td, th');
                if (cells.length >= 2) {
                    var currencyText = $(cells[0]).text().trim();
                    for (var _i = 0, _a = Object.entries(currencyMap); _i < _a.length; _i++) {
                        var _b = _a[_i], key = _b[0], code = _b[1];
                        if (currencyText.includes(key)) {
                            try {
                                var rateText = $(cells[1]).text().trim();
                                var rate = _this.cleanRate(rateText);
                                if (rate !== null) {
                                    rates[code] = {
                                        currency: code,
                                        name: key,
                                        rate: rate,
                                        symbol: _this.getCurrencySymbol(code)
                                    };
                                }
                            }
                            catch (error) {
                                // Continue to next currency
                            }
                        }
                    }
                }
            });
        });
        // If no rates found, add placeholder structure
        if (Object.keys(rates).length === 0) {
            for (var _i = 0, _a = Object.entries(currencyMap); _i < _a.length; _i++) {
                var _b = _a[_i], name_1 = _b[0], code = _b[1];
                rates[code] = {
                    currency: code,
                    name: name_1,
                    rate: null,
                    symbol: this.getCurrencySymbol(code),
                    note: 'Rate not available - check BCV website'
                };
            }
        }
        return rates;
    };
    /**
     * Clean and convert rate text to float
     * @param {string} rateText - Raw rate text
     * @returns {number|null} Cleaned rate or null
     */
    BCVScraper.prototype.cleanRate = function (rateText) {
        try {
            // Remove currency symbols, spaces, and convert comma to dot
            var cleaned = rateText.replace(/,/g, '.').replace(/\s/g, '');
            // Remove any non-numeric characters except dot and minus
            cleaned = cleaned.replace(/[^\d.-]/g, '');
            var rate = parseFloat(cleaned);
            return isNaN(rate) ? null : rate;
        }
        catch (error) {
            return null;
        }
    };
    /**
     * Get currency symbol for a given currency code
     * @param {string} code - Currency code
     * @returns {string} Currency symbol
     */
    BCVScraper.prototype.getCurrencySymbol = function (code) {
        var symbols = {
            'USD': '$',
            'EUR': '€',
            'CNY': '¥',
            'TRY': '₺',
            'RUB': '₽'
        };
        return symbols[code] || '';
    };
    return BCVScraper;
}());
/**
 * Main function to run the scraper
 */
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var scraper, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    scraper = new BCVScraper();
                    return [4 /*yield*/, scraper.getExchangeRates()];
                case 1:
                    data = _a.sent();
                    console.log(JSON.stringify(data, null, 2));
                    return [2 /*return*/];
            }
        });
    });
}
// Export for module usage
exports.default = BCVScraper;
// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}
