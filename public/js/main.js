// ==========================================
// Multi-marca: ?negocio=jacaqu-cafe (por defecto Jacaqu Café)
// ==========================================
let tenantSlug = 'jacaqu-cafe';
/** @type {null | { slug: string, nombre_publico: string, color_primario: string, color_secundario: string, font_heading: string, puntos_para_canje: number, texto_premio: string, unidad_punto: string }} */
let negocioConfig = null;
let clienteActual = null;

function apiHeaders() {
    return {
        'Content-Type': 'application/json',
        'X-Tenant-Slug': tenantSlug,
    };
}

function colorPrimario() {
    return negocioConfig?.color_primario || '#18405c';
}

function aplicarBranding(cfg) {
    document.documentElement.style.setProperty('--color-primary', cfg.color_primario);
    document.documentElement.style.setProperty('--color-secondary', cfg.color_secundario);
    document.documentElement.style.setProperty('--font-heading', cfg.font_heading);

    const heading = document.getElementById('brand-heading');
    if (heading) heading.textContent = cfg.nombre_publico;

    document.title = `${cfg.nombre_publico} · Rewards`;

    const meta = document.getElementById('meta-canje');
    if (meta) {
        meta.textContent = `Canje: ${cfg.texto_premio} al llegar a ${cfg.puntos_para_canje} puntos.`;
    }

    const btnAdd = document.getElementById('btn-add-point');
    if (btnAdd) {
        const u = cfg.unidad_punto || 'consumo';
        btnAdd.textContent = `+ Sumar ${u} (punto)`;
    }

    const theme = document.querySelector('meta[name="theme-color"]');
    if (theme) theme.setAttribute('content', cfg.color_primario);
}

async function cargarNegocio() {
    const params = new URLSearchParams(window.location.search);
    tenantSlug = params.get('negocio') || localStorage.getItem('tenantNegocio') || 'jacaqu-cafe';
    localStorage.setItem('tenantNegocio', tenantSlug);

    const resp = await fetch(`/api/negocios/${encodeURIComponent(tenantSlug)}/config`);
    if (!resp.ok) {
        throw new Error('Negocio no encontrado');
    }
    negocioConfig = await resp.json();
    aplicarBranding(negocioConfig);
}

function generarQR(clienteId) {
    const el = document.getElementById('qrcode');
    if (!el || typeof QRCode === 'undefined') return;
    el.innerHTML = '';
    const base = `${location.origin}${location.pathname}`;
    const url = `${base}?negocio=${encodeURIComponent(tenantSlug)}&cliente=${encodeURIComponent(String(clienteId))}`;
    new QRCode(el, { text: url, width: 128, height: 128 });
}

// ==========================================
// Eventos
// ==========================================
function registrarFormulario(e) {
    e.preventDefault();

    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        apellido: document.getElementById('apellido').value.trim(),
        celular: document.getElementById('celular').value.trim(),
        correo: document.getElementById('correo').value.trim(),
        fecha_nacimiento: document.getElementById('fecha_nacimiento').value,
    };

    fetch('/api/registro', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(datos),
    })
        .then(async (respuesta) => {
            if (respuesta.ok) {
                const clienteGuardado = await respuesta.json();
                alert(`¡${clienteGuardado.nombre} registrado con éxito!`);
                seleccionarCliente(clienteGuardado);
            } else {
                alert('El cliente ya existe en este negocio o los datos coinciden con un registro actual.');
            }
        })
        .catch((err) => {
            console.error(err);
            alert('Error de conexión con el servidor.');
        });
}

function buscarCliente() {
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();

    if (!nombre || !apellido) {
        alert('Ingresa nombre y apellido para buscar.');
        return;
    }

    const q = new URLSearchParams({ nombre, apellido, negocio: tenantSlug });
    fetch(`/api/buscar?${q.toString()}`, { headers: { 'X-Tenant-Slug': tenantSlug } })
        .then(async (respuesta) => {
            if (respuesta.ok) {
                const cliente = await respuesta.json();
                seleccionarCliente(cliente);
            } else {
                mostrarError('Cliente no encontrado.');
            }
        })
        .catch((err) => {
            console.error(err);
            mostrarError('Error de red.');
        });
}

