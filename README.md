# BCV API - Exchange Rates Web Scraper

Open source API through web scraping to obtain exchange rates for American Dollars (USD $), Euros (€), Yuan (¥), Turkish Lira (₺), and Russian Ruble (₽) from the Venezuelan Central Bank (Banco Central de Venezuela - BCV).

Available in multiple programming languages:
- 🐍 Python
- 🟨 JavaScript (Node.js)
- 🔷 TypeScript
- 🐘 PHP

Returns data in **JSON format**.

---

## 📋 Features

- Web scraping of official BCV exchange rates
- Support for 5 major currencies:
  - USD (American Dollar) $
  - EUR (Euro) €
  - CNY (Yuan) ¥
  - TRY (Turkish Lira) ₺
  - RUB (Russian Ruble) ₽
- JSON response format
- Error handling
- Multiple language implementations

---

## 🚀 Quick Start

### Python

#### Installation
```bash
pip install -r requirements.txt
```

#### Usage
```bash
python bcv_api.py
```

Or import as a module:
```python
from bcv_api import BCVScraper

scraper = BCVScraper()
data = scraper.get_exchange_rates()
print(data)
```

---

### JavaScript (Node.js)

#### Installation
```bash
npm install
```

#### Usage
```bash
node bcv_api.js
```

Or import as a module:
```javascript
const BCVScraper = require('./bcv_api');

const scraper = new BCVScraper();
scraper.getExchangeRates().then(data => {
    console.log(data);
});
```

---

### TypeScript

#### Installation
```bash
npm install
npm install -g typescript ts-node @types/node
```

#### Compile
```bash
tsc
```

#### Usage
```bash
npm run start:ts
# or after compilation:
node dist/bcv_api.js
```

Or import as a module:
```typescript
import BCVScraper from './src/bcv_api';

const scraper = new BCVScraper();
scraper.getExchangeRates().then(data => {
    console.log(data);
});
```

---

### PHP

#### Usage
```bash
php bcv_api.php
```

Or use in your PHP application:
```php
<?php
require_once 'bcv_api.php';

$scraper = new BCVScraper();
$data = $scraper->getExchangeRates();
echo json_encode($data, JSON_PRETTY_PRINT);
?>
```

---

### cURL

If you deploy any of the implementations as a web service, you can access it using cURL:

```bash
# If hosted locally with PHP
curl http://localhost:8000/bcv_api.php

# If hosted on a server
curl https://your-server.com/bcv_api.php

# With formatted output
curl -s https://your-server.com/bcv_api.php | jq '.'
```

**To run PHP as a web server locally:**
```bash
php -S localhost:8000
```

Then access: `http://localhost:8000/bcv_api.php`

---

## 📊 JSON Response Format

### Success Response
```json
{
  "status": "success",
  "timestamp": "2026-02-03T16:04:05.123Z",
  "source": "BCV (Banco Central de Venezuela)",
  "rates": {
    "USD": {
      "currency": "USD",
      "name": "Dólar",
      "rate": 36.5,
      "symbol": "$"
    },
    "EUR": {
      "currency": "EUR",
      "name": "Euro",
      "rate": 39.8,
      "symbol": "€"
    },
    "CNY": {
      "currency": "CNY",
      "name": "Yuan",
      "rate": 5.2,
      "symbol": "¥"
    },
    "TRY": {
      "currency": "TRY",
      "name": "Lira",
      "rate": 1.2,
      "symbol": "₺"
    },
    "RUB": {
      "currency": "RUB",
      "name": "Rublo",
      "rate": 0.4,
      "symbol": "₽"
    }
  }
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Failed to fetch data from BCV: Connection timeout",
  "timestamp": "2026-02-03T16:04:05.123Z"
}
```

---

## 🔧 Requirements

### Python
- Python 3.7+
- requests
- beautifulsoup4
- lxml

### JavaScript/TypeScript
- Node.js 14+
- axios
- cheerio

### PHP
- PHP 7.4+
- cURL extension
- DOM extension

---

## 📝 API Methods

All implementations provide a `BCVScraper` class with the following method:

### `getExchangeRates()`
Fetches and returns current exchange rates from BCV.

**Returns:** 
- JSON object with status, timestamp, source, and rates
- On error: JSON object with status, message, and timestamp

---

## ⚠️ Important Notes

1. **Web Scraping**: This API relies on web scraping the BCV website. The structure of the website may change, which could affect the functionality.

2. **Rate Limits**: Be respectful of the BCV website and avoid excessive requests. Consider implementing caching for production use.

3. **Availability**: Exchange rates depend on the BCV website being accessible and up-to-date.

4. **Legal**: Ensure you comply with BCV's terms of service and local regulations when using this API.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🔗 Links

- BCV Website: https://www.bcv.org.ve/
- Currency symbols: $ (USD), € (EUR), ¥ (CNY), ₺ (TRY), ₽ (RUB)

---

## 📞 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.