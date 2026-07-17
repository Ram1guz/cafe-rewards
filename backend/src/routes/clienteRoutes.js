import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// ==========================================
// ⚙️ CONFIGURACIÓN ADMINISTRATIVA (CAMPAÑA)
// ==========================================

// Carga los datos en el Panel del Administrador
router.get('/config-admin', async (req, res) => {
  try {
    // 1. Buscamos la última configuración de la pizarra y del cumple
    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    });

    // 2. Buscamos el producto estrella con ID 1 para el canje de fidelidad
    const producto = await prisma.producto.findUnique({
      where: { id: 1 }
    });

    // Unificamos toda la información en un solo objeto de respuesta para el frontend
    res.json({
      promo_del_dia: config?.promo_del_dia || '¡Bienvenidos a Café Rewards!',
      regalo_cumpleanos: config?.cumple_regalo_desc || '¡Un café de cortesía!',
      cumple_plazo_dias: config?.cumple_plazo_dias ?? 7,
      producto_nombre: producto?.nombre || 'Café de Regalo',
      puntos_necesarios: producto?.puntos_necesarios ?? 10
    });

  } catch (error) {
    console.error('❌ Error al obtener configuración admin:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar configuración.' });
  }
});

// Guarda la configuración tanto en la campaña como en el producto de fidelidad
router.post('/config-admin', async (req, res) => {
  try {
    const { 
      promo_del_dia, 
      regalo_cumpleanos, 
      cumple_plazo_dias, 
      producto_nombre, 
      puntos_necesarios 
    } = req.body;

    // 1. Creamos la nueva configuración del sistema (Pizarra y cumpleaños)
    const nuevaConfig = await prisma.configuracionSistema.create({
      data: {
        promo_del_dia: promo_del_dia?.trim() || 'Sin promociones por hoy.',
        cumple_regalo_desc: regalo_cumpleanos?.trim() || '¡Un café de cortesía!',
        cumple_puntos_bono: 0, // No se regalan puntos en cumpleaños, es en especie
        cumple_plazo_dias: parseInt(cumple_plazo_dias, 10) || 7
      }
    });

    // 2. Actualizamos o creamos el producto ID 1 con sus nuevos puntos y nombre (Upsert)
    const puntosValidos = parseInt(puntos_necesarios, 10) || 10;
    const nombreValido = producto_nombre?.trim() || 'Café de Regalo';

    await prisma.producto.upsert({
      where: { id: 1 },
      update: {
        nombre: nombreValido,
        puntos_necesarios: puntosValidos
      },
      create: {
        id: 1,
        nombre: nombreValido,
        puntos_necesarios: puntosValidos
      }
    });

    // Enviamos una respuesta combinada exitosa
    res.json({
      ...nuevaConfig,
      producto_nombre: nombreValido,
      puntos_necesarios: puntosValidos
    });

  } catch (error) {
    console.error('❌ Error al guardar configuración admin:', error);
    res.status(500).json({ error: 'Error interno del servidor al guardar configuración.' });
  }
});

// ==========================================
// 👥 GESTIÓN DE CLIENTES
// ==========================================

// Obtener listado de clientes (con o sin query de búsqueda)
router.get('/', async (req, res) => {
  try {
    const { q } = req.query;
    const idBuscar = q ? parseInt(q, 10) : NaN;
    const esNumero = !Number.isNaN(idBuscar);

    const clientes = await prisma.cliente.findMany({
      where: q ? {
        OR: [
          ...(esNumero ? [{ id: idBuscar }] : []),
          { nombre: { contains: q, mode: 'insensitive' } },
          { apellido: { contains: q, mode: 'insensitive' } },
          { celular: { contains: q } }
        ]
      } : undefined,
      orderBy: { id: 'asc' }
    });

    res.json(clientes);
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar clientes.' });
  }
});

// Obtener un cliente específico por su ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const cliente = await prisma.cliente.findUnique({
      where: { id }
    });

    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

    res.json(cliente);
  } catch (error) {
    console.error('❌ Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar cliente.' });
  }
});

// Crear un cliente nuevo
router.post('/', async (req, res) => {
  try {
    const { nombre, apellido, celular, correo, fecha_nacimiento, acepta_marketing } = req.body;

    const clienteExistente = await prisma.cliente.findUnique({
      where: { celular: celular?.toString().trim() }
    });

    if (clienteExistente) {
      return res.status(409).json(clienteExistente);
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre: nombre?.trim(),
        apellido: apellido?.trim() || '',
        celular: celular?.toString().trim(),
        correo: correo?.trim() || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        acepta_marketing: acepta_marketing === true || acepta_marketing === 'true'
      }
    });

    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear cliente.' });
  }
});

