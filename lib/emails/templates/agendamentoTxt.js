/**
 * Gera o conteúdo TXT do requerimento de agendamento (passaporte).
 * Usado como anexo nos emails de agendamento.
 */

export default function gerarTxt(agendamento) {
  let txt = `REQUERIMENTO #${agendamento.codigo_agendamento}\n`;
  txt += `${'='.repeat(30)}\n\n`;

  // DADOS DO ASSESSOR (primeiro, se houver)
  if (agendamento.assessor_nome_completo && agendamento.assessor_nome_completo.trim() !== '') {
    txt += `DADOS DO ASSESSOR\n`;
    txt += `${'-'.repeat(20)}\n`;
    txt += `Nome: ${agendamento.assessor_nome_completo}\n`;
    txt += `Email: ${agendamento.assessor_email || 'Não informado'}\n`;
    txt += `Telefone: ${agendamento.assessor_telefone || 'Não informado'}\n\n`;
  }

  // DADOS DO CLIENTE
  txt += `DADOS DO CLIENTE\n`;
  txt += `${'-'.repeat(20)}\n`;
  txt += `Nome Completo: ${agendamento.titular_nome_completo}\n`;
  txt += `Email: ${agendamento.titular_email}\n`;
  txt += `Cor dos Olhos: ${agendamento.titular_cor_olhos}\n`;
  txt += `Altura: ${agendamento.titular_altura_cm} cm\n`;
  txt += `Endereço: ${agendamento.titular_endereco}\n`;
  txt += `Estado Civil: ${agendamento.titular_estado_civil}\n`;
  txt += `Qtd. Requerentes Adicionais: ${agendamento.requerentes_adicionais ? agendamento.requerentes_adicionais.length : 0}\n\n`;

  // DADOS DOS REQUERENTES ADICIONAIS (se houver)
  if (agendamento.requerentes_adicionais && agendamento.requerentes_adicionais.length > 0) {
    txt += `DADOS DOS REQUERENTES ADICIONAIS\n`;
    txt += `${'-'.repeat(30)}\n`;

    agendamento.requerentes_adicionais.forEach((requerente, index) => {
      txt += `\nRequerente #${index + 1}\n`;
      txt += `Nome Completo: ${requerente.nome_completo || 'Não informado'}\n`;
      txt += `Data de Nascimento: ${requerente.nascimento || 'Não informada'}\n`;
      txt += `Altura: ${requerente.altura_cm ? requerente.altura_cm + ' cm' : 'Não informada'}\n`;
      txt += `Cor dos Olhos: ${requerente.cor_olhos || 'Não informada'}\n`;
    });

    txt += `\n`;
  }

  // INFORMAÇÕES ADICIONAIS
  txt += `INFORMAÇÕES ADICIONAIS\n`;
  txt += `${'-'.repeat(30)}\n`;
  txt += `Observações: ${agendamento.anotacoes || 'Nenhuma'}\n`;
  txt += `Email OTP: ${agendamento.email_otp || 'Não informado'}\n`;
  txt += `Senha Email OTP: ${agendamento.senha_email_otp || 'Não informado'}\n`;
  txt += `Data Alvo: ${agendamento.data_alvo || 'Não informada'}\n\n`;

  // Períodos de Restrição (lista completa)
  if (agendamento.periodos_restricao_email && agendamento.periodos_restricao_email.length > 0) {
    txt += `PERÍODOS DE RESTRIÇÃO\n`;
    txt += `${'-'.repeat(25)}\n`;
    agendamento.periodos_restricao_email.forEach((periodo, index) => {
      txt += `${index + 1}. ${periodo.inicio} a ${periodo.fim}\n`;
    });
    txt += `\n`;
  } else {
    txt += `Período de Restrição: ${agendamento.data_inicio_restricao || 'N/A'} a ${agendamento.data_fim_restricao || 'N/A'}\n\n`;
  }

  // DATA DE REQUERIMENTO
  txt += `DATA DE REQUERIMENTO\n`;
  txt += `${'-'.repeat(20)}\n`;
  txt += `${new Date(agendamento.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n\n`;

  txt += `Gerado automaticamente pelo sistema Onesta`;

  return txt;
}