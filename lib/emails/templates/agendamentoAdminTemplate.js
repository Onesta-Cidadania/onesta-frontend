/**
 * Gera o HTML do email administrativo enviado à equipe Onesta
 * quando um novo requerimento de agendamento é criado.
 */

export default function gerarHTMLAgendamento(agendamento) {
  const dataFormatada = new Date(agendamento.criado_em).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const temAssessor = agendamento.assessor_nome_completo && agendamento.assessor_nome_completo.trim() !== '';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novo Requerimento - ${agendamento.titular_nome_completo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@400;500;600&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #1F1F1E;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    .email-container {
      max-width: 650px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    /* Header com gradiente verde */
    .header {
      background: linear-gradient(135deg, #315E33 0%, #2a522b 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
    }

    .header-logo {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 36px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }

    .header-subtitle {
      color: #ffffff;
      font-size: 14px;
      opacity: 0.9;
      letter-spacing: 1px;
    }

    /* Faixa italiana */
    .italian-stripe {
      height: 4px;
      background: linear-gradient(90deg,
        #315E33 0%,
        #315E33 33.33%,
        #ffffff 33.33%,
        #ffffff 66.66%,
        #903339 66.66%,
        #903339 100%
      );
    }

    /* Content */
    .content {
      padding: 40px 30px;
      background-color: #ffffff;
    }

    .greeting {
      font-size: 18px;
      color: #1F1F1E;
      margin-bottom: 20px;
    }

    .greeting strong {
      font-weight: 600;
    }

    /* Agendamento Code Badge */
    .code-badge {
      display: inline-block;
      background-color: #03084C;
      color: #ffffff;
      padding: 8px 20px;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 30px;
    }

    /* Section Card */
    .section-card {
      background-color: #FAFAF8;
      border-radius: 8px;
      padding: 25px;
      margin-bottom: 20px;
      border-left: 4px solid #315E33;
    }

    .section-card-assessor {
      border-left-color: #03084C;
    }

    .section-card-info {
      border-left-color: #D4A574;
    }

    .section-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      font-weight: 600;
      color: #315E33;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-card-assessor .section-title {
      color: #03084C;
    }

    .section-card-info .section-title {
      color: #903339;
    }

    /* Info Rows */
    .info-row {
      display: flex;
      align-items: baseline;
      padding: 8px 0;
      border-bottom: 1px solid #e5e5e5;
      font-size: 14px;
    }

    .info-row:last-child {
      border-bottom: none;
    }

    .info-label {
      color: #666666;
      font-weight: 700;
    }

    .info-value {
      color: #1F1F1E;
      font-weight: 400;
    }

    /* Attachments Section */
    .attachments {
      background-color: #f0f7f1;
      border: 2px dashed #315E33;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }

    .attachments-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16px;
      color: #315E33;
      margin-bottom: 10px;
    }

    .attachments-list {
      font-size: 14px;
      color: #666666;
      text-align: left;
      padding-left: 20px;
    }

    .attachments-list li {
      margin-bottom: 8px;
    }

    .attachments-list strong {
      color: #315E33;
    }

    /* Footer */
    .footer {
      background-color: #FAFAF8;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e5e5;
    }

    .footer-text {
      font-size: 13px;
      color: #666666;
      line-height: 1.8;
    }

    .footer-brand {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 18px;
      color: #315E33;
      margin-bottom: 10px;
    }

    .footer-divider {
      width: 50px;
      height: 2px;
      background: linear-gradient(90deg, #315E33 0%, #D4A574 100%);
      margin: 15px auto;
    }

    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        max-width: 100% !important;
        border-radius: 0 !important;
      }

      .header {
        padding: 30px 20px;
      }

      .content {
        padding: 30px 20px;
      }

      .section-card {
        padding: 20px;
      }

      .info-row {
        flex-direction: column;
        gap: 2px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header" style="background-color:#315E33;padding:40px 30px;text-align:center;">
      <div class="header-logo" style="font-family:Georgia,serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:2px;margin-bottom:10px;">ONESTA</div>
      <div class="header-subtitle" style="color:#ffffff;font-size:14px;letter-spacing:1px;">SISTEMA DE REQUERIMENTO</div>
    </div>

    <!-- Faixa Italiana -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="33.33%" bgcolor="#315E33" style="background-color:#315E33;height:4px;font-size:0;line-height:0;">&nbsp;</td>
        <td width="33.33%" bgcolor="#ffffff" style="background-color:#ffffff;height:4px;font-size:0;line-height:0;">&nbsp;</td>
        <td width="33.34%" bgcolor="#903339" style="background-color:#903339;height:4px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>

    <!-- Content -->
    <div class="content" style="padding:40px 30px;background-color:#ffffff;">
      <p class="greeting" style="font-size:18px;color:#1F1F1E;margin-bottom:20px;">
        <strong style="font-weight:600;">Olá!</strong> Um novo requerimento foi criado no sistema.
      </p>

      <div class="code-badge" style="display:inline-block;background-color:#03084C;color:#ffffff;padding:8px 20px;border-radius:6px;font-size:14px;font-weight:600;margin-bottom:30px;">
        Requerimento #${agendamento.codigo_agendamento}
      </div>

      ${temAssessor ? `
      <!-- Dados do Assessor -->
      <div class="section-card section-card-assessor" style="background-color:#FAFAF8;border-radius:8px;padding:25px;margin-bottom:20px;border-left:4px solid #03084C;">
        <div class="section-title" style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#03084C;margin-bottom:15px;">
          🤝 &nbsp;&nbsp; DADOS DO ASSESSOR
        </div>

        <div style="padding:8px 0;border-bottom:1px solid #e5e5e5;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Nome:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.assessor_nome_completo}</span>
        </div>

        <div style="padding:8px 0;border-bottom:1px solid #e5e5e5;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Email:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.assessor_email}</span>
        </div>

        <div style="padding:8px 0;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Telefone:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.assessor_telefone}</span>
        </div>
      </div>
      ` : ''}

      <!-- Dados do Cliente -->
      <div class="section-card" style="background-color:#FAFAF8;border-radius:8px;padding:25px;margin-bottom:20px;border-left:4px solid #315E33;">
        <div class="section-title" style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#315E33;margin-bottom:15px;">
          👤 &nbsp;&nbsp; DADOS DO CLIENTE
        </div>

        <div style="padding:8px 0;border-bottom:1px solid #e5e5e5;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Nome Completo:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.titular_nome_completo}</span>
        </div>

        <div style="padding:8px 0;border-bottom:1px solid #e5e5e5;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Email:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.titular_email}</span>
        </div>

        <div style="padding:8px 0;border-bottom:1px solid #e5e5e5;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Endereço:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.titular_endereco}</span>
        </div>

        <div style="padding:8px 0;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Quantidade de Filhos:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.titular_qtde_filhos}</span>
        </div>
      </div>

      <!-- Informações Adicionais -->
      <div class="section-card section-card-info" style="background-color:#FAFAF8;border-radius:8px;padding:25px;margin-bottom:20px;border-left:4px solid #D4A574;">
        <div class="section-title" style="font-family:Georgia,serif;font-size:18px;font-weight:600;color:#903339;margin-bottom:15px;">
          📋 &nbsp;&nbsp; INFORMAÇÕES ADICIONAIS
        </div>

        <div style="padding:8px 0;border-bottom:1px solid #e5e5e5;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Observações:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.anotacoes || 'Nenhuma'}</span>
        </div>

        ${agendamento.periodos_restricao_email && agendamento.periodos_restricao_email.length > 0 ? `
        <div style="margin-top: 15px;">
          <div style="font-size: 14px; color: #666666; font-weight: 700; margin-bottom: 10px;">Períodos de Restrição:</div>
          ${agendamento.periodos_restricao_email.map(periodo => `
            <div style="font-size: 14px; color: #1F1F1E; font-weight: 400; margin-bottom: 8px;">
              • ${periodo.inicio} a ${periodo.fim}
            </div>
          `).join('')}
        </div>
        ` : `
        <div style="padding:8px 0;font-size:14px;">
          <span style="color:#666666;font-weight:700;">Período de Restrição:</span>&nbsp;&nbsp;<span style="color:#1F1F1E;">${agendamento.data_inicio_restricao || 'N/A'} a ${agendamento.data_fim_restricao || 'N/A'}</span>
        </div>
        `}
      </div>

      <!-- Anexos -->
      <div class="attachments" style="background-color:#f0f7f1;border:2px dashed #315E33;border-radius:8px;padding:20px;text-align:center;margin:30px 0;">
        <div class="attachments-title" style="font-family:Georgia,serif;font-size:16px;color:#315E33;margin-bottom:10px;">📎 &nbsp;&nbsp; ARQUIVOS EM ANEXO</div>
        <ul class="attachments-list" style="font-size:14px;color:#666666;text-align:left;padding-left:20px;">
          <li style="margin-bottom:8px;"><strong style="color:#315E33;">1. Arquivo TXT</strong> - Informações detalhadas do cliente e assessor</li>
          <li style="margin-bottom:8px;"><strong style="color:#315E33;">2. Arquivo JSONC</strong> - Todos os dados do formulário</li>
          <li style="margin-bottom:8px;"><strong style="color:#315E33;">3. Arquivos PDF</strong> - Documentos do formulário (identidade, comprovante de residência, etc.)</li>
        </ul>
      </div>

      <!-- Data de Requerimento -->
      <div style="text-align: center; margin: 30px 0 20px 0;">
        <p style="font-size: 14px; color: #666666;">
          📅 &nbsp;&nbsp; <strong>Data de Requerimento:</strong> ${dataFormatada}
        </p>
      </div>

    </div>

    <!-- Faixa Italiana -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="33.33%" bgcolor="#315E33" style="background-color:#315E33;height:4px;font-size:0;line-height:0;">&nbsp;</td>
        <td width="33.33%" bgcolor="#ffffff" style="background-color:#ffffff;height:4px;font-size:0;line-height:0;">&nbsp;</td>
        <td width="33.34%" bgcolor="#903339" style="background-color:#903339;height:4px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>

    <!-- Footer -->
    <div class="footer" style="background-color:#FAFAF8;padding:30px;text-align:center;border-top:1px solid #e5e5e5;">
      <div class="footer-brand" style="font-family:Georgia,serif;font-size:18px;color:#315E33;margin-bottom:10px;">ONESTA</div>
      <div class="footer-divider" style="width:50px;height:2px;background-color:#315E33;margin:15px auto;">&nbsp;</div>
      <p class="footer-text" style="font-size:13px;color:#666666;line-height:1.8;">
        Este email foi gerado automaticamente pelo sistema Onesta.<br>
      </p>
    </div>
  </div>
</body>
</html>
`;
}