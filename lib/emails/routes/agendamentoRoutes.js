/**
 * Rotas para envio de emails de agendamento (requerimento de passaporte)
 *
 * Rotas migradas do server.js monolítico para o padrão modular.
 * - POST /api/send-email         -> Email administrativo (com TXT + JSONC + PDFs em anexo)
 * - POST /api/send-client-email  -> Email de confirmação para o cliente
 * - POST /api/send-simple-email  -> Email simples de teste
 */

import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import gerarTxt from '../templates/agendamentoTxt.js';
import gerarHTMLConfirmacaoCliente from '../templates/agendamentoClienteTemplate.js';
import gerarHTMLAgendamento from '../templates/agendamentoAdminTemplate.js';
import mapAgendamento from '../utils/mapAgendamento.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do .env.local (3 níveis acima)
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

// Remetente com nome de exibição "Onesta" + email de EMAIL_USER.
const EMAIL_FROM = `Onesta <${process.env.EMAIL_USER}>`;

const router = express.Router();

// Middleware
router.use(cors());
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log de debug
router.use((req, res, next) => {
  console.log(`➔ Requisição de email (agendamento) recebida: ${req.method} ${req.url}`);
  next();
});

// Configuração do transporter de email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Verificação de credenciais
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️  ALERTA: Credenciais de email não configuradas no .env');
}

// ======================================================
// FUNÇÃO AUXILIAR: baixar arquivo (JSONC do Storage)
// ======================================================
async function baixarArquivo(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Falha ao baixar arquivo: ${response.statusText}`);
  return response.text();
}

// ======================================================
// ROTAS
// ======================================================

/**
 * POST /api/send-simple-email
 * Envia um email simples de teste.
 *
 * Body: { message: string }
 */
router.post('/api/send-simple-email', async (req, res, next) => {
  try {
    const { message } = req.body || {};

    if (!message) {
      console.log('Erro: Body vazio ou propriedade message ausente.', req.body);
      return res.status(400).json({ success: false, error: 'O campo "message" é obrigatório.' });
    }

    const mailOptions = {
      from: EMAIL_FROM,
      to: process.env.EMAIL_DESTINO,
      subject: `📧 Teste de Email - ${new Date().toLocaleString('pt-BR')}`,
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/send-email
 * Envia o email administrativo completo (para a equipe Onesta) com anexos.
 *
 * Body: { agendamento, jsoncUrl, arquivos: [{ nome, conteudoBase64 }] }
 */
router.post('/api/send-email', async (req, res, next) => {
  try {
    const { agendamento: rawAgendamento, jsoncUrl, arquivos = [] } = req.body || {};

    if (!rawAgendamento || !jsoncUrl) {
      return res.status(400).json({
        success: false,
        error: 'Dados de agendamento e URL do JSONC são obrigatórios.'
      });
    }

    // Normaliza os dados (aceita tanto formato DB quanto formato legado)
    const agendamento = mapAgendamento(rawAgendamento);

    const [txtContent, jsoncContent] = await Promise.all([
      Promise.resolve(gerarTxt(agendamento)),
      baixarArquivo(jsoncUrl)
    ]);

    const nomeTitularFormatado = agendamento.titular_nome_completo
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

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
    next(error);
  }
});

/**
 * POST /api/send-client-email
 * Envia o email de confirmação para o cliente (titular).
 *
 * Body: { agendamento }
 */
router.post('/api/send-client-email', async (req, res, next) => {
  try {
    const { agendamento: rawAgendamento } = req.body || {};

    if (!rawAgendamento) {
      return res.status(400).json({
        success: false,
        error: 'Dados do agendamento são obrigatórios.'
      });
    }

    // Normaliza os dados (aceita tanto formato DB quanto formato legado)
    const agendamento = mapAgendamento(rawAgendamento);

    if (!agendamento.codigo_agendamento || !agendamento.titular_email || !agendamento.titular_nome_completo) {
      return res.status(400).json({
        success: false,
        error: 'Dados do agendamento (código, email e nome) são obrigatórios.'
      });
    }

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
    console.error('Erro ao enviar email para cliente:', error);
    next(error);
  }
});

export default router;