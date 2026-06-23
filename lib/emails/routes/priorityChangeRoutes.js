/**
 * Rotas para envio de email de alteração de prioridade de cliente
 * 
 * Sempre usa o formato de tabela (lote), mesmo para 1 cliente.
 * O template normaliza internamente: usa changes[] se presente, ou dados individuais.
 */

import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import gerarHTMLAlteracaoPrioridade from '../templates/priorityChangeTemplate.js';

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
 * POST /api/emails/priority-change
 * Envia email de notificação quando um usuário não-admin altera a prioridade de um cliente.
 * 
 * Body esperado (individual):
 * { customerName, customerCode, customerEmail, previousPriority, newPriority, userEmail, userRole }
 * 
 * Body esperado (lote):
 * { changes: [{ customerCode, customerEmail, previousPriority, newPriority }], userEmail, userRole }
 */
router.post('/api/emails/priority-change', async (req, res, next) => {
  try {
    const {
      customerName,
      customerCode,
      customerEmail,
      previousPriority,
      newPriority,
      userEmail,
      userRole,
      changes
    } = req.body || {};

    // Verificar se é alteração em lote ou individual
    const isBatch = changes && Array.isArray(changes) && changes.length > 0;

    // Validação
    if (isBatch) {
      if (!userEmail || !userRole || changes.length === 0) {
        console.log('Erro: Dados incompletos no body para lote', req.body);
        return res.status(400).json({ 
          success: false, 
          error: 'Campos obrigatórios para lote: changes[], userEmail, userRole' 
        });
      }
    } else {
      if (!customerName || previousPriority === undefined || newPriority === undefined || !userEmail || !userRole) {
        console.log('Erro: Dados incompletos no body', req.body);
        return res.status(400).json({ 
          success: false, 
          error: 'Campos obrigatórios: customerName, previousPriority, newPriority, userEmail, userRole' 
        });
      }
    }

    // Não enviar email se for Admin (case insensitive)
    if (userRole && userRole.toLowerCase() === 'admin') {
      console.log('ℹ️  Alteração feita por Admin - email não enviado');
      return res.status(200).json({ 
        success: true, 
        message: 'Alteração por Admin não gera notificação',
        skipped: true
      });
    }

    // Sempre usa o mesmo template (formato de tabela), mesmo para 1 cliente.
    // O template normaliza internamente: usa changes[] se presente, ou dados individuais.
    const subject = isBatch
      ? `Alteração de Prioridade - ${changes.length} ${changes.length === 1 ? 'cliente' : 'clientes'}`
      : `Alteração de Prioridade - ${customerName} - ${customerCode || 'N/A'}`;

    const mailOptions = {
      from: EMAIL_FROM,
      to: process.env.EMAIL_DESTINO,
      subject,
      html: gerarHTMLAlteracaoPrioridade({
        customerName,
        customerCode,
        customerEmail,
        previousPriority,
        newPriority,
        changes,
        userEmail,
        userRole
      }),
    };

    console.log(`📧 Enviando email de alteração de prioridade: ${isBatch ? `${changes.length} clientes` : customerName} por ${userEmail}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado com sucesso: ${info.messageId}`);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email de notificação enviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de alteração de prioridade:', error);
    
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