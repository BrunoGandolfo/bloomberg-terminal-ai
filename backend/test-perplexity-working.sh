#!/bin/bash
API_KEY="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"

function get_stock_data() {
  SYMBOL=$1
  echo "=== Consultando $SYMBOL ==="
  
  curl -s -X POST "https://api.perplexity.ai/chat/completions" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"sonar\",
      \"messages\": [{
        \"role\": \"user\",
        \"content\": \"$SYMBOL stock: What is the current market capitalization and P/E ratio? Give me only the numbers\"
      }],
      \"temperature\": 0,
      \"max_tokens\": 200
    }" | jq -r '.choices[0].message.content // "Error"'
    
  echo -e "\n"
  sleep 2
}

# Probar
get_stock_data "GLOB"
get_stock_data "MSFT"
get_stock_data "DLO"
