const API_URL = '/clientes';
let html5QrCode;
let clienteActualId = null;

// --- 🔐 FUNCIÓN EXPLÍCITA PARA PINTAR EL SALUDO ---
function verificarUsuarioYSaludar() {
    const nombreBarista = localStorage.getItem("usuarioNombre");
    const contenedorSaludo = document.getElementById("saludoBarista");

    // Si el elemento no existe en el HTML todavía, salimos para evitar errores
    if (!contenedorSaludo) return;

    if (nombreBarista) {
        contenedorSaludo.innerHTML = `☕ <strong>Atendido por:</strong> ${nombreBarista}`;
    } else {
        // Si no hay sesión iniciada, redirigimos al login
        window.location.href = "/login.html";
    }
}

// --- ⚙️ INICIALIZACIÓN AL CARGAR LA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Ejecutar el saludo de inmediato en cuanto el DOM esté listo
    verificarUsuarioYSaludar();

    // 2. Configuración inicial de límites de fecha y botones
    const hoy = new Date().toISOString().split("T")[0];
    const inputFecha = document.getElementById('fecha_nacimiento');
    if (inputFecha) inputFecha.setAttribute("max", hoy);
    
    gestionarBotonesFormulario('inicio');
});

// --- 🔄 RESPALDO ULTRA SEGURO ---
// Por si el DOM va muy rápido, esta función se vuelve a asegurar cuando todo el sitio cargue visualmente
window.onload = () => {
    verificarUsuarioYSaludar();
};

// --- FUNCIONES DE CONTROL DE INTERFAZ (UI) ---

function bloquearInputs(debeBloquear) {
    if (document.getElementById('nombre')) document.getElementById('nombre').disabled = debeBloquear;
    if (document.getElementById('apellido')) document.getElementById('apellido').disabled = debeBloquear;
    if (document.getElementById('celular')) document.getElementById('celular').disabled = debeBloquear;
    if (document.getElementById('correo')) document.getElementById('correo').disabled = debeBloquear;
    if (document.getElementById('fecha_nacimiento')) document.getElementById('fecha_nacimiento').disabled = debeBloquear;
    if (document.getElementById('acepta_marketing')) document.getElementById('acepta_marketing').disabled = debeBloquear;
}

function gestionarBotonesFormulario(modo) {
    const btnRegistrar = document.getElementById('btnRegistrar');
    const btnBuscar = document.getElementById('btnBuscar');
    const btnEditar = document.getElementById('btnEditar');
    const btnGuardarCambios = document.getElementById('btnGuardarCambios');

    if (modo === 'inicio') {
        if (btnRegistrar) btnRegistrar.style.display = 'inline-block';
        if (btnBuscar) btnBuscar.style.display = 'inline-block';
        if (btnEditar) btnEditar.style.display = 'none';
        if (btnGuardarCambios) btnGuardarCambios.style.display = 'none';
    } else if (modo === 'perfil_bloqueado') {
        if (btnRegistrar) btnRegistrar.style.display = 'none';
        if (btnBuscar) btnBuscar.style.display = 'none';
        if (btnEditar) btnEditar.style.display = 'inline-block';
        if (btnGuardarCambios) btnGuardarCambios.style.display = 'none';
    } else if (modo === 'edicion') {
        if (btnRegistrar) btnRegistrar.style.display = 'none';
        if (btnBuscar) btnBuscar.style.display = 'none';
        if (btnEditar) btnEditar.style.display = 'none';
        if (btnGuardarCambios) btnGuardarCambios.style.display = 'inline-block';
    }
}

// --- VALIDACIÓN ULTRA ESTRICTA DE FORMULARIO ---
function validarDatosFormulario(nombre, apellido, celular, correo, fechaInput) {
    if (!nombre) { alert("⚠️ El campo 'Nombre' es obligatorio."); return false; }
    if (!apellido) { alert("⚠️ El campo 'Apellido' es obligatorio para el registro."); return false; }
    if (!celular) { alert("⚠️ El campo 'Celular' es obligatorio."); return false; }
    if (!/^\d+$/.test(celular)) { alert("⚠️ El celular debe ser un número entero válido."); return false; }
    
    const checkboxMarketing = document.getElementById('acepta_marketing');
    const aceptaMarketing = checkboxMarketing ? checkboxMarketing.checked : false;

    if (aceptaMarketing && (!correo || correo.trim() === "")) {
        alert("⚠️ Si el cliente acepta ofertas y marketing, debe proporcionar un correo electrónico.");
        return false;
    }

    if (correo && correo.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) { alert("⚠️ El formato del Correo Electrónico es inválido (ejemplo: usuario@correo.com)."); return false; }
    }
    
    if (fechaInput && fechaInput.trim() !== "") {
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fechaInput)) { alert("⚠️ Formato de fecha inválido."); return false; }
        
        const fechaTest = new Date(fechaInput + "T00:00:00");
        const hoy = new Date();
        if (isNaN(fechaTest.getTime()) || fechaTest > hoy) { alert("⚠️ La fecha introducida es inválida o futura."); return false; }
    }
    return true;
}

