# ☕ Jacaqu Café - Reglas Críticas de Desarrollo

## 1. Lógica de Búsqueda Manual (Control de Homónimos)

- **Regla:** La búsqueda manual debe ser precisa. Se permite buscar de dos formas válidas:
  1. Ingresando **Nombre Y Apellido** combinados (para evitar cruzar personas con el mismo nombre en Cochabamba).
  2. O ingresando el número de **Celular** directo (al ser un dato único por cliente).
- **Filtro de código:** Debe validar estrictamente que se cumpla una de estas dos condiciones antes de hacer la consulta.

## 2. Base de Datos y Stack Local

- **Frontend:** HTML/CSS/JS nativo. Colores: Azul (#18405c), Fuente: Parisienne (para logos/títulos).
- **Backend:** Node.js + Express (arquitectura con carpeta `backend/src/index.js`).
- **ORM/BD:** Prisma + PostgreSQL. Tabla: `clientes` (campos: id, nombre, apellido, celular, correo, puntos, fecha_registro).

## 3. Arquitectura de Archivos Frontend (Separación de Roles)

- `admin.html` / `admin.js` -> Panel exclusivo de Administración (PIN 9999).
- `barista.html` / `barista.js` -> Panel exclusivo de Mostrador/Atención (PIN 1234).
- _Nota Histórica:_ El archivo `app.js` quedó obsoleto y duplicado en desarrollo; el control real del admin local es `admin.js`.
- `cliente.html` / `cliente.js` -> Vista de fidelidad del usuario final. QR azul nativo generado por URL estable inmediata.

## 4. Flujo de Seguridad y Redirección

- El servidor Node.js centraliza la seguridad por Roles (`ADMIN`, `BARISTA`).
- Las redirecciones en `login.js` deben respetar los archivos separados e independientes sin mezclar las rutas.

## 5. Comportamiento del Perfil del Cliente en Mostrador

- Al seleccionar un cliente (por QR o Búsqueda), la pantalla debe mostrar sus puntos, pero TAMBIÉN debe rellenar el formulario manual con sus datos completos (Nombre, Apellido, Celular, Correo, Cumpleaños).
- Se deben activar visiblemente los botones "✏️ EDITAR" y "💾 GUARDAR" en la sección manual para permitir modificaciones en caliente desde el mostrador.
