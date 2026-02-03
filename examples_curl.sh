#!/bin/bash
# Example cURL commands for BCV API

echo "=== BCV Exchange Rates API - cURL Examples ==="
echo ""

# If you're running the PHP version as a web server
echo "1. Using PHP built-in server (run this first in another terminal):"
echo "   php -S localhost:8000"
echo ""

echo "2. Fetch exchange rates from local PHP server:"
echo "   curl http://localhost:8000/bcv_api.php"
echo ""

echo "3. Fetch and format JSON output with jq:"
echo "   curl -s http://localhost:8000/bcv_api.php | jq '.'"
echo ""

echo "4. Get only USD rate:"
echo "   curl -s http://localhost:8000/bcv_api.php | jq '.rates.USD'"
echo ""

echo "5. Get all currency symbols:"
echo "   curl -s http://localhost:8000/bcv_api.php | jq '.rates | to_entries[] | .value.symbol'"
echo ""

echo "6. Save response to file:"
echo "   curl -o rates.json http://localhost:8000/bcv_api.php"
echo ""

echo "=== To actually run these commands, start the PHP server first ==="
echo "Run: php -S localhost:8000"
echo "Then run any curl command above"
