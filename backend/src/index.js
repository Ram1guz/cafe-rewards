import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import clienteRoutes from './routes/clienteRoutes.js';
import baristaRoutes from './routes/baristaRoutes.js';
import authRoutes from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

console.log('DATABASE_URL desde .env ->', process.env.DATABASE_URL);

// Middlewares
app.use(cors());
app.use(express.json());

const rutaFrontend = path.join(__dirname, '..', '..', 'frontend');

// Servir archivos estáticos
app.use(express.static(rutaFrontend));

// Rutas estáticas - Interfaces de usuario por rol
// GET / → Cliente (registro y consulta de puntos)
app.get('/', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'index.html'));
});

// GET /barista → Barista (mostrador con PIN y escaneo de QR)
// En producción el index actúa como pantalla única; en local usamos login.html
app.get('/barista', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'login.html'));
});

// En producción el index actúa como pantalla única para barista; en local
// queremos que /admin sirva el archivo local index.html (como en prod)
app.get('/admin', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'index.html'));
});

// GET /cliente → Cliente (tarjeta digital de fidelidad)
app.get('/cliente', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'cliente.html'));
});

// Rutas de la API
app.use('/clientes', clienteRoutes);
app.use('/baristas', baristaRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor listo y escuchando en el puerto ${PORT}`);
});
