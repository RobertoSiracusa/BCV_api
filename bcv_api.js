#!/usr/bin/env node
/**
 * BCV API - Web scraping for Venezuelan Central Bank exchange rates
 * Retrieves exchange rates for USD only (Optimized)
 */

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
// const https = require('https'); // Not used with env var approach

class BCVScraper {
    constructor() {
        this.baseUrl = 'https://www.bcv.org.ve/';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        this.cacheFile = path.join(__dirname, 'bcv_rate_cache.json');
        this.cacheTime = 3600 * 1000; // 1 hour in milliseconds
    }
    async getExchangeRates() {
        // ... cache check ...
        try {
            const response = await axios.get(this.baseUrl, {
                headers: this.headers,
                timeout: 10000,
                decompress: true // Enable GZIP automatically
            });

            const $ = cheerio.load(response.data);
            const rates = this._parseRates($);

            const data = {
                status: 'success',
                timestamp: new Date().toISOString(),
                source: 'BCV (Banco Central de Venezuela)',
                rates: rates
            };

            // Save to cache
            fs.writeFileSync(this.cacheFile, JSON.stringify(data));

            return data;

        } catch (error) {
            // Try to return stale cache on error
            if (fs.existsSync(this.cacheFile)) {
                try {
                    const cachedData = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                    if (cachedData) {
                        cachedData.cached = true;
                        cachedData.stale = true;
                        return cachedData;
                    }
                } catch (e) {
                    // Ignore
                }
            }

            return {
                status: 'error',
                message: `Failed to fetch data from BCV: ${error.message}`,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Parse exchange rates from the HTML
     * @param {CheerioStatic} $ - Cheerio instance with loaded HTML
     * @returns {Object} Parsed exchange rates
     */
    _parseRates($) {
        const rates = {};

        // Try to find exchange rates in tables using optimized traversal
        const tables = $('table');

        for (let i = 0; i < tables.length; i++) {
            const rows = $(tables[i]).find('tr');

            for (let j = 0; j < rows.length; j++) {
                const cells = $(rows[j]).find('td, th');

                if (cells.length > 0) {
                    const currencyText = $(cells[0]).text().trim();
                    console.log(`Row[${i}][${j}]: ${currencyText} (cells: ${cells.length})`);
                }

                if (cells.length >= 2) {
                    const currencyText = $(cells[0]).text().trim();

                    // Optimized: Check directly for Dólar
                    if (currencyText.includes('Dólar') || currencyText.includes('USD')) {
                        try {
                            const rateText = $(cells[1]).text().trim();
                            // console.log(`Found USD rate text: ${rateText}`); // Debug
                            const rate = this._cleanRate(rateText);

                            if (rate !== null) {
                                rates['USD'] = {
                                    currency: 'USD',
                                    name: 'Dólar',
                                    rate: rate,
                                    symbol: '$'
                                };
                                // Found USD, break completely
                                return rates;
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                }
            }
        }

        // If USD not found, add placeholder
        if (!rates['USD']) {
            rates['USD'] = {
                currency: 'USD',
                name: 'Dólar',
                rate: null,
                symbol: '$',
                note: 'Rate not available - check BCV website'
            };
        }

        return rates;
    }

    /**
     * Clean and convert rate text to float
     * @param {string} rateText - Raw rate text
     * @returns {number|null} Cleaned rate or null
     */
    _cleanRate(rateText) {
        try {
            // Remove known separators first
            let cleaned = rateText.replace(/,/g, '.').replace(/\s/g, '');
            // Strict cleanup
            cleaned = cleaned.replace(/[^\d.-]/g, '');

            if (!cleaned || isNaN(cleaned)) return null;

            return parseFloat(cleaned);
        } catch (error) {
            return null;
        }
    }
}

/**
 * Main function to run the scraper
 */
async function main() {
    const scraper = new BCVScraper();
    const data = await scraper.getExchangeRates();
    console.log(JSON.stringify(data, null, 2));
}

// Export for module usage
module.exports = BCVScraper;

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}
