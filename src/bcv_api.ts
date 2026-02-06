/**
 * BCV API - Web scraping for Venezuelan Central Bank exchange rates
 * Retrieves exchange rates for USD only (Optimized)
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

const agent = new https.Agent({
    rejectUnauthorized: false
});

interface CurrencyRate {
    currency: string;
    name: string;
    rate: number | null;
    symbol: string;
    note?: string;
}

interface ExchangeRatesResponse {
    status: string;
    timestamp: string;
    source?: string;
    rates?: { [key: string]: CurrencyRate } | null;
    message?: string;
    cached?: boolean;
    stale?: boolean;
}

class BCVScraper {
    private baseUrl: string;
    private headers: { [key: string]: string };
    private cacheFile: string;
    private cacheTime: number;

    constructor() {
        this.baseUrl = 'https://www.bcv.org.ve/';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        this.cacheFile = path.join(__dirname, '..', 'bcv_rate_cache_ts.json');
        this.cacheTime = 3600 * 1000; // 1 hour
    }

    /**
     * Scrape exchange rates from BCV website
     * @returns {Promise<ExchangeRatesResponse>} Exchange rates in JSON format
     */
    async getExchangeRates(): Promise<ExchangeRatesResponse> {
        // Check cache first
        if (fs.existsSync(this.cacheFile)) {
            const stats = fs.statSync(this.cacheFile);
            if (Date.now() - stats.mtimeMs < this.cacheTime) {
                try {
                    const cachedData = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                    if (cachedData && cachedData.status === 'success') {
                        cachedData.cached = true;
                        return cachedData as ExchangeRatesResponse;
                    }
                } catch (e) {
                    // Ignore cache read errors
                }
            }
        }

        try {
            const config: any = {
                headers: this.headers,
                timeout: 10000,
                decompress: true,
                httpsAgent: agent
            };

            const response = await axios.get(this.baseUrl, config);

            // Correct type for Cheerio load
            const $ = cheerio.load(response.data as string);
            const rates = this.parseRates($);

            const data: ExchangeRatesResponse = {
                status: 'success',
                timestamp: new Date().toISOString(),
                source: 'BCV (Banco Central de Venezuela)',
                rates: rates
            };

            // Save to cache
            fs.writeFileSync(this.cacheFile, JSON.stringify(data));

            return data;

        } catch (error: any) {
            // Try to return stale cache on error
            if (fs.existsSync(this.cacheFile)) {
                try {
                    const cachedData = JSON.parse(fs.readFileSync(this.cacheFile, 'utf8'));
                    if (cachedData) {
                        cachedData.cached = true;
                        cachedData.stale = true;
                        return cachedData as ExchangeRatesResponse;
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
     * @param {cheerio.CheerioAPI} $ - Cheerio instance with loaded HTML
     * @returns {Object} Parsed exchange rates
     */
    private parseRates($: any): { [key: string]: CurrencyRate } {
        const rates: { [key: string]: CurrencyRate } = {};

        // Try to find exchange rates in tables using optimized traversal
        const tables = $('table');

        for (let i = 0; i < tables.length; i++) {
            const rows = $(tables[i]).find('tr');

            for (let j = 0; j < rows.length; j++) {
                const cells = $(rows[j]).find('td, th');

                if (cells.length >= 2) {
                    const currencyText = $(cells[0]).text().trim();

                    // Optimized: Check directly for Dólar
                    if (currencyText.includes('Dólar')) {
                        try {
                            const rateText = $(cells[1]).text().trim();
                            const rate = this.cleanRate(rateText);

                            if (rate !== null) {
                                rates['USD'] = {
                                    currency: 'USD',
                                    name: 'Dólar',
                                    rate: rate,
                                    symbol: '$'
                                };
                                // Found USD, return immediately
                                return rates;
                            }
                        } catch (error) {
                            continue;
                        }
                    }
                }
            }
        }

        // If USD not found, add placeholder structure
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
    private cleanRate(rateText: string): number | null {
        try {
            // Remove currency symbols, spaces, and convert comma to dot
            let cleaned = rateText.replace(/,/g, '.').replace(/\s/g, '');
            // Strict cleanup
            cleaned = cleaned.replace(/[^\d.-]/g, '');

            if (!cleaned || isNaN(Number(cleaned))) return null;

            return parseFloat(cleaned);
        } catch (error) {
            return null;
        }
    }
}

/**
 * Main function to run the scraper
 */
async function main(): Promise<void> {
    const scraper = new BCVScraper();
    const data = await scraper.getExchangeRates();
    console.log(JSON.stringify(data, null, 2));
}

// Export for module usage
export default BCVScraper;

// Run if executed directly
if (require.main === module) {
    main().catch(console.error);
}
