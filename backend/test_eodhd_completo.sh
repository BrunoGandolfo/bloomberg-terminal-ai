#!/bin/bash

# Script para probar TODOS los servicios de EODHD All-in-One

API_KEY="686d27ea3ab0d1.30880785"

# 1. FINANCIAL NEWS API - Últimas noticias
echo "=== 1. PROBANDO FINANCIAL NEWS API ==="
curl -s "https://eodhd.com/api/news?s=AAPL.US&offset=0&limit=5&api_token=$API_KEY&fmt=json" | jq '.'

# 2. SENTIMENT ANALYSIS - Análisis de sentimiento
echo -e "\n=== 2. PROBANDO SENTIMENT ANALYSIS ==="
curl -s "https://eodhd.com/api/sentiments?s=AAPL.US&from=2025-07-01&to=2025-07-11&api_token=$API_KEY&fmt=json" | jq '.'

# 3. EOD HISTORICAL - Precios históricos
echo -e "\n=== 3. PROBANDO EOD HISTORICAL DATA ==="
curl -s "https://eodhd.com/api/eod/AAPL.US?api_token=$API_KEY&fmt=json&from=2025-07-01" | jq '.'

# 4. FUNDAMENTALS - Datos fundamentales
echo -e "\n=== 4. PROBANDO FUNDAMENTALS DATA ==="
curl -s "https://eodhd.com/api/fundamentals/AAPL.US?api_token=$API_KEY&fmt=json" | jq '.Financials.Balance_Sheet.yearly | to_entries | .[0:2]'

# 5. LIVE DELAYED - Precio en vivo con delay
echo -e "\n=== 5. PROBANDO LIVE DELAYED PRICES ==="
curl -s "https://eodhd.com/api/real-time/AAPL.US?api_token=$API_KEY&fmt=json" | jq '.'

# 6. OPTIONS DATA - Datos de opciones
echo -e "\n=== 6. PROBANDO OPTIONS DATA ==="
curl -s "https://eodhd.com/api/options/AAPL.US?api_token=$API_KEY&fmt=json" | jq '.data[0:2]'

# 7. INSIDER TRANSACTIONS - Transacciones de insiders
echo -e "\n=== 7. PROBANDO INSIDER TRANSACTIONS ==="
curl -s "https://eodhd.com/api/insider-transactions?api_token=$API_KEY&code=AAPL.US&limit=5&fmt=json" | jq '.'

# 8. CALENDAR API - Earnings calendar
echo -e "\n=== 8. PROBANDO CALENDAR API (EARNINGS) ==="
curl -s "https://eodhd.com/api/calendar/earnings?symbols=AAPL.US&from=2025-07-01&to=2025-07-31&api_token=$API_KEY&fmt=json" | jq '.'

# 9. MARKET STATUS - Estado del mercado
echo -e "\n=== 9. PROBANDO MARKET STATUS API ==="
curl -s "https://eodhd.com/api/exchanges-details?api_token=$API_KEY&fmt=json" | jq '.[0:3]'

# 10. INTRADAY DATA - Datos intradía
echo -e "\n=== 10. PROBANDO INTRADAY DATA ==="
curl -s "https://eodhd.com/api/intraday/AAPL.US?api_token=$API_KEY&interval=5m&fmt=json" | jq '.[0:5]'

# 11. STOCK SCREENER - Buscador de acciones
echo -e "\n=== 11. PROBANDO STOCK SCREENER ==="
curl -s "https://eodhd.com/api/screener?api_token=$API_KEY&filters=[[\"market_capitalization\",\">\",1000000000]]&limit=5&fmt=json" | jq '.'

# 12. NEWS WORD WEIGHTS - Análisis de palabras clave
echo -e "\n=== 12. PROBANDO NEWS WORD WEIGHTS ==="
curl -s "https://eodhd.com/api/news-word-weights?s=AAPL.US&filter[date_from]=2025-07-01&filter[to]=2025-07-11&page[limit]=10&api_token=$API_KEY&fmt=json" | jq '.'

echo -e "\n=== TESTS COMPLETADOS ==="
echo "Revisa los resultados arriba para confirmar que todos los servicios funcionan."
