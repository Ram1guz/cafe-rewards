import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; // 💡 Importación manual segura
import clienteRoutes from './routes/clienteRoutes.js';
import baristaRoutes from './routes/baristaRoutes.js';
import authRoutes from './routes/authRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧠 💾 Forzamos a dotenv a buscar el .env una carpeta hacia atrás de 'src' de manera absoluta
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 3000;

console.log('DATABASE_URL desde .env ->', process.env.DATABASE_URL);

// Middlewares
app.use(cors());
app.use(express.json());

const rutaFrontend = path.join(__dirname, '..', '..', 'frontend');

// Servir archivos estáticos
app.use(express.static(rutaFrontend));

/// Rutas estáticas - Interfaces de usuario por rol
app.get('/', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'bienvenida.html')); // 👈 ¡Apunta aquí!
});

app.get('/barista', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'login.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'index.html'));
});

app.get('/cliente', (req, res) => {
  res.sendFile(path.join(rutaFrontend, 'cliente.html'));
});

// Rutas de la API
app.use('/clientes', clienteRoutes);
app.use('/baristas', baristaRoutes);
app.use('/api/auth', authRoutes);

// 🧪 RUTA DE PRUEBA DE CORREOS (localhost:3000/mail-test)
app.get('/mail-test', async (req, res) => {
  try {
    const { enviarCorreo } = await import('./services/correoService.js');
    const { obtenerPlantillaCumpleanos } = await import('./services/plantillasCorreo.js');
    const { default: prisma } = await import('./prisma.js');

    const cliente = await prisma.cliente.findFirst({
      where: { correo: 'ramiguz@gmail.com' }
    });

    if (!cliente) {
      return res.status(404).send("❌ No se encontró ningún cliente con el correo ramiguz@gmail.com en la base de datos. Regístralo primero desde /barista.");
    }

    const htmlPrueba = obtenerPlantillaCumpleanos(
      cliente.nombre, 
      "Un Café de Cortesía por tu Cumpleaños ☕", 
      "10/07/2026"
    );

    console.log(`⏳ Intentando enviar correo de prueba a ${cliente.correo}...`);
    const exito = await enviarCorreo(cliente.correo, "🎉 ¡Feliz Cumpleaños en Jacaqu Café! ☕", htmlPrueba);

    if (exito) {
      return res.send(`
        <div style="font-family: sans-serif; text-align: center; padding: 40px; color: #18405c;">
          <h2>✅ ¡Prueba de correo enviada con éxito!</h2>
          <p>Se despachó la plantilla de cumpleaños a: <strong>${cliente.correo}</strong></p>
          <p>Revisa tu bandeja de entrada (o la carpeta de Spam) y la consola de Ubuntu.</p>
        </div>
      `);
    } else {
      return res.status(500).send("❌ Nodemailer devolvió falso. Revisa los logs de la terminal para ver el error de SMTP.");
    }

  } catch (error) {
    console.error("❌ Error en el test de correo:", error);
    return res.status(500).send("❌ Error al procesar el envío de prueba: " + error.message);
  }
});

// 🎯 ESCUCHA EN TODA LA RED LOCAL (0.0.0.0) para que celular y tablet puedan conectarse
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor listo y escuchando en la RED LOCAL en el puerto ${PORT}`);
});