// --- LÓGICA DE LA CÁMARA ---
document.getElementById('btnAbrirCamara').addEventListener('click', () => {
    const readerDiv = document.getElementById('reader');
    readerDiv.classList.remove('hidden');
    
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
        detenerCamara();
        buscarCliente(decodedText); 
    });
});

function detenerCamara() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('reader').classList.add('hidden');
        }).catch(err => console.error("Error al detener la cámara:", err));
    }
}

// --- ACCIONES DE LA API ---

async function buscarCliente(valor) {
    try {
        const respuesta = await axios.get(API_URL, { params: { q: valor } });
        const data = respuesta.data;
        
        if (data && data.length > 0) {
            let cliente = data[0];

            if (data.length > 1) {
                let mensajePrompt = `Se encontraron ${data.length} clientes. Escribe el número del correcto:\n\n`;
                data.forEach((c, index) => {
                    mensajePrompt += `${index + 1}. ${c.nombre} ${c.apellido || ''} (Cel: ${c.celular})\n`;
                });
                
                const seleccion = prompt(mensajePrompt, "1");
                if (seleccion === null) return; 
                
                const idx = parseInt(seleccion, 10) - 1;
                if (idx >= 0 && idx < data.length) {
                    cliente = data[idx];
                } else {
                    alert("Selección inválida. Se cargará el primer resultado por defecto.");
                }
            }
            
            document.getElementById('nombre').value = cliente.nombre || '';
            document.getElementById('apellido').value = cliente.apellido || '';
            document.getElementById('celular').value = cliente.celular || '';
            
            if (document.getElementById('correo')) {
                document.getElementById('correo').value = cliente.correo || '';
            }
            
            if (document.getElementById('acepta_marketing')) {
                document.getElementById('acepta_marketing').checked = cliente.acepta_marketing || false;
            }
            
            if (cliente.fecha_nacimiento) {
                document.getElementById('fecha_nacimiento').value = cliente.fecha_nacimiento.split('T')[0];
            } else {
                document.getElementById('fecha_nacimiento').value = '';
            }

            cargarPanelFidelidadCliente(cliente.id, cliente.celular);
            
            bloquearInputs(true); 
            gestionarBotonesFormulario('perfil_bloqueado');
        } else {
            alert("No se encontró el cliente.");
        }
    } catch (err) {
        console.error(err);
        alert("Error de conexión con el servidor (Puerto 3000).");
    }
}

async function cargarPanelFidelidadCliente(id, celular) {
    clienteActualId = id;
    try {
        const respuesta = await axios.get(`${API_URL}/${id}/panel-fidelidad`);
        const panel = respuesta.data;

        document.getElementById('puntosContenedor').classList.remove('hidden');
        document.getElementById('nombreCliente').innerText = panel.cliente.nombreCompleto;
        document.getElementById('infoAdicional').innerText = `Cel: ${celular}`;
        document.getElementById('displayPuntos').innerText = panel.cliente.puntosActuales;

        const contenedorPromo = document.getElementById('promoDiaDisplay');
        if (contenedorPromo) {
            contenedorPromo.innerText = panel.promocionDelDia;
        }

        if (panel.cumpleanos.esHoy) {
            alert(`🎉 ¡ATENCIÓN BARISTA! Hoy es el cumpleaños de este cliente. \nRegalo: ${panel.cumpleanos.mensajeEspecial}`);
            const contenedorCumple = document.getElementById('mensajeCumpleDisplay');
            if (contenedorCumple) {
                contenedorCumple.innerText = panel.cumpleanos.mensajeEspecial;
                contenedorCumple.classList.remove('hidden');
            }
        } else {
            const contenedorCumple = document.getElementById('mensajeCumpleDisplay');
            if (contenedorCumple) contenedorCumple.classList.add('hidden');
        }

    } catch (err) {
        console.error("❌ Error al cargar panel de fidelidad:", err);
        document.getElementById('puntosContenedor').classList.remove('hidden');
    }
}

function mostrarPerfil(cliente) {
    cargarPanelFidelidadCliente(cliente.id, cliente.celular);
}

document.getElementById('btnSumarPunto').addEventListener('click', async () => {
    if (!clienteActualId) return;
    
    // Obtenemos de forma dinámica el ID del barista que inició sesión
    const baristaId = localStorage.getItem("usuarioId"); 

    try {
        // Le mandamos el baristaId en el cuerpo del PATCH
        const respuesta = await axios.patch(`${API_URL}/${clienteActualId}/sumar-puntos`, {
            usuarioId: baristaId 
        });
        
        document.getElementById('displayPuntos').innerText = respuesta.data.puntosTotales || respuesta.data.puntos;
        alert("¡Punto sumado con éxito!");
    } catch (err) {
        console.error(err);
        alert("Error al actualizar puntos.");
    }
});

document.getElementById('btnRegistrar').addEventListener('click', async (e) => {
    e.preventDefault(); 
    e.stopImmediatePropagation();

    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const celular = document.getElementById('celular').value.trim();
    const correo = document.getElementById('correo') ? document.getElementById('correo').value.trim() : '';
    const fechaInput = document.getElementById('fecha_nacimiento').value;
    const checkboxMarketing = document.getElementById('acepta_marketing');
    const acepta_marketing = checkboxMarketing ? checkboxMarketing.checked : false;

    if (!validarDatosFormulario(nombre, apellido, celular, correo, fechaInput)) return;

    const datos = { nombre, apellido, celular, correo: correo || null, fecha_nacimiento: fechaInput || null, acepta_marketing };
    try {
        const respuesta = await axios.post(API_URL, datos);
        alert("¡Cliente registrado exitosamente!");
        mostrarPerfil(respuesta.data);
        bloquearInputs(true);
        gestionarBotonesFormulario('perfil_bloqueado');
    } catch (err) {
        if (err.response && err.response.status === 409) {
            alert(`El celular ${datos.celular} ya existe. Cargando perfil...`);
            mostrarPerfil(err.response.data);
            bloquearInputs(true);
            gestionarBotonesFormulario('perfil_bloqueado');
        } else {
            alert("Error en el registro.");
        }
    }
});

document.getElementById('btnEditar').addEventListener('click', (e) => {
    e.preventDefault();
    bloquearInputs(false); 
    gestionarBotonesFormulario('edicion');
});

document.getElementById('btnGuardarCambios').addEventListener('click', async (e) => {
    e.preventDefault(); 
    e.stopImmediatePropagation();

    if (!clienteActualId) return;
    const nombre = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const celular = document.getElementById('celular').value.trim();
    const correo = document.getElementById('correo') ? document.getElementById('correo').value.trim() : '';
    const fechaInput = document.getElementById('fecha_nacimiento').value;
    const checkboxMarketing = document.getElementById('acepta_marketing');
    const acepta_marketing = checkboxMarketing ? checkboxMarketing.checked : false;

    if (!validarDatosFormulario(nombre, apellido, celular, correo, fechaInput)) return;

    const datosActualizados = { nombre, apellido, cellular, correo: correo || null, fecha_nacimiento: fechaInput || null, acepta_marketing };
    try {
        const respuesta = await axios.put(`${API_URL}/${clienteActualId}`, datosActualizados);
        alert("¡Datos del cliente corregidos con éxito!");
        
        bloquearInputs(true); 
        
        if (respuesta.data && respuesta.data.cliente) {
            mostrarPerfil(respuesta.data.cliente);
        } else if (respuesta.data) {
            mostrarPerfil(respuesta.data);
        }
        gestionarBotonesFormulario('perfil_bloqueado');
    } catch (err) {
        console.error("Error al guardar cambios:", err);
        alert("No se pudieron salvar los cambios de edición.");
    }
});

document.getElementById('btnBuscar').addEventListener('click', (e) => {
    e.preventDefault();
    const nombreVal = document.getElementById('nombre').value.trim();
    const celularVal = document.getElementById('celular').value.trim();
    
    const valor = celularVal || nombreVal;
    if (valor) {
        buscarCliente(valor);
    } else {
        alert("⚠️ Por favor escribe un nombre o celular para buscar.");
    }
});

function limpiarFormulario() {
    const inputs = document.querySelectorAll('input');
    inputs.forEach(i => {
        if (i.id !== 'btnAbrirCamara') {
            if (i.type === 'checkbox') i.checked = false; 
            else i.value = '';
        }
    });
    
    const contenedorPromo = document.getElementById('promoDiaDisplay');
    if (contenedorPromo) contenedorPromo.innerText = '';
    const contenedorCumple = document.getElementById('mensajeCumpleDisplay');
    if (contenedorCumple) contenedorCumple.classList.add('hidden');

    bloquearInputs(false); 
    gestionarBotonesFormulario('inicio');
    detenerCamara(); 
}

document.getElementById('btnCerrarPerfil').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('puntosContenedor').classList.add('hidden');
    clienteActualId = null;
    limpiarFormulario();
});

document.getElementById('btnLimpiar').addEventListener('click', (e) => {
    e.preventDefault();
    limpiarFormulario();
});