// src/utils/constants.js

// WebSocket & API
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080';
export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Update Intervals (in milliseconds)
export const PRICE_UPDATE_INTERVAL = 1000;
export const CHART_UPDATE_INTERVAL = 1000;
export const MARKET_STATUS_UPDATE_INTERVAL = 60000;

// Display Modes
export const DISPLAY_MODES = {
  TRADING: 'trading',
  RESEARCH: 'research',
};

// Market Status
export const MARKET_STATUS = {
  PRE_MARKET: 'PRE_MARKET',
  OPEN: 'OPEN',
  AFTER_HOURS: 'AFTER_HOURS',
  CLOSED: 'CLOSED',
};

// Tab Types
export const TABS = {
  PORTFOLIO: 'portfolio',
  WATCHLIST: 'watchlist',
  RESEARCH: 'research',
};

// Chart Time Ranges
export const CHART_RANGES = {
  '1D': { label: '1 Day', minutes: 390 },
  '5D': { label: '5 Days', minutes: 1950 },
  '1M': { label: '1 Month', minutes: 8580 },
  '3M': { label: '3 Months', minutes: 25740 },
  '6M': { label: '6 Months', minutes: 51480 },
  '1Y': { label: '1 Year', minutes: 102960 },
  '5Y': { label: '5 Years', minutes: 514800 },
};

// Analysis Indicators
export const TECHNICAL_INDICATORS = {
  RSI: { min: 0, max: 100, oversold: 30, overbought: 70 },
  MACD: { signal: 'bullish', neutral: 'neutral', bearish: 'bearish' },
};

// Theme Colors
export const COLORS = {
  primary: '#FF8800',
  secondary: '#00FF00',
  danger: '#FF0000',
  background: '#000000',
  backgroundAlt: '#1a1a1a',
  backgroundHover: '#0a0a0a',
  border: '#333333',
  text: '#FFFFFF',
  textMuted: '#666666',
  success: '#00FF00',
  warning: '#FF8800',
  error: '#FF0000',
};

// Table Column Definitions
export const PORTFOLIO_COLUMNS = [
  { key: 'symbol', label: 'Symbol', sortable: true },
  { key: 'shares', label: 'Shares', sortable: true },
  { key: 'currentPrice', label: 'Price', sortable: true },
  { key: 'value', label: 'Value', sortable: true },
  { key: 'gain', label: 'P&L', sortable: true },
  { key: 'gainPercent', label: 'P&L %', sortable: true },
];

export const WATCHLIST_COLUMNS = [
  { key: 'symbol', label: 'Symbol', sortable: true },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'change', label: 'Change', sortable: true },
  { key: 'changePercent', label: '%', sortable: true },
  { key: 'volume', label: 'Volume', sortable: true },
];

// Local Storage Keys
export const STORAGE_KEYS = {
  WATCHLIST: 'bloomberg_terminal_watchlist',
  PREFERENCES: 'bloomberg_terminal_preferences',
  LAYOUT: 'bloomberg_terminal_layout',
};

// Default Symbols
export const DEFAULT_WATCHLIST = ['TSLA', 'NVDA', 'AMD', 'META'];
export const DEFAULT_PORTFOLIO = ['AAPL', 'MSFT', 'GOOGL'];

// Animation Durations
export const ANIMATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};
