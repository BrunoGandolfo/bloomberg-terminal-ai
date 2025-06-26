// Importar dependencias
const express = require('express');
const cors = require('cors');

// Crear la aplicación de Express
const app = express();
// Definir el puerto, usando una variable de entorno si está disponible
const port = process.env.PORT || 5000;

// Middlewares
// Habilitar CORS para permitir solicitudes de otros orígenes
app.use(cors());
// Middleware para parsear JSON
app.use(express.json());

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('Hello World from Bloomberg Terminal AI Backend!');
});

// Ruta de salud para verificar el estado del servidor
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Middleware para manejo de errores
// Este middleware se ejecutará si ninguna de las rutas anteriores coincide
app.use((req, res, next) => {
  const error = new Error('Not Found');
  error.status = 404;
  next(error);
});

// Middleware para manejar todos los errores pasados por next()
app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
}); 