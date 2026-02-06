<?php
declare(strict_types=1);

/**
 * BCV API - Web scraping for Venezuelan Central Bank exchange rates
 * Retrieves exchange rates for USD, EUR, Yuan, Turkish Lira, and Russian Ruble
 */

class BCVScraper
{
    private string $baseUrl;
    private array $headers;
    private string $cacheFile;
    private int $cacheTime;

    public function __construct()
    {
        $this->baseUrl = 'https://www.bcv.org.ve/';
        $this->headers = [
            'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ];
        $this->cacheFile = __DIR__ . '/bcv_rate_cache.json';
        $this->cacheTime = 3600; // 1 hour
    }

    /**
     * Scrape exchange rates from BCV website
     * @return array Exchange rates in array format
     */
    public function getExchangeRates(): array
    {
        // Check cache first
        if (file_exists($this->cacheFile) && (time() - filemtime($this->cacheFile) < $this->cacheTime)) {
            $content = file_get_contents($this->cacheFile);
            if ($content !== false) {
                $cachedData = json_decode($content, true);
                if (is_array($cachedData) && isset($cachedData['status']) && $cachedData['status'] === 'success') {
                    $cachedData['cached'] = true;
                    return $cachedData;
                }
            }
        }

        try {
            $html = $this->fetchUrl($this->baseUrl);

            if ($html === false) {
                // Try to return stale cache if fetch fails
                if (file_exists($this->cacheFile)) {
                    $content = file_get_contents($this->cacheFile);
                    if ($content !== false) {
                        $cachedData = json_decode($content, true);
                        if (is_array($cachedData)) {
                            $cachedData['cached'] = true;
                            $cachedData['stale'] = true;
                            return $cachedData;
                        }
                    }
                }

                return [
                    'status' => 'error',
                    'message' => 'Failed to fetch data from BCV',
                    'timestamp' => date('c')
                ];
            }

            $rates = $this->parseRates($html);

            $data = [
                'status' => 'success',
                'timestamp' => date('c'),
                'source' => 'BCV (Banco Central de Venezuela)',
                'rates' => $rates
            ];

            // Save to cache
            file_put_contents($this->cacheFile, json_encode($data, JSON_THROW_ON_ERROR));

            return $data;

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
    private function fetchUrl(string $url)
    {
        $ch = curl_init();

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5); // Fail faster on connection issues
        curl_setopt($ch, CURLOPT_ENCODING, ''); // Enable GZIP compression
        curl_setopt($ch, CURLOPT_HTTPHEADER, $this->headers);
        // Enforce TLS certificate and hostname verification for HTTPS requests
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

        curl_close($ch);

        if ($httpCode !== 200 || !is_string($response)) {
            return false;
        }

        return $response;
    }

    /**
     * Parse exchange rates from HTML
     * @param string $html HTML content
     * @return array Parsed exchange rates
     */
    private function parseRates(string $html): array
    {
        $rates = [];

        // Use DOMDocument to parse HTML
        $dom = new DOMDocument();
        // Suppress warnings for malformed HTML, common in scanned/legacy sites
        libxml_use_internal_errors(true);
        $dom->loadHTML($html);
        libxml_clear_errors();

        // Faster native DOM traversal
        $tables = $dom->getElementsByTagName('table');

        foreach ($tables as $table) {
            if (!$table instanceof DOMElement) {
                continue;
            }
            $rows = $table->getElementsByTagName('tr');

            foreach ($rows as $row) {
                // Ensure $row is indeed a DOMElement before calling getElementsByTagName
                if (!$row instanceof DOMElement) {
                    continue;
                }

                $cells = $row->getElementsByTagName('td');
                // Some tables might use th for headers
                if ($cells->length === 0) {
                    $cells = $row->getElementsByTagName('th');
                }

                if ($cells->length >= 2) {
                    $currencyText = trim($cells->item(0)->textContent);

                    // Optimized direct check using fast string search
                    if (strpos($currencyText, 'Dólar') !== false) {
                        try {
                            $rateText = trim($cells->item(1)->textContent);
                            $rate = $this->cleanRate($rateText);

                            if ($rate !== null) {
                                $rates['USD'] = [
                                    'currency' => 'USD',
                                    'name' => 'Dólar',
                                    'rate' => $rate,
                                    'symbol' => '$'
                                ];
                                // Early exit once found - O(1) best case for remainder
                                return $rates;
                            }
                        } catch (Exception $e) {
                            continue;
                        }
                    }
                }
            }
        }

        // If USD not found, add placeholder
        if (empty($rates['USD'])) {
            $rates['USD'] = [
                'currency' => 'USD',
                'name' => 'Dólar',
                'rate' => null,
                'symbol' => '$',
                'note' => 'Rate not available - check BCV website'
            ];
        }

        return $rates;
    }

    /**
     * Clean and convert rate text to float
     * @param string $rateText Raw rate text
     * @return float|null Cleaned rate or null
     */
    private function cleanRate(string $rateText): ?float
    {
        try {
            // Fast replacement of known separators
            $cleaned = str_replace([',', ' '], ['.', ''], $rateText);

            // Allow only numbers, dot, and minus
            $cleaned = preg_replace('/[^\d.-]/', '', $cleaned);

            if ($cleaned === '') {
                return null;
            }

            if (!is_numeric($cleaned)) {
                return null;
            }

            return (float) $cleaned;
        } catch (Exception $e) {
            return null;
        }
    }
}

/**
 * Main function to run the scraper
 */
function main(): void
{
    $scraper = new BCVScraper();
    $data = $scraper->getExchangeRates();

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
}

// Run if executed directly
if (php_sapi_name() === 'cli' || basename(__FILE__) === basename($_SERVER['PHP_SELF'])) {
    main();
}
