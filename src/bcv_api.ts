/**
 * BCV API - Web scraping for Venezuelan Central Bank exchange rates
 * Retrieves exchange rates for USD, EUR, Yuan, Turkish Lira, and Russian Ruble
 */

import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

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
    rates?: { [key: string]: CurrencyRate };
    message?: string;
}

class BCVScraper {
    private baseUrl: string;
    private headers: { [key: string]: string };

    constructor() {
        this.baseUrl = 'https://www.bcv.org.ve/';
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
    }

    /**
     * Scrape exchange rates from BCV website
     * @returns {Promise<ExchangeRatesResponse>} Exchange rates in JSON format
     */
    async getExchangeRates(): Promise<ExchangeRatesResponse> {
        try {
            const response: AxiosResponse = await axios.get(this.baseUrl, {
                headers: this.headers,
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const rates = this.parseRates($);

            return {
                status: 'success',
                timestamp: new Date().toISOString(),
                source: 'BCV (Banco Central de Venezuela)',
                rates: rates
            };

        } catch (error: any) {
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
    private parseRates($: cheerio.CheerioAPI): { [key: string]: CurrencyRate } {
        const rates: { [key: string]: CurrencyRate } = {};
        const currencyMap: { [key: string]: string } = {
            'Dólar': 'USD',
            'Euro': 'EUR',
            'Yuan': 'CNY',
            'Lira': 'TRY',
            'Rublo': 'RUB'
        };

        // Try to find exchange rates in tables
        $('table').each((_, table) => {
            $(table).find('tr').each((_, row) => {
                const cells = $(row).find('td, th');
                if (cells.length >= 2) {
                    const currencyText = $(cells[0]).text().trim();
                    
                    for (const [key, code] of Object.entries(currencyMap)) {
                        if (currencyText.includes(key)) {
                            try {
                                const rateText = $(cells[1]).text().trim();
                                const rate = this.cleanRate(rateText);
                                
                                if (rate !== null) {
                                    rates[code] = {
                                        currency: code,
                                        name: key,
                                        rate: rate,
                                        symbol: this.getCurrencySymbol(code)
                                    };
                                }
                            } catch (error) {
                                // Continue to next currency
                            }
                        }
                    }
                }
            });
        });

        // If no rates found, add placeholder structure
        if (Object.keys(rates).length === 0) {
            for (const [name, code] of Object.entries(currencyMap)) {
                rates[code] = {
                    currency: code,
                    name: name,
                    rate: null,
                    symbol: this.getCurrencySymbol(code),
                    note: 'Rate not available - check BCV website'
                };
            }
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
            // Remove any non-numeric characters except dot and minus
            cleaned = cleaned.replace(/[^\d.-]/g, '');
            // Validate format: optional leading '-', digits, optional single '.' with following digits
            if (!/^-?\d+(\.\d+)?$/.test(cleaned)) {
                return null;
            }
            const rate = parseFloat(cleaned);
            return isNaN(rate) ? null : rate;
        } catch (error) {
            return null;
        }
    }

    /**
     * Get currency symbol for a given currency code
     * @param {string} code - Currency code
     * @returns {string} Currency symbol
     */
    private getCurrencySymbol(code: string): string {
        const symbols: { [key: string]: string } = {
            'USD': '$',
            'EUR': '€',
            'CNY': '¥',
            'TRY': '₺',
            'RUB': '₽'
        };
        return symbols[code] || '';
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
