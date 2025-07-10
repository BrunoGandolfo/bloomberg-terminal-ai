const WebSocket = require('ws');

const ws = new WebSocket('wss://ws.eodhistoricaldata.com/ws/us?api_token=686d27ea3ab0d1.30880785');

ws.on('open', function open() {
  console.log('🚀 Conectado a EODHD WebSocket!');
  
  // Suscribirse a AAPL y MSFT
  const subscribeMessage = JSON.stringify({
    "action": "subscribe", 
    "symbols": "AAPL,MSFT"
  });
  
  console.log('📡 Enviando suscripción:', subscribeMessage);
  ws.send(subscribeMessage);
});

ws.on('message', function message(data) {
  console.log('📊 DATOS EN TIEMPO REAL:', JSON.parse(data));
});

ws.on('error', function error(err) {
  console.log('❌ Error:', err.message);
});

ws.on('close', function close() {
  console.log('🔌 Conexión cerrada');
});

// Cerrar después de 30 segundos
setTimeout(() => {
  console.log('⏰ Cerrando test...');
  ws.close();
  process.exit(0);
}, 30000);
