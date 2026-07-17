let html5QrcodeScanner = null;
let clienteSeleccionadoId = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificación de Seguridad Obligatoria
    const token = localStorage.getItem("token");
    const nombreUsuario = localStorage.getItem("usuarioNombre");
    const rolUsuario = localStorage.getItem("usuarioRol");
    
    if (!token || rolUsuario !== "BARISTA") {
        alert("Acceso no autorizado. Por favor inicia sesión.");
        localStorage.clear();
        window.location.href = "/login.html";
        return;
    }

    const tagBarista = document.getElementById("tagBarista");
    if (tagBarista) tagBarista.innerHTML = `Panel del Barista: <strong>${nombreUsuario}</strong>`;

    // 2. Asignación de Eventos según el HTML de Producción
    document.getElementById('btnCerrarSesion').addEventListener('click', cerrarSesion);
    document.getElementById('btnAbrirCamara').addEventListener('click', alternarCamara);
    document.getElementById('btnBuscar').addEventListener('click', buscarClienteManual);
    document.getElementById('btnRegistrar').addEventListener('click', registrarClienteManual);
    document.getElementById('btnEditar').addEventListener('click', habilitarEdicion);
    document.getElementById('btnGuardarCambios').addEventListener('click', guardarCambiosCliente);
    document.getElementById('btnSumarPunto').addEventListener('click', sumarPuntoCliente);
    document.getElementById('btnCanjearPremio').addEventListener('click', canjearPremioCliente);
    document.getElementById('btnCerrarPerfil').addEventListener('click', cerrarPerfilCliente);
    document.getElementById('btnLimpiar').addEventListener('click', limpiarFormulario);

    // Por defecto los campos empiezan habilitados para buscar/registrar
    bloquearCamposFormulario(false);
});

// --- 🔒 CONTROL DE SESIÓN ---
function cerrarSesion() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(err => console.error(err));
    }
    localStorage.clear();
    window.location.href = "/login.html";
}

// --- 📷 CONTROL DEL ESCÁNER QR ---
function alternarCamara() {
    const readerDiv = document.getElementById("reader");
    
    if (!html5QrcodeScanner) {
        readerDiv.classList.remove("hidden");
        
        // Configuración blindada para tablets: solo activa la cámara física
        html5QrcodeScanner = new Html5QrcodeScanner("reader", { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            // 🎯 ESTA LÍNEA ELIMINA EL BOTÓN DE SUBIR IMAGENES Y ARCHIVOS COLOQUIALES
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        }, false);
        
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        document.getElementById('btnAbrirCamara').innerText = "🛑 CERRAR CÁMARA";
    } else {
        apagarCamara();
    }
}

function apagarCamara() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().then(() => {
            html5QrcodeScanner = null;
            document.getElementById("reader").classList.add("hidden");
            document.getElementById('btnAbrirCamara').innerText = "📷 ESCANEAR QR CLIENTE";
        }).catch(err => console.error(err));
    }
}

// --- 🔍 BÚSQUEDA, REGISTRO Y EDICIÓN ---
function onScanSuccess(decodedText) {
    apagarCamara();
    
    try {
        const urlObj = new URL(decodedText);
        const idExtraido = urlObj.searchParams.get("id");
        
        if (idExtraido) {
            console.log(`🎯 QR Escaneado con éxito. ID de Cliente detectado: ${idExtraido}`);
            cargarPerfilCliente(idExtraido);
        } else {
            if (!isNaN(decodedText) && decodedText.trim() !== "") {
                cargarPerfilCliente(decodedText.trim());
            } else {
                alert("⚠️ El código QR escaneado no contiene un formato de cliente válido.");
            }
        }
    } catch (err) {
        if (!isNaN(decodedText) && decodedText.trim() !== "") {
            cargarPerfilCliente(decodedText.trim());
        } else {
            console.error("Error al procesar el texto del QR:", err);
            alert("⚠️ Código QR ilegible o formato no soportado.");
        }
    }
}

function onScanFailure(error) {}

