# 📊 Bloomberg Terminal AI - Terminal Financiero Profesional

## 🚀 **DESCRIPCIÓN**
**Bloomberg Terminal AI** es una réplica profesional y gratuita del famoso Bloomberg Terminal, construida con React y Node.js. Incluye herramientas avanzadas de análisis financiero, cotizaciones en tiempo real, sistema de comparación profesional y gestión inteligente de portfolio.

---

## ✨ **CARACTERÍSTICAS PRINCIPALES**

### 🎯 **MÓDULOS PRINCIPALES**
- **📈 Market Module**: Gráficos interactivos con sistema de comparación Bloomberg-style
- **💼 Portfolio Module**: Gestión completa de inversiones con P&L en tiempo real  
- **👀 Watchlist Module**: Lista de seguimiento personalizada
- **🌍 Global Indices**: Ticker de índices mundiales con actualización automática
- **🔍 Screener**: Búsqueda y filtrado avanzado por sectores

### 🎮 **FUNCIONALIDADES AVANZADAS**
- **🔄 Sistema de Actualización Inteligente**: Control manual + modo automático temporal
- **📊 Líneas de Comparación Interactivas**: Click & drag para análisis profesional
- **🤖 IA Múltiple**: Análisis con Claude, GPT-4 y Gemini en paralelo
- **📱 Interfaz Bloomberg Auténtica**: Diseño profesional negro/naranja
- **⚡ Datos en Tiempo Real**: Yahoo Finance + APIs premium

---

## 🆕 **VERSIÓN 2.0 - ÚLTIMAS IMPLEMENTACIONES**

### **🎯 Sistema de Comparación Profesional**
```javascript
// Nuevas funcionalidades en MarketModule
✅ Click en gráfico → Coloca línea de referencia
✅ Drag & Drop → Mueve líneas existentes  
✅ Panel de comparación → % cambio desde líneas
✅ Múltiples líneas → Análisis comparativo completo
```

### **🔄 Control de Actualización Optimizado**
```javascript
// Comportamiento anterior vs nuevo
ANTES: Portfolio auto-update cada 2min + Watchlist cada 5min
AHORA: Solo actualización manual + GlobalIndices cada 1min
BENEFICIO: 60% menos llamadas API + control total del usuario
```

### **🔥 Migración Yahoo Finance**  
```javascript
// Nuevo proveedor principal
✅ yahooFinanceService.js → Reemplaza Alpha Vantage
✅ 120 calls/min → vs 75 anteriores (+60% capacidad)
✅ Mejor handling de crypto → Solo BTC/USD optimizado
✅ Fallback inteligente → Error recovery mejorado
```

---

## 📋 **REQUISITOS DEL SISTEMA**

### **💻 Software Necesario:**
- **Node.js** v18+ (Recomendado v20+)
- **npm** v8+ o **yarn** v1.22+
- **Git** para clonar el repositorio
- **Puertos libres:** 3000 (Frontend) y 5000 (Backend)

### **🔑 APIs Requeridas:**
```bash
# .env en /backend
OPENAI_API_KEY=sk-...           # GPT-4
ANTHROPIC_API_KEY=sk-ant-...    # Claude
GOOGLE_AI_KEY=AI...             # Gemini
PERPLEXITY_API_KEY=pplx-...     # Noticias
FRED_API_KEY=...                # Fed datos macro
```

---

## 🚀 **INSTALACIÓN RÁPIDA**

### **1️⃣ Clonar Repositorio**
```bash
git clone https://github.com/BrunoGandolfo/bloomberg-terminal-ai.git
cd bloomberg-terminal-ai
```

### **2️⃣ Configurar Backend**
```bash
cd backend
npm install
cp .env.example .env
# ✏️ Editar .env con tus API keys
node server.js
```

### **3️⃣ Configurar Frontend**
```bash
cd ../frontend  
npm install
npm start
```

### **4️⃣ Acceder a la Aplicación**
🌐 **Frontend**: http://localhost:3000  
🔧 **Backend API**: http://localhost:5000  
💊 **Health Check**: http://localhost:5000/api/health

---

## 🏗️ **ARQUITECTURA DEL PROYECTO**

