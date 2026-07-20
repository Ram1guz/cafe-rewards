FROM node:20-alpine

WORKDIR /app

# Instalar dependencias necesarias para Prisma en Alpine
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install --only=production

# Copiar el resto del código y las plantillas
COPY . .

# Generar el cliente de Prisma para producción
RUN npx prisma generate

EXPOSE 3000

CMD ["node", "src/index.js"]