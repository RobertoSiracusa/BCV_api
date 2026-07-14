# BCV API - Web Scraper de Tasas de Cambio

API de código abierto que obtiene, mediante web scraping, la tasa de cambio oficial del Dólar estadounidense (USD) publicada por el Banco Central de Venezuela (BCV) en https://www.bcv.org.ve/.

El mismo scraper está implementado en cuatro lenguajes: Python, JavaScript (Node.js), TypeScript y PHP. Todas las implementaciones devuelven la misma estructura JSON.

## Estado actual del proyecto

Aunque el objetivo original contemplaba varias monedas (EUR, CNY, TRY, RUB), la implementación actual extrae únicamente la tasa del **USD (Dólar)**. El parser está optimizado con salida temprana: en cuanto encuentra la fila del Dólar deja de recorrer el HTML y devuelve el resultado. Ampliar a otras monedas requiere extender la función de parseo (`_parseRates` / `parseRates`).

## Cómo funciona

1. Se hace una petición HTTP GET a `https://www.bcv.org.ve/` con un `User-Agent` de navegador.
2. Se descarga el HTML de la página principal (con compresión GZIP habilitada).
3. Se parsea el HTML y se recorren todas las tablas (`<table>`) y sus filas (`<tr>`).
4. En cada fila se compara la primera celda buscando el texto `Dólar`. Al encontrarlo, se toma la segunda celda como valor de la tasa.
5. El valor se limpia (`cleanRate`): se reemplaza la coma decimal por punto, se eliminan espacios y cualquier carácter no numérico, y se convierte a número flotante. Si no es un número válido, devuelve `null`.
6. Se construye un objeto JSON con `status`, `timestamp`, `source` y `rates`.
7. Si el USD no se encuentra, se devuelve un registro `USD` con `rate: null` y una nota indicando que no está disponible.

### Caché (JavaScript, TypeScript, PHP)

Las implementaciones en JS, TS y PHP incluyen caché en disco para no golpear el sitio del BCV en cada llamada:

- Tiempo de vida (TTL): **1 hora**.
- Archivos de caché:
  - JavaScript: `bcv_rate_cache.json`
  - TypeScript: `bcv_rate_cache_ts.json`
  - PHP: `bcv_rate_cache.json`
- Si la caché es reciente y válida, se devuelve directamente con el campo `cached: true`, sin hacer petición HTTP.
- Si la petición al BCV falla pero existe una caché previa, se devuelve esa caché marcada con `cached: true` y `stale: true` (datos antiguos como respaldo).

La implementación en **Python no tiene caché**: hace una petición en cada ejecución.

### Nota sobre TLS

- **PHP** valida el certificado TLS del BCV (`CURLOPT_SSL_VERIFYPEER = true`, `CURLOPT_SSL_VERIFYHOST = 2`).
- **JavaScript** deshabilita la verificación TLS mediante `NODE_TLS_REJECT_UNAUTHORIZED = '0'`.
- **TypeScript** deshabilita la verificación TLS mediante un `https.Agent` con `rejectUnauthorized: false`.

La verificación se deshabilita en JS/TS porque el sitio del BCV suele presentar cadenas de certificados problemáticas. Tenlo en cuenta si lo usas en producción.

## Estructura del proyecto

```
BCV_api/
├── bcv_api.py            Implementación en Python (sin caché)
├── bcv_api.js            Implementación en JavaScript / Node.js (con caché)
├── src/bcv_api.ts        Implementación en TypeScript (con caché)
├── bcv_api.php           Implementación en PHP (con caché, ejecutable por CLI o web)
├── examples_curl.sh      Ejemplos de uso con cURL contra el servidor PHP
├── requirements.txt      Dependencias de Python
├── package.json          Dependencias y scripts de Node/TypeScript
├── tsconfig.json         Configuración del compilador de TypeScript
└── bcv_rate_cache*.json  Archivos de caché generados en tiempo de ejecución
```

## Requisitos

### Python
- Python 3.7+
- `requests`, `beautifulsoup4`, `lxml` (ver `requirements.txt`)

### JavaScript / TypeScript
- Node.js 14+
- `axios`, `cheerio`
- Para TypeScript: `typescript`, `ts-node`, `@types/node` (dev dependencies)

### PHP
- PHP 7.4+
- Extensión cURL
- Extensión DOM (`DOMDocument`)

## Instalación y uso

### Python

Instalar dependencias:

```bash
pip install -r requirements.txt
```

Ejecutar directamente (imprime JSON por stdout):

```bash
python bcv_api.py
```

Usar como módulo:

```python
from bcv_api import BCVScraper

scraper = BCVScraper()
data = scraper.get_exchange_rates()
print(data)
```

