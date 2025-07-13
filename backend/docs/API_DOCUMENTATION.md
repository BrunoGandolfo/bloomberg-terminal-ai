# Bloomberg Terminal AI - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
Currently no authentication required (personal use only)

## Response Format
All API responses follow this format:
```json
{
  "data": {},      // Response data
  "error": null,   // Error message if any
  "status": 200    // HTTP status code
}
```

## Error Handling
Error responses:
```json
{
  "error": "Error message",
  "status": 400-500,
  "details": {}  // Additional error details
}
```

## Rate Limiting
- EODHD API: Limited by subscription (€99.99/month plan)
- Internal cache: 5 minutes for market data
- No explicit rate limits for personal use

## Endpoints

### 📈 Market Data

#### GET /api/market/quote/:symbol
Get real-time quote for a symbol.

**Parameters:**
- `symbol` (required): Stock symbol with exchange (e.g., AAPL.US)

**Response:**
```json
{
  "symbol": "AAPL.US",
  "price": 150.25,
  "change": 2.50,
  "changePercent": 1.69,
  "volume": 75000000,
  "high": 151.00,
  "low": 149.50,
  "previousClose": 147.75,
  "timestamp": 1641234567
}
```

#### POST /api/market/batch-quotes
Get multiple quotes in one request.

**Body:**
```json
{
  "symbols": ["AAPL.US", "MSFT.US", "GOOGL.US"]
}
```

**Response:**
```json
[
  {
    "symbol": "AAPL.US",
    "price": 150.25,
    "change": 2.50,
    "changePercent": 1.69
  },
  {
    "symbol": "MSFT.US",
    "price": 375.50,
    "change": 5.25,
    "changePercent": 1.42
  }
]
```

#### GET /api/market/historical/:symbol
Get historical price data.

**Parameters:**
- `symbol` (required): Stock symbol
- `period` (optional): Time period (1D, 1W, 1M, 3M, 6M, 1Y, 5Y)
- `from` (optional): Start date (YYYY-MM-DD)
- `to` (optional): End date (YYYY-MM-DD)

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "open": 149.50,
    "high": 151.00,
    "low": 149.00,
    "close": 150.25,
    "volume": 75000000
  }
]
```

### 📊 Fundamental Data

#### GET /api/fundamentals/:symbol
Get comprehensive fundamental data.

**Parameters:**
- `symbol` (required): Stock symbol

**Response:**
```json
{
  "General": {
    "Code": "AAPL",
    "Type": "Common Stock",
    "Name": "Apple Inc",
    "Exchange": "NASDAQ",
    "CurrencyCode": "USD",
    "CurrencyName": "US Dollar",
    "Sector": "Technology",
    "Industry": "Consumer Electronics",
    "Description": "Company description..."
  },
  "Highlights": {
    "MarketCapitalization": 2500000000000,
    "EBITDA": 120000000000,
    "PERatio": 25.5,
    "DividendYield": 0.0055
  },
  "Financials": {
    "BS": {
      "yearly": {
        "2023-12-31": {
          "totalAssets": 352755000000,
          "totalLiabilities": 290437000000
        }
      }
    },
    "IS": {
      "yearly": {
        "2023-12-31": {
          "totalRevenue": 383285000000,
          "netIncome": 96995000000
        }
      }
    }
  }
}
```

### 🤖 AI Analysis

#### POST /api/ai/analyze
Get AI-powered market analysis using Claude.

**Body:**
```json
{
  "question": "What is the current market sentiment for tech stocks?",
  "context": {
    "symbols": ["AAPL.US", "MSFT.US"],
    "includeNews": true,
    "includeTechnicals": true
  }
}
```

**Response:**
```json
{
  "response": "Based on the current market data...",
  "sources": ["technical_analysis", "news_sentiment"],
  "timestamp": 1641234567
}
```

### 📱 Screener

#### GET /api/screener/filter
Get pre-configured market screeners.

**Query Parameters:**
- `type`: Screener type (gainers, losers, volume, technical)

**Response:**
```json
{
  "type": "gainers",
  "data": [
    {
      "codigo": "AAPL.US",
      "nombre": "Apple Inc",
      "precio": 150.25,
      "cambio_porcentual": 5.2,
      "volumen": 125000000
    }
  ],
  "updated": 1641234567
}
```

#### POST /api/screener/filter
Apply custom filters to screen stocks.

**Body:**
```json
{
  "filters": {
    "market_cap_min": 1000000000,
    "market_cap_max": 50000000000,
    "pe_min": 10,
    "pe_max": 30,
    "volume_min": 1000000,
    "sector": "Technology"
  }
}
```

### 📈 Technical Analysis

#### GET /api/technical/:symbol/:indicator
Get technical indicators.

**Parameters:**
- `symbol` (required): Stock symbol
- `indicator` (required): Indicator type (sma, ema, rsi, macd, bbands)

**Query Parameters:**
- `period`: Period for calculation (default varies by indicator)
- `interval`: Data interval (1d, 1w, 1m)

**Response for RSI:**
```json
[
  {
    "date": "2024-01-15",
    "rsi": 65.5
  },
  {
    "date": "2024-01-14",
    "rsi": 62.3
  }
]
```

**Response for MACD:**
```json
[
  {
    "date": "2024-01-15",
    "macd": 2.5,
    "signal": 2.1,
    "histogram": 0.4
  }
]
```

### 🌍 Macroeconomic Data

#### GET /api/macro/indicators
Get key macroeconomic indicators.

**Response:**
```json
{
  "VIX": {
    "value": 15.25,
    "change": -0.5,
    "changePercent": -3.17
  },
  "DXY": {
    "value": 103.45,
    "change": 0.25,
    "changePercent": 0.24
  },
  "US10Y": {
    "value": 4.25,
    "change": 0.05,
    "changePercent": 1.19
  },
  "GOLD": {
    "value": 2050.50,
    "change": 15.25,
    "changePercent": 0.75
  }
}
```

#### GET /api/macro/fred/:series
Get FRED economic data series.

**Parameters:**
- `series`: FRED series ID (e.g., DGS10, UNRATE, CPIAUCSL)

**Response:**
```json
{
  "series": "DGS10",
  "name": "10-Year Treasury Rate",
  "data": [
    {
      "date": "2024-01-15",
      "value": 4.25
    }
  ],
  "updated": 1641234567
}
```

### 💼 Insider Trading

#### GET /api/insider/:symbol
Get insider trading data.

**Parameters:**
- `symbol` (required): Stock symbol

**Response:**
```json
{
  "symbol": "AAPL.US",
  "transactions": [
    {
      "date": "2024-01-10",
      "transactionType": "Buy",
      "ownerName": "John Doe",
      "ownerTitle": "CFO",
      "shares": 10000,
      "value": 1500000
    }
  ]
}
```

### 🔍 Search

#### GET /api/search/:query
Search for symbols and companies.

**Parameters:**
- `query` (required): Search term

**Response:**
```json
{
  "results": [
    {
      "symbol": "AAPL.US",
      "name": "Apple Inc",
      "type": "Stock",
      "exchange": "NASDAQ",
      "currency": "USD"
    }
  ]
}
```

### 🏥 System Health

#### GET /api/health
Check system health status.

**Response:**
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "cache": "active",
    "eodhd": "operational",
    "claude": "available"
  },
  "uptime": 86400,
  "version": "1.0.0"
}
```

## WebSocket Events

### Real-time Price Updates
```javascript
// Connect
ws://localhost:5000

// Subscribe
{
  "action": "subscribe",
  "symbols": ["AAPL.US", "MSFT.US"]
}

// Receive updates
{
  "type": "price_update",
  "data": {
    "symbol": "AAPL.US",
    "price": 150.25,
    "change": 2.50,
    "timestamp": 1641234567
  }
}
```

## Examples

### Getting Started
```bash
# Get a stock quote
curl http://localhost:5000/api/market/quote/AAPL.US

# Get fundamental data
curl http://localhost:5000/api/fundamentals/AAPL.US

# Search for a company
curl http://localhost:5000/api/search/apple

# Get technical indicators
curl http://localhost:5000/api/technical/AAPL.US/rsi?period=14
```

### Advanced Usage
```javascript
// Batch quotes request
fetch('http://localhost:5000/api/market/batch-quotes', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    symbols: ['AAPL.US', 'MSFT.US', 'GOOGL.US']
  })
});

// AI Analysis
fetch('http://localhost:5000/api/ai/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: 'Analyze AAPL technical setup',
    context: {
      symbols: ['AAPL.US'],
      includeNews: true,
      includeTechnicals: true
    }
  })
});
```

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Symbol or resource not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable - External API down |

## Changelog

### v1.0.0 (2024-01)
- Initial release
- Full market data integration
- AI analysis with Claude
- Technical indicators
- Fundamental data
- Real-time WebSocket updates 