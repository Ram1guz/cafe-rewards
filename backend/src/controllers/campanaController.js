import prisma from '../prisma.js';

// 1. OBTENER PANEL DEL CLIENTE (Puntos + Promo del Día + Cumpleaños con Vencimiento)
export const obtenerPanelCliente = async (req, res) => {
  const { id } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(id, 10) }
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    // Traemos la última configuración guardada por el administrador
    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    }) || {
      promo_del_dia: "¡Bienvenidos a Café Rewards!",
      cumple_regalo_desc: "¡Un café de cortesía!",
      cumple_plazo_dias: 7 
    };

    // Verificación de Cumpleaños
    let esSuCumpleanos = false;
    let fechaVencimientoRegalo = null;

    if (cliente.fecha_nacimiento) {
      const hoy = new Date();
      const cumple = new Date(cliente.fecha_nacimiento);
      
      esSuCumpleanos = (hoy.getUTCDate() === cumple.getUTCDate() && 
                        hoy.getUTCMonth() === cumple.getUTCMonth());

      if (esSuCumpleanos) {
        // 🗓️ CALCULAR EL VENCIMIENTO: Sumamos los días configurados a la fecha de hoy
        const limite = new Date();
        limite.setDate(hoy.getDate() + (config.cumple_plazo_dias || 7));
        
        fechaVencimientoRegalo = limite.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }

    res.json({
      cliente: {
        id: cliente.id,
        nombreCompleto: `${cliente.nombre} ${cliente.apellido}`,
        puntosActuales: cliente.puntos
      },
      promocionDelDia: config.promo_del_dia,
      cumpleanos: {
        esHoy: esSuCumpleanos,
        plazoDiasValido: config.cumple_plazo_dias,
        fechaVence: fechaVencimientoRegalo,
        mensajeEspecial: esSuCumpleanos 
          ? `🎁 ¡Feliz Cumpleaños! Tienes un regalo esperando en caja: ${config.cumple_regalo_desc}. Válido hasta el ${fechaVencimientoRegalo}.` 
          : null
      }
    });

  } catch (error) {
    console.error("❌ Error al consolidar el panel del cliente:", error);
    res.status(500).json({ error: "No se pudo cargar la información." });
  }
};

// 2. ACTUALIZAR CONFIGURACIÓN (Para el Administrador - POST)
export const guardarConfiguracionAdmin = async (req, res) => {
  const { promo_del_dia, cumple_regalo_desc, cumple_puntos_bono, cumple_plazo_dias } = req.body;

  try {
    const nuevaConfig = await prisma.configuracionSistema.create({
      data: {
        promo_del_dia: promo_del_dia || "Sin promociones por hoy.",
        cumple_regalo_desc: cumple_regalo_desc || "¡Un café de cortesía!",
        cumple_puntos_bono: parseInt(cumple_puntos_bono, 10) || 0,
        cumple_plazo_dias: parseInt(cumple_plazo_dias, 10) || 7 
      }
    });

    res.json({ mensaje: "Configuración del sistema actualizada", configuracion: nuevaConfig });
  } catch (error) {
    console.error("❌ Error al guardar la configuración:", error);
    res.status(500).json({ error: "No se pudo salvar la configuración." });
  }
};

// 3. NUEVO: OBTENER CONFIGURACIÓN ACTUAL (Para el Administrador - GET)
// Esto es lo que llama tu admin.js al abrir la página para rellenar los campos
export const obtenerConfiguracionAdmin = async (req, res) => {
  try {
    const config = await prisma.configuracionSistema.findFirst({
      orderBy: { id: 'desc' }
    });

    if (!config) {
      // Si no hay configuraciones en la base de datos, enviamos valores por defecto
      return res.json({
        promo_del_dia: "¡Bienvenidos a Café Rewards!",
        cumple_regalo_desc: "¡Un café de cortesía!",
        cumple_puntos_bono: 0,
        cumple_plazo_dias: 7
      });
    }

    res.json(config);
  } catch (error) {
    console.error("❌ Error al obtener la configuración de administración:", error);
    res.status(500).json({ error: "No se pudo recuperar la configuración." });
  }
};