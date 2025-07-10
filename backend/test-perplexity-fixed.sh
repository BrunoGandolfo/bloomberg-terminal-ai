#!/bin/bash
API_KEY="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"

function get_stock_data() {
  SYMBOL=$1
  echo "=== Consultando $SYMBOL ==="
  
  curl -s -X POST "https://api.perplexity.ai/chat/completions" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"model\": \"llama-3.1-sonar-small-128k-online\",
      \"messages\": [{
        \"role\": \"user\",
        \"content\": \"$SYMBOL stock current market cap and PE ratio. Only numbers.\"
      }],
      \"temperature\": 0,
      \"max_tokens\": 100
    }" | jq -r '.choices[0].message.content'
    
  echo -e "\n"
  sleep 2
}

get_stock_data "GLOB"
get_stock_data "MSFT"
