/**
 * Serverless Function para envio de email de alteração de prioridade
 * Executado na Vercel como Serverless Function
 * 
 * Sempre usa o formato de tabela (lote), mesmo para 1 cliente.
 * Aceita tanto changes[] quanto dados individuais (converte para changes[]).
 */

import nodemailer from 'nodemailer';

// Remetente com nome de exibição "Onesta" + email de EMAIL_USER.
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
      previousPriority,
      newPriority,
      userEmail,
      userRole,
      changes // Array para alterações em lote
    } = req.body || {};

    // Normalizar para sempre usar changes[]
    let normalizedChanges = [];
    if (changes && Array.isArray(changes) && changes.length > 0) {
      normalizedChanges = changes;
    } else {
      // Dados individuais → converter para array de 1 item
      normalizedChanges = [{
        customerCode: customerCode || '',
        customerEmail: customerEmail || '',
        previousPriority: previousPriority,
        newPriority: newPriority,
      }];
    }

    // Validação
    if (!userEmail || !userRole || normalizedChanges.length === 0) {
      console.log('Erro: Dados incompletos no body', req.body);
      return res.status(400).json({ 
        success: false, 
        error: 'Campos obrigatórios: changes[] (ou customerCode/customerEmail/previousPriority/newPriority), userEmail, userRole' 
      });
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

    // Gerar linhas da tabela
    const rows = normalizedChanges.map(change => {
      const prevBadge = change.previousPriority 
        ? '<span style="background:#FEF3C7; color:#92400E; padding:4px 8px; border-radius:4px; font-weight:600; font-size:12px;">⭐ Prioritário</span>'
        : '<span style="background:#F3F4F6; color:#6B7280; padding:4px 8px; border-radius:4px; font-weight:600; font-size:12px;">Não Prioritário</span>';
      
      const newBadge = change.newPriority
        ? '<span style="background:#FEF3C7; color:#92400E; padding:4px 8px; border-radius:4px; font-weight:600; font-size:12px;">⭐ Prioritário</span>'
        : '<span style="background:#F3F4F6; color:#6B7280; padding:4px 8px; border-radius:4px; font-weight:600; font-size:12px;">Não Prioritário</span>';
      
      return `
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:12px; color:#374151; font-size:14px;">
            ${change.customerCode || 'N/A'}
          </td>
          <td style="padding:12px; color:#374151; font-size:14px;">
            ${change.customerEmail || 'Não informado'}
          </td>
          <td style="padding:12px; font-size:14px;">
            ${prevBadge}
          </td>
          <td style="padding:12px; font-size:14px;">
            ${newBadge}
          </td>
        </tr>
      `;
    }).join('');

    const subject = `Alteração de Prioridade - ${normalizedChanges.length} ${normalizedChanges.length === 1 ? 'cliente' : 'clientes'}`;

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alteração de Prioridade</title>
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
                ALTERAÇÃO DE PRIORIDADE DOS CLIENTES
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
                ${normalizedChanges.length === 1 
                  ? 'Uma alteração de prioridade foi realizada no sistema por ' 
                  : 'Uma alteração de prioridade em lote foi realizada no sistema por '}<b style="color:#315E33;">${roleLabel}</b>.
              </p>
              <h3 style="margin:20px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                📊 Resumo
              </h3>
              <p style="margin:0; color:#374151; font-size:14px;">
                <b>Total de ${normalizedChanges.length === 1 ? 'alteração' : 'alterações'}:</b> ${normalizedChanges.length} ${normalizedChanges.length === 1 ? 'cliente' : 'clientes'}
              </p>
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                ⭐ ${normalizedChanges.length === 1 ? 'Alteração Realizada' : 'Alterações Realizadas'}
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
                      Prioridade Anterior
                    </th>
                    <th style="padding:12px; text-align:left; color:#6b7280; font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                      Nova Prioridade
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
                Alteração de prioridade realizada por usuário não-administrador.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: EMAIL_FROM,
      to: process.env.EMAIL_DESTINO,
      subject,
      html,
    };

    console.log(`📧 Enviando email de alteração de prioridade: ${normalizedChanges.length} ${normalizedChanges.length === 1 ? 'cliente' : 'clientes'} por ${userEmail}`);
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email enviado com sucesso: ${info.messageId}`);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Email de notificação enviado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao enviar email de alteração de prioridade:', error);
    
    // Erro de email não deve falhar completamente
    return res.status(200).json({ 
      success: false, 
      error: error.message,
      message: 'Erro ao enviar email de notificação'
    });
  }
}