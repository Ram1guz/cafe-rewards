document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener el ID del cliente desde la barra de direcciones (URL)
    // Ejemplo: http://localhost:3000/cliente.html?id=1
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('id');

    if (!clienteId) {
        document.getElementById('nombreCliente').innerText = "❌ Error: Enlace inválido";
        return;
    }

    // URL base de tu API corriendo en Docker/Ubuntu
    const API_URL = `http://localhost:3000/clientes/${clienteId}/panel-fidelidad`;

    try {
        // 2. Hacer la petición al backend unificado que creamos ayer
        const respuesta = await axios.get(API_URL);
        const datos = respuesta.data;

        if (datos) {
            // 3. Pintar la información del cliente en el HTML
            document.getElementById('nombreCliente').innerText = `👋 ¡Hola, ${datos.cliente.nombreCompleto}!`;
            document.getElementById('puntosActuales').innerText = datos.cliente.puntosActuales;
            document.getElementById('promoDia').innerText = datos.promocionDelDia || "¡Disfruta del mejor café hoy!";

            // 4. Mostrar alerta si hoy es su cumpleaños
            if (datos.cumpleanos && datos.cumpleanos.esHoy) {
                const alerta = document.getElementById('alertaCumple');
                alerta.innerText = datos.cumpleanos.mensajeEspecial;
                alerta.style.display = 'block';
            }

            // 5. 📷 GENERAR EL CÓDIGO QR AUTOMÁTICO
            // Limpiamos el contenedor por si acaso
            document.getElementById("qrcode").innerHTML = "";
            
            // Invocamos la librería qrcode.js para dibujar el ID del cliente
            new QRCode(document.getElementById("qrcode"), {
                text: clienteId.toString(), // El contenido del QR será únicamente el ID (ej: "1")
                width: 160,
                height: 160,
                colorDark : "#18405c", // QR con tu azul institucional
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H // Máxima seguridad de lectura para cámaras lentas
            });
        }

    } catch (error) {
        console.error("❌ Error al cargar el panel del cliente:", error);
        document.getElementById('nombreCliente').innerText = "☕ Conexión perdida con Jacaqu Café";
    }
});