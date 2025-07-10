# 📊 REPORTE FINAL - PRUEBA EODHD API

**Fecha:** Tue Jul  8 12:20:51 PM -03 2025
**API Key:** 686d27ea3a...
**Empresas Probadas:** 20

## 📈 Resultados por Empresa

### AAPL.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### MSFT.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### GOOGL.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### AMZN.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### TSLA.US

- **Éxito:** 9/10 endpoints
- **Archivos:** 13 archivos generados

### META.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### NVDA.US

- **Éxito:** 9/10 endpoints
- **Archivos:** 13 archivos generados

### JPM.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### JNJ.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### WMT.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### PG.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### HD.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### BAC.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### DIS.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### ADBE.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### CRM.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### NFLX.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### PYPL.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### INTC.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados

### AMD.US

- **Éxito:** 10/10 endpoints
- **Archivos:** 13 archivos generados


## 🔧 Información Técnica

- **Base URL:** https://eodhd.com/api
- **Rate Limiting:** 100,000 calls/día según plan
- **Formato:** JSON
- **Timeout:** 10 segundos por request

## 📁 Estructura de Archivos

Cada empresa tiene su carpeta con:
- `01_real_time.json` - Cotización actual
- `02_fundamentals.json` - Datos fundamentales
- `03_historical.json` - Históricos 30 días
- `04_intraday.json` - Intraday 5 minutos
- `05_dividends.json` - Dividendos
- `06_splits.json` - Stock splits
- `07_sma50.json` - Media móvil 50
- `08_rsi.json` - RSI 14 períodos
- `09_news.json` - Noticias (5)
- `10_insider.json` - Transacciones insiders

