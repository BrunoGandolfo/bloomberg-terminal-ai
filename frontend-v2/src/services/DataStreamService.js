// src/services/DataStreamService.js

// EventEmitter personalizado para navegador
class EventEmitter {
  constructor() {
    this.events = {};
  }
  
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
    console.log(`📌 EventEmitter: Listener registrado para evento '${event}', total listeners: ${this.events[event].length}`);
  }
  
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }
  
  emit(event, ...args) {
    console.log(`📡 EventEmitter: Emitiendo evento '${event}' con ${this.events[event]?.length || 0} listeners`);
    if (!this.events[event]) return;
    this.events[event].forEach(callback => callback(...args));
  }
}

class DataStreamService extends EventEmitter {
  constructor() {
    super();
    this.data = {
      portfolio: {
        AAPL: {
          shares: 500,
          avgCost: 160,
          currentPrice: 185.92,
          change: 2.34,
          changePercent: 1.27,
          dayHigh: 187.45,
          dayLow: 183.20,
          volume: 52340000,
        },
        MSFT: {
          shares: 300,
          avgCost: 385,
          currentPrice: 378.85,
          change: 4.21,
          changePercent: 1.12,
          dayHigh: 380.90,
          dayLow: 374.50,
          volume: 23450000,
        },
        GOOGL: {
          shares: 200,
          avgCost: 135,
          currentPrice: 142.57,
          change: -0.89,
          changePercent: -0.62,
          dayHigh: 144.20,
          dayLow: 141.80,
          volume: 18900000,
        },
      },
      watchlist: {
        TSLA: {
          price: 242.84,
          change: 5.58,
          changePercent: 2.35,
          volume: 89230000,
          marketCap: 770.5e9,
          dayHigh: 245.60,
          dayLow: 237.20,
        },
        NVDA: {
          price: 487.20,
          change: 8.64,
          changePercent: 1.81,
          volume: 45670000,
          marketCap: 1.2e12,
          dayHigh: 492.30,
          dayLow: 478.50,
        },
        AMD: {
          price: 167.32,
          change: -0.84,
          changePercent: -0.50,
          volume: 32100000,
          marketCap: 270.8e9,
          dayHigh: 169.40,
          dayLow: 166.10,
        },
        META: {
          price: 334.50,
          change: 4.20,
          changePercent: 1.27,
          volume: 28900000,
          marketCap: 860.3e9,
          dayHigh: 336.80,
          dayLow: 330.20,
        },
      },
      currentSymbol: 'AAPL',
      chartData: [],
      marketStatus: 'OPEN',
      lastUpdate: Date.now(),
    };

    this.subscribers = new Map();
    this.updateInterval = null;
    this.chartUpdateInterval = null;
    this.isConnected = false;
  }

  connect() {
    console.log('🚀 DataStreamService: connect() llamado');
    console.log('🔍 DataStreamService: isConnected actual:', this.isConnected);
    
    if (this.isConnected) {
      console.log('⚠️ DataStreamService: Ya está conectado, saliendo...');
      return;
    }

    this.isConnected = true;
    console.log('✓ DataStreamService: isConnected = true');
    
    this.initializeChartData();
    console.log('✓ DataStreamService: Chart data inicializada');
    
    this.startDataUpdates();
    console.log('✓ DataStreamService: Updates iniciados');
    
    console.log('📡 DataStreamService: A punto de emitir evento connected...');
    this.emit('connected');
    console.log('✅ DataStreamService: Evento connected emitido!');
  }

  disconnect() {
    if (!this.isConnected) return;

    this.isConnected = false;
    this.stopDataUpdates();
    this.emit('disconnected');
  }

  initializeChartData() {
    const now = Date.now();
    this.data.chartData = [];

    for (let i = 30; i >= 0; i--) {
      this.data.chartData.push({
        time: now - i * 60000,
        price: 180 + Math.random() * 10,
        volume: Math.floor(1000000 + Math.random() * 500000),
      });
    }
  }

  startDataUpdates() {
    this.updateInterval = setInterval(() => {
      this.updatePrices();
      this.updateChartData();
      this.notifySubscribers();
    }, 1000);

    this.marketStatusInterval = setInterval(() => {
      this.checkMarketStatus();
    }, 60000);
  }

  stopDataUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    if (this.marketStatusInterval) {
      clearInterval(this.marketStatusInterval);
      this.marketStatusInterval = null;
    }
  }

  updatePrices() {
    Object.keys(this.data.portfolio).forEach(symbol => {
      const stock = this.data.portfolio[symbol];
      const change = (Math.random() - 0.5) * 2;
      stock.currentPrice = Math.max(0.01, stock.currentPrice + change);
      stock.change += change;
      stock.changePercent = (stock.change / (stock.currentPrice - change)) * 100;
      stock.dayHigh = Math.max(stock.dayHigh, stock.currentPrice);
      stock.dayLow = Math.min(stock.dayLow, stock.currentPrice);
      stock.volume += Math.floor(Math.random() * 10000);
    });

    Object.keys(this.data.watchlist).forEach(symbol => {
      const stock = this.data.watchlist[symbol];
      const change = (Math.random() - 0.5) * 3;
      stock.price = Math.max(0.01, stock.price + change);
      stock.change = change;
      stock.changePercent = (change / stock.price) * 100;
      stock.dayHigh = Math.max(stock.dayHigh || stock.price, stock.price);
      stock.dayLow = Math.min(stock.dayLow || stock.price, stock.price);
      stock.volume += Math.floor(Math.random() * 50000);
    });

    this.data.lastUpdate = Date.now();
  }

  updateChartData() {
    const currentStock = this.getCurrentStockData();
    if (!currentStock) return;

    const lastPrice = this.data.chartData.at(-1)?.price || currentStock.currentPrice || currentStock.price;

    this.data.chartData.push({
      time: Date.now(),
      price: lastPrice + (Math.random() - 0.5) * 2,
      volume: Math.floor(1000000 + Math.random() * 500000),
    });

    if (this.data.chartData.length > 50) this.data.chartData.shift();
  }

  getCurrentStockData() {
    const symbol = this.data.currentSymbol;
    return this.data.portfolio[symbol] || this.data.watchlist[symbol];
  }

  checkMarketStatus() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();

    if (day >= 1 && day <= 5 && hour >= 9 && hour < 16) {
      this.data.marketStatus = 'OPEN';
    } else if (hour >= 4 && hour < 9) {
      this.data.marketStatus = 'PRE_MARKET';
    } else if (hour >= 16 && hour < 20) {
      this.data.marketStatus = 'AFTER_HOURS';
    } else {
      this.data.marketStatus = 'CLOSED';
    }
  }

  subscribe(callback) {
    const id = Date.now() + Math.random();
    this.subscribers.set(id, callback);
    callback({ ...this.data });
    return () => this.subscribers.delete(id);
  }

  notifySubscribers() {
    const dataCopy = { ...this.data };
    this.subscribers.forEach(callback => callback(dataCopy));
    this.emit('data', dataCopy);
  }

  setCurrentSymbol(symbol) {
    if (this.data.currentSymbol === symbol) return;
    this.data.currentSymbol = symbol;
    this.regenerateChartData(symbol);
    this.notifySubscribers();
    this.emit('symbolChanged', symbol);
  }

  regenerateChartData(symbol) {
    const stock = this.data.portfolio[symbol] || this.data.watchlist[symbol];
    if (!stock) return;

    const basePrice = stock.currentPrice || stock.price || 100;
    const now = Date.now();
    this.data.chartData = [];

    for (let i = 30; i >= 0; i--) {
      this.data.chartData.push({
        time: now - i * 60000,
        price: basePrice + (Math.random() - 0.5) * 10,
        volume: Math.floor(1000000 + Math.random() * 500000),
      });
    }
  }

  addToWatchlist(symbol, initialData = {}) {
    if (this.data.watchlist[symbol] || this.data.portfolio[symbol]) return false;

    this.data.watchlist[symbol] = {
      price: initialData.price || 100,
      change: 0,
      changePercent: 0,
      volume: initialData.volume || 0,
      marketCap: initialData.marketCap || 0,
      dayHigh: initialData.price || 100,
      dayLow: initialData.price || 100,
    };

    this.notifySubscribers();
    this.emit('watchlistUpdated', { symbol, action: 'add' });
    return true;
  }

  removeFromWatchlist(symbol) {
    if (!this.data.watchlist[symbol]) return false;

    delete this.data.watchlist[symbol];

    if (this.data.currentSymbol === symbol) {
      const symbols = [...Object.keys(this.data.portfolio), ...Object.keys(this.data.watchlist)];
      if (symbols.length > 0) this.setCurrentSymbol(symbols[0]);
    }

    this.notifySubscribers();
    this.emit('watchlistUpdated', { symbol, action: 'remove' });
    return true;
  }

  getData() {
    return { ...this.data };
  }
}

const dataStreamService = new DataStreamService();

export default dataStreamService;
