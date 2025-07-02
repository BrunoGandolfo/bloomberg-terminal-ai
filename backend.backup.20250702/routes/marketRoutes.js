const express = require('express');
const router = express.Router();
const marketService = require('../services/marketService');

// GET /api/price?symbol=AAPL
router.get('/price', async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  const quote = await marketService.getQuote(symbol);
  if (!quote) return res.status(502).json({ error: 'Quote unavailable' });
  res.json(quote);
});

module.exports = router; 