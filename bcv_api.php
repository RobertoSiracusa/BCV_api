<?php
/**
 * BCV API - Web scraping for Venezuelan Central Bank exchange rates
 * Retrieves exchange rates for USD, EUR, Yuan, Turkish Lira, and Russian Ruble
 */

class BCVScraper {
    private $baseUrl;
    private $headers;

    public function __construct() {
        $this->baseUrl = 'https://www.bcv.org.ve/';
        $this->headers = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ];
    }

    /**
     * Scrape exchange rates from BCV website
     * @return array Exchange rates in array format
     */
    public function getExchangeRates() {
        try {
            $html = $this->fetchUrl($this->baseUrl);
            
            if ($html === false) {
                return [
                    'status' => 'error',
                    'message' => 'Failed to fetch data from BCV',
                    'timestamp' => date('c')
                ];
            }

            $rates = $this->parseRates($html);

            return [
                'status' => 'success',
                'timestamp' => date('c'),
                'source' => 'BCV (Banco Central de Venezuela)',
                'rates' => $rates
            ];

        } catch (Exception $e) {
            return [
                'status' => 'error',
                'message' => 'Error processing data: ' . $e->getMessage(),
                'timestamp' => date('c')
            ];
        }
    }

    /**
     * Fetch URL using cURL
     * @param string $url URL to fetch
     * @return string|false HTML content or false on failure
     */
    private function fetchUrl($url) {
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        // Enforce TLS certificate and hostname verification for HTTPS requests
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        return $response;
    }

    /**
     * Parse exchange rates from HTML
     * @param string $html HTML content
     * @return array Parsed exchange rates
     */
    private function parseRates($html) {
        $rates = [];
        $currencyMap = [
            'Dólar' => 'USD',
            'Euro' => 'EUR',
            'Yuan' => 'CNY',
            'Lira' => 'TRY',
            'Rublo' => 'RUB'
        ];

        // Use DOMDocument to parse HTML
        $dom = new DOMDocument();
        @$dom->loadHTML($html); // Suppress warnings for malformed HTML
        
        $xpath = new DOMXPath($dom);
        
        // Find all table rows
        $rows = $xpath->query('//table//tr');
        
        foreach ($rows as $row) {
            $cells = $xpath->query('.//td | .//th', $row);
            
            if ($cells->length >= 2) {
                $currencyText = trim($cells->item(0)->textContent);
                
                foreach ($currencyMap as $key => $code) {
                    if (strpos($currencyText, $key) !== false) {
                        try {
                            $rateText = trim($cells->item(1)->textContent);
                            $rate = $this->cleanRate($rateText);
                            
                            if ($rate !== null) {
                                $rates[$code] = [
                                    'currency' => $code,
                                    'name' => $key,
                                    'rate' => $rate,
                                    'symbol' => $this->getCurrencySymbol($code)
                                ];
                            }
                        } catch (Exception $e) {
                            // Continue to next currency
                        }
                    }
                }
            }
        }

        // If no rates found, add placeholder structure
        if (empty($rates)) {
            foreach ($currencyMap as $name => $code) {
                $rates[$code] = [
                    'currency' => $code,
                    'name' => $name,
                    'rate' => null,
                    'symbol' => $this->getCurrencySymbol($code),
                    'note' => 'Rate not available - check BCV website'
                ];
            }
        }

        return $rates;
    }

    /**
     * Clean and convert rate text to float
     * @param string $rateText Raw rate text
     * @return float|null Cleaned rate or null
     */
    private function cleanRate($rateText) {
        try {
            // Remove currency symbols, spaces, and convert comma to dot
            $cleaned = str_replace(',', '.', $rateText);
            $cleaned = str_replace(' ', '', $cleaned);
            // Remove any non-numeric characters except dot and minus
            $cleaned = preg_replace('/[^\d.-]/', '', $cleaned);

            // If nothing remains after cleaning, treat as invalid
            if ($cleaned === '') {
                return null;
            }

            // Ensure the cleaned value is a valid numeric representation
            if (!is_numeric($cleaned)) {
                return null;
            }

            $rate = (float) $cleaned;
            return $rate;
        } catch (Exception $e) {
            return null;
        }
    }

    /**
     * Get currency symbol for a given currency code
     * @param string $code Currency code
     * @return string Currency symbol
     */
    private function getCurrencySymbol($code) {
        $symbols = [
            'USD' => '$',
            'EUR' => '€',
            'CNY' => '¥',
            'TRY' => '₺',
            'RUB' => '₽'
        ];
        
        return isset($symbols[$code]) ? $symbols[$code] : '';
    }
}

/**
 * Main function to run the scraper
 */
function main() {
    $scraper = new BCVScraper();
    $data = $scraper->getExchangeRates();
    
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}

// Run if executed directly
if (php_sapi_name() === 'cli' || basename(__FILE__) === basename($_SERVER['PHP_SELF'])) {
    main();
}
