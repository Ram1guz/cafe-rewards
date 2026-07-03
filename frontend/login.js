let pinAcumulado = "";
const MAX_PIN_LENGTH = 4;

const pinDisplay = document.getElementById("pinDisplay");
const errorMsg = document.getElementById("errorMsg");

function agregarNumero(numero) {
    if (pinAcumulado.length < MAX_PIN_LENGTH) {
        pinAcumulado += numero;
        actualizarPantalla();
        if (errorMsg) errorMsg.innerText = "";
    }
}

function limpiarPin() {
    pinAcumulado = "";
    actualizarPantalla();
    if (errorMsg) errorMsg.innerText = "";
}

function actualizarPantalla() {
    if (pinDisplay) {
        pinDisplay.innerText = "•".repeat(pinAcumulado.length);
    }
}

async function enviarPin() {
    if (pinAcumulado.length < 4) {
        if (errorMsg) errorMsg.innerText = "⚠️ El PIN debe ser de 4 dígitos";
        return;
    }

    try {
        const respuesta = await axios.post('/api/auth/login', { pin: pinAcumulado });
        
        // Extraemos los datos que modificamos en el backend (incluyendo el id del usuario)
        const { token, usuario } = respuesta.data;
        
        // Guardamos todo de forma limpia en el localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("usuarioId", usuario.id);
        localStorage.setItem("usuarioNombre", usuario.nombre);
        localStorage.setItem("usuarioRol", usuario.rol);

      // REDIRECCIÓN LIMPIA Y SEPARADA SEGÚN ROL
        if (usuario.rol === "ADMIN") {
            window.location.href = "/admin"; // 🛠️ ¡Directo al panel de control!
        } else if (usuario.rol === "BARISTA") {
            window.location.href = "/barista.html"; // ☕ ¡Directo a su nuevo mostrador limpio!
        } else {
            if (errorMsg) errorMsg.innerText = "❌ Rol no reconocido";
        }

    } catch (error) {
        console.error(error);
        if (errorMsg) {
            if (error.response && error.response.data && error.response.data.error) {
                errorMsg.innerText = `❌ ${error.response.data.error}`;
            } else {
                errorMsg.innerText = "❌ No se pudo conectar con el servidor";
            }
        }
        limpiarPin();
    }
}