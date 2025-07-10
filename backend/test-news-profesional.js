// test-news-profesional.js

const axios = require('axios');
require('dotenv').config();

// Importar las funciones de noticias
const { searchFinancialNews, getMarketContext } = require('./services/perplexityService');

async function testNewsProfesional() {
  console.log('\n📰 PROBANDO NOTICIAS FINANCIERAS PROFESIONALES EN ESPAÑOL');
  console.log('========================================================\n');
  
  // Queries relevantes para un analista financiero
  const testQueries = [
    // Contexto de mercado
    'mercados futuros índices S&P Nasdaq Europa',
    'Fed tasas interés política monetaria',
    'inflación datos macro Estados Unidos Europa',
    
    // Geopolítica y riesgos
    'geopolítica guerra Ucrania impacto mercados',
    'China Taiwan tensiones semiconductores',
    
    // Sectores y empresas clave
    'tecnología earnings Apple Microsoft Google',
    'bancos crisis financiera Credit Suisse',
    'petróleo OPEP precios energía',
    
    // Mercados específicos
    'mercados emergentes América Latina',
    'EUR USD forex divisas',
    'oro commodities refugio'
  ];
  
  const results = [];
  
  console.log(`📊 QUERIES A PROBAR: ${testQueries.length}\n`);
  
  for (let i = 0; i < testQueries.length; i++) {
    const query = testQueries[i];
    console.log(`\n🔍 [${i+1}/${testQueries.length}] Buscando: "${query}"`);
    console.log('─'.repeat(70));
    
    const start = Date.now();
    
    try {
      const news = await searchFinancialNews(query, 3);
      const elapsed = Date.now() - start;
      
      if (news && news.length > 0) {
        console.log(`✅ Encontradas ${news.length} noticias en ${elapsed}ms\n`);
        
        news.forEach((item, idx) => {
          console.log(`\n📄 Noticia ${idx + 1}:`);
          console.log(`   📌 Titular: ${item.headline}`);
          console.log(`   📝 Resumen: ${item.summary}`);
          console.log(`   🌐 Fuente: ${item.source}`);
          console.log(`   📊 Mercado: ${item.market}`);
          console.log(`   🏷️  Categoría: ${item.category}`);
          console.log(`   ⏰ Tiempo: ${item.timeAgo}`);
          console.log(`   ${item.sentiment === 'positive' ? '📈' : item.sentiment === 'negative' ? '📉' : '➡️'} Sentimiento: ${item.sentiment}`);
          console.log(`   ⚡ Impacto: ${item.impact}`);
          
          if (item.keyMetrics && item.keyMetrics.length > 0) {
            console.log(`   📊 Métricas clave:`);
            item.keyMetrics.forEach(metric => console.log(`      • ${metric}`));
          }
          
          if (item.affectedAssets && item.affectedAssets.length > 0) {
            console.log(`   💰 Activos afectados: ${item.affectedAssets.join(', ')}`);
          }
        });
        
        // Analizar distribución
        const markets = news.map(n => n.market);
        const categories = news.map(n => n.category);
        const impacts = news.map(n => n.impact);
        
        results.push({
          query,
          success: true,
          newsCount: news.length,
          time: elapsed,
          markets: [...new Set(markets)],
          categories: [...new Set(categories)],
          highImpact: impacts.filter(i => i === 'alto').length
        });
        
      } else {
        console.log('❌ No se encontraron noticias');
        results.push({
          query,
          success: false,
          error: 'Sin resultados'
        });
      }
      
    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      results.push({
        query,
        success: false,
        error: error.message
      });
    }
    
    // Esperar entre búsquedas
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  
  // Estadísticas finales
  console.log('\n\n📊 ESTADÍSTICAS FINALES:');
  console.log('====================================\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Búsquedas exitosas: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(0)}%)`);
  console.log(`❌ Búsquedas fallidas: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgTime = successful.reduce((acc, r) => acc + r.time, 0) / successful.length;
    const avgNews = successful.reduce((acc, r) => acc + r.newsCount, 0) / successful.length;
    const totalHighImpact = successful.reduce((acc, r) => acc + r.highImpact, 0);
    
    console.log(`\n📈 MÉTRICAS DE CALIDAD:`);
    console.log(`⏱️  Tiempo promedio: ${avgTime.toFixed(0)}ms`);
    console.log(`📰 Noticias promedio por búsqueda: ${avgNews.toFixed(1)}`);
    console.log(`⚡ Noticias de alto impacto: ${totalHighImpact}`);
    
    // Análisis de cobertura
    const allMarkets = successful.flatMap(r => r.markets);
    const allCategories = successful.flatMap(r => r.categories);
    
    console.log(`\n🌍 COBERTURA DE MERCADOS:`);
    const marketCounts = {};
    allMarkets.forEach(m => marketCounts[m] = (marketCounts[m] || 0) + 1);
    Object.entries(marketCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([market, count]) => {
        console.log(`   • ${market}: ${count} menciones`);
      });
    
    console.log(`\n📁 CATEGORÍAS CUBIERTAS:`);
    const categoryCounts = {};
    allCategories.forEach(c => categoryCounts[c] = (categoryCounts[c] || 0) + 1);
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`   • ${category}: ${count} noticias`);
      });
  }
  
  console.log('\n✅ PRUEBA COMPLETADA');
}

// Probar también la función de contexto de mercado
async function testMarketContext() {
  console.log('\n\n🌐 PROBANDO CONTEXTO GENERAL DE MERCADO');
  console.log('========================================\n');
  
  try {
    const context = await getMarketContext();
    
    console.log(`✅ Contexto obtenido: ${context.length} noticias principales\n`);
    
    context.forEach((item, idx) => {
      console.log(`${idx + 1}. [${item.impact.toUpperCase()}] ${item.headline}`);
      console.log(`   ${item.market} | ${item.category} | ${item.sentiment}`);
      console.log('');
    });
    
  } catch (error) {
    console.log(`❌ Error obteniendo contexto: ${error.message}`);
  }
}

// Ejecutar todas las pruebas
async function runAllTests() {
  await testNewsProfesional();
  await testMarketContext();
}

runAllTests().catch(console.error);
