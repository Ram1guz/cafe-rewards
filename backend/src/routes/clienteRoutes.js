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

import { 
  obtenerPanelCliente, 
  guardarConfiguracionAdmin
} from '../controllers/campanaController.js';

import prisma from '../prisma.js';

const router = Router();

// --- 1. CONFIGURACIÓN DEL ADMIN (Rutas fijas van ARRIBA) ---

// GUARDAR configuración del Admin (POST https://3.133.218.54/clientes/config-admin)
router.post('/config-admin', guardarConfiguracionAdmin);

// LEER configuración del Admin (GET https://3.133.218.54/clientes/config-admin)
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


// --- 2. RUTAS DE PRUEBA Y GENERALES DE CLIENTES ---

// Obtener todos los clientes
router.get('/', obtenerClientes);

// Registrar un nuevo cliente
router.post('/', registrarCliente);


// --- 3. PRUEBA DE FUEGO AUTOMATIZADA DE CORREO ---
router.get('/test-email', async (req, res) => {
  try {
    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    }) || {
      cumple_regalo_desc: "¡1 Capuchino Grande + 1 Factura de cortesía! ☕🎉",
      cumple_plazo_dias: 7
    };

    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + parseInt(config.cumple_plazo_dias, 10));
    
    const fechaVencimientoTexto = limite.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const htmlVisual = obtenerPlantillaCumpleanos(
      "Ramiro Guz", 
      config.cumple_regalo_desc, 
      fechaVencimientoTexto
    );
    
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


// --- 4. RUTAS DINÁMICAS POR ID (Van ABAJO del todo) ---

// Actualizar datos de un cliente
router.put('/:id', actualizarCliente);

// Sumar un punto al cliente
router.patch('/:id/sumar-puntos', sumarPuntos);

// Canjear un premio / recompensa
router.post('/:id/recompensa', pedirRecompensa);

// Panel de fidelidad del Barista
router.get('/:id/panel-fidelidad', obtenerPanelCliente);

export default router;