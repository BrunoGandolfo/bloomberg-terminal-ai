// src/utils/formatters.js
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined || isNaN(value)) return '---';
  
  const absValue = Math.abs(value);
  let suffix = '';
  let formattedValue = absValue;
  
  if (absValue >= 1e12) {
    formattedValue = absValue / 1e12;
    suffix = 'T';
  } else if (absValue >= 1e9) {
    formattedValue = absValue / 1e9;
    suffix = 'B';
  } else if (absValue >= 1e6) {
    formattedValue = absValue / 1e6;
    suffix = 'M';
  } else if (absValue >= 1e3) {
    formattedValue = absValue / 1e3;
    suffix = 'K';
  }
  
  const sign = value < 0 ? '-' : '';
  return `${sign}$${formattedValue.toFixed(decimals)}${suffix}`;
};

export const formatPrice = (price, decimals = 2) => {
  if (price === null || price === undefined || isNaN(price)) return '---';
  return `$${price.toFixed(decimals)}`;
};

export const formatPercent = (value, decimals = 2, showPlus = true) => {
  if (value === null || value === undefined || isNaN(value)) return '---';
  const sign = value > 0 && showPlus ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

export const formatNumber = (value, decimals = 0) => {
  if (value === null || value === undefined || isNaN(value)) return '---';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatVolume = (volume) => {
  if (!volume || isNaN(volume)) return '---';
  
  if (volume >= 1e9) {
    return `${(volume / 1e9).toFixed(2)}B`;
  } else if (volume >= 1e6) {
    return `${(volume / 1e6).toFixed(2)}M`;
  } else if (volume >= 1e3) {
    return `${(volume / 1e3).toFixed(2)}K`;
  }
  
  return volume.toFixed(0);
};

export const formatMarketCap = (marketCap) => {
  return formatCurrency(marketCap, 1);
};

export const formatTime = (timestamp) => {
  if (!timestamp) return '---';
  
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (timestamp) => {
  if (!timestamp) return '---';
  
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatDateTime = (timestamp) => {
  if (!timestamp) return '---';
  return `${formatDate(timestamp)} ${formatTime(timestamp)}`;
};

export const getPriceColor = (value) => {
  if (value === null || value === undefined || value === 0) return '#999';
  return value > 0 ? '#00FF00' : '#FF0000';
};

export const getPriceArrow = (value) => {
  if (value === null || value === undefined || value === 0) return '';
  return value > 0 ? '▲' : '▼';
};

export const formatChange = (change, changePercent) => {
  const color = getPriceColor(change);
  const arrow = getPriceArrow(change);
  const formattedChange = formatPrice(Math.abs(change));
  const formattedPercent = formatPercent(changePercent);
  
  return {
    text: `${arrow} ${formattedChange} (${formattedPercent})`,
    color,
  };
};
