import prisma from '../prisma.js';

// LISTAR PRODUCTOS (Para el selector <select> del Barista)
export const listarProductos = async (req, res) => {
  try {
    const productos = await prisma.producto.findMany({
      orderBy: { puntos_necesarios: 'asc' }
    });
    res.json(productos);
  } catch (error) {
    console.error('❌ Error al obtener el catálogo de premios:', error);
    res.status(500).json({ error: 'No se pudo cargar el catálogo de recompensas.' });
  }
};

// CREAR PRODUCTO (Para el Administrador desde Windows 11)
export const crearProducto = async (req, res) => {
  const { nombre, puntos_necesarios } = req.body;

  if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
    return res.status(400).json({ error: 'El nombre de la recompensa es obligatorio.' });
  }

  const puntos = parseInt(puntos_necesarios, 10);
  if (isNaN(puntos) || puntos <= 0) {
    return res.status(400).json({ error: 'Los puntos deben ser un número mayor a cero.' });
  }

  try {
    const productoExistente = await prisma.producto.findFirst({
      where: { nombre: { equals: nombre.trim(), mode: 'insensitive' } }
    });

    if (productoExistente) {
      return res.status(409).json({ error: `Ya existe un premio con el nombre '${nombre.trim()}'.` });
    }

    const nuevoProducto = await prisma.producto.create({
      data: {
        nombre: nombre.trim(),
        puntos_necesarios: puntos
      }
    });

    res.status(201).json({ mensaje: '¡Recompensa configurada con éxito!', producto: nuevoProducto });
  } catch (error) {
    console.error('❌ Error al crear el producto:', error);
    res.status(500).json({ error: 'No se pudo guardar la recompensa.' });
  }
};