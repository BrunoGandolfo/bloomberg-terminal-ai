const axios = require('axios');

/**
 * Calculates Unix timestamps for the current time and five years ago.
 * @returns {{timestampNow: number, timestamp5YearsAgo: number}} Object containing the timestamps.
 */
function getTimestamps() {
  const now = new Date();
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(now.getFullYear() - 5);

  const timestampNow = Math.floor(now.getTime() / 1000);
  const timestamp5YearsAgo = Math.floor(fiveYearsAgo.getTime() / 1000);

  return { timestampNow, timestamp5YearsAgo };
}

/**
 * Fetches 5 years of historical daily data for a given symbol from Yahoo Finance.
 * @param {string} symbol The stock symbol (e.g., 'AAPL').
 * @returns {Promise<Array<{date: string, price: number}>>} A promise that resolves to an array of historical data points, or an empty array on error.
 */
async function getHistoricalData(symbol) {
  if (!symbol) {
    console.error('Error: Symbol is required for historical data.');
    return [];
  }

  const { timestampNow, timestamp5YearsAgo } = getTimestamps();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${timestamp5YearsAgo}&period2=${timestampNow}&interval=1d`;

  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const result = data?.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
      console.warn(`No historical data found for symbol: ${symbol}`);
      return [];
    }
    
    const timestamps = result.timestamp;
    const prices = result.indicators.quote[0].close;

    const historicalData = timestamps.map((ts, index) => {
      // Filter out any entries where the price is null or undefined
      if (prices[index] === null || prices[index] === undefined) {
        return null;
      }
      const date = new Date(ts * 1000);
      return {
        date: date.toISOString().split('T')[0], // Format to YYYY-MM-DD
        price: parseFloat(prices[index].toFixed(2)),
      };
    }).filter(Boolean); // Remove null entries

    return historicalData;

  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`Symbol ${symbol} not found on Yahoo Finance for historical data.`);
    } else {
      console.error(`Error fetching historical data for ${symbol}:`, error.message);
    }
    return []; // Return empty array on any error
  }
}

module.exports = {
  getHistoricalData,
}; 