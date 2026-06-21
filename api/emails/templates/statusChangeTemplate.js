/**
 * Template de Email - Alteração de Status de Cliente
 * Enviado quando um usuário não-admin altera o status de um cliente
 */

function gerarHTMLAlteracaoStatus(dados) {
  const dataFormatada = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const roleLabel = dados.userRole === 'partner' ? 'Parceiro' : 'Usuário';

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

  // Função para obter cores do status (maiúsculas por padrão)
  const getStatusColors = (status) => {
    const normalizedStatus = (status || '').toUpperCase().trim();
    return STATUS_COLOR_MAP[normalizedStatus] || {
      bg: '#F8F9FA',
      text: '#383D41',
      border: '#6C757D'
    };
  };

  const previousStatusColors = getStatusColors(dados.previousStatus);
  const newStatusColors = getStatusColors(dados.newStatus);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alteração de Status - ${dados.customerName}</title>
</head>

<body style="margin:0; padding:0; background-color:#f3f4f6; font-family: Inter, Arial, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px;">
    <tr>
      <td align="center">

        <!-- CARD PRINCIPAL -->
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:10px; overflow:hidden;">

          <!-- HEADER ONESTA -->
          <tr>
            <td bgcolor="#315E33" style="background-color:#315E33; padding:40px 30px; text-align:center;">
              <div style="font-family:Georgia, serif; font-size:36px; font-weight:700; color:#ffffff; letter-spacing:2px; margin-bottom:10px;">
                ONESTA
              </div>
              <div style="font-size:14px; color:#ffffff; letter-spacing:1px;">
                NOTIFICAÇÃO DE ALTERAÇÃO DE STATUS
              </div>
            </td>
          </tr>

          <!-- FAIXA ITALIANA -->
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

          <!-- CONTEÚDO -->
          <tr>
            <td style="padding:20px;">

              <!-- Texto introdutório -->
              <p style="margin:0 0 15px 0; color:#374151; font-size:15px; line-height:1.6;">
                Uma alteração de status foi realizada no sistema por <b style="color:#315E33;">${roleLabel}</b>.
              </p>

              <!-- CLIENTE -->
              <h3 style="margin:20px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                👤 Cliente
              </h3>

              <p style="margin:0; color:#374151; font-size:14px; line-height:1.8;">
                <b>Nome:</b> ${dados.customerName}<br>
                <b>Código:</b> ${dados.customerCode || 'N/A'}<br>
                <b>Email:</b> 
                <a href="mailto:${dados.customerEmail}" style="color:#2563eb; text-decoration:none;">
                  ${dados.customerEmail || 'Não informado'}
                </a>
              </p>

              <!-- STATUS -->
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                🔄 Mudança de Status
              </h3>

              <table cellpadding="10" cellspacing="0" style="width:100%; text-align:center;">
                <tr>
                  <td style="border:1px solid ${previousStatusColors.border}; border-radius:8px; background:${previousStatusColors.bg};">
                    <div style="font-size:12px; color:${previousStatusColors.text}; font-weight:600; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">
                      De
                    </div>
                    <b style="color:${previousStatusColors.text}; font-size:16px;">${dados.previousStatus}</b>
                  </td>

                  <td style="font-size:24px; color:#315E33; padding:0 10px;">
                    →
                  </td>

                  <td style="border:1px solid ${newStatusColors.border}; border-radius:8px; background:${newStatusColors.bg};">
                    <div style="font-size:12px; color:${newStatusColors.text}; font-weight:600; margin-bottom:5px; text-transform:uppercase; letter-spacing:1px;">
                      Para
                    </div>
                    <b style="color:${newStatusColors.text}; font-size:18px;">${dados.newStatus}</b>
                  </td>
                </tr>
              </table>

              <!-- RESPONSÁVEL -->
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                🧑‍ Realizado por
              </h3>

              <p style="margin:0; color:#374151; font-size:14px; line-height:1.8;">
                <b>Tipo:</b> ${roleLabel}<br>
                <b>Email:</b> 
                <a href="mailto:${dados.userEmail}" style="color:#2563eb; text-decoration:none;">
                  ${dados.userEmail}
                </a>
              </p>

              <!-- DATA -->
              <p style="margin-top:25px; font-size:12px; color:#9ca3af; text-align:center;">
                📅 ${dataFormatada}
              </p>

            </td>
          </tr>

          <!-- FAIXA ITALIANA (rodapé) -->
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

          <!-- FOOTER -->
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
}

export default gerarHTMLAlteracaoStatus;