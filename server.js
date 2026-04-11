require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const pool = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});

pool.connect((err, client, release) => {
    if (err) {
        return console.error('❌ Error conectando a PostgreSQL desde Node:', err.stack);
    }
    console.log('🐘 Conectado a PostgreSQL exitosamente desde el contenedor');
    release();
});

function tenantSlugFromRequest(req) {
    return (
        req.headers['x-tenant-slug'] ||
        req.query.negocio ||
        req.body?.negocio_slug ||
        ''
    ).trim();
}

async function negocioPorSlug(slug) {
    if (!slug) return null;
    const r = await pool.query('SELECT * FROM negocios WHERE slug = $1', [slug]);
    return r.rows[0] || null;
}

// ---------- API (multi-marca) ----------
app.get('/api/negocios/:slug/config', async (req, res) => {
    try {
        const negocio = await negocioPorSlug(req.params.slug);
        if (!negocio) {
            return res.status(404).json({ error: 'Negocio no encontrado' });
        }
        res.json({
            slug: negocio.slug,
            nombre_publico: negocio.nombre_publico,
            color_primario: negocio.color_primario,
            color_secundario: negocio.color_secundario,
            font_heading: negocio.font_heading,
            puntos_para_canje: negocio.puntos_para_canje,
            texto_premio: negocio.texto_premio,
            unidad_punto: negocio.unidad_punto,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/registro', async (req, res) => {
    const slug = tenantSlugFromRequest(req);
    const negocio = await negocioPorSlug(slug);
    if (!negocio) {
        return res.status(400).json({ error: 'Indica un negocio válido (cabecera X-Tenant-Slug o negocio_slug).' });
    }

    const { nombre, apellido, celular, correo, fecha_nacimiento } = req.body;
    if (!nombre || !apellido || !celular || !correo || !fecha_nacimiento) {
        return res.status(400).json({ error: 'Faltan datos obligatorios para el registro.' });
    }

    try {
        const query = `
            INSERT INTO clientes (negocio_id, nombre, apellido, celular, correo, puntos, fecha_nacimiento)
            VALUES ($1, $2, $3, $4, $5, 0, $6) RETURNING *`;
        const values = [negocio.id, nombre, apellido, celular, correo, fecha_nacimiento];
        const resultado = await pool.query(query, values);
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('❌ Error en DB:', err.message);
        if (err.code === '23505') {
            res.status(400).json({ error: 'El celular o el correo ya están registrados en este negocio.' });
        } else {
            res.status(500).json({ error: 'Hubo un problema técnico al guardar. Intenta de nuevo.' });
        }
    }
});

app.get('/api/buscar', async (req, res) => {
    const slug = tenantSlugFromRequest(req);
    const negocio = await negocioPorSlug(slug);
    if (!negocio) {
        return res.status(400).json({ error: 'Indica un negocio válido (cabecera X-Tenant-Slug o query negocio).' });
    }

    const { nombre, apellido } = req.query;
    if (!nombre || !apellido) {
        return res.status(400).json({ error: 'Nombre y apellido son obligatorios para buscar.' });
    }

    try {
        const query =
            'SELECT * FROM clientes WHERE negocio_id = $1 AND nombre = $2 AND apellido = $3';
        const result = await pool.query(query, [negocio.id, nombre, apellido]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ error: 'Cliente no encontrado' });
        }
    } catch (err) {
        console.error('🚨 Error en la consulta SQL:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

app.post('/api/sumar-punto', async (req, res) => {
    const slug = tenantSlugFromRequest(req);
    const negocio = await negocioPorSlug(slug);
    if (!negocio) {
        return res.status(400).json({ error: 'Indica un negocio válido (cabecera X-Tenant-Slug o negocio_slug).' });
    }

    const id = Number(req.body?.id);
    if (!id || Number.isNaN(id)) {
        return res.status(400).json({ error: 'Falta id de cliente válido.' });
    }

    try {
        const query =
            'UPDATE clientes SET puntos = puntos + 1 WHERE id = $1 AND negocio_id = $2 RETURNING *';
        const resultado = await pool.query(query, [id, negocio.id]);
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado en este negocio.' });
        }
        res.json({ success: true, puntos: resultado.rows[0].puntos });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Archivos estáticos y SPA
app.use(express.static(path.join(__dirname, 'public')));

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor listo en puerto ${PORT} (multi-marca)`);
});
