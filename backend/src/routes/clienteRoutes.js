import { enviarCorreo } from '../services/correoService.js';
import { obtenerPlantillaCumpleanos } from '../services/plantillasCorreo.js';

import { Router } from 'express';
import { 
  obtenerClientes, 
  registrarCliente, 
  actualizarCliente, 
  sumarPuntos, 
  pedirRecompensa 
} from '../controllers/clienteController.js';

// Importamos las funciones desde campanaController.js (Unificadas) ☕
import { 
  obtenerPanelCliente, 
  guardarConfiguracionAdmin, 
  obtenerConfiguracionAdmin
} from '../controllers/campanaController.js';

import prisma from '../prisma.js'; // Necesario para la lectura rápida de la configuración

const router = Router();

// --- RUTAS DE CLIENTES ---

// 1. Obtener todos los clientes (GET http://localhost:3000/clientes)
router.get('/', obtenerClientes);

// 2. Registrar un nuevo cliente (POST http://localhost:3000/clientes)
router.post('/', registrarCliente);

// 3. Actualizar datos de un cliente existente (PUT http://localhost:3000/clientes/:id)
router.put('/:id', actualizarCliente);

// 4. Sumar un punto al cliente (PATCH http://localhost:3000/clientes/:id/sumar-puntos)
router.patch('/:id/sumar-puntos', sumarPuntos);

// 5. Canjear un premio / recompensa (POST http://localhost:3000/clientes/:id/recompensa)
router.post('/:id/recompensa', pedirRecompensa);


// --- RUTAS DE FIDELIZACIÓN Y CAMPAÑAS ---

// 6. Panel de fidelidad del Barista (GET http://localhost:3000/clientes/:id/panel-fidelidad)
router.get('/:id/panel-fidelidad', obtenerPanelCliente);

// 7. GUARDAR configuración del Admin (POST http://localhost:3000/clientes/config-admin)
router.post('/config-admin', guardarConfiguracionAdmin);

// 8. LEER configuración del Admin (GET http://localhost:3000/clientes/config-admin)
router.get('/config-admin', async (req, res) => {
  try {
    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    });
    res.json(config);
  } catch (error) {
    console.error("❌ Error al obtener la configuración para el administrador:", error);
    res.status(500).json({ error: "No se pudo cargar la configuración actual." });
  }
});

// 🔥 RUTA DE PRUEBA DE FUEGO AUTOMATIZADA (GET http://localhost:3000/clientes/test-email)
router.get('/test-email', async (req, res) => {
  try {
    // 1. Jalamos la configuración real que guardó el administrador con Prisma
    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    }) || {
      cumple_regalo_desc: "¡1 Capuchino Grande + 1 Factura de cortesía! ☕🎉",
      cumple_plazo_dias: 7
    };

    // 2. 🧮 Calculamos la fecha límite real basada en tus días configurados
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + parseInt(config.cumple_plazo_dias, 10));
    
    const fechaVencimientoTexto = limite.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // 3. Generamos la plantilla pasándole los 3 DATOS REQUERIDOS (¡Incluyendo la fecha!)
    const htmlVisual = obtenerPlantillaCumpleanos(
      "Ramiro Guz", 
      config.cumple_regalo_desc, 
      fechaVencimientoTexto
    );
    
    // 4. Disparamos el correo a tu dirección
    const enviado = await enviarCorreo(
      "ramiguz@gmail.com", 
      `🎉 ¡Feliz Cumpleaños de parte de Café Rewards! (Válido hasta el ${fechaVencimientoTexto})`, 
      htmlVisual
    );

    if (enviado) {
      res.send(`
        <div style="font-family: Arial, sans-serif; text-align: center; padding: 40px; color: #18405c;">
          <h1>🚀 ¡Prueba de fuego exitosa!</h1>
          <p style="font-size: 18px; color: #333;">El correo fue enviado con éxito usando los parámetros del administrador.</p>
          <p style="font-weight: bold; color: #cc0000;">🎁 Premio: ${config.cumple_regalo_desc}</p>
          <p style="font-weight: bold; color: #cc0000;">⏳ Vence el: ${fechaVencimientoTexto} (${config.cumple_plazo_dias} días de plazo)</p>
          <p>Revisa tu bandeja de entrada en gmail.</p>
        </div>
      `);
    } else {
      res.status(500).send("<h1>❌ El servicio falló al enviar el correo. Revisa la terminal de Ubuntu.</h1>");
    }
  } catch (error) {
    res.status(500).send(`<h1>❌ Error crítico en la ruta: ${error.message}</h1>`);
  }
});

export default router;