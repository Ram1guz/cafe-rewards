-- Esquema multi-marca: cada fila en `negocios` es un negocio (Jacaqu Café como primer entregable).
-- Si ya tenías una BD antigua solo con `clientes`, recrea el volumen de Postgres o aplica una migración manual.

CREATE TABLE negocios (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(64) NOT NULL UNIQUE,
    nombre_publico VARCHAR(120) NOT NULL,
    color_primario VARCHAR(7) NOT NULL DEFAULT '#18405c',
    color_secundario VARCHAR(7) NOT NULL DEFAULT '#2c6e91',
    font_heading VARCHAR(160) NOT NULL DEFAULT '''Parisienne'', cursive',
    puntos_para_canje INTEGER NOT NULL DEFAULT 10 CHECK (puntos_para_canje > 0),
    texto_premio VARCHAR(200) NOT NULL DEFAULT 'un café de cortesía',
    unidad_punto VARCHAR(80) NOT NULL DEFAULT 'café',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    negocio_id INTEGER NOT NULL REFERENCES negocios(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    celular VARCHAR(20) NOT NULL,
    correo VARCHAR(100) NOT NULL,
    puntos INTEGER NOT NULL DEFAULT 0 CHECK (puntos >= 0),
    fecha_nacimiento DATE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (negocio_id, correo),
    UNIQUE (negocio_id, celular)
);

CREATE INDEX idx_clientes_negocio ON clientes (negocio_id);

INSERT INTO negocios (slug, nombre_publico, color_primario, color_secundario, font_heading, puntos_para_canje, texto_premio, unidad_punto)
VALUES (
    'jacaqu-cafe',
    'Jacaqu Café',
    '#18405c',
    '#2c6e91',
    '''Parisienne'', cursive',
    10,
    'un café de cortesía',
    'café'
);
