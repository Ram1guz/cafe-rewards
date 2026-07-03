import prisma from '../prisma.js';
import bcrypt from 'bcrypt'; // 🔐 Importamos la librería de comparación

export const loginPorPin = async (req, res) => {
  try {
    const { pin } = req.body;

    // 1. Validar que nos hayan enviado un PIN
    if (!pin) {
      return res.status(400).json({ error: 'El PIN es requerido' });
    }

    // 2. Recuperamos todos los usuarios activos del sistema para verificar sus hashes
    const usuarios = await prisma.usuario.findMany({
      where: { activo: true }
    });

    let usuarioEncontrado = null;

    // 3. Comparamos el PIN ingresado contra el hash de cada usuario en la base de datos
    for (const u of usuarios) {
      const coincide = await bcrypt.compare(String(pin), u.pin);
      if (coincide) {
        usuarioEncontrado = u;
        break; // Detenemos el bucle en cuanto encontramos al dueño del PIN
      }
    }

    // 4. Si ningún hash coincidió, rechazamos el acceso de inmediato
    if (!usuarioEncontrado) {
      return res.status(401).json({ error: 'PIN incorrecto o no registrado' });
    }

    // 5. ¡Éxito! Devolvemos los datos del usuario con su ID real (fundamental para el mostrador)
    return res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        id: usuarioEncontrado.id, // 👈 MEJORA: Mandamos el ID para auditar las transacciones del barista
        nombre: usuarioEncontrado.nombre,
        rol: usuarioEncontrado.rol
      }
    });

  } catch (error) {
    console.error('❌ Error en el login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};