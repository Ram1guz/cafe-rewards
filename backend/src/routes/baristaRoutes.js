import { Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// Obtener todos los baristas activos
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
        pin: true
      }
    });

    res.json(baristas);
  } catch (error) {
    console.error('❌ Error al obtener baristas:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar baristas.' });
  }
});

// Obtener un barista por ID
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });

    const barista = await prisma.usuario.findUnique({
      where: { id }
    });

    if (!barista) return res.status(404).json({ error: 'Barista no encontrado.' });

    res.json(barista);
  } catch (error) {
    console.error('❌ Error al obtener barista:', error);
    res.status(500).json({ error: 'Error interno del servidor al consultar barista.' });
  }
});

// Crear un nuevo barista
router.post('/', async (req, res) => {
  try {
    const { nombre, pin } = req.body;

    const nuevoBarista = await prisma.usuario.create({
      data: {
        nombre: nombre?.trim(),
        pin: pin?.trim(),
        rol: 'BARISTA',
        activo: true,
        sucursalId: null
      }
    });

    res.status(201).json(nuevoBarista);
  } catch (error) {
    console.error('❌ Error al crear barista:', error);
    res.status(500).json({ error: 'Error interno del servidor al crear barista.' });
  }
});

// Actualizar un barista por ID
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido.' });
    const { nombre, pin } = req.body;

    const baristaActualizado = await prisma.usuario.update({
      where: { id },
      data: {
        nombre: nombre?.trim(),
        pin: pin?.trim()
      }
    });

    res.json(baristaActualizado);
  } catch (error) {
    console.error('❌ Error al actualizar barista:', error);
    res.status(500).json({ error: 'Error interno del servidor al actualizar barista.' });
  }
});

// Eliminar un barista por ID
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
