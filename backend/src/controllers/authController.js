import prisma from '../prisma.js';

export const loginPorPin = async (req, res) => {
  try {
    const { pin } = req.body;

    // 1. Validar que nos hayan enviado un PIN
    if (!pin) {
      return res.status(400).json({ error: 'El PIN es requerido' });
    }

    // 2. Buscar en la base de datos si existe un usuario con ese PIN
    const usuario = await prisma.usuario.findUnique({
      where: { pin: String(pin) }
    });

    // 3. Si no existe, rechazar el acceso
    if (!usuario) {
      return res.status(401).json({ error: 'PIN incorrecto o no registrado' });
    }

    // 4. Si el usuario está desactivado, bloquearlo
    if (!usuario.activo) {
      return res.status(403).json({ error: 'Este usuario está inactivo' });
    }

    // 5. ¡Éxito! Devolvemos los datos del usuario (su nombre y su rol: ADMIN o BARISTA)
    return res.json({
      mensaje: 'Inicio de sesión exitoso',
      usuario: {
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });

  } catch (error) {
    console.error('❌ Error en el login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};