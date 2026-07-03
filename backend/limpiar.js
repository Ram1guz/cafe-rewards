import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function limpiarBaseDeDatos() {
  console.log('🚨 Iniciando limpieza absoluta de datos de prueba...');

  try {
    // Usamos una transacción para asegurar que todo se borre en orden o nada se borre si falla algo
    await prisma.$transaction([
      // 1. Borramos el historial de transacciones (puntos ganados/redimidos)
      prisma.transaccion.deleteMany(),
      
      // 2. Borramos todos los clientes registrados de prueba
      prisma.cliente.deleteMany(),
      
      // 3. Borramos las ofertas acumuladas si las hay
      prisma.oferta.deleteMany(),
    ]);

    console.log('🗑️  ¡Éxito! Clientes, transacciones y ofertas eliminados por completo.');
    console.log('✨ Las tablas estructurales (Usuarios, Sucursales, Productos) permanecen intactas para producción.');

  } catch (error) {
    console.error('❌ Error durante la limpieza de la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

limpiarBaseDeDatos();