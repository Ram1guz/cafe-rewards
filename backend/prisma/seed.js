import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inicializando usuarios seguros en la base de datos...');

  // Encriptamos los PINs de fábrica antes de pasarlos a la base de datos
  const pinAdminEncriptado = await bcrypt.hash('9999', 10);
  const pinBaristaEncriptado = await bcrypt.hash('1234', 10);

  // 1. Crear o mantener al Administrador
  const admin = await prisma.usuario.upsert({
    where: { pin: '9999' }, // Nota: si cambias el PIN en producción, el upsert evaluará el nuevo
    update: {},
    create: {
      nombre: 'Ramiro Admin',
      pin: pinAdminEncriptado, // Ahora guardado de forma segura
      rol: 'ADMIN',
      activo: true
    },
  });

  // 2. Crear o mantener al Barista
  const barista = await prisma.usuario.upsert({
    where: { pin: '1234' },
    update: {},
    create: {
      nombre: 'Carlos Barista',
      pin: pinBaristaEncriptado, // Ahora guardado de forma segura
      rol: 'BARISTA',
      activo: true
    },
  });

  console.log('✅ Usuarios de fábrica inicializados con éxito con seguridad Bcrypt.');
  console.log(` - ${admin.nombre} (Rol: ${admin.rol})`);
  console.log(` - ${barista.nombre} (Rol: ${barista.rol})`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el proceso de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });