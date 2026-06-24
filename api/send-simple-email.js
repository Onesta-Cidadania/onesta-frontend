/**
 * Serverless Function para envio de email simples (teste)
 * Executado na Vercel como Serverless Function
 *
 * Body: { message: string }
 */

import nodemailer from 'nodemailer';

const EMAIL_FROM = `Onesta <${process.env.EMAIL_USER}>`;

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message) {
      return res.status(400).json({ success: false, error: 'O campo "message" é obrigatório.' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: EMAIL_FROM,
      to: process.env.EMAIL_DESTINO,
      subject: `📧 Teste de Email - ${new Date().toLocaleString('pt-BR')}`,
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('❌ Erro ao enviar email simples:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}