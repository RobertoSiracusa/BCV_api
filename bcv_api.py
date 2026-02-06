#!/usr/bin/env python3
"""
BCV API - Web scraping for Venezuelan Central Bank exchange rates
Retrieves exchange rates for USD, EUR, Yuan, Turkish Lira, and Russian Ruble
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime
from typing import Dict, Optional


class BCVScraper:
    """Scraper for BCV (Banco Central de Venezuela) exchange rates"""
    
    def __init__(self) -> None:
        self.base_url = "https://www.bcv.org.ve/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
    def get_exchange_rates(self) -> Dict:
        """
        Scrape exchange rates from BCV website
        
        Returns:
            dict: Exchange rates in JSON format
        """
        try:
            response = self.session.get(self.base_url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Parse exchange rates from the BCV website
            rates = self._parse_rates(soup)
            
            return {
                "status": "success",
                "timestamp": datetime.now().isoformat(),
                "source": "BCV (Banco Central de Venezuela)",
                "rates": rates
            }
            
        except requests.RequestException as e:
            return {
                "status": "error",
                "message": f"Failed to fetch data from BCV: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
        except Exception as e:
            return {
                "status": "error",
                "message": f"Error processing data: {str(e)}",
                "timestamp": datetime.now().isoformat()
            }
    
    def _parse_rates(self, soup: BeautifulSoup) -> Dict:
        """
        Parse exchange rates from the HTML soup
        
        Args:
            soup: BeautifulSoup object with the page content
            
        Returns:
            dict: Parsed exchange rates
        """
        rates = {}
        
        # Try to find exchange rates in the common BCV structure
        # Currently implemented: look for tables with exchange rate data
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')
            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 2:
                    currency_text = cells[0].get_text(strip=True)
                    # Directly check for Dólar
                    if 'Dólar' in currency_text:
                        try:
                            rate_text = cells[1].get_text(strip=True)
                            # Clean and convert the rate
                            rate = self._clean_rate(rate_text)
                            if rate:
                                rates['USD'] = {
                                    "currency": 'USD',
                                    "name": 'Dólar',
                                    "rate": rate,
                                    "symbol": '$'
                                }
                                # Found what we needed, return immediately or break
                                return rates
                        except (ValueError, IndexError):
                            continue
        
        # If USD not found, add placeholder
        if 'USD' not in rates:
            rates['USD'] = {
                "currency": 'USD',
                "name": 'Dólar',
                "rate": None,
                "symbol": '$',
                "note": "Rate not available - check BCV website"
            }
        
        return rates
    
    def _clean_rate(self, rate_text: str) -> Optional[float]:
        """Clean and convert rate text to float"""
        try:
            # Remove currency symbols, spaces, and convert comma to dot
            cleaned = rate_text.replace(',', '.').replace(' ', '')
            # Remove any non-numeric characters except dot and minus
            cleaned = ''.join(c for c in cleaned if c.isdigit() or c in '.-')

            # If nothing remains after cleaning, treat as no rate
            if not cleaned:
                return None

            # Validate minus sign usage: at most one, and only at the beginning
            if cleaned.count('-') > 1:
                return None
            if '-' in cleaned and not cleaned.startswith('-'):
                return None

            # Validate decimal point usage: at most one
            if cleaned.count('.') > 1:
                return None

            # Ensure there is at least one digit
            if not any(ch.isdigit() for ch in cleaned):
                return None

            return float(cleaned)
        except ValueError:
            return None
    
    def _get_currency_symbol(self, code: str) -> str:
        """Get currency symbol for a given currency code"""
        symbols = {
            'USD': '$',
            'EUR': '€',
            'CNY': '¥',
            'TRY': '₺',
            'RUB': '₽'
        }
        return symbols.get(code, '')


def main():
    """Main function to run the scraper"""
    scraper = BCVScraper()
    data = scraper.get_exchange_rates()
    print(json.dumps(data, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
