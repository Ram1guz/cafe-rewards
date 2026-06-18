import prisma from '../prisma.js';

// 1. OBTENER TODOS LOS CLIENTES
export const obtenerClientes = async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(clientes);
  } catch (error) {
    console.error('❌ Error al obtener clientes:', error);
    res.status(500).json({ error: 'No se pudieron cargar los clientes.' });
  }
};

// 2. REGISTRAR CLIENTE (Actualizado con acepta_marketing)
export const registrarCliente = async (req, res) => {
  const { nombre, apellido, celular, correo, fecha_nacimiento, acepta_marketing } = req.body;

  if (!nombre || !celular) {
    return res.status(400).json({ error: 'Nombre y celular son obligatorios.' });
  }

  try {
    const clienteExistente = await prisma.cliente.findFirst({
      where: { celular: celular.toString().trim() }
    });

    if (clienteExistente) {
      return res.status(409).json(clienteExistente);
    }

    const nuevoCliente = await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido ? apellido.trim() : "",
        celular: celular.toString().trim(),
        correo: correo || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        acepta_marketing: acepta_marketing === true || acepta_marketing === 'true',
        puntos: 0
      },
    });
    
    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('❌ Error al crear cliente:', error);
    res.status(500).json({ error: 'No se pudo registrar al cliente.' });
  }
};

// 3. ACTUALIZAR CLIENTE (¡La función que nos faltaba!)
export const actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, celular, correo, fecha_nacimiento, acepta_marketing } = req.body;

  try {
    const clienteEditado = await prisma.cliente.update({
      where: { id: parseInt(id, 10) },
      data: {
        nombre: nombre?.trim(),
        apellido: apellido?.trim(),
        celular: celular?.toString().trim(),
        correo: correo || null,
        fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : null,
        acepta_marketing: acepta_marketing === true || acepta_marketing === 'true'
      }
    });

    res.json({ mensaje: "Cliente actualizado con éxito", cliente: clienteEditado });
  } catch (error) {
    console.error("❌ Error al actualizar cliente:", error);
    res.status(500).json({ error: "No se pudo actualizar los datos del cliente." });
  }
};

// 4. SUMAR PUNTOS A UN CLIENTE
export const sumarPuntos = async (req, res) => {
  const { id } = req.params;

  try {
    const clienteActualizado = await prisma.cliente.update({
      where: { id: parseInt(id, 10) },
      data: { puntos: { increment: 1 } } // Incrementa de 1 en 1 de manera segura
    });

    res.json({
      mensaje: "¡Punto sumado con éxito!",
      puntosTotales: clienteActualizado.puntos
    });
  } catch (error) {
    console.error('❌ Error al sumar puntos:', error);
    res.status(500).json({ error: 'No se pudieron actualizar los puntos.' });
  }
};

// 5. CANJEAR PREMIO / PEDIR RECOMPENSA (Descuenta puntos de forma segura)
export const pedirRecompensa = async (req, res) => {
  const { id } = req.params; 
  const { productoId } = req.body; 

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findUnique({ where: { id: parseInt(id, 10) } });
      if (!cliente) throw new Error('CLIENTE_NO_ENCONTRADO');

      const producto = await tx.producto.findUnique({ where: { id: parseInt(productoId, 10) } });
      if (!producto) throw new Error('PRODUCTO_NO_ENCONTRADO');

      if (cliente.puntos < producto.puntos_necesarios) throw new Error('PUNTOS_INSUFICIENTES');

      const clienteActualizado = await tx.cliente.update({
        where: { id: cliente.id },
        data: { puntos: cliente.puntos - producto.puntos_necesarios }
      });

      await tx.transaccion.create({
        data: {
          clienteId: cliente.id,
          sucursalId: 1, 
          usuarioId: 1,   
          puntos_redimidos: producto.puntos_necesarios,
          puntos_ganados: 0
        }
      });

      return { clienteActualizado, producto };
    });

    res.json({
      mensaje: `¡Canje exitoso! Disfruta tu ${resultado.producto.nombre}`,
      puntosRestantes: resultado.clienteActualizado.puntos
    });

  } catch (error) {
    if (error.message === 'CLIENTE_NO_ENCONTRADO') return res.status(404).json({ error: 'Cliente no encontrado.' });
    if (error.message === 'PRODUCTO_NO_ENCONTRADO') return res.status(404).json({ error: 'El premio seleccionado no existe.' });
    if (error.message === 'PUNTOS_INSUFICIENTES') return res.status(400).json({ error: 'El cliente no tiene suficientes puntos para este premio.' });
    
    console.error('❌ Error en la transacción de canje:', error);
    res.status(500).json({ error: 'Ocurrió un error al procesar el canje.' });
  }
};
