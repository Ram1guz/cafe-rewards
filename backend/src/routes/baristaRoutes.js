import { Router } from 'express';
import prisma from '../prisma.js';
import bcrypt from 'bcrypt'; // 🔐 Importamos la encriptación obligatoria

const router = Router();

// ☕ 1. Obtener todos los baristas activos (SIN EXPOREN EL PIN)
router.get('/', async (req, res) => {
  try {
    const baristas = await prisma.usuario.findMany({
      where: {
        rol: 'BARISTA',
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        activo: true // Ocultamos el pin por completo por seguridad física
      },
      orderBy: { nombre: 'asc' }
    });

    res.json(baristas);
  } catch (error) {
    console.error('❌ Error al obtener baristas:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar baristas.' });
  }
});

// 🔍 2. Obtener un barista por ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const barista = await prisma.usuario.findUnique({
      where: { id },
      select: { id: true, nombre: true, rol: true, activo: true } // El PIN no se envía jamás por GET
    });

    if (!barista) return res.status(404).json({ error: 'Barista no encontrado.' });

    res.json(barista);
  } catch (error) {
    console.error('❌ Error al obtener barista:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar barista.' });
  }
});

// ➕ 3. Crear un nuevo barista (CON PIN ENCRIPTADO Y VALIDADO)
router.post('/', async (req, res) => {
  try {
    const { nombre, pin } = req.body;

    if (!nombre || !pin) {
      return res.status(400).json({ error: 'El nombre y el PIN de 4 dígitos son obligatorios.' });
    }

    // Validamos si el PIN ya está tomado por otro usuario
    const pinExiste = await prisma.usuario.findUnique({
      where: { pin: pin.toString().trim() }
    });

    if (pinExiste) {
      return res.status(409).json({ error: 'Este PIN ya está asignado a otro usuario. Elige otro.' });
    }

    // Encriptamos el PIN antes de guardarlo en Postgres
    const pinEncriptado = await bcrypt.hash(pin.toString().trim(), 10);

    const nuevoBarista = await prisma.usuario.create({
      data: {
        nombre: nombre?.trim(),
        pin: pinEncriptado, // Guardado seguro
        rol: 'BARISTA',
        activo: true,
        sucursalId: null
      }
    });

    // Retornamos el objeto sin el pin expuesto
    res.status(201).json({ id: nuevoBarista.id, nombre: nuevoBarista.nombre, rol: nuevoBarista.rol });
  } catch (error) {
    console.error('❌ Error al crear barista:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear barista.' });
  }
});

// 📝 4. Actualizar un barista por ID (MANEJANDO ENCRIPTACIÓN)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    
    const { nombre, pin } = req.body;
    const dataUpdate = {};

    if (nombre) dataUpdate.nombre = nombre.trim();
    
    // Si el administrador decide cambiarle el PIN al barista, se vuelve a encriptar
    if (pin) {
      // Validamos si el nuevo PIN choca con otro existente
      const pinExiste = await prisma.usuario.findUnique({
        where: { pin: pin.toString().trim() }
      });
      
      if (pinExiste && pinExiste.id !== id) {
        return res.status(409).json({ error: 'Este PIN ya está siendo utilizado por otro usuario.' });
      }
      
      dataUpdate.pin = await bcrypt.hash(pin.toString().trim(), 10);
    }

    const baristaActualizado = await prisma.usuario.update({
      where: { id },
      data: dataUpdate
    });

    res.json({ id: baristaActualizado.id, nombre: baristaActualizado.nombre });
  } catch (error) {
    console.error('❌ Error al actualizar barista:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar barista.' });
  }
});

// 🗑️ 5. Eliminar un barista por ID
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    await prisma.usuario.delete({
      where: { id }
    });

    res.json({ mensaje: 'Barista eliminado correctamente.' });
  } catch (error) {
    console.error('❌ Error al eliminar barista:', error);
    res.status(500).json({ error: 'Error interno del servidor al eliminar barista.' });
  }
});

export default router;