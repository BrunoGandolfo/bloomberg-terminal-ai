// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.css';

// Performance monitoring (optional)
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Create root element
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render app with StrictMode for development
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: log performance metrics
reportWebVitals(console.log);

// Service Worker registration (optional, for PWA features)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Global error handler
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Prevent right-click context menu (optional, for production)
if (process.env.NODE_ENV === 'production') {
  document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
  });
}

// Set page title
document.title = 'Bloomberg Terminal AI';

// Add Bloomberg Terminal meta tags
const metaTags = [
  { name: 'description', content: 'Professional financial terminal with real-time market data and AI-powered analysis' },
  { name: 'keywords', content: 'trading, finance, bloomberg, terminal, stocks, portfolio, market data' },
  { name: 'author', content: 'Bloomberg Terminal AI' },
  { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
  { name: 'theme-color', content: '#FF8800' }
];

metaTags.forEach(tag => {
  const meta = document.createElement('meta');
  Object.keys(tag).forEach(key => {
    meta.setAttribute(key, tag[key]);
  });
  document.head.appendChild(meta);
});

// Add favicon (Bloomberg orange)
const link = document.createElement('link');
link.rel = 'icon';
link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23000"/><text x="50" y="50" font-family="Courier New" font-size="60" font-weight="bold" text-anchor="middle" dominant-baseline="central" fill="%23FF8800">B</text></svg>';
document.head.appendChild(link);

// Console styling for Bloomberg Terminal
console.log(
  '%cBloomberg Terminal AI',
  'color: #FF8800; font-size: 20px; font-weight: bold; font-family: "Courier New", monospace; text-shadow: 0 0 10px rgba(255, 136, 0, 0.5);'
);
console.log(
  '%cProfessional Trading Terminal v1.0',
  'color: #00FF00; font-family: "Courier New", monospace;'
);
console.log(
  '%c⚠️ Warning: This console is for developers only. Do not paste any code here unless you understand what it does.',
  'color: #FF0000; font-weight: bold;'
);
