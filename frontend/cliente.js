document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtener el ID del cliente desde la barra de direcciones (URL)
    const urlParams = new URLSearchParams(window.location.search);
    let clienteId = urlParams.get('id');

    // 🧠 💾 RECONOCIMIENTO AUTOMÁTICO (Pegamento de Memoria)
    if (!clienteId) {
        // Si no hay ID en la URL, vamos a ver si este celular ya lo guardó antes
        clienteId = localStorage.getItem("jaqaku_cliente_id");
        
        if (clienteId) {
            // ¡Sí tenía memoria! Reescribimos la URL de inmediato con el ID recuperado
            window.location.href = `${window.location.pathname}?id=${clienteId}`;
            return;
        } else {
            // El celular está limpio y no hay ID: es un cliente nuevo, mandamos a registrar
            alert("⚠️ No encontramos tu tarjeta digital activa. Por favor, regístrate primero.");
            window.location.href = "/registro.html";
            return;
        }
    }

    // Si el cliente entró con un ID en la URL, aseguramos respaldarlo en la memoria
    localStorage.setItem("jaqaku_cliente_id", clienteId);


    // 🚀 TU LÓGICA CORE ORIGINAL INTACTA: Generamos el QR por imagen inmediatamente
    generarQrClienteId(clienteId);

    // URL base de tu API expuesta por el backend
    const API_URL = `/clientes/${clienteId}/panel-fidelidad`;

    try {
        // 2. Hacer la petición al backend unificado
        const respuesta = await axios.get(API_URL);
        const datos = respuesta.data;

        if (datos) {
            // 3. Pintar la información del cliente real traída de Postgres
            document.getElementById('nombreCliente').innerText = `👋 ¡Hola, ${datos.cliente.nombreCompleto || datos.cliente.nombre}!`;
            document.getElementById('puntosActuales').innerText = datos.cliente.puntosActuales;
            
            // ☕ TRAE LAS OFERTAS DE TU PANEL ADMIN DIRECTO AL CELULAR DEL CLIENTE
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
        // Salvavidas visual corporativo
        document.getElementById('nombreCliente').innerText = "👋 ¡Bienvenido a Jaqaku Café!";
        document.getElementById('promoDia').innerText = "¡Pide tu café favorito y acumula estrellas!";
    }
});

// --- 📲 FUNCIÓN INTERNA BLINDADA PARA EL QR POR IMAGEN (Tuya e Intacta) ---
function generarQrClienteId(clienteId) {
    const contenedor = document.getElementById("qrcode");
    if (!contenedor) {
        console.error("❌ No se encontró el contenedor 'qrcode' en el HTML");
        return;
    }

    // Limpiamos cualquier rastro de texto previo
    contenedor.innerHTML = ""; 

    try {
        // Codificamos la URL completa del cliente.
        const textoQr = `${window.location.origin}/cliente.html?id=${clienteId}`;
        
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