// Actualizar datos de un cliente
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const { nombre, apellido, celular, correo, fecha_nacimiento, acepta_marketing } = req.body;

    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: nombre?.trim(),
        apellido: apellido?.trim(),
        celular: celular?.toString().trim(),
        correo: correo?.trim() || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        acepta_marketing: acepta_marketing === true || acepta_marketing === 'true'
      }
    });

    res.json(clienteActualizado);
  } catch (error) {
    console.error('❌ Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar cliente.' });
  }
});

// Eliminar un cliente de la base de datos
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await prisma.cliente.delete({
      where: { id }
    });

    res.json({ mensaje: 'Cliente eliminado correctamente.' });
  } catch (error) {
    console.error('❌ Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar cliente.' });
  }
});

// ==========================================
// ⭐ ACUMULACIÓN Y CANJES DE PUNTOS
// ==========================================

// Sumar puntos a un cliente y registrar auditoría de transacción
router.patch('/:id/sumar-puntos', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { usuarioId } = req.body; // Recibimos el ID del barista real desde el frontend
    
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    // 1. Incrementamos las estrellas del cliente
    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: { puntos: { increment: 1 } }
    });

    // 2. Registramos la auditoría de acumulación
    await prisma.transaccion.create({
      data: {
        clienteId: id,
        sucursalId: 1, // MVP estático en 1
        usuarioId: usuarioId ? parseInt(usuarioId, 10) : 1, // Barista real
        puntos_ganados: 1,
        puntos_redimidos: 0
      }
    });

    res.json({ puntosTotales: clienteActualizado.puntos });
  } catch (error) {
    console.error('❌ Error al sumar puntos:', error);
    res.status(500).json({ error: 'Error interno del servidor al sumar puntos.' });
  }
});

// Redimir recompensa (canjear premio) con validación y resta del saldo
router.post('/:id/recompensa', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { productoId, usuarioId } = req.body; // Recibimos ambos datos dinámicos
    
    if (Number.isNaN(id) || Number.isNaN(parseInt(productoId, 10))) {
      return res.status(400).json({ error: 'ID inválido.' });
    }

    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

    const producto = await prisma.producto.findUnique({ where: { id: parseInt(productoId, 10) } });
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });

    if (cliente.puntos < producto.puntos_necesarios) {
      return res.status(400).json({ error: 'Puntos insuficientes.' });
    }

    // Restamos del cliente de forma exacta usando el valor "puntos_necesarios" del producto
    const clienteActualizado = await prisma.cliente.update({
      where: { id },
      data: { puntos: cliente.puntos - producto.puntos_necesarios }
    });

    // Guardamos la transacción con el ID real del barista
    await prisma.transaccion.create({
      data: {
        clienteId: id,
        sucursalId: 1,
        usuarioId: usuarioId ? parseInt(usuarioId, 10) : 1, // Vinculado de verdad
        puntos_redimidos: producto.puntos_necesarios,
        puntos_ganados: 0
      }
    });

    res.json({ mensaje: 'Recompensa procesada correctamente.', puntosRestantes: clienteActualizado.puntos });
  } catch (error) {
    console.error('❌ Error al procesar recompensa:', error);
    res.status(500).json({ error: 'Error interno del servidor al procesar recompensa.' });
  }
});

// Obtener los datos del panel de fidelidad de un cliente (y procesar cumpleaños)
router.get('/:id/panel-fidelidad', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    });

    // 🎂 --- CÁLCULO REAL DE CUMPLEAÑOS ---
    let esHoySuCumple = false;
    let mensajeCumple = null;

    if (cliente.fecha_nacimiento) {
      const hoy = new Date();
      const cumple = new Date(cliente.fecha_nacimiento);
      
      // Comparamos el día y el mes
      if (hoy.getDate() === cumple.getUTCDate() && (hoy.getMonth() + 1) === (cumple.getUTCMonth() + 1)) {
        esHoySuCumple = true;
        mensajeCumple = `🎉 ¡Felicidades, ${cliente.nombre}! ${config?.cumple_regalo_desc || '¡Un café de cortesía!'} Reclámalo en caja.`;
      }
    }

    // Respuesta para la pantalla de cara al cliente
    res.json({
      cliente: {
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        nombreCompleto: `${cliente.nombre} ${cliente.apellido}`,
        celular: cliente.celular,
        correo: cliente.correo,
        fecha_nacimiento: cliente.fecha_nacimiento,
        puntosActuales: cliente.puntos
      },
      promocionDelDia: config?.promo_del_dia || '¡Bienvenidos a Café Rewards!',
      cumpleanos: {
        esHoy: esHoySuCumple,
        mensajeEspecial: mensajeCumple
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener panel de fidelidad:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener panel de fidelidad.' });
  }
});

export default router;