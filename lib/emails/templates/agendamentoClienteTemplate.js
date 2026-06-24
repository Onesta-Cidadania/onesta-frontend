/**
 * Gera o HTML do email de confirmação enviado ao cliente (titular)
 * após criar um requerimento de agendamento.
 */

export default function gerarHTMLConfirmacaoCliente(agendamento) {
  const nomePrimeiro = agendamento.titular_nome_completo.split(' ')[0];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
      text-align: center;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #315E33 0%, #2a522b 100%);
      border-radius: 50%;
      display: inline-block;
      text-align: center;
      line-height: 80px;
      margin-bottom: 25px;
      font-size: 40px;
      color: white;
      vertical-align: middle;
    }

    .greeting {
      font-size: 24px;
      color: #1F1F1E;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .message {
      font-size: 16px;
      color: #666666;
      margin-bottom: 30px;
      line-height: 1.8;
    }

    .code-badge {
      display: inline-block;
      background-color: #03084C;
      color: #ffffff;
      padding: 12px 30px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 30px;
      letter-spacing: 1px;
    }

    .info-box {
      background-color: #FAFAF8;
      border-radius: 8px;
      padding: 25px;
      margin: 30px 0;
      border-left: 4px solid #315E33;
      text-align: left;
    }

    .info-box-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 16px;
      font-weight: 600;
      color: #315E33;
      margin-bottom: 15px;
    }

    .info-box p {
      font-size: 14px;
      color: #666666;
      line-height: 1.8;
      margin-bottom: 10px;
    }

    .info-box p:last-child {
      margin-bottom: 0;
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

      .greeting {
        font-size: 20px;
      }

      .code-badge {
        font-size: 16px;
        padding: 10px 20px;
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
    <div class="content" style="padding:40px 30px;background-color:#ffffff;text-align:center;">
      <div class="success-icon" style="width:80px;height:80px;background-color:#315E33;border-radius:50%;display:inline-block;text-align:center;line-height:80px;font-size:40px;color:#ffffff;margin-bottom:25px;vertical-align:middle;">✓</div>

      <p class="greeting" style="font-size:24px;color:#1F1F1E;margin-bottom:10px;font-weight:600;">Olá, ${nomePrimeiro}!</p>

      <p class="message" style="font-size:16px;color:#666666;margin-bottom:30px;line-height:1.8;">
        Temos ótimas notícias! Seu requerimento para agendamento de passaporte italiano foi realizado <strong>com sucesso</strong>. 🎉
      </p>

      <div class="code-badge" style="display:inline-block;background-color:#03084C;color:#ffffff;padding:12px 30px;border-radius:8px;font-size:18px;font-weight:600;margin-bottom:30px;letter-spacing:1px;">
        Requerimento #${agendamento.codigo_agendamento}
      </div>

      <p class="message" style="font-size:16px;color:#666666;margin-bottom:30px;line-height:1.8;">
        Seu requerimento foi registrado em nosso sistema e nossa equipe já está trabalhando para processar seu requerimento.
        Em anexo segue arquivo TXT com informações detalhadas do seu requerimento
      </p>

      <div class="info-box" style="background-color:#FAFAF8;border-radius:8px;padding:25px;margin:30px 0;border-left:4px solid #315E33;text-align:left;">
        <div class="info-box-title" style="font-family:Georgia,serif;font-size:16px;font-weight:600;color:#315E33;margin-bottom:15px;">📋 &nbsp;&nbsp; O que acontece agora?</div>
        <p style="font-size:14px;color:#666666;line-height:1.8;margin-bottom:10px;">• Seu requerimento está sendo analisado por nossa equipe especializada</p>
        <p style="font-size:14px;color:#666666;line-height:1.8;margin-bottom:10px;">• Você receberá atualizações sobre o andamento do seu processo</p>
        <p style="font-size:14px;color:#666666;line-height:1.8;">• Se necessário, entraremos em contato por email ou telefone</p>
      </div>

      <p class="message" style="font-size:16px;color:#666666;margin-bottom:30px;line-height:1.8;margin-top:30px;">
        Agradecemos pela confiança em escolher a Onesta para esta jornada tão importante em busca da sua cidadania italiana. 🇮🇹
      </p>
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
        Este email confirma o recebimento do seu requerimento.<br>
      </p>
    </div>
  </div>
</body>
</html>
`;
}