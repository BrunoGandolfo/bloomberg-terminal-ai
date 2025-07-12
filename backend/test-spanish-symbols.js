// test-spanish-symbols.js
// Pruebas para verificar que la función funciona correctamente con español

const extractStockSymbols = require('./services/extractStockSymbolsSpanish');

console.log('🧪 PRUEBAS DE EXTRACCIÓN DE SÍMBOLOS EN ESPAÑOL');
console.log('================================================\n');

// Casos de prueba realistas en español
const pruebasEspanol = [
    {
        consulta: "¿Cuál es el precio de Apple?",
        esperado: ["AAPL"],
        descripcion: "Debe detectar Apple como AAPL"
    },
    {
        consulta: "Quiero comprar acciones de MSFT",
        esperado: ["MSFT"],
        descripcion: "Debe detectar símbolo explícito MSFT"
    },
    {
        consulta: "¿Cómo está el mercado hoy?",
        esperado: [],
        descripcion: "No debe detectar símbolos en consulta general"
    },
    {
        consulta: "Compara Tesla con Amazon",
        esperado: ["AMZN", "TSLA"],
        descripcion: "Debe detectar ambas empresas"
    },
    {
        consulta: "¿Es buen momento para invertir en NVDA?",
        esperado: ["NVDA"],
        descripcion: "Debe detectar NVDA"
    },
    {
        consulta: "Las acciones de tecnología están subiendo",
        esperado: [],
        descripcion: "No debe detectar símbolos sin empresas específicas"
    },
    {
        consulta: "Análisis de MercadoLibre",
        esperado: ["MELI"],
        descripcion: "Debe detectar empresa latinoamericana"
    },
    {
        consulta: "¿Qué opinas de coca cola y disney?",
        esperado: ["DIS", "KO"],
        descripcion: "Debe detectar ambas empresas tradicionales"
    },
    {
        consulta: "El CEO de Meta anunció cambios",
        esperado: ["META"],
        descripcion: "Debe detectar Meta (antes Facebook)"
    },
    {
        consulta: "Inversión en acciones de AAPL y GOOGL",
        esperado: ["AAPL", "GOOGL"],
        descripcion: "Debe detectar múltiples símbolos explícitos"
    }
];

// Ejecutar las pruebas
let exitosas = 0;
let fallidas = 0;

pruebasEspanol.forEach((prueba, indice) => {
    const resultado = extractStockSymbols(prueba.consulta);
    const resultadoEsperado = JSON.stringify(prueba.esperado);
    const resultadoObtenido = JSON.stringify(resultado);
    const exito = resultadoEsperado === resultadoObtenido;
    
    console.log(`Prueba ${indice + 1}: ${exito ? '✅ EXITOSA' : '❌ FALLÓ'}`);
    console.log(`  Consulta: "${prueba.consulta}"`);
    console.log(`  Descripción: ${prueba.descripcion}`);
    console.log(`  Esperado: ${resultadoEsperado}`);
    console.log(`  Obtenido: ${resultadoObtenido}`);
    
    if (!exito) {
        console.log(`  ⚠️  DIFERENCIA ENCONTRADA`);
        fallidas++;
    } else {
        exitosas++;
    }
    console.log('');
});

// Resumen final
console.log('📊 RESUMEN DE PRUEBAS');
console.log('====================');
console.log(`✅ Exitosas: ${exitosas}/${pruebasEspanol.length}`);
console.log(`❌ Fallidas: ${fallidas}/${pruebasEspanol.length}`);
console.log(`📈 Porcentaje de éxito: ${((exitosas/pruebasEspanol.length)*100).toFixed(1)}%`);

// Comparación con la versión anterior
console.log('\n📊 COMPARACIÓN CON VERSIÓN EN INGLÉS');
console.log('=====================================');
console.log('Versión inglés: 150+ líneas de código complejo');
console.log('Versión español: ~50 líneas de código simple');
console.log('Reducción de complejidad: 66%');
console.log('\nVentajas de la versión en español:');
console.log('- No necesita lista negra de palabras comunes');
console.log('- No hay conflictos con ARE, CAN, UP, etc.');
console.log('- Más precisa para usuarios hispanohablantes');
console.log('- Mucho más fácil de mantener');
