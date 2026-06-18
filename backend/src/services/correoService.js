import nodemailer from 'nodemailer';

// 💡 Configuración optimizada y fija para Gmail
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // <-- Forzamos a que apunte a Google y no a localhost
  port: 465,              // Port seguro SSL
  secure: true,           
  auth: {
    user: process.env.EMAIL_USER, // Esto sí lo jala del .env (ramiguz@gmail.com)
    pass: process.env.EMAIL_PASS, // Esto sí lo jala del .env (uvttygkrtlequwgg)
  },
});

/**
 * Función global para enviar correos electrónicos
... el resto del código lo dejas igual ...

/**
 * Función global para enviar correos electrónicos
 * @param {string} para - Correo del cliente destinatario
 * @param {string} asunto - Asunto del correo
 * @param {string} contenidoHtml - La plantilla que genera el archivo plantillasCorreo.js
 */
export const enviarCorreo = async (para, asunto, contenidoHtml) => {
  try {
    const opciones = {
      from: `"☕ Café Rewards" <${process.env.EMAIL_USER}>`,
      to: para,
      subject: asunto,
      html: contenidoHtml,
    };

    const info = await transporter.sendMail(opciones);
    console.log(`📩 [Nodemailer] Correo enviado con éxito a ${para}. ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ [Nodemailer] Error al enviar correo a ${para}:`, error);
    return false;
  }
};