/*
  Warnings:

  - You are about to drop the column `password` on the `usuarios` table. All the data in the column will be lost.
  - You are about to drop the column `username` on the `usuarios` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[pin]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.
  - Made the column `celular` on table `clientes` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `nombre` to the `usuarios` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pin` to the `usuarios` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "usuarios_username_key";

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "acepta_marketing" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "celular" SET NOT NULL;

-- AlterTable
ALTER TABLE "usuarios" DROP COLUMN "password",
DROP COLUMN "username",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "nombre" VARCHAR(50) NOT NULL,
ADD COLUMN     "pin" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" SERIAL NOT NULL,
    "promo_del_dia" TEXT NOT NULL,
    "cumple_regalo_desc" TEXT NOT NULL,
    "cumple_puntos_bono" INTEGER NOT NULL DEFAULT 0,
    "cumple_plazo_dias" INTEGER NOT NULL DEFAULT 0,
    "actualizado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_pin_key" ON "usuarios"("pin");

-- AddForeignKey
ALTER TABLE "transacciones" ADD CONSTRAINT "transacciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
