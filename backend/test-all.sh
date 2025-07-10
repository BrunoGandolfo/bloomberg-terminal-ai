#!/bin/bash

# Lista de símbolos para probar
symbols=(
  "AAPL" "MSFT" "NVDA" "MELI" "GLOB" "NU" 
  "CROX" "DNUT" "BROS" "O" "AMT" "PLD" 
  "BRK.B" "META" "TSM" "XOM" "JNJ" "WMT" 
  "PLTR" "SOFI"
)

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Contador de éxitos/fallos
success=0
failure=0

echo "🧪 INICIANDO PRUEBA INTENSIVA DE 20 EMPRESAS"
echo "============================================"

for symbol in "${symbols[@]}"
do
  echo -n "Probando $symbol... "
  
  # Ejecutar curl y capturar respuesta
  response=$(curl -s http://localhost:5000/api/fundamentals-perplexity/$symbol)
  
  # Verificar si la respuesta contiene "error"
  if [[ $response == *"error"* ]]; then
    echo -e "${RED}❌ FALLÓ${NC}"
    echo "  Error: $(echo $response | jq -r '.error' 2>/dev/null || echo $response)"
    ((failure++))
  else
    # Verificar si tiene buffettScore
    if [[ $response == *"buffettScore"* ]]; then
      score=$(echo $response | jq -r '.analysis.buffettScore' 2>/dev/null || echo "N/A")
      grade=$(echo $response | jq -r '.analysis.grade' 2>/dev/null || echo "N/A")
      echo -e "${GREEN}✅ ÉXITO${NC} - Buffett Score: $score ($grade)"
      ((success++))
    else
      echo -e "${RED}❌ RESPUESTA INVÁLIDA${NC}"
      ((failure++))
    fi
  fi
  
  # Esperar 2 segundos entre llamadas para no saturar
  sleep 2
done

echo ""
echo "============================================"
echo "📊 RESULTADOS FINALES:"
echo "✅ Exitosos: $success"
echo "❌ Fallidos: $failure"
echo "📈 Tasa de éxito: $(( success * 100 / 20 ))%"
