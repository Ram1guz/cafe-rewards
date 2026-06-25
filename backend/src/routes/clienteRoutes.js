import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// Configuración administrativa
router.get('/config-admin', async (req, res) => {
  try {
    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    });

    res.json(config || {
      promo_del_dia: '¡Bienvenidos a Café Rewards!',
      cumple_regalo_desc: '¡Un café de cortesía!',
      cumple_puntos_bono: 0,
      cumple_plazo_dias: 7
    });
  } catch (error) {
    console.error('❌ Error al obtener configuración admin:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar configuración.' });
  }
});

router.post('/config-admin', async (req, res) => {
  try {
    const { promo_del_dia, cumple_regalo_desc, cumple_puntos_bono, cumple_plazo_dias } = req.body;

    const nuevaConfig = await prisma.configuracionSistema.create({
      data: {
        promo_del_dia: promo_del_dia?.trim() || 'Sin promociones por hoy.',
        cumple_regalo_desc: cumple_regalo_desc?.trim() || '¡Un café de cortesía!',
        cumple_puntos_bono: parseInt(cumple_puntos_bono, 10) || 0,
        cumple_plazo_dias: parseInt(cumple_plazo_dias, 10) || 7
      }
    });

    res.json(nuevaConfig);
  } catch (error) {
    console.error('❌ Error al guardar configuración admin:', error);
    res.status(500).json({ error: 'Error interno del servidor al guardar configuración.' });
  }
});

// Clientes
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
// --- ➕ SUMAR PUNTOS Y AUDITAR TRANSACCIÓN ---
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
        sucursalId: 1, // En el MVP lo dejamos estático en 1
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

// --- 🎁 REDIMIR RECOMPENSA CON BARISTA DINÁMICO ---
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

router.get('/:id/panel-fidelidad', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const cliente = await prisma.cliente.findUnique({ where: { id } });
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado.' });

    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    });

    res.json({
      cliente: {
        id: cliente.id,
        nombreCompleto: `${cliente.nombre} ${cliente.apellido}`,
        puntosActuales: cliente.puntos
      },
      promocionDelDia: config?.promo_del_dia || '¡Bienvenidos a Café Rewards!',
      cumpleanos: {
        esHoy: false,
        mensajeEspecial: null
      }
    });
  } catch (error) {
    console.error('❌ Error al obtener panel de fidelidad:', error);
    res.status(500).json({ error: 'Error interno del servidor al obtener panel de fidelidad.' });
  }
});

export default router;
