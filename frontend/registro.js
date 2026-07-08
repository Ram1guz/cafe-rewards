document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnRegistrarCliente').addEventListener('click', registrarClienteCliente);
});

async function registrarClienteCliente() {
    const data = {
        nombre: document.getElementById("nombre").value.trim(),
        apellido: document.getElementById("apellido").value.trim(),
        celular: document.getElementById("celular").value.trim(),
        correo: document.getElementById("correo").value.trim() || null
    };

    if (!data.nombre || !data.apellido || !data.celular) {
        alert("⚠️ Por favor ingresa tu Nombre, Apellido y Celular para poder registrarte.");
        return;
    }

    try {
        // 🎯 MEJORA DE ARQUITECTURA: Usamos la ruta relativa. 
        // Nginx se encargará de redirigir al puerto 3000 de forma transparente tanto en local como en la nube.
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
        alert("❌ Ocurrió un error al procesar tu registro. Por favor verifica los datos o solicita ayuda en caja.");
    }
}