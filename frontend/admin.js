const API_CONFIG_URL = '/clientes/config-admin';

// Al cargar la página, traemos la última configuración guardada
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const respuesta = await axios.get(API_CONFIG_URL);
        if (respuesta.data) {
            document.getElementById('promo_del_dia').value = respuesta.data.promo_del_dia || '';
            document.getElementById('cumple_regalo_desc').value = respuesta.data.cumple_regalo_desc || '';
            document.getElementById('cumple_puntos_bono').value = respuesta.data.cumple_puntos_bono || 0;
            
            // ⏳ AGREGADO: Carga el plazo de días guardado para que aparezca en la cajita al abrir la página
            document.getElementById('cumple_plazo_dias').value = respuesta.data.cumple_plazo_dias || 7;
        }
    } catch (err) {
        console.log("ℹ️ Primera configuración o servidor desconectado. Se iniciará con campos vacíos.");
    }
});

// Enviar los datos modificados al servidor
document.getElementById('formAdmin').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Captura de datos (¡Esto lo tenías perfecto!)
    const datos = {
        promo_del_dia: document.getElementById('promo_del_dia').value,
        cumple_regalo_desc: document.getElementById('cumple_regalo_desc').value,
        cumple_puntos_bono: document.getElementById('cumple_puntos_bono').value,
        cumple_plazo_dias: document.getElementById('cumple_plazo_dias').value 
    };

    try {
        const respuesta = await axios.post(API_CONFIG_URL, datos);
        alert("🎉 ¡Configuración actualizada con éxito! Los baristas verán los cambios de inmediato.");
    } catch (err) {
        console.error("❌ Error al guardar:", err);
        alert("Error de conexión con el servidor (Puerto 3000) al intentar guardar.");
    }
});