function sumarPunto() {
    if (!clienteActual) return;

    fetch('/api/sumar-punto', {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify({ id: clienteActual.id }),
    })
        .then(async (respuesta) => {
            if (respuesta.ok) {
                const datosActualizados = await respuesta.json();
                clienteActual.puntos = datosActualizados.puntos;
                document.getElementById('current-points').innerText = String(clienteActual.puntos);

                const display = document.getElementById('display-nombre-cliente');
                display.innerText = `Punto añadido. Total: ${clienteActual.puntos}`;
                setTimeout(() => {
                    display.innerText = `Cliente: ${clienteActual.nombre} ${clienteActual.apellido}`;
                }, 2000);
            } else {
                alert('No se pudo sumar el punto.');
            }
        })
        .catch(() => alert('Error al sumar punto.'));
}

function seleccionarCliente(cliente) {
    clienteActual = cliente;

    const nombreElemento = document.getElementById('display-nombre-cliente');
    if (nombreElemento) {
        nombreElemento.innerText = `Cliente: ${cliente.nombre} ${cliente.apellido}`;
        nombreElemento.style.color = colorPrimario();
    }

    const celElemento = document.getElementById('display-celular');
    if (celElemento) {
        celElemento.innerText = `Celular: ${cliente.celular || '—'}`;
    }

    const correoElemento = document.getElementById('display-correo');
    if (correoElemento) {
        correoElemento.innerText = `Correo: ${cliente.correo || '—'}`;
    }

    const fechaElemento = document.getElementById('display-fecha');
    if (fechaElemento) {
        const valorFecha = cliente.fecha_nacimiento;
        if (valorFecha) {
            const fechaObj = new Date(valorFecha);
            const fechaFormateada = fechaObj.toLocaleDateString('es-ES', { timeZone: 'UTC' });
            fechaElemento.innerText = `Cumpleaños: ${fechaFormateada}`;
        } else {
            fechaElemento.innerText = 'Cumpleaños: —';
        }
    }

    document.getElementById('current-points').innerText = String(cliente.puntos ?? 0);
    document.getElementById('btn-add-point').style.display = 'block';

    if (cliente.id) {
        generarQR(cliente.id);
    }
}

function limpiarPantalla() {
    clienteActual = null;
    document.getElementById('form-registro').reset();
    const display = document.getElementById('display-nombre-cliente');
    display.innerText = 'Esperando selección…';
    display.style.color = colorPrimario();

    document.getElementById('display-celular').innerText = '';
    document.getElementById('display-correo').innerText = '';
    document.getElementById('display-fecha').innerText = '';

    document.getElementById('current-points').innerText = '0';
    document.getElementById('btn-add-point').style.display = 'none';
    document.getElementById('qrcode').innerHTML = '';
}

function mostrarError(mensaje) {
    clienteActual = null;
    const display = document.getElementById('display-nombre-cliente');
    display.innerText = mensaje;
    display.style.color = 'red';

    document.getElementById('display-celular').innerText = '';
    document.getElementById('display-correo').innerText = '';
    document.getElementById('display-fecha').innerText = '';
    document.getElementById('current-points').innerText = '0';
    document.getElementById('btn-add-point').style.display = 'none';
    document.getElementById('qrcode').innerHTML = '';
}

function enlazarUI() {
    document.getElementById('form-registro').addEventListener('submit', registrarFormulario);
    document.getElementById('btn-buscar').addEventListener('click', buscarCliente);
    document.getElementById('btn-add-point').addEventListener('click', sumarPunto);
    document.getElementById('btn-limpiar').addEventListener('click', limpiarPantalla);
    document.getElementById('btn-staff-placeholder').addEventListener('click', () => {
        alert('Área restringida (próximamente).');
    });
}

async function init() {
    try {
        await cargarNegocio();
    } catch {
        document.body.innerHTML =
            '<p style="font-family:sans-serif;padding:2rem;text-align:center;">Negocio no encontrado. Revisa el enlace o el código <code>?negocio=</code>.</p>';
        return;
    }
    enlazarUI();

    const params = new URLSearchParams(window.location.search);
    const clienteRef = params.get('cliente');
    if (clienteRef && /^\d+$/.test(clienteRef)) {
        document.getElementById('nombre').focus();
    }

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
}

document.addEventListener('DOMContentLoaded', init);
