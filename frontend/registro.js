document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnRegistrarCliente').addEventListener('click', registrarClienteCliente);
});

async function registrarClienteCliente() {
    // Capturamos el valor del celular de forma segura como texto antes de limpiarlo
    const celularRaw = document.getElementById("celular").value;
    const celularTexto = celularRaw ? celularRaw.toString().trim() : "";

    const data = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        celular: celularTexto,
        correo: document.getElementById("correo").value.trim() || null
    };

    // Validación visual de campos obligatorios
    if (!data.nombre || !data.apellido || !data.celular) {
        alert("⚠️ Por favor ingresa tu Nombre, Apellido y Celular para poder registrarte.");
        return;
    }

    try {
        // 🎯 Usamos la ruta relativa compartida para desarrollo y producción
        const respuesta = await axios.post('/clientes', data);
        const clienteCreado = respuesta.data;

        // Extraemos el ID real devuelto por Postgres
        const idReal = clienteCreado.id || clienteCreado.insertId; 

        if (!idReal) {
            throw new Error("El servidor no devolvió un ID de cliente válido.");
        }

        // 🧠 💾 Guardamos el ID en la memoria interna del teléfono
        localStorage.setItem("jaqaku_cliente_id", idReal);

        alert("✅ ¡Te has registrado correctamente en Jaqaku Club!");

        // 🚀 Redirección limpia al espacio interactivo del cliente
        window.location.href = `/cliente.html?id=${idReal}`;

    } catch (error) {
        console.error("❌ Error en registro:", error);
        
        // 💡 MEJORA: Validamos si el backend detectó que el celular ya existe (Conflicto 409)
        if (error.response && error.response.status === 409) {
            alert("📢 Este número de celular ya está registrado. Si necesitas actualizar tus datos, por favor solicita ayuda en caja.");
        } else {
            // Error genérico para caídas de red o fallas internas
            alert("❌ Ocurrió un error al procesar tu registro. Por favor verifica los datos o solicita ayuda en caja.");
        }
    }
}