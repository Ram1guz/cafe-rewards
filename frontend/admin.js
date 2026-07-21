// --- 🔐 VALIDACIÓN DE SEGURIDAD E INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    const nombreAdmin = localStorage.getItem("usuarioNombre");
    const rolAdmin = localStorage.getItem("usuarioRol");
    const contenedorSaludo = document.getElementById("saludoAdmin");

    // Verificar estrictamente que sea un ADMIN real
    if (nombreAdmin && rolAdmin === "ADMIN" && contenedorSaludo) {
        contenedorSaludo.innerHTML = `👑 Bienvenido: <strong>${nombreAdmin}</strong>`;
    } else {
        alert("⚠️ Acceso denegado. Se requieren permisos de Administrador.");
        window.location.href = "/login.html";
        return;
    }

    // Cargar listas reales desde la Base de Datos al iniciar
    obtenerBaristasBD();
    obtenerClientesReporteBD();
    cargarConfiguracionAdmin();
});

async function cargarConfiguracionAdmin() {
    try {
        const respuesta = await axios.get('/clientes/config-admin');
        console.log('Datos recibidos en el panel:', respuesta.data);
        
        const config = respuesta.data;

        if (config) {
            const promo = document.getElementById('promo_del_dia');
            const regalo = document.getElementById('regalo_cumpleanos');
            const plazo = document.getElementById('cumple_plazo_dias');
            const productoNombre = document.getElementById('producto_nombre');
            const puntosNecesarios = document.getElementById('puntos_necesarios');

            // Asignamos solo si los elementos existen en el HTML y en la respuesta
            if (promo) promo.value = config.promo_del_dia || '';
            
            // Mapeo inteligente con fallback para evitar errores si el backend sigue con nombres viejos
            if (regalo) {
                regalo.value = config.regalo_cumpleanos || config.cumple_regalo_desc || '';
            }
            
            if (plazo) {
                plazo.value = config.cumple_plazo_dias ?? 7;
            }
            
            if (productoNombre) {
                productoNombre.value = config.producto_nombre || 'Café de Regalo';
            }
            if (puntosNecesarios) {
                puntosNecesarios.value = config.puntos_necesarios ?? config.cumple_puntos_bono ?? 10;
            }
        }
        
        // ¡DESTRABAR EL SALUDO! Si llegamos aquí, quitamos el estado de carga de forma segura
        const nombreAdmin = localStorage.getItem("usuarioNombre") || "Administrador";
        const contenedorSaludo = document.getElementById("saludoAdmin");
        if (contenedorSaludo) {
            contenedorSaludo.innerHTML = `👑 Bienvenido: <strong>${nombreAdmin}</strong>`;
        }

    } catch (error) {
        console.error('❌ Error al cargar configuración admin:', error);
        
        // Plan de rescate: si el backend falla localmente, liberamos la interfaz para poder cerrar sesión o navegar
        const contenedorSaludo = document.getElementById("saludoAdmin");
        if (contenedorSaludo) {
            contenedorSaludo.innerHTML = `👑 Bienvenido: <strong>Admin (Modo Offline)</strong>`;
        }
    }
}

// --- 🎛️ CONTROLADOR DE PESTAÑAS (NAVEGACIÓN) ---
function cambiarSeccion(seccionId) {
    // 1. Ocultar todas las secciones
    const secciones = document.querySelectorAll('.seccion-admin');
    secciones.forEach(sec => sec.classList.remove('active'));

    // 2. Desactivar todos los botones del menú
    const botones = document.querySelectorAll('.btn-menu');
    botones.forEach(btn => btn.classList.remove('active'));

    // 3. Buscar la sección elegida de forma segura
    const seccionObjetivo = document.getElementById(`sec-${seccionId}`);
    if (seccionObjetivo) {
        seccionObjetivo.classList.add('active');
    } else {
        console.warn(`⚠️ No se encontró la sección: sec-${seccionId}`);
    }
    
    // 4. Activar el botón correcto del menú
    const botonActivo = Array.from(botones).find(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        return onclickAttr && onclickAttr.includes(seccionId);
    });
    if (botonActivo) botonActivo.classList.add('active');

    // 🎯 SI ENTRA A LA PESTAÑA DEL QR, LO GENERA CON RETRASO DE SEGURIDAD
    if (seccionId === 'qr-mostrador') {
        generarQrMostrador();
    }
}
window.cambiarSeccion = cambiarSeccion;

// --- 👥 MÓDULO GESTIÓN DE BARISTAS (CONEXIÓN POSTGRESQL REAL) ---

async function obtenerBaristasBD() {
    try {
        const respuesta = await axios.get('/baristas');
        const baristas = respuesta.data;
        const tbody = document.getElementById('tablaBaristas');
        
        if (!tbody) return;
        tbody.innerHTML = '';

        if (!baristas || baristas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay baristas registrados</td></tr>`;
            return;
        }

        baristas.forEach(barista => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td><strong>${barista.nombre}</strong></td>
                <td><code>${barista.pin}</code></td>
                <td>
                    <button class="btn-buscar" style="padding: 2px 8px; font-size:11px; background-color: #ff9800;" onclick="prepararEdicionBarista(${barista.id}, '${barista.nombre}', '${barista.pin}')">✏️</button>
                    <button class="btn-limpiar" style="padding: 2px 8px; font-size:11px; background-color: #dc2626; color:white; margin:0;" onclick="eliminarBarista(${barista.id})">🗑️</button>
                </td>
            `;
            tbody.appendChild(fila);
        });
    } catch (error) {
        console.error('❌ Error al obtener baristas:', error);
        const tbody = document.getElementById('tablaBaristas');
        if (tbody) tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: red;">Error al conectar con la BD del Servidor</td></tr>`;
    }
}

