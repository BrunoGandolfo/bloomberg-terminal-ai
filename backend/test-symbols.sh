#!/bin/bash
API_KEY="0720638184774111afaff3dc46916084"

for SYMBOL in AAPL GLOB QQQ MSFT; do
    echo "============================================"
    echo "PROBANDO: $SYMBOL"
    echo "============================================"
    
    echo -e "\n--- STATISTICS ---"
    curl -s "https://api.twelvedata.com/statistics?symbol=$SYMBOL&apikey=$API_KEY" | jq '.'
    
    echo -e "\n"
    sleep 1  # Para no exceder rate limits
done