async function buscarClienteManual() {
    const nombre = document.getElementById("nombre").value.trim().toLowerCase();
    const apellido = document.getElementById("apellido").value.trim().toLowerCase();
    const celular = document.getElementById("celular").value.trim();

    const tieneNombreCompleto = nombre && apellido;
    const tieneCelular = celular !== "";

    if (!tieneNombreCompleto && !tieneCelular) {
        alert("⚠️ Ingresa el [Nombre Y Apellido] combinados para evitar homónimos, O busca directamente por el [Celular].");
        return;
    }

    try {
        const respuesta = await axios.get('/clientes');
        const clientes = respuesta.data;

        const encontrado = clientes.find(c => {
            if (tieneCelular && c.celular === celular) return true;
            if (tieneNombreCompleto && c.nombre.toLowerCase() === nombre && c.apellido?.toLowerCase() === apellido) return true;
            return false;
        });

        if (!encontrado) {
            alert("❌ Cliente no encontrado.");
            return;
        }

        cargarPerfilCliente(encontrado.id);
    } catch (error) {
        console.error(error);
        alert("❌ Error en el servidor de búsqueda.");
    }
}

async function registrarClienteManual() {
    const data = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        celular: document.getElementById("celular").value.trim(),
        correo: document.getElementById("correo").value.trim() || null
    };

    if (!data.nombre || !data.apellido || !data.celular) {
        alert("⚠️ Nombre, Apellido y Celular son obligatorios para registrar.");
        return;
    }

    try {
        const respuesta = await axios.post('/clientes', data);
        alert("✅ ¡Cliente registrado con éxito!");
        cargarPerfilCliente(respuesta.data.id);
    } catch (error) {
        console.error(error);
        alert("❌ Error al registrar cliente.");
    }
}

// --- 👤 CONTROL DE PERFIL ACTIVO ---
async function cargarPerfilCliente(id) {
    clienteSeleccionadoId = id;
    try {
        const respuesta = await axios.get(`/clientes/${id}/panel-fidelidad`);
        const datos = respuesta.data;

        if (datos && datos.cliente) {
            const c = datos.cliente;

            // 1. Pintar sección superior de puntos
            document.getElementById("nombreCliente").innerText = `👤 ${c.nombreCompleto || (c.nombre + ' ' + c.apellido)}`;
            
            // 🛠️ FIX CELULAR: Aseguramos que use el valor limpio de la respuesta de la BD
            document.getElementById("infoAdicional").innerText = `📱 Celular: ${c.celular ? c.celular : 'Sin número'}`;
            
            document.getElementById("displayPuntos").innerText = c.puntosActuales !== undefined ? c.puntosActuales : (c.puntos || 0);
            document.getElementById("promoDiaDisplay").innerText = datos.promocionDelDia || "Ninguna";

            // Mensaje Cumpleaños
            const cumpleDiv = document.getElementById("mensajeCumpleDisplay");
            if (datos.cumpleanos && datos.cumpleanos.esHoy) {
                cumpleDiv.innerText = datos.cumpleanos.mensajeEspecial;
                cumpleDiv.classList.remove("hidden");
            } else {
                cumpleDiv.classList.add("hidden");
            }

            // 2. Rellenar el formulario manual con los datos reales encontrados
            document.getElementById("nombre").value = c.nombre || "";
            document.getElementById("apellido").value = c.apellido || "";
            document.getElementById("celular").value = c.celular || "";
            document.getElementById("correo").value = c.correo || "";
            
            // 🛠️ FIX CUMPLEANOS: Cargamos el input de fecha si viene en la respuesta
            const fechaInput = document.getElementById("fecha_nacimiento");
            if (fechaInput) {
                if (c.fecha_nacimiento) {
                    fechaInput.value = c.fecha_nacimiento.split('T')[0];
                } else if (c.fecha_registro) {
                    // Fallback preventivo
                    fechaInput.value = "";
                }
            }
            
            // Bloqueamos los inputs inicialmente para que no se alteren sin querer
            bloquearCamposFormulario(true);

            // 3. Control de visibilidad de botones
            document.getElementById("btnBuscar").style.display = "none";
            document.getElementById("btnRegistrar").style.display = "none";
            document.getElementById("btnEditar").style.display = "inline-block";
            document.getElementById("btnGuardarCambios").style.display = "none";

            // Forzamos la visibilidad al navegador inyectando !important inline
            document.getElementById("puntosContenedor").style.setProperty("display", "block", "important");
            document.getElementById("seccionManual").style.setProperty("display", "block", "important");

            // Quitamos las clases hidden por si acaso
            document.getElementById("puntosContenedor").classList.remove("hidden");
            document.getElementById("seccionManual").classList.remove("hidden");
        }
    } catch (error) {
        console.error(error);
        alert("❌ Error al cargar los datos del cliente.");
    }
}

