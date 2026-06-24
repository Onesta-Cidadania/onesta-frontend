/**
 * Serverless Function para envio de email administrativo (requerimento de passaporte)
 * Executado na Vercel como Serverless Function
 *
 * Body: { agendamento, jsoncUrl, arquivos: [{ nome, conteudoBase64 }] }
 */

import nodemailer from 'nodemailer';
import gerarTxt from '../lib/emails/templates/agendamentoTxt.js';
import gerarHTMLAgendamento from '../lib/emails/templates/agendamentoAdminTemplate.js';
import mapAgendamento from '../lib/emails/utils/mapAgendamento.js';

const EMAIL_FROM = `Onesta <${process.env.EMAIL_USER}>`;

async function baixarArquivo(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar arquivo: ${response.statusText}`);
  return response.text();
}

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
    const { agendamento: rawAgendamento, jsoncUrl, arquivos = [] } = req.body || {};

    if (!rawAgendamento || !jsoncUrl) {
      return res.status(400).json({
        success: false,
        error: 'Dados de agendamento e URL do JSONC são obrigatórios.'
      });
    }

    const agendamento = mapAgendamento(rawAgendamento);

    const [txtContent, jsoncContent] = await Promise.all([
      Promise.resolve(gerarTxt(agendamento)),
      baixarArquivo(jsoncUrl)
    ]);

    // Preparar anexos base (TXT e JSONC)
    const attachments = [
      { filename: `(${agendamento.codigo_agendamento}) ${agendamento.titular_nome_completo}.txt`, content: txtContent },
      { filename: `(${agendamento.codigo_agendamento}) ${agendamento.titular_nome_completo}.jsonc`, content: jsoncContent }
    ];

    // Adicionar arquivos do formulário (PDFs em base64)
    if (arquivos && Array.isArray(arquivos)) {
      arquivos.forEach((arquivo) => {
        if (arquivo.nome && arquivo.conteudoBase64) {
          try {
            attachments.push({
              filename: arquivo.nome,
              content: Buffer.from(arquivo.conteudoBase64, 'base64'),
              encoding: 'base64'
            });
          } catch (error) {
            console.error('Erro ao processar arquivo:', arquivo.nome, error);
          }
        }
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
      to: process.env.EMAIL_DESTINO,
      subject: `🎯 Novo Requerimento - ${agendamento.titular_nome_completo} - ${agendamento.codigo_agendamento}`,
      html: gerarHTMLAgendamento(agendamento),
      attachments
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('❌ Erro ao enviar email de requerimento:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}