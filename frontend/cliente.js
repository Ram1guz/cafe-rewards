document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener el ID del cliente desde la barra de direcciones (URL)
    // Ejemplo: /cliente?id=1
    const urlParams = new URLSearchParams(window.location.search);
    const clienteId = urlParams.get('id');

    if (!clienteId) {
        document.getElementById('nombreCliente').innerText = "❌ Error: Enlace inválido";
        return;
    }

    // 🚀 MEJORA CRÍTICA: Generamos el QR por imagen inmediatamente al cargar.
    // Así, si el backend está caído o usas Live Server, ¡el QR se dibuja siempre!
    generarQrClienteId(clienteId);

    // URL base de tu API expuesta por el backend
    const API_URL = `/clientes/${clienteId}/panel-fidelidad`;

    try {
        // 2. Hacer la petición al backend unificado
        const respuesta = await axios.get(API_URL);
        const datos = respuesta.data;

        if (datos) {
            // 3. Pintar la información del cliente real traída de Postgres
            document.getElementById('nombreCliente').innerText = `👋 ¡Hola, ${datos.cliente.nombreCompleto}!`;
            document.getElementById('puntosActuales').innerText = datos.cliente.puntosActuales;
            document.getElementById('promoDia').innerText = datos.promocionDelDia || "¡Disfruta del mejor café hoy!";

            // 4. Mostrar alerta si hoy es su cumpleaños
            if (datos.cumpleanos && datos.cumpleanos.esHoy) {
                const alerta = document.getElementById('alertaCumple');
                if (alerta) {
                    alerta.innerText = datos.cumpleanos.mensajeEspecial;
                    alerta.style.display = 'block';
                }
            }
        }

    } catch (error) {
        console.error("❌ Error al cargar datos del servidor:", error);
        // Salvavidas visual: Evita que la pantalla asuste al usuario si hay un microcorte
        document.getElementById('nombreCliente').innerText = "👋 ¡Bienvenido a Jacaqu Café!";
        document.getElementById('promoDia').innerText = "¡Pide tu café favorito y acumula estrellas!";
    }
});

// --- 📲 FUNCIÓN INTERNA BLINDADA PARA EL QR POR IMAGEN ---
function generarQrClienteId(clienteId) {
    const contenedor = document.getElementById("qrcode");
    if (!contenedor) {
        console.error("❌ No se encontró el contenedor 'qrcode' en el HTML");
        return;
    }

    // Limpiamos cualquier rastro de texto previo
    contenedor.innerHTML = ""; 

    try {
        // 🚀 MEJORA DE INTEGRACIÓN: Codificamos la URL completa del cliente.
        // De esta forma, cuando el mostrador (barista.js) escanee el código,
        // podrá extraer el ID de los parámetros con total precisión matemática.
        const textoQr = `${window.location.origin}/cliente?id=${clienteId}`;
        
        // Genera la imagen del QR directo usando tu azul (#18405c)
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(textoQr)}&color=18405c`;
        
        // Creamos la etiqueta <img> nativa
        const imgQr = document.createElement("img");
        imgQr.src = qrUrl;
        imgQr.alt = `Código QR del Cliente ${clienteId}`;
        imgQr.style.width = "160px";
        imgQr.style.height = "160px";
        imgQr.style.display = "block";
        imgQr.style.margin = "0 auto";
        
        // Inyectamos la imagen en la caja blanca
        contenedor.appendChild(imgQr);
        console.log(`✅ Código QR unificado inyectado con éxito para ID: ${clienteId}`);

    } catch (err) {
        console.error("❌ Error al renderizar el QR por imagen:", err);
        contenedor.innerHTML = "<span style='color:red;'>Error al dibujar QR</span>";
    }
}