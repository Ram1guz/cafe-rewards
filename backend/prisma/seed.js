import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// ... el resto de tu función main() ...
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Insertando usuarios de prueba...');

  // 1. Crear un Administrador con PIN "9999"
  const admin = await prisma.usuario.upsert({
    where: { pin: '9999' },
    update: {},
    create: {
      nombre: 'Ramiro Admin',
      pin: '9999',
      rol: 'ADMIN',
      activo: true
    },
  });

  // 2. Crear un Barista con PIN "1234"
  const barista = await prisma.usuario.upsert({
    where: { pin: '1234' },
    update: {},
    create: {
      nombre: 'Carlos Barista',
      pin: '1234',
      rol: 'BARISTA',
      activo: true
    },
  });

  console.log('✅ Usuarios creados con éxito:');
  console.log(` - ${admin.nombre} (Rol: ${admin.rol}, PIN: ${admin.pin})`);
  console.log(` - ${barista.nombre} (Rol: ${barista.rol}, PIN: ${barista.pin})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });