/**
 * Genera el diseño HTML para el correo de cumpleaños
 * @param {string} nombreCliente - Nombre del cumpleañero
 * @param {string} premioEspecie - Descripción del obsequio físico
 * @param {string} fechaVence - Fecha límite real (Ej: 02/06/2026)
 */
export const obtenerPlantillaCumpleanos = (nombreCliente, premioEspecie, fechaVence) => {
  // Si por algún motivo la fecha no llega, le ponemos un texto seguro de respaldo
  const fechaLimite = fechaVence || "los próximos 7 días";

  return `
    <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 2px solid #18405c;">
        
        <div style="background-color: #18405c; padding: 25px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 26px; font-family: Arial, sans-serif;">¡Muchas Felicidades, ${nombreCliente}! ☕🎉</h1>
        </div>
        
        <div style="padding: 30px; color: #333333; line-height: 1.6; text-align: center;">
          <p style="font-size: 16px; margin-top: 0;">En este día tan especial, en <strong>Jacaqu Café</strong> queremos celebrar contigo.</p>
          
          <div style="background-color: #eef5f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 5px solid #18405c;">
            <p style="margin: 0; font-size: 14px; color: #555;">Tu obsequio exclusivo de cumpleaños:</p>
            <p style="margin: 5px 0 0 0; font-size: 18px; color: #18405c; font-weight: bold;">
              🎁 ${premioEspecie}
            </p>
          </div>
          
          <div style="background-color: #fff0f0; border: 1px dashed #cc0000; padding: 15px; border-radius: 8px; margin-top: 25px;">
            <p style="margin: 0; font-size: 15px; color: #cc0000; font-weight: bold;">
              ⚠️ ¿Cómo reclamarlo?
            </p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #333;">
              Pasa por caja en nuestro local, muestra este mensaje al barista y reclama tu premio en especie.
              <br>
              <strong style="color: #cc0000; font-size: 15px;">¡Válido únicamente hasta el ${fechaLimite}!</strong>
            </p>
          </div>

          <p style="margin-top: 30px; font-size: 12px; color: #777; margin-bottom: 0;">Gracias por ser parte de nuestra familia Café Rewards.</p>
        </div>

      </div>
    </div>
  `;
};