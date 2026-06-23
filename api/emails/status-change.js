/**
 * Serverless Function para envio de email de alteração de status
 * Executado na Vercel como Serverless Function
 * Suporta tanto alterações individuais quanto em lote
 */

import nodemailer from 'nodemailer';

// Remetente com nome de exibição "Onesta" + email de EMAIL_USER.
// O Gmail exige que o "from" seja o mesmo email autenticado, então
// usamos apenas EMAIL_USER e adicionamos o prefixo "Onesta" aqui.
const EMAIL_FROM = `Onesta <${process.env.EMAIL_USER}>`;

// Handler da Serverless Function
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder a preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      customerName,
      customerCode,
      customerEmail,
      previousStatus,
      newStatus,
      userEmail,
      userRole,
      changes // Array para alterações em lote
    } = req.body || {};

    // Verificar se é alteração em lote ou individual
    const isBatch = changes && Array.isArray(changes) && changes.length > 0;

    if (isBatch) {
      // Validação básica para lote
      if (!userEmail || !userRole || changes.length === 0) {
        console.log('Erro: Dados incompletos no body para lote', req.body);
        return res.status(400).json({ 
          success: false, 
          error: 'Campos obrigatórios para lote: changes[], userEmail, userRole' 
        });
      }
    } else {
      // Validação básica para individual
      if (!customerName || !previousStatus || !newStatus || !userEmail || !userRole) {
        console.log('Erro: Dados incompletos no body', req.body);
        return res.status(400).json({ 
          success: false, 
          error: 'Campos obrigatórios: customerName, previousStatus, newStatus, userEmail, userRole' 
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

    // Configurar transporter de email
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Gerar HTML do email
    const roleLabel = userRole === 'partner' || userRole === 'Partner' ? 'Parceiro' : 'Usuário';
    const dataFormatada = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Mapeamento de cores por status
    const STATUS_COLOR_MAP = {
      EM_ANALISE: {
        bg: '#FFF3CD',
        text: '#856404',
        border: '#FFC107'
      },
      AGUARDANDO_CORRECAO: {
        bg: '#F8D7DA',
        text: '#721C24',
        border: '#DC3545'
      },
      EM_ANDAMENTO: {
        bg: '#D1ECF1',
        text: '#0C5460',
        border: '#03084C'
      },
      PAUSADO: {
        bg: '#F8D7DA',
        text: '#721C24',
        border: '#DC3545'
      },
      CANCELADO: {
        bg: '#F8F9FA',
        text: '#383D41',
        border: '#6C757D'
      },
      AGENDADO: {
        bg: '#D4EDDA',
        text: '#155724',
        border: '#315E33'
      }
    };

    // Função para obter cores do status
    const getStatusColors = (status) => {
      const normalizedStatus = (status || '').toUpperCase().trim();
      return STATUS_COLOR_MAP[normalizedStatus] || {
        bg: '#F8F9FA',
        text: '#383D41',
        border: '#6C757D'
      };
    };

    // Gerar HTML baseado no tipo de alteração (individual ou lote)
    let html;
    let subject;

    if (isBatch) {
      // Email em lote com tabela
      const rows = changes.map(change => {
        const prevColors = getStatusColors(change.previousStatus);
        const newColors = getStatusColors(change.newStatus);
        return `
          <tr style="border-bottom:1px solid #e5e7eb;">
            <td style="padding:12px; color:#374151; font-size:14px;">
              ${change.customerCode || 'N/A'}
            </td>
            <td style="padding:12px; color:#374151; font-size:14px;">
              ${change.customerEmail || 'Não informado'}
            </td>
            <td style="padding:12px; font-size:14px;">
              <span style="background:${prevColors.bg}; color:${prevColors.text}; padding:4px 8px; border-radius:4px; font-weight:600; font-size:12px;">
                ${change.previousStatus}
              </span>
            </td>
            <td style="padding:12px; font-size:14px;">
              <span style="background:${newColors.bg}; color:${newColors.text}; padding:4px 8px; border-radius:4px; font-weight:600; font-size:12px;">
                ${change.newStatus}
              </span>
            </td>
          </tr>
        `;
      }).join('');

      subject = `Alteração de Status em Lote - ${changes.length} cliente(s)`;

      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alteração de Status em Lote</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Inter, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">
          <tr>
            <td bgcolor="#315E33" style="background-color:#315E33; padding:40px 30px; text-align:center;">
              <div style="font-family:Georgia, serif; font-size:36px; font-weight:700; color:#ffffff; letter-spacing:2px; margin-bottom:10px;">
                ONESTA
              </div>
              <div style="font-size:14px; color:#ffffff; letter-spacing:1px;">
                ALTERAÇÃO DE STATUS DOS CLIENTES
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33.33%" bgcolor="#315E33" height="4"></td>
                  <td width="33.33%" bgcolor="#ffffff" height="4"></td>
                  <td width="33.34%" bgcolor="#903339" height="4"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 15px 0; color:#374151; font-size:15px; line-height:1.6;">
                Uma alteração de status em lote foi realizada no sistema por <b style="color:#315E33;">${roleLabel}</b>.
              </p>
              <h3 style="margin:20px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                📊 Resumo
              </h3>
              <p style="margin:0; color:#374151; font-size:14px;">
                <b>Total de alterações:</b> ${changes.length} cliente(s)
              </p>
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                🔄 Alterações Realizadas
              </h3>
              <table cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                <thead>
                  <tr style="background:#f9fafb; border-bottom:2px solid #e5e7eb;">
                    <th style="padding:12px; text-align:left; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                      Código
                    </th>
                    <th style="padding:12px; text-align:left; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                      Email do Cliente
                    </th>
                    <th style="padding:12px; text-align:left; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                      Status Anterior
                    </th>
                    <th style="padding:12px; text-align:left; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                      Novo Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                🧑 Realizado por
              </h3>
              <p style="margin:0; color:#374151; font-size:14px; line-height:1.8;">
                <b>Tipo:</b> ${roleLabel}<br>
                <b>Email:</b> 
                <a href="mailto:${userEmail}" style="color:#2563eb; text-decoration:none;">
                  ${userEmail}
                </a>
              </p>
              <p style="margin-top:25px; font-size:12px; color:#9ca3af; text-align:center;">
                📅 ${dataFormatada}
              </p>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33.33%" bgcolor="#315E33" height="4"></td>
                  <td width="33.33%" bgcolor="#ffffff" height="4"></td>
                  <td width="33.34%" bgcolor="#903339" height="4"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAFAF8; padding:30px; text-align:center; border-top:1px solid #e5e5e5;">
              <div style="font-family:Georgia, serif; font-size:18px; color:#315E33; margin-bottom:10px;">
                ONESTA
              </div>
              <div style="width:50px; height:2px; background:#315E33; margin:15px auto;"></div>
              <p style="margin:0; font-size:13px; color:#666666; line-height:1.8;">
                Este email foi gerado automaticamente pelo sistema Onesta.<br>
                Alteração de status em lote realizada por usuário não-administrador.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      console.log(`📧 Enviando email de alteração em lote: ${changes.length} alterações por ${userEmail}`);
    } else {
      // Email individual (mantido original)
      const previousStatusColors = getStatusColors(previousStatus);
      const newStatusColors = getStatusColors(newStatus);

      subject = `Alteração de Status - ${customerName} - ${customerCode || 'N/A'}`;

      html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alteração de Status - ${customerName}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Inter, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">
          <tr>
            <td bgcolor="#315E33" style="background-color:#315E33; padding:40px 30px; text-align:center;">
              <div style="font-family:Georgia, serif; font-size:36px; font-weight:700; color:#ffffff; letter-spacing:2px; margin-bottom:10px;">
                ONESTA
              </div>
              <div style="font-size:14px; color:#ffffff; letter-spacing:1px;">
                NOTIFICAÇÃO DE ALTERAÇÃO
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33.33%" bgcolor="#315E33" height="4"></td>
                  <td width="33.33%" bgcolor="#ffffff" height="4"></td>
                  <td width="33.34%" bgcolor="#903339" height="4"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:20px;">
              <p style="margin:0 0 15px 0; color:#374151; font-size:15px; line-height:1.6;">
                Uma alteração de status foi realizada no sistema por <b style="color:#315E33;">${roleLabel}</b>.
              </p>
              <h3 style="margin:20px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                👤 Cliente
              </h3>
              <p style="margin:0; color:#374151; font-size:14px; line-height:1.8;">
                <b>Nome:</b> ${customerName}<br>
                <b>Código:</b> ${customerCode || 'N/A'}<br>
                <b>Email:</b> 
                <a href="mailto:${customerEmail}" style="color:#2563eb; text-decoration:none;">
                  ${customerEmail || 'Não informado'}
                </a>
              </p>
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                🔄 Mudança de Status
              </h3>
              <table cellpadding="10" cellspacing="0" style="width:100%; text-align:center;">
                <tr>
                  <td style="border:1px solid ${previousStatusColors.border}; border-radius:8px; background:${previousStatusColors.bg};">
                    <div style="font-size:12px; color:${previousStatusColors.text}; font-weight:600; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">
                      De
                    </div>
                    <b style="color:${previousStatusColors.text}; font-size:16px;">${previousStatus}</b>
                  </td>
                  <td style="font-size:24px; color:#315E33; padding:0 10px;">
                    →
                  </td>
                  <td style="border:1px solid ${newStatusColors.border}; border-radius:8px; background:${newStatusColors.bg};">
                    <div style="font-size:12px; color:${newStatusColors.text}; font-weight:600; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">
                      Para
                    </div>
                    <b style="color:${newStatusColors.text}; font-size:18px;">${newStatus}</b>
                  </td>
                </tr>
              </table>
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                🧑 Realizado por
              </h3>
              <p style="margin:0; color:#374151; font-size:14px; line-height:1.8;">
                <b>Tipo:</b> ${roleLabel}<br>
                <b>Email:</b> 
                <a href="mailto:${userEmail}" style="color:#2563eb; text-decoration:none;">
                  ${userEmail}
                </a>
              </p>
              <p style="margin-top:25px; font-size:12px; color:#9ca3af; text-align:center;">
                📅 ${dataFormatada}
              </p>
            </td>
          </tr>
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td width="33.33%" bgcolor="#315E33" height="4"></td>
                  <td width="33.33%" bgcolor="#ffffff" height="4"></td>
                  <td width="33.34%" bgcolor="#903339" height="4"></td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAFAF8; padding:30px; text-align:center; border-top:1px solid #e5e5e5;">
              <div style="font-family:Georgia, serif; font-size:18px; color:#315E33; margin-bottom:10px;">
                ONESTA
              </div>
              <div style="width:50px; height:2px; background:#315E33; margin:15px auto;"></div>
              <p style="margin:0; font-size:13px; color:#666666; line-height:1.8;">
                Este email foi gerado automaticamente pelo sistema Onesta.<br>
                Alteração de status realizada por usuário não-administrador.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

      console.log(`📧 Enviando email de alteração de status: ${customerName} (${previousStatus} → ${newStatus}) por ${userEmail}`);
    }

    const mailOptions = {
      from: EMAIL_FROM,
      to: process.env.EMAIL_DESTINO,
      subject,
      html,
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado com sucesso: ${info.messageId}`);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: isBatch ? 'Email de notificação em lote enviado com sucesso' : 'Email de notificação enviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de alteração de status:', error);
    
    // Erro de email não deve falhar completamente
    return res.status(200).json({ 
      success: false, 
      error: error.message,
      message: 'Erro ao enviar email de notificação'
    });
  }
}