function habilitarEdicion() {
    bloquearCamposFormulario(false);
    document.getElementById("btnEditar").style.display = "none";
    document.getElementById("btnGuardarCambios").style.display = "inline-block";
}

async function guardarCambiosCliente() {
    if (!clienteSeleccionadoId) return;

    const data = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        celular: document.getElementById("celular").value.trim(),
        correo: document.getElementById("correo").value.trim() || null
    };

    try {
        await axios.put(`/clientes/${clienteSeleccionadoId}`, data);
        alert("💾 ¡Datos actualizados correctamente!");
        cargarPerfilCliente(clienteSeleccionadoId);
    } catch (error) {
        console.error(error);
        alert("❌ No se pudieron guardar los cambios.");
    }
}

async function sumarPuntoCliente() {
    if (!clienteSeleccionadoId) return;
    
    const baristaId = localStorage.getItem("usuarioId");

    try {
        await axios.patch(`/clientes/${clienteSeleccionadoId}/sumar-puntos`, {
            usuarioId: baristaId ? parseInt(baristaId, 10) : null
        });
        alert("⭐ ¡Punto acumulado correctamente!");
        cargarPerfilCliente(clienteSeleccionadoId);
    } catch (error) {
        console.error(error);
        alert("❌ No se pudo sumar el punto.");
    }
}

function cerrarPerfilCliente() {
    clienteSeleccionadoId = null;
    
    document.getElementById("puntosContenedor").style.setProperty("display", "none", "important");
    document.getElementById("seccionManual").style.setProperty("display", "block", "important");
    
    document.getElementById("btnBuscar").style.display = "inline-block";
    document.getElementById("btnRegistrar").style.display = "inline-block";
    document.getElementById("btnEditar").style.display = "none";
    document.getElementById("btnGuardarCambios").style.display = "none";
    
    bloquearCamposFormulario(false);
    limpiarFormulario();
}

// --- 🔧 UTILIDADES ---
function bloquearCamposFormulario(bloquear) {
    document.getElementById("nombre").disabled = bloquear;
    document.getElementById("apellido").disabled = bloquear; // 🛠️ FIX: Se removió la doble asignación rota
    document.getElementById("celular").disabled = bloquear;
    document.getElementById("correo").disabled = bloquear;
    const fecha = document.getElementById("fecha_nacimiento");
    if (fecha) fecha.disabled = bloquear;
    const mkt = document.getElementById("acepta_marketing");
    if (mkt) mkt.disabled = bloquear;
}

function limpiarFormulario() {
    document.getElementById("nombre").value = "";
    document.getElementById("apellido").value = "";
    document.getElementById("celular").value = "";
    document.getElementById("correo").value = "";
    const fecha = document.getElementById("fecha_nacimiento");
    if (fecha) fecha.value = "";
    const mkt = document.getElementById("acepta_marketing");
    if (mkt) mkt.checked = false;
}

async function canjearPremioCliente() {
    if (!clienteSeleccionadoId) return alert("⚠️ Primero debes escanear o buscar a un cliente.");

    const confirmar = confirm("¿Estás seguro de entregar el premio y descontar los puntos de este cliente?");
    if (!confirmar) return;

    const baristaId = localStorage.getItem("usuarioId");

    try {
        const respuesta = await axios.post(`/clientes/${clienteSeleccionadoId}/recompensa`, {
            productoId: 1, 
            usuarioId: baristaId ? parseInt(baristaId, 10) : null
        });

        alert(`🎁 ${respuesta.data.mensaje}`);
        cargarPerfilCliente(clienteSeleccionadoId);

    } catch (error) {
        console.error("❌ Error al procesar el canje:", error);
        if (error.response && error.response.data && error.response.data.error) {
            alert(`⚠️ No se pudo realizar el canje: ${error.response.data.error}`);
        } else {
            alert("❌ Ocurrió un error al conectar con el servidor para aplicar el premio.");
        }
    }
}