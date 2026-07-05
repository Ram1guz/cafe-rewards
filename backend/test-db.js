import prisma from './src/prisma.js';

async function diagnosticoTablas() {
  console.log("🔍 === INICIANDO RADIOGRAFÍA DE LA BASE DE DATOS ===");
  try {
    // 1. Revisar los usuarios disponibles para auditoría
    const usuarios = await prisma.usuario.findMany();
    console.log("\n👤 TABLA USUARIOS (BARISTAS/ADMINS):");
    console.table(usuarios.map(u => ({ id: u.id, nombre: u.nombre, rol: u.rol })));

    // 2. Revisar si existe la configuración global
    const config = await prisma.configuracionSistema.findMany();
    console.log("\n⚙️ TABLA CONFIGURACION SISTEMA:");
    console.table(config.map(c => ({ id: c.id, promo: c.promo_del_dia?.substring(0, 30) })));

    // 3. Revisar los productos/premios creados
    // Nota: Si en tu esquema se llama de otra forma, Copilot te sugerirá cambiar el nombre aquí
    const productos = await prisma.producto.findMany();
    console.log("\n☕ TABLA PRODUCTOS (PREMIOS del MVP):");
    console.table(productos.map(p => ({ id: p.id, nombre: p.nombre, puntos: p.puntos_necesarios })));

    // 4. Revisar si hay sucursales activas
    const sucursales = await prisma.sucursal.findMany();
    console.log("\n🏪 TABLA SUCURSALES:");
    console.table(sucursales.map(s => ({ id: s.id, nombre: s.nombre || 'Sin nombre' })));

  } catch (error) {
    console.error("\n❌ Error durante el diagnóstico:", error.message);
    console.log("💡 Tip de Copilot: Si dio error en alguna tabla, es probable que se llame diferente en tu schema.prisma");
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticoTablas();