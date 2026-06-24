/**
 * Template de Email - Alteração de Status de Cliente
 * Sempre usa o formato de tabela (lote), mesmo para 1 cliente.
 */

function gerarHTMLAlteracaoStatus(dados) {
  const dataFormatada = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const roleLabel = dados.userRole === 'partner' || dados.userRole === 'Partner' ? 'Parceiro' : 'Usuário';

  // Normalizar changes[]: aceita tanto changes quanto dados individuais
  let changes = [];
  if (dados.changes && Array.isArray(dados.changes) && dados.changes.length > 0) {
    changes = dados.changes;
  } else {
    changes = [{
      customerCode: dados.customerCode || '',
      customerEmail: dados.customerEmail || '',
      previousStatus: dados.previousStatus || '',
      newStatus: dados.newStatus || '',
    }];
  }

  // Mapeamento de cores por status
  const STATUS_COLOR_MAP = {
    EM_ANALISE: { bg: '#FFF3CD', text: '#856404', border: '#FFC107' },
    AGUARDANDO_CORRECAO: { bg: '#F8D7DA', text: '#721C24', border: '#DC3545' },
    EM_ANDAMENTO: { bg: '#D1ECF1', text: '#0C5460', border: '#03084C' },
    PAUSADO: { bg: '#F8D7DA', text: '#721C24', border: '#DC3545' },
    CANCELADO: { bg: '#F8F9FA', text: '#383D41', border: '#6C757D' },
    AGENDADO: { bg: '#D4EDDA', text: '#155724', border: '#315E33' }
  };

  const getStatusColors = (status) => {
    const normalizedStatus = (status || '').toUpperCase().trim();
    return STATUS_COLOR_MAP[normalizedStatus] || { bg: '#F8F9FA', text: '#383D41', border: '#6C757D' };
  };

  // Gerar linhas da tabela
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

  const isSingle = changes.length === 1;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alteração de Status</title>
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
                ALTERAÇÃO DE STATUS DOS CLIENTES
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
                ${isSingle
                  ? 'Uma alteração de status foi realizada no sistema por '
                  : 'Uma alteração de status em lote foi realizada no sistema por '}<b style="color:#315E33;">${roleLabel}</b>.
              </p>

              <!-- RESUMO -->
              <h3 style="margin:20px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                📊 Resumo
              </h3>

              <p style="margin:0; color:#374151; font-size:14px;">
                <b>Total de ${isSingle ? 'alteração' : 'alterações'}:</b> ${changes.length} ${isSingle ? 'cliente' : 'clientes'}
              </p>

              <!-- TABELA DE ALTERAÇÕES -->
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                🔄 ${isSingle ? 'Alteração Realizada' : 'Alterações Realizadas'}
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

              <!-- RESPONSÁVEL -->
              <h3 style="margin:25px 0 10px 0; font-size:14px; color:#111827; font-weight:600;">
                🧑 Realizado por
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