// Formulario para Registrar / Editar Barista de forma persistente
document.getElementById('formBarista').addEventListener('submit', async (e) => {
    e.preventDefault();
    const idInput = document.getElementById('barista_id').value;
    const nombreInput = document.getElementById('barista_nombre').value.trim();
    const pinInput = document.getElementById('barista_pin').value.trim();

    if (pinInput.length !== 4 || isNaN(pinInput)) {
        alert("⚠️ El PIN debe tener exactamente 4 números enteros.");
        return;
    }

    try {
        if (idInput) {
            await axios.put(`/baristas/${idInput}`, { nombre: nombreInput, pin: pinInput });
            alert("✅ Datos del barista corregidos con éxito.");
        } else {
            await axios.post('/baristas', { nombre: nombreInput, pin: pinInput });
            alert("➕ Barista registrado y guardado en la Base de Datos.");
        }
        
        limpiarFormularioBarista();
        obtenerBaristasBD(); 
    } catch (error) {
        console.error('❌ Error al guardar el barista:', error);
        alert('Hubo un error al guardar en el servidor local.');
    }
});

function prepararEdicionBarista(id, nombre, pin) {
    document.getElementById('barista_id').value = id;
    document.getElementById('barista_nombre').value = nombre;
    document.getElementById('barista_pin').value = pin;

    document.getElementById('btnGuardarBarista').innerText = "💾 GUARDAR CAMBIOS";
    document.getElementById('btnGuardarBarista').style.backgroundColor = "#ff9800";
    document.getElementById('btnCancelarEdicion').style.display = "inline-block";
}
window.prepararEdicionBarista = prepararEdicionBarista;

document.getElementById('btnCancelarEdicion').addEventListener('click', limpiarFormularioBarista);

function limpiarFormularioBarista() {
    document.getElementById('barista_id').value = '';
    document.getElementById('formBarista').reset();
    document.getElementById('btnGuardarBarista').innerText = "➕ REGISTRAR BARISTA";
    document.getElementById('btnGuardarBarista').style.backgroundColor = "#28a745";
    document.getElementById('btnCancelarEdicion').style.display = "none";
}

async function eliminarBarista(id) {
    if (confirm("❌ ¿Estás seguro de que quieres dar de baja a este barista de la Base de Datos?")) {
        try {
            await axios.delete(`/baristas/${id}`);
            obtenerBaristasBD(); 
        } catch (error) {
            console.error('Error al eliminar:', error);
            alert('No se pudo borrar el registro del servidor.');
        }
    }
}
window.eliminarBarista = eliminarBarista;

// --- 📊 MÓDULO REPORTES / LISTADO REAL DE CLIENTES ---
async function obtenerClientesReporteBD() {
    const tbody = document.getElementById('tablaClientesReporte');
    if (!tbody) return;

    try {
        const respuesta = await axios.get('/clientes'); 
        const clientes = respuesta.data;
        tbody.innerHTML = '';

        if (!clientes || clientes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No hay clientes registrados todavía</td></tr>`;
            return;
        }

        clientes.forEach(c => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${c.nombre} ${c.apellido || ''}</td>
                <td>${c.celular || 'Sin celular'}</td>
                <td><span style="background:#18405c; color:white; padding:2px 6px; border-radius:4px; font-weight:bold;">${c.puntos} ⭐</span></td>
            `;
            tbody.appendChild(fila);
        });
    } catch (err) {
        console.error("❌ Error al traer clientes de reporte:", err);
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; color: red;">Error al consultar tabla clientes</td></tr>`;
    }
}

// --- 💾 ENVÍO DEL FORMULARIO DE CAMPAÑA ---
document.getElementById('formAdmin').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Captura los datos nuevos limpios alineados al nuevo index.html
    const datosCampana = {
        promo_del_dia: document.getElementById('promo_del_dia').value.trim(),
        regalo_cumpleanos: document.getElementById('regalo_cumpleanos').value.trim(),
        cumple_plazo_dias: parseInt(document.getElementById('cumple_plazo_dias').value, 10),
        producto_nombre: document.getElementById('producto_nombre').value.trim(),
        puntos_necesarios: parseInt(document.getElementById('puntos_necesarios').value, 10)
    };

    try {
        await axios.post('/clientes/config-admin', datosCampana);
        alert("✅ ¡Configuración de campaña guardada con éxito!");
    } catch (error) {
        console.error(error);
        alert("❌ Error al persistir la campaña.");
    }
});

// --- 🔒 CERRAR SESIÓN ---
document.getElementById('btnCerrarSesion').addEventListener('click', () => {
    localStorage.clear(); 
    alert("🔒 Sesión cerrada de forma segura.");
    window.location.href = "/login.html";
});

// --- 📲 GENERADOR DE QR EN EL CARTEL DEL MOSTRADOR ---
function generarQrMostrador() {
    setTimeout(() => {
        const contenedor = document.getElementById("qrcodeContenedor");
        if (!contenedor) return;

        contenedor.innerHTML = ""; // Limpieza estricta de duplicados

        // Funciona dinámicamente: localhost en desarrollo y jaqaku.com en AWS
        const urlAppCliente = `${window.location.origin}`;
        if (typeof QRCode === "undefined") {
            console.error("La librería QRCode no está disponible globalmente.");
            return;
        }

        new QRCode(contenedor, {
            text: urlAppCliente,
            width: 160,
            height: 160,
            colorDark : "#18405c", 
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
    }, 60); 
}