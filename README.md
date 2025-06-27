# Bloomberg Terminal AI - Réplica Profesional Gratuita

## 🚀 Descripción
Réplica funcional del Bloomberg Terminal con datos de mercado en tiempo real, construida con React y Node.js. Incluye cotizaciones en vivo, gráficos históricos de 5 años, screener avanzado y gestión de portfolio.

## 📸 Screenshots
(Aquí debes agregar imágenes del proyecto - por ahora pon placeholders)
- Vista principal con cotización y gráfico
- Screener con filtros por sector
- Portfolio con seguimiento de ganancias/pérdidas
- Ticker de índices globales

## ✨ Features Implementadas
- Cotizaciones en tiempo real de acciones, ETFs y bonos
- Gráficos históricos de 5 años
- Screener con filtro por sectores (Tecnología, Finanzas, Salud, etc.)
- Ticker de índices globales (S&P 500, Dow Jones, Nasdaq)
- Gestión de portfolio con persistencia en JSON
- Búsqueda universal de cualquier símbolo
- Interfaz idéntica a Bloomberg (fondo negro, texto naranja)
- Actualización automática cada 30 segundos

## 🛠️ Tecnologías
- Frontend: React 18, Recharts para gráficos
- Backend: Node.js, Express
- APIs: Yahoo Finance (datos gratuitos)
- Almacenamiento: Archivos JSON (sin base de datos)

## 📋 Requisitos
- Node.js v20+
- npm o yarn
- Puerto 3000 y 5000 libres

## 🔧 Instalación

### 1. Clonar repositorio
```bash
git clone https://github.com/BrunoGandolfo/bloomberg-terminal-ai.git
cd bloomberg-terminal-ai
```
### 2. Instalar dependencias del Backend
```bash
cd backend
npm install
```
### 3. Instalar dependencias del Frontend
```bash
cd ../frontend
npm install
```
### 4. Iniciar el proyecto
**Terminal 1 - Backend:**
```bash
cd backend
node server.js
```
**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
Abrir http://localhost:3000

## 🔑 APIs Utilizadas
- **Yahoo Finance** (sin API key, límites por IP)
- Próximamente: Claude AI, GPT-4, Gemini

## 📊 Estructura del Proyecto
```
bloomberg-terminal-ai/
├── backend/
│   ├── server.js          # Servidor Express
│   ├── services/          # Lógica de negocio
│   │   ├── marketService.js      # Cotizaciones
│   │   ├── screenerService.js    # Filtros y búsquedas
│   │   └── dataService.js        # Persistencia
│   └── data/              # Almacenamiento JSON
│       └── portfolio.json
├── frontend/
│   └── src/
│       └── App.js         # Aplicación React completa
└── README.md
```

## 🚧 Próximas Mejoras
- [ ] Integración con 3 IAs (Claude, GPT-4, Gemini)
- [ ] Indicadores técnicos reales (RSI, MACD, Bollinger)
- [ ] Análisis de documentos PDF
- [ ] Finanzas personales unificadas
- [ ] Alertas de precio vía email/SMS
- [ ] Dark/Light mode
- [ ] PWA para móvil
- [ ] Backtesting de estrategias

## ⚠️ Limitaciones
- Datos con 15 minutos de retraso (estándar gratuito)
- Sin datos de opciones
- Sin noticias en tiempo real
- Límites de API de Yahoo Finance

## 🤝 Contribuciones
Pull requests bienvenidos. Para cambios grandes, abrir un issue primero.

## 📝 Licencia
MIT

## 👨‍💻 Autor
Bruno Gandolfo 