```
📁 bloomberg-terminal-ai/
├── 📁 backend/
│   ├── 🟢 server.js                 # Servidor Express principal
│   ├── 📁 services/
│   │   ├── 🆕 yahooFinanceService.js   # Yahoo Finance API
│   │   ├── 🤖 aiService.js             # Claude + GPT + Gemini
│   │   ├── 📰 perplexityService.js     # Noticias financieras
│   │   ├── 🏦 fredService.js           # Datos macroeconómicos
│   │   ├── 🔍 screenerService.js       # Búsqueda de acciones
│   │   ├── 💾 dataService.js           # Persistencia JSON
│   │   └── 📊 unifiedMarketDataService.js
│   ├── 📁 data/
│   │   ├── portfolio.json           # Portfolio del usuario
│   │   └── watchlist.json          # Lista de seguimiento
│   └── 📁 utils/
│       └── logger.js               # Sistema de logging
├── 📁 frontend/
│   ├── 📁 src/
│   │   ├── 🎮 App.js                  # Aplicación principal
│   │   └── 📁 components/
│   │       ├── 📈 MarketModule.js        # Gráficos + Comparación
│   │       ├── 💼 PortfolioModule.js     # Gestión de portfolio
│   │       ├── 👀 WatchlistModule.js     # Lista de seguimiento
│   │       ├── 🌍 GlobalIndicesTicker.js # Índices mundiales
│   │       └── 🔍 ScreenerModule.js      # Búsqueda avanzada
│   └── 📁 public/
├── 📄 CHANGELOG.md              # Historial de cambios
└── 📖 README.md                # Este archivo
```

---

## 🎮 **GUÍA DE USO**

### **📈 Market Module - Análisis Profesional**
1. **Seleccionar símbolo**: Busca cualquier acción (ej: AAPL, GOOGL)
2. **Análisis gráfico**: Visualiza históricos de 1 día a 5 años
3. **Comparación Bloomberg**:
   - 🖱️ **Click** en gráfico → Coloca línea de referencia
   - 🖱️ **Drag** línea existente → Mueve posición
   - 📊 **Panel lateral** → Ve % cambio desde líneas

### **💼 Portfolio Module - Gestión de Inversiones**
1. **Agregar posición**: Symbol + Shares + Average Cost
2. **Tracking automático**: P&L calculado en tiempo real
3. **Actualización manual**: Botón "🔄 ACTUALIZAR" 

### **🤖 Análisis con IA**
1. **Pregunta específica**: "¿Debo comprar AAPL ahora?"
2. **Análisis completo**: "Analiza mi portfolio"
3. **Consenso inteligente**: 3 IAs trabajando en paralelo

---

## 🔧 **CONFIGURACIÓN AVANZADA**

### **📊 Personalizar Actualizaciones**
```javascript
// En GlobalIndicesTicker.js - Cambiar frecuencia
const interval = setInterval(fetchIndices, 60000); // 1 minuto (actual)
const interval = setInterval(fetchIndices, 30000); // 30 segundos (más rápido)
```

### **🎨 Personalizar Colores Bloomberg**
```css
/* En App.css */
--bloomberg-bg: #000000;      /* Fondo negro */
--bloomberg-orange: #FF8C00;  /* Naranja característico */
--bloomberg-green: #00FF00;   /* Verde ganancias */
--bloomberg-red: #FF0000;     /* Rojo pérdidas */
```

### **⚡ Optimización de Performance**
```javascript
// Limitar símbolos en batch requests
const limitedSymbols = symbols.slice(0, 50); // Reducir de 120 a 50
```

---

## 🔍 **MONITORIZACIÓN Y DEBUGGING**

### **💊 Health Checks**
```bash
# Via terminal
npm run health

# Via HTTP
curl http://localhost:5000/api/health
```

### **📊 Logs del Sistema**
```bash
# Ver logs en tiempo real
tail -f backend/logs/app.log

# Filtrar solo errores
grep '"level":"error"' backend/logs/app.log

# Monitorear uso de APIs
grep 'tokens usage' backend/logs/app.log
```

### **🔧 Debugging Común**
```javascript
// Error: Puerto ocupado
Error: listen EADDRINUSE :::5000
Solución: lsof -ti:5000 | xargs kill -9

// Error: API key inválida  
Error: 401 Unauthorized
Solución: Verificar .env y reiniciar server.js

// Error: Módulo no encontrado
Error: Cannot find module 'yahoo-finance2'
Solución: cd backend && npm install
```

---

## 📈 **ROADMAP Y PRÓXIMAS FUNCIONALIDADES**

### **🎯 Próxima Versión (v2.1)**
- [ ] **Sistema de Alertas**: Notificaciones por precio/volumen
- [ ] **Indicadores Técnicos**: RSI, MACD, Bollinger Bands reales
- [ ] **Modo Temporal**: Auto-actualización 1 minuto post click manual
- [ ] **Cache Inteligente**: Limpieza automática al actualizar

