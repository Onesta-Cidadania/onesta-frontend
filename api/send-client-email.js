/**
 * Serverless Function para envio de email de confirmação ao cliente
 * Executado na Vercel como Serverless Function
 *
 * Body: { agendamento }
 */

import nodemailer from 'nodemailer';
import gerarTxt from '../lib/emails/templates/agendamentoTxt.js';
import gerarHTMLConfirmacaoCliente from '../lib/emails/templates/agendamentoClienteTemplate.js';
import mapAgendamento from '../lib/emails/utils/mapAgendamento.js';

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
    const { agendamento: rawAgendamento } = req.body || {};

    if (!rawAgendamento) {
      return res.status(400).json({
        success: false,
        error: 'Dados do agendamento são obrigatórios.'
      });
    }

    const agendamento = mapAgendamento(rawAgendamento);

    if (!agendamento.codigo_agendamento || !agendamento.titular_email || !agendamento.titular_nome_completo) {
      return res.status(400).json({
        success: false,
        error: 'Dados do agendamento (código, email e nome) são obrigatórios.'
      });
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
      to: agendamento.titular_email,
      subject: `✅ Requerimento cadastrado - Agendamento de Primeiro Passaporte - São Paulo`,
      html: gerarHTMLConfirmacaoCliente(agendamento),
      attachments: [
        {
          filename: `(${agendamento.codigo_agendamento}) ${agendamento.titular_nome_completo}.txt`,
          content: gerarTxt(agendamento)
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de confirmação enviado para cliente: ${agendamento.titular_email} - ${info.messageId}`);

    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('❌ Erro ao enviar email para cliente:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}