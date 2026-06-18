import './config/dotenv.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; 
import clienteRoutes from './routes/clienteRoutes.js';

// Calcular de forma exacta dónde está este archivo index.js
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

/* 💡 AJUSTE DE RUTA: 
   Apuntamos directamente a la raíz de la carpeta 'frontend' donde guardas tus HTML, JS y CSS.
   Si 'index.js' está en 'backend/src', salimos dos veces (.. / ..) y entramos a 'frontend'.
*/
const rutaFrontend = path.join(__dirname, '..', '..', 'frontend');

// Servir archivos estáticos (¡Crucial para los QR y estilos!)
app.use(express.static(rutaFrontend));

// Rutas de la API
app.use('/clientes', clienteRoutes);

// Ruta raíz que sirve la página principal del sistema
app.get('/', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'index.html'));
});

// 📌 NUEVA RUTA: Ruta explícita para que el cliente vea su tarjeta digital
// Cuando escaneen el QR (ej: dominio.com/cliente?id=1), les abrirá directamente el diseño azul
app.get('/cliente', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'cliente.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor listo y escuchando en el puerto ${PORT}`);
});