# BCV API - Implementation Details

## Overview
This repository contains web scraping implementations to fetch exchange rates from the Venezuelan Central Bank (Banco Central de Venezuela - BCV) for multiple currencies.

## Supported Currencies
1. **USD** - American Dollar ($)
2. **EUR** - Euro (€)
3. **CNY** - Chinese Yuan (¥)
4. **TRY** - Turkish Lira (₺)
5. **RUB** - Russian Ruble (₽)

## Implementations

### Python (`bcv_api.py`)
- **Requirements**: Python 3.7+, requests, beautifulsoup4, lxml
- **Usage**: `python3 bcv_api.py`
- **Module Import**: `from bcv_api import BCVScraper`

### JavaScript (`bcv_api.js`)
- **Requirements**: Node.js 14+, axios, cheerio
- **Usage**: `node bcv_api.js` or `npm start`
- **Module Import**: `const BCVScraper = require('./bcv_api')`

### TypeScript (`src/bcv_api.ts`)
- **Requirements**: TypeScript, Node.js 14+, axios, cheerio
- **Usage**: `npm run start:ts` or compile with `npm run build`
- **Module Import**: `import BCVScraper from './src/bcv_api'`
- **Compilation Output**: `dist/` directory

### PHP (`bcv_api.php`)
- **Requirements**: PHP 7.4+, cURL extension, DOM extension
- **Usage**: `php bcv_api.php`
- **Web Server**: `php -S localhost:8000` then access `http://localhost:8000/bcv_api.php`

## JSON Response Structure

### Success Response
```json
{
  "status": "success",
  "timestamp": "2026-02-03T16:00:00.000Z",
  "source": "BCV (Banco Central de Venezuela)",
  "rates": {
    "USD": {
      "currency": "USD",
      "name": "Dólar",
      "rate": 36.5,
      "symbol": "$"
    },
    "EUR": { ... },
    "CNY": { ... },
    "TRY": { ... },
    "RUB": { ... }
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2026-02-03T16:00:00.000Z"
}
```

## Architecture

### Common Features Across All Implementations:
1. **Web Scraping**: Uses HTTP requests to fetch BCV website
2. **HTML Parsing**: Extracts exchange rate data from HTML tables
3. **Error Handling**: Comprehensive error handling with descriptive messages
4. **JSON Output**: All implementations return consistent JSON format
5. **Currency Symbols**: Includes Unicode currency symbols

### Security Considerations:
- ✅ No SQL injection risks (no database usage)
- ✅ No code execution vulnerabilities
- ✅ Proper error handling prevents information disclosure
- ✅ SSL/TLS verification enabled (except where needed for compatibility)
- ✅ Input validation on parsed data
- ✅ CodeQL security scan passed with 0 alerts

## Installation

### Python
```bash
pip install -r requirements.txt
```

### Node.js/TypeScript
```bash
npm install
```

### PHP
No installation needed - uses built-in extensions

## Testing
All implementations have been tested and:
- ✅ Execute without syntax errors
- ✅ Handle network errors gracefully
- ✅ Return valid JSON output
- ✅ Include proper error messages
- ✅ Pass security scans

## Usage Examples

### Python
```python
from bcv_api import BCVScraper
import json

scraper = BCVScraper()
data = scraper.get_exchange_rates()
print(json.dumps(data, indent=2))
```

### JavaScript
```javascript
const BCVScraper = require('./bcv_api');

async function getRates() {
    const scraper = new BCVScraper();
    const data = await scraper.getExchangeRates();
    console.log(JSON.stringify(data, null, 2));
}

getRates();
```

### TypeScript
```typescript
import BCVScraper from './src/bcv_api';

async function getRates(): Promise<void> {
    const scraper = new BCVScraper();
    const data = await scraper.getExchangeRates();
    console.log(JSON.stringify(data, null, 2));
}

getRates();
```

### PHP
```php
<?php
require_once 'bcv_api.php';

$scraper = new BCVScraper();
$data = $scraper->getExchangeRates();

header('Content-Type: application/json; charset=utf-8');
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
```

### cURL
```bash
# If hosted as a web service
curl -s http://localhost:8000/bcv_api.php | jq '.'
```

## File Structure
```
BCV_api/
├── bcv_api.py           # Python implementation
├── bcv_api.js           # JavaScript implementation
├── bcv_api.php          # PHP implementation
├── src/
│   └── bcv_api.ts       # TypeScript source
├── requirements.txt     # Python dependencies
├── package.json         # Node.js dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── examples_curl.sh     # cURL usage examples
├── README.md            # Main documentation
├── IMPLEMENTATION.md    # This file
├── .gitignore          # Git ignore rules
└── LICENSE             # MIT License
```

## Dependencies

### Python
- `requests` - HTTP client
- `beautifulsoup4` - HTML parsing
- `lxml` - XML/HTML parser

### Node.js/TypeScript
- `axios` - HTTP client
- `cheerio` - HTML parsing (jQuery-like)
- `typescript` (dev) - TypeScript compiler
- `@types/node` (dev) - Node.js type definitions

### PHP
- Built-in cURL extension
- Built-in DOM extension

## Contributing
Contributions are welcome! Please ensure:
1. Code follows existing patterns
2. Error handling is comprehensive
3. JSON output format is maintained
4. Security best practices are followed

## License
MIT License - See LICENSE file for details
