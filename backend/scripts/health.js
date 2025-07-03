
const axios = require('axios');
(async () => {
  try {
    await axios.get('http://localhost:5000/api/price?symbol=AAPL');
    await axios.post('https://api.perplexity.ai/chat/completions', { model:'sonar-pro', stream:false, max_tokens:5, messages:[{role:'user',content:'ping'}]}, { headers: require('../config/aiHeaders').perplexity });
    await require('../services/aiService').callClaude('ping');
    await require('../services/aiService').callGPT('ping');
    await require('../services/aiService').callGemini('ping');
    console.log('HEALTH-CHECK OK'); process.exit(0);
  } catch (e) { console.error('HEALTH-CHECK FAIL', e.message); process.exit(1); }
})(); 