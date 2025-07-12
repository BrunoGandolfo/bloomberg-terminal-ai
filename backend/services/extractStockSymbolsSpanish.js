// extractStockSymbolsSpanish.js
// Función optimizada para extraer símbolos bursátiles de consultas en español

const EMPRESA_A_SIMBOLO = {
    // Empresas tecnológicas más conocidas
    'apple': 'AAPL',
    'microsoft': 'MSFT',
    'google': 'GOOGL',
    'alphabet': 'GOOGL',
    'amazon': 'AMZN',
    'facebook': 'META',
    'meta': 'META',
    'tesla': 'TSLA',
    'nvidia': 'NVDA',
    'netflix': 'NFLX',
    
    // Empresas tradicionales populares
    'coca cola': 'KO',
    'cocacola': 'KO',
    'disney': 'DIS',
    'walmart': 'WMT',
    'boeing': 'BA',
    'nike': 'NKE',
    'starbucks': 'SBUX',
    'mcdonalds': 'MCD',
    'visa': 'V',
    'mastercard': 'MA',
    
    // Bancos importantes
    'jp morgan': 'JPM',
    'jpmorgan': 'JPM',
    'bank of america': 'BAC',
    'wells fargo': 'WFC',
    'goldman sachs': 'GS',
    'morgan stanley': 'MS',
    
    // Empresas latinas en NYSE/NASDAQ
    'mercadolibre': 'MELI',
    'mercado libre': 'MELI',
    'globant': 'GLOB',
    'grupo televisa': 'TV',
    'televisa': 'TV',
    'cemex': 'CX',
    'america movil': 'AMX',
    'américa móvil': 'AMX'
};

// Crear un Set con todos los nombres de empresas en mayúsculas para búsqueda rápida
const NOMBRES_EMPRESAS_MAYUSCULAS = new Set(
    Object.keys(EMPRESA_A_SIMBOLO).map(empresa => empresa.toUpperCase())
);

function extractStockSymbols(text) {
    if (!text || typeof text !== 'string') return [];
    
    const simbolosEncontrados = new Set();
    const textoNormalizado = text.toLowerCase();
    
    // 1. Primero buscar nombres de empresas conocidas
    Object.entries(EMPRESA_A_SIMBOLO).forEach(([empresa, simbolo]) => {
        const patron = new RegExp(`\\b${empresa}\\b`, 'i');
        if (patron.test(textoNormalizado)) {
            simbolosEncontrados.add(simbolo);
        }
    });
    
    // 2. Buscar símbolos explícitos (AAPL, MSFT, etc.)
    const palabras = text.split(/\s+/);
    
    palabras.forEach(palabra => {
        // Limpiar la palabra de signos de puntuación al inicio y final
        const palabraLimpia = palabra.replace(/^[¿¡"'(]|[?!.,;:"')]*$/g, '');
        
        // Verificar si es un símbolo válido (1-5 letras mayúsculas)
        if (/^[A-Z]{1,5}$/.test(palabraLimpia)) {
            // Palabras en mayúsculas que NO son símbolos
            const noSonSimbolos = new Set([
                'CEO', 'CFO', 'IPO', 'ETF', 'NYSE', 'NASDAQ', 'SP', 'USA',
                'EU', 'UE', 'FMI', 'BCE', 'FED', 'PIB', 'IPC', 'EEUU',
                'ONU', 'OEA', 'OTAN', 'UE', 'AI', 'IA', 'ML', 'API',
                'IT', 'DE', 'LA', 'EL', 'EN', 'Y', 'O', 'A', 'E', 'I'
            ]);
            
            // NO agregar si es el nombre de una empresa que ya procesamos
            if (!noSonSimbolos.has(palabraLimpia) && !NOMBRES_EMPRESAS_MAYUSCULAS.has(palabraLimpia)) {
                // Para símbolos de 1 letra, ser más estrictos
                if (palabraLimpia.length === 1) {
                    // Solo aceptar si está en contexto financiero claro
                    const patronesValidos = [
                        new RegExp(`\\bacciones?\\s+de\\s+${palabraLimpia}\\b`, 'i'),
                        new RegExp(`\\binvertir\\s+en\\s+${palabraLimpia}\\b`, 'i'),
                        new RegExp(`\\bcomprar\\s+${palabraLimpia}\\b`, 'i'),
                        new RegExp(`\\b${palabraLimpia}\\s+(stock|acciones?)\\b`, 'i')
                    ];
                    
                    if (patronesValidos.some(patron => patron.test(text))) {
                        simbolosEncontrados.add(palabraLimpia);
                    }
                } else {
                    // Símbolos de 2+ letras se agregan directamente
                    simbolosEncontrados.add(palabraLimpia);
                }
            }
        }
    });
    
    // 3. Detectar patrones del español financiero
    const patronesFinancieros = [
        /acciones?\s+de\s+([A-Z]{1,5})\b/gi,
        /invertir\s+en\s+([A-Z]{1,5})\b/gi,
        /comprar\s+([A-Z]{1,5})\b/gi,
        /vender\s+([A-Z]{1,5})\b/gi,
        /análisis\s+de\s+([A-Z]{1,5})\b/gi,
        /precio\s+de\s+([A-Z]{1,5})\b/gi,
        /cotización\s+de\s+([A-Z]{1,5})\b/gi
    ];
    
    patronesFinancieros.forEach(patron => {
        let match;
        while ((match = patron.exec(text)) !== null) {
            const simbolo = match[1].toUpperCase();
            const noSonSimbolos = new Set([
                'CEO', 'CFO', 'IPO', 'ETF', 'NYSE', 'NASDAQ', 'SP', 'USA',
                'EU', 'UE', 'FMI', 'BCE', 'FED', 'PIB', 'IPC', 'EEUU'
            ]);
            
            // NO agregar si es el nombre de una empresa
            if (!noSonSimbolos.has(simbolo) && !NOMBRES_EMPRESAS_MAYUSCULAS.has(simbolo)) {
                simbolosEncontrados.add(simbolo);
            }
        }
    });
    
    // 4. Manejar casos especiales
    // FAANG - Facebook (Meta), Apple, Amazon, Netflix, Google
    if (/\bFAANG\b/i.test(text)) {
        ['META', 'AAPL', 'AMZN', 'NFLX', 'GOOGL'].forEach(s => simbolosEncontrados.add(s));
    }
    
    // Convertir Set a Array y ordenar
    return Array.from(simbolosEncontrados).sort();
}

// Exportar la función
module.exports = extractStockSymbols;
