// test-perplexity-corregido.js

const axios = require('axios');

async function testPerplexityCorregido() {
  console.log('\n🧪 PROBANDO SOLUCIÓN CORREGIDA DE PERPLEXITY - 40 EMPRESAS');
  console.log('========================================================\n');
  
  // Probar con 40 empresas diferentes
  const symbols = [
    // Tech Giants
    'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'TSLA',
    // Latinoamericanas
    'MELI', 'GLOB', 'NU', 'PBR', 'VALE', 'ITUB',
    // REITs
    'O', 'AMT', 'PLD', 'SPG', 'VICI',
    // Tradicionales
    'XOM', 'JNJ', 'WMT', 'KO', 'PG', 'JPM', 'BAC',
    // Growth
    'PLTR', 'SOFI', 'RBLX', 'COIN', 'HOOD',
    // Retail/Consumer
    'CROX', 'DNUT', 'BROS', 'MCD', 'SBUX', 'NKE',
    // Internacional
    'TSM', 'BABA', 'NVO', 'ASML',
    // Warren Buffett
    'BRK.B', 'CVX'
  ];
  
  const results = [];
  
  console.log(`📊 TOTAL DE EMPRESAS A PROBAR: ${symbols.length}\n`);
  
  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i];
    console.log(`\n🔍 [${i+1}/${symbols.length}] PROBANDO ${symbol}...`);
    const start = Date.now();
    
    try {
      const response = await axios.get(`http://localhost:5000/api/fundamentals-perplexity/${symbol}`);
      const data = response.data;
      const elapsed = Date.now() - start;
      
      // Contar campos N/A
      const naCount = Object.values(data.financials).filter(v => v === 'N/A').length;
      const totalFields = Object.keys(data.financials).length;
      const completeness = ((totalFields - naCount) / totalFields * 100).toFixed(1);
      
      console.log(`✅ ÉXITO para ${symbol} en ${elapsed}ms`);
      console.log(`   📊 Completitud de datos: ${completeness}% (${totalFields - naCount}/${totalFields} campos)`);
      console.log(`   💰 Buffett Score: ${data.analysis?.buffettScore || 'N/A'} (${data.analysis?.grade || 'N/A'})`);
      console.log(`   📈 P/E: ${data.financials.P_E_ratio}`);
      console.log(`   💵 ROE: ${data.financials.ROE}`);
      console.log(`   🏢 Market Cap: ${data.financials.market_cap}`);
      console.log(`   📝 Fuentes: ${data.sources?.length || 0}`);
      
      results.push({
        symbol,
        success: true,
        completeness: parseFloat(completeness),
        buffettScore: data.analysis?.buffettScore || 0,
        time: elapsed,
        grade: data.analysis?.grade || 'N/A'
      });
      
    } catch (error) {
      console.log(`❌ ERROR para ${symbol}: ${error.response?.data?.error || error.message}`);
      results.push({
        symbol,
        success: false,
        error: error.response?.data?.error || error.message
      });
    }
    
    // Esperar 1 segundo entre llamadas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Estadísticas finales
  console.log('\n\n📊 ESTADÍSTICAS FINALES:');
  console.log('====================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Exitosos: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(0)}%)`);
  console.log(`❌ Fallidos: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgCompleteness = successful.reduce((acc, r) => acc + r.completeness, 0) / successful.length;
    const avgTime = successful.reduce((acc, r) => acc + r.time, 0) / successful.length;
    
    console.log(`📈 Completitud promedio: ${avgCompleteness.toFixed(1)}%`);
    console.log(`⏱️  Tiempo promedio: ${avgTime.toFixed(0)}ms`);
    
    // Mostrar TOP 10 más completos
    console.log('\n🏆 TOP 10 - DATOS MÁS COMPLETOS:');
    successful
      .sort((a, b) => b.completeness - a.completeness)
      .slice(0, 10)
      .forEach((r, i) => {
        console.log(`   ${i+1}. ${r.symbol}: ${r.completeness}% - Score: ${r.buffettScore} (${r.grade})`);
      });
    
    // Mostrar BOTTOM 10 menos completos
    console.log('\n⚠️  BOTTOM 10 - DATOS MENOS COMPLETOS:');
    successful
      .sort((a, b) => a.completeness - b.completeness)
      .slice(0, 10)
      .forEach((r, i) => {
        console.log(`   ${i+1}. ${r.symbol}: ${r.completeness}% - Score: ${r.buffettScore} (${r.grade})`);
      });
    
    // Distribución por completitud
    console.log('\n📊 DISTRIBUCIÓN POR COMPLETITUD:');
    const ranges = {
      '100%': successful.filter(r => r.completeness === 100).length,
      '80-99%': successful.filter(r => r.completeness >= 80 && r.completeness < 100).length,
      '60-79%': successful.filter(r => r.completeness >= 60 && r.completeness < 80).length,
      '40-59%': successful.filter(r => r.completeness >= 40 && r.completeness < 60).length,
      '20-39%': successful.filter(r => r.completeness >= 20 && r.completeness < 40).length,
      '0-19%': successful.filter(r => r.completeness < 20).length
    };
    
    Object.entries(ranges).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} empresas (${(count/successful.length*100).toFixed(1)}%)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Errores encontrados:');
    failed.forEach(f => {
      console.log(`   - ${f.symbol}: ${f.error}`);
    });
  }
  
  console.log('\n✅ PRUEBA COMPLETADA');
  console.log(`⏱️  Tiempo total: ${Math.round((Date.now() - startTime) / 1000)} segundos`);
}

const startTime = Date.now();

// Ejecutar prueba
testPerplexityCorregido().catch(console.error);