### JavaScript (Node.js)

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
node bcv_api.js
# equivalente:
npm start
```

Usar como módulo:

```javascript
const BCVScraper = require('./bcv_api');

const scraper = new BCVScraper();
scraper.getExchangeRates().then(data => {
    console.log(data);
});
```

### TypeScript

Instalar dependencias:

```bash
npm install
```

Ejecutar sin compilar (con ts-node):

```bash
npm run start:ts
```

Compilar a JavaScript (genera la carpeta `dist/`):

```bash
npm run build
# luego:
node dist/bcv_api.js
```

Usar como módulo:

```typescript
import BCVScraper from './src/bcv_api';

const scraper = new BCVScraper();
scraper.getExchangeRates().then(data => {
    console.log(data);
});
```

### PHP

Ejecutar por línea de comandos (imprime JSON):

```bash
php bcv_api.php
```

Servir como endpoint web con el servidor embebido de PHP:

```bash
php -S localhost:8000
```

Luego acceder a `http://localhost:8000/bcv_api.php`.

Usar dentro de una aplicación PHP:

```php
<?php
require_once 'bcv_api.php';

$scraper = new BCVScraper();
$data = $scraper->getExchangeRates();
echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
```

### cURL (contra el endpoint PHP)

Con el servidor PHP corriendo (`php -S localhost:8000`):

```bash
# Obtener todo el JSON
curl http://localhost:8000/bcv_api.php

# Formatear la salida con jq
curl -s http://localhost:8000/bcv_api.php | jq '.'

# Obtener solo el bloque del USD
curl -s http://localhost:8000/bcv_api.php | jq '.rates.USD'

# Guardar la respuesta en un archivo
curl -o rates.json http://localhost:8000/bcv_api.php
```

El script `examples_curl.sh` imprime estos mismos ejemplos:

```bash
bash examples_curl.sh
```

## Formato de respuesta JSON

### Respuesta exitosa

```json
{
  "status": "success",
  "timestamp": "2026-02-05T18:40:35.277Z",
  "source": "BCV (Banco Central de Venezuela)",
  "rates": {
    "USD": {
      "currency": "USD",
      "name": "Dólar",
      "rate": 36.5,
      "symbol": "$"
    }
  }
}
```

### Respuesta desde caché

Igual que la exitosa, con campos adicionales (`cached` y, si son datos antiguos por fallo de red, `stale`):

```json
{
  "status": "success",
  "timestamp": "2026-02-05T18:40:35.277Z",
  "source": "BCV (Banco Central de Venezuela)",
  "rates": { "USD": { "currency": "USD", "name": "Dólar", "rate": 36.5, "symbol": "$" } },
  "cached": true,
  "stale": true
}
```

### USD no disponible

Cuando la página responde pero no se encuentra la fila del Dólar:

```json
{
  "status": "success",
  "timestamp": "2026-02-05T18:40:35.277Z",
  "source": "BCV (Banco Central de Venezuela)",
  "rates": {
    "USD": {
      "currency": "USD",
      "name": "Dólar",
      "rate": null,
      "symbol": "$",
      "note": "Rate not available - check BCV website"
    }
  }
}
```

### Respuesta de error

Cuando falla la petición HTTP y no hay caché para respaldo:

```json
{
  "status": "error",
  "message": "Failed to fetch data from BCV: Connection timeout",
  "timestamp": "2026-02-05T18:40:35.277Z"
}
```

## API

Todas las implementaciones exponen una clase `BCVScraper` con un método principal:

- **Python:** `get_exchange_rates()`
- **JavaScript / TypeScript:** `getExchangeRates()` (asíncrono, devuelve una `Promise`)
- **PHP:** `getExchangeRates()`

Devuelve un objeto/array JSON con `status`, `timestamp`, `source` y `rates` en caso de éxito, o `status`, `message` y `timestamp` en caso de error.

## Consideraciones importantes

1. **Depende del HTML del BCV.** Es web scraping: si el BCV cambia la estructura de su página, el parseo puede dejar de funcionar y habría que ajustarlo.
2. **Uso responsable.** Evita peticiones excesivas al sitio del BCV. La caché (JS/TS/PHP) ayuda a reducir la carga.
3. **Disponibilidad.** Los datos dependen de que el sitio del BCV esté accesible y actualizado.
4. **Legal.** Asegúrate de cumplir los términos de servicio del BCV y la normativa local al usar esta API.

## Licencia

Proyecto bajo licencia MIT. Ver el archivo `LICENSE`.

## Enlaces

- Sitio del BCV: https://www.bcv.org.ve/