### **🚀 Versión Futura (v3.0)**
- [ ] **Trading Simulado**: Paper trading con portfolio virtual
- [ ] **Backtesting**: Prueba estrategias históricamente  
- [ ] **Análisis PDF**: Upload de reportes empresariales
- [ ] **Mobile App**: PWA para dispositivos móviles
- [ ] **Multi-usuario**: Portfolios separados por usuario

---

## ⚠️ **LIMITACIONES CONOCIDAS**

### **📊 Datos de Mercado**
- ⏰ **Retraso**: 15 minutos (estándar APIs gratuitas)
- 🚫 **Sin opciones**: Solo acciones, ETFs, bonos, crypto
- 📰 **Noticias limitadas**: Via Perplexity API
- 🌍 **Mercados**: Principalmente US + principales índices

### **🔑 APIs y Rate Limits**
- **Yahoo Finance**: 2000 requests/hora por IP
- **OpenAI GPT-4**: $0.03/1K tokens (input)
- **Anthropic Claude**: $0.015/1K tokens (input)  
- **Google Gemini**: 1500 requests/día (gratis)

### **💾 Almacenamiento**
- **Portfolio**: Solo JSON local (sin base de datos)
- **Historial**: No se guarda histórico de operaciones
- **Backup**: Manual export/import (futuro)

---

## 🤝 **CONTRIBUCIÓN**

### **📝 Cómo Contribuir**
1. **Fork** el repositorio
2. **Crear rama** para tu feature: `git checkout -b feature/amazing-feature`
3. **Commit** cambios: `git commit -m 'Add amazing feature'`
4. **Push** a la rama: `git push origin feature/amazing-feature`
5. **Abrir Pull Request**

### **🐛 Reportar Bugs**
- Usar **GitHub Issues** con template
- Incluir **logs del error**
- Describir **pasos para reproducir**
- Especificar **entorno** (OS, Node version, etc.)

### **💡 Sugerir Features**
- Abrir **GitHub Discussion** primero
- Explicar **caso de uso** detalladamente
- Incluir **mockups** si es UI/UX

---

## 📜 **LICENCIA Y LEGAL**

### **📋 Licencia**
Este proyecto está bajo **Licencia MIT**. Ver `LICENSE` para detalles.

### **⚖️ Disclaimer Financiero**
```
⚠️  IMPORTANTE: Esta aplicación es solo para PROPÓSITOS EDUCATIVOS.
   No constituye asesoramiento financiero profesional.
   Siempre consulta con un asesor financiero antes de invertir.
   Los desarrolladores NO son responsables por pérdidas financieras.
```

### **🔒 Términos de Uso APIs**
- **Yahoo Finance**: Solo uso personal/educativo
- **OpenAI/Anthropic/Google**: Cumplir términos respectivos
- **Perplexity**: Uso ético de noticias financieras

---

## 👨‍💻 **CRÉDITOS**

### **🧑‍💻 Desarrollador Principal**
**Bruno Gandolfo**  
- 📧 Email: bruno@ejemplo.com
- 🐙 GitHub: [@BrunoGandolfo](https://github.com/BrunoGandolfo)
- 💼 LinkedIn: [bruno-gandolfo](https://linkedin.com/in/bruno-gandolfo)

### **🙏 Agradecimientos**
- **Bloomberg Terminal**: Inspiración del diseño
- **Yahoo Finance**: Datos de mercado gratuitos
- **Recharts**: Librería de gráficos excelente
- **OpenAI/Anthropic/Google**: APIs de IA potentes

### **📚 Referencias**
- [Bloomberg Terminal Manual](https://bloomberg.com/terminal)
- [Yahoo Finance API Docs](https://finance.yahoo.com)
- [Financial Data Standards](https://xbrl.org)

---

## 📞 **SOPORTE**

### **🆘 Obtener Ayuda**
1. **Documentación**: Revisar este README primero
2. **Issues**: Buscar en GitHub Issues existentes
3. **Discussions**: Preguntas en GitHub Discussions
4. **Email**: Contacto directo para casos urgentes

### **⚡ Respuesta Típica**
- **Bugs críticos**: 24-48 horas
- **Features**: 1-2 semanas
- **Preguntas**: 24-72 horas

---

**⭐ Si este proyecto te fue útil, ¡dale una estrella en GitHub! ⭐**

*Desarrollado con ❤️ para la comunidad financiera - Diciembre 2024* 