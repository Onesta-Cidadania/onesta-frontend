/**
 * Rotas para envio de email de alteração de status de cliente
 */

import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import gerarHTMLAlteracaoStatus from '../templates/statusChangeTemplate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do .env.local (3 níveis acima)
dotenv.config({ path: path.join(__dirname, '../../../.env.local') });

// Remetente com nome de exibição "Onesta" + email de EMAIL_USER.
// O Gmail exige que o "from" seja o mesmo email autenticado, então
// usamos apenas EMAIL_USER e adicionamos o prefixo "Onesta" aqui.
const EMAIL_FROM = `Onesta <${process.env.EMAIL_USER}>`;

const router = express.Router();

// Middleware
router.use(cors());
router.use(express.json({ limit: '50mb' }));
router.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log de debug
router.use((req, res, next) => {
  console.log(`➔ Requisição de email recebida: ${req.method} ${req.url}`);
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

/**
 * POST /api/emails/status-change
 * Envia email de notificação quando um usuário não-admin altera o status de um cliente
 * 
 * Body esperado:
 * {
 *   customerName: string,
 *   customerCode: string,
 *   customerEmail: string,
 *   previousStatus: string,
 *   newStatus: string,
 *   userEmail: string,
 *   userRole: string (Partner, Customer, etc.)
 * }
 */
router.post('/api/emails/status-change', async (req, res, next) => {
  try {
    const {
      customerName,
      customerCode,
      customerEmail,
      previousStatus,
      newStatus,
      userEmail,
      userRole
    } = req.body || {};

    // Validação básica
    if (!customerName || !previousStatus || !newStatus || !userEmail || !userRole) {
      console.log('Erro: Dados incompletos no body', req.body);
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: customerName, previousStatus, newStatus, userEmail, userRole' 
      });
    }

    // Não enviar email se for Admin (case insensitive)
    if (userRole.toLowerCase() === 'admin') {
      console.log('ℹ️  Alteração feita por Admin - email não enviado');
      return res.status(200).json({ 
        success: true, 
        message: 'Alteração por Admin não gera notificação',
        skipped: true
      });
    }

    const mailOptions = {
      from: EMAIL_FROM,
      to: process.env.EMAIL_DESTINO,
      subject: `Alteração de Status - ${customerName} - ${customerCode || 'N/A'}`,
      html: gerarHTMLAlteracaoStatus({
        customerName,
        customerCode,
        customerEmail,
        previousStatus,
        newStatus,
        userEmail,
        userRole
      }),
    };

    console.log(`📧 Enviando email de alteração de status: ${customerName} (${previousStatus} → ${newStatus}) por ${userEmail}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado com sucesso: ${info.messageId}`);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email de notificação enviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de alteração de status:', error);
    
    // Erro de email não deve falhar completamente - retornamos erro mas status 200
    // para não impactar o fluxo principal
    return res.status(200).json({ 
      success: false, 
      error: error.message,
      message: 'Erro ao enviar email de notificação'
    });
  }
});

export default router;