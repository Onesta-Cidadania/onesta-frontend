/**
 * Mapeia dados do customer (formato do banco) para o formato esperado pelos templates de email.
 *
 * O agendamento.service.ts envia os dados brutos do Supabase (snake_case),
 * mas os templates foram escritos com os nomes antigos do formulário.
 * Esta função centraliza a conversão para que rotas e serverless functions
 * reaproveitem os mesmos templates.
 */

export default function mapAgendamento(data) {
  return {
    // Identificação
    codigo_agendamento: data.codigo_agendamento || data.customer_code || 'SEM_CÓDIGO',
    criado_em: data.criado_em || data.created_at || new Date().toISOString(),

    // Titular
    titular_nome_completo: data.titular_nome_completo || data.full_name || '',
    titular_email: data.titular_email || data.email || '',
    titular_cor_olhos: data.titular_cor_olhos || data.eye_color || '',
    titular_altura_cm: data.titular_altura_cm || data.height_cm || '',
    titular_endereco: data.titular_endereco || data.address || '',
    titular_estado_civil: data.titular_estado_civil || data.marital_status || '',
    titular_qtde_filhos: data.titular_qtde_filhos ?? data.number_of_children ?? 0,

    // Informações adicionais
    anotacoes: data.anotacoes || data.notes || '',
    email_otp: data.email_otp || '',
    senha_email_otp: data.senha_email_otp || data.otp_email_password || '',
    data_alvo: data.data_alvo || data.target_date || '',

    // Períodos de restrição
    periodos_restricao_email: data.periodos_restricao_email || data.restriction_periods || [],
    data_inicio_restricao: data.data_inicio_restricao || '',
    data_fim_restricao: data.data_fim_restricao || '',

    // Assessor (opcional)
    assessor_nome_completo: data.assessor_nome_completo || '',
    assessor_email: data.assessor_email || '',
    assessor_telefone: data.assessor_telefone || '',

    // Requerentes adicionais
    requerentes_adicionais: data.requerentes_adicionais || [],
  };
}