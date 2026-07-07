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
        // Envió de datos al servidor local
        const respuesta = await axios.post('http://192.168.100.123:3000/clientes', data);
        const clienteCreado = respuesta.data;

        alert("✅ ¡Te has registrado correctamente en Jaqaku Club!");

        // Alternancia de pantallas
        document.getElementById("formularioRegistroCard").classList.add("hidden");
        document.getElementById("seccionExitoCard").classList.remove("hidden");

        // Mapeo de datos del cliente
        document.getElementById("txtClienteNombre").innerText = `${clienteCreado.nombre} ${clienteCreado.apellido}`;
        document.getElementById("txtClienteCelular").innerText = `📱 Celular: ${clienteCreado.celular}`;

        // Selección y limpieza absoluta del contenedor del QR
        const elementoQR = document.getElementById("qrcodeContenedor");
        elementoQR.innerHTML = "";

        // URL definitiva apuntando a la visualización del cliente
        const urlQRCliente = `http://192.168.100.123/cliente.html?id=${clienteCreado.id}`;

        // Generación del código QR acoplado a la librería oficial
        new QRCode(elementoQR, {
            text: urlQRCliente,
            width: 200,
            height: 200,
            colorDark: "#18405c", 
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });

        console.log("🎯 ¡QR generado limpiamente sin usar canvas!");

    } catch (error) {
        console.error("Error en registro:", error);
        alert("❌ Ocurrió un error al procesar tu registro. Por favor verifica los datos o solicita ayuda en caja.");
    }
}