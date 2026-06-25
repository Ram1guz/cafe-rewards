let pinAcumulado = "";
const MAX_PIN_LENGTH = 4;

const pinDisplay = document.getElementById("pinDisplay");
const errorMsg = document.getElementById("errorMsg");

// 1. Función para ir agregando los números al presionar el teclado
function agregarNumero(numero) {
    if (pinAcumulado.length < MAX_PIN_LENGTH) {
        pinAcumulado += numero;
        actualizarPantalla();
        errorMsg.innerText = ""; // Limpia errores previos al escribir
    }
}

// 2. Función para borrar todo y empezar de nuevo (Botón C)
function limpiarPin() {
    pinAcumulado = "";
    actualizarPantalla();
    errorMsg.innerText = "";
}

// 3. Muestra asteriscos en la pantalla en lugar de los números reales
function actualizarPantalla() {
    // Si hay texto, lo llena con asteriscos '•' según el largo
    pinDisplay.innerText = "•".repeat(pinAcumulado.length);
}

// 4. Enviar el PIN al backend para validar (Botón ✓)
async function enviarPin() {
    if (pinAcumulado.length < 4) {
        errorMsg.innerText = "⚠️ El PIN debe ser de 4 dígitos";
        return;
    }

    try {
        // Hacemos la petición POST usando la ruta relativa que configuramos
        const respuesta = await axios.post('/api/auth/login', { pin: pinAcumulado });
        
        const { usuario } = respuesta.data;
        
        // Guardamos temporalmente en el navegador quién inició sesión
        localStorage.setItem("usuarioNombre", usuario.nombre);
        localStorage.setItem("usuarioRol", usuario.rol);

        // Redirección según el rol que nos devolvió el backend
        if (usuario.rol === "ADMIN") {
            window.location.href = "/admin.html";
        } else if (usuario.rol === "BARISTA") {
            window.location.href = "/index.html"; // Tu panel actual de barista
        } else {
            errorMsg.innerText = "❌ Rol no reconocido por el sistema";
        }

    } catch (error) {
        console.error(error);
        if (error.response && error.response.data) {
            errorMsg.innerText = `❌ ${error.response.data.error}`;
        } else {
            errorMsg.innerText = "❌ No se pudo conectar con el servidor";
        }
        limpiarPin();
    }
}