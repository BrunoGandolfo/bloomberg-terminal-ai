const axios = require('axios');

/**
 * Fetches the quote for a specific symbol from the Yahoo Finance API.
 * @param {string} symbol The stock symbol (e.g., 'AAPL').
 * @returns {Promise<Object|null>} An object with the quote data or null if an error occurs.
 */
async function getQuote(symbol) {
  if (!symbol) {
    throw new Error('Symbol is required.');
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        // Adding a User-Agent can help avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const chart = data.chart;

    if (!chart || !chart.result || chart.result.length === 0 || !chart.result[0].meta) {
      console.warn(`No valid data found for symbol: ${symbol} from Yahoo Finance.`);
      return null;
    }
    
    const meta = chart.result[0].meta;

    const price = meta.regularMarketPrice;
    const previousClose = meta.chartPreviousClose;
    
    if (price === undefined || previousClose === undefined) {
        console.warn(`Missing price data for symbol: ${symbol} from Yahoo Finance.`);
        return null;
    }

    const change = price - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol: meta.symbol,
      price: price,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    };

  } catch (error) {
    // Yahoo Finance often returns 404 for invalid symbols
    if (error.response && error.response.status === 404) {
      console.warn(`Symbol ${symbol} not found on Yahoo Finance.`);
    } else {
      console.error(`Error fetching quote for ${symbol} from Yahoo Finance:`, error.message);
    }
    return null;
  }
}

module.exports = {
  getQuote,
}; 