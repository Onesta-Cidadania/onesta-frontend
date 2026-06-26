/**
 * Serviço de Agendamento
 * Responsável por transformar dados do formulário e salvar no Supabase
 * Atualizado para o novo schema (pistacchio): customers + additional_applicants
 */

import { supabase } from '@/lib/supabase/client';
import type { FormData } from '@/hooks/useLocalStorageForm';

/**
 * Converte um arquivo File para string Base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

interface ArquivoEmail {
  nome: string;
  conteudoBase64: string;
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY
 */
const formatarData = (date: string | null): string => {
  if (!date) return '';
  try {
    const [ano, mes, dia] = date.split('-');
    if (ano && mes && dia) {
      return `${dia}/${mes}/${ano}`;
    }
  } catch (error) {
    console.error('Erro ao formatar data:', error);
  }
  return date;
};

/**
 * Formata endereço completo a partir dos campos separados
 */
const formatarEndereco = (formData: FormData): string => {
  const partes: string[] = [];
  if (formData.titularLogradouro) partes.push(formData.titularLogradouro);
  if (formData.titularNumero) partes.push(formData.titularNumero);
  if (formData.titularBairro) partes.push(formData.titularBairro);
  if (formData.titularCidade) partes.push(formData.titularCidade);
  if (formData.titularEstado) partes.push(formData.titularEstado);
  if (formData.titularComplemento) partes.push(`(${formData.titularComplemento})`);
  return partes.join(' ');
};

/**
 * Extrai sobrenome e nome a partir do nome completo
 */
const separarNome = (nomeCompleto: string): { sobrenome: string; nome: string } => {
  if (!nomeCompleto) {
    return { sobrenome: '', nome: '' };
  }
  const partes = nomeCompleto.trim().split(' ');
  if (partes.length === 1) {
    return { sobrenome: '', nome: partes[0] };
  }
  const nome = partes.pop() || '';
  const sobrenome = partes.join(' ');
  return { sobrenome, nome };
};

interface PeriodoRestricao {
  inicio: string;
  fim: string;
}

/**
 * Interface para os dados do customer (tabela customers)
 */
interface CustomerInsert {
  full_name: string;
  email: string;
  password: string;
  eye_color: string;
  height_cm: number;
  address: string;
  marital_status: string;
  number_of_children: number;
  notes: string | null;
  email_otp: string | null;
  otp_email_password: string | null;
  restriction_periods: unknown;
  partner_id: string | null;
  service_id: number; // bigint → services.id
}

/**
 * Interface para os dados do additional_applicant (tabela additional_applicants)
 */
interface AdditionalApplicantInsert {
  customer_id: string;
  last_name: string;
  first_name: string;
  birth_date: string;
  height_cm: number | null;
  eye_color: string | null;
  sort_order: number;
}

/**
 * Transforma dados do formulário para formato da tabela customers
 */
const transformarParaCustomer = (formData: FormData): CustomerInsert => {
  // Processar todos os períodos de restrição para o banco (JSONB)
  const periodosRestricao: Array<{ inicio: string; fim: string }> = formData.datasRestricao
    .filter(range => range.inicio && range.fim)
    .map(range => ({
      inicio: formatarData(range.inicio!.toISOString().split('T')[0]),
      fim: formatarData(range.fim!.toISOString().split('T')[0])
    }));

  return {
    full_name: formData.clienteNome || '',
    email: formData.prenotamiEmail || '',
    password: formData.prenotamiSenha || '',
    eye_color: formData.prenotamiCorOlhos || '',
    height_cm: parseInt(formData.prenotamiAltura) || 0,
    address: formatarEndereco(formData),
    marital_status: formData.titularEstadoCivil || '',
    number_of_children: formData.requerentes.length,
    notes: formData.observacoes || null,
    email_otp: formData.email_otp || null,
    otp_email_password: formData.senha_email_otp || null,
    restriction_periods: periodosRestricao.length > 0 ? periodosRestricao : [],
    partner_id: formData.partnerId || null,
    service_id: formData.servicoId || 0,
  };
};

/**
 * Cria array de additional_applicants para inserção no banco
 */
const criarAdditionalApplicants = (formData: FormData, customerId: string): AdditionalApplicantInsert[] => {
  const applicants: AdditionalApplicantInsert[] = [];
  formData.requerentes.forEach((requerente, index) => {
    if (index >= 3) return;
    const { sobrenome, nome } = separarNome(requerente.nomeCompleto);
    applicants.push({
      customer_id: customerId,
      last_name: sobrenome || '',
      first_name: nome || '',
      birth_date: requerente.dataNascimento ? formatarData(requerente.dataNascimento) : '',
      height_cm: requerente.altura ? parseInt(requerente.altura) : null,
      eye_color: requerente.corOlhos || null,
      sort_order: index + 1,
    });
  });
  return applicants;
};

/**
 * Prepara os arquivos do formulário para envio por email
 */
const prepararArquivosEmail = async (formData: FormData, customerCode: string): Promise<ArquivoEmail[]> => {
  const arquivos: ArquivoEmail[] = [];

  if (formData.titularDocumentoIdentidadeFile) {
    const base64 = await fileToBase64(formData.titularDocumentoIdentidadeFile);
    const nomeArquivo = `(${customerCode}) ${formData.clienteNome} - Identidade.pdf`;
    arquivos.push({ nome: nomeArquivo, conteudoBase64: base64 });
  }

  if (formData.clientePdfFileObject) {
    const base64 = await fileToBase64(formData.clientePdfFileObject);
    const nomeArquivo = `(${customerCode}) ${formData.clienteNome} - Comprovante Residência.pdf`;
    arquivos.push({ nome: nomeArquivo, conteudoBase64: base64 });
  }

  for (let i = 0; i < formData.requerentes.length; i++) {
    const requerente = formData.requerentes[i];
    if (requerente.documentoIdentidadeFile) {
      const base64 = await fileToBase64(requerente.documentoIdentidadeFile);
      const nomeArquivo = `(${customerCode}) ${requerente.nomeCompleto} - Identidade Requerente ${i + 1}.pdf`;
      arquivos.push({ nome: nomeArquivo, conteudoBase64: base64 });
    }
  }

  return arquivos;
};

/**
 * Gera string JSONC a partir dos dados do formulário
 */
const gerarJSONC = (formData: FormData): string => {
  const restricoes: Array<{ inicio: string; fim: string }> = [];
  formData.datasRestricao.forEach((range) => {
    if (range.inicio && range.fim) {
      restricoes.push({
        inicio: formatarData(range.inicio.toISOString().split('T')[0]),
        fim: formatarData(range.fim.toISOString().split('T')[0])
      });
    }
  });

  const requerentesAdicionais = formData.requerentes.map((requerente, index) => {
    const { sobrenome, nome } = separarNome(requerente.nomeCompleto);
    return {
      numero: index + 1,
      sobrenome: sobrenome || 'REVISAR',
      nome: nome || 'REVISAR',
      nascimento: requerente.dataNascimento ? formatarData(requerente.dataNascimento) : 'REVISAR',
      altura_cm: requerente.altura || 'REVISAR',
      cor_olhos: requerente.corOlhos || 'REVISAR'
    };
  });

  const dadosJSONC = {
    email: formData.prenotamiEmail || 'REVISAR',
    senha: formData.prenotamiSenha || 'REVISAR',
    cor_olhos: formData.prenotamiCorOlhos || 'REVISAR',
    altura_cm: formData.prenotamiAltura || 'REVISAR',
    endereco: formatarEndereco(formData) || 'REVISAR',
    estado_civil: formData.titularEstadoCivil || 'REVISAR',
    qtde_filhos: formData.requerentes.length.toString(),
    tipo_reserva: formData.requerentes.length > 0 ? '2' : '1',
    anotacoes: formData.observacoes || 'REVISAR',
    email_otp: formData.email_otp || 'REVISAR',
    senha_email_otp: formData.senha_email_otp || 'REVISAR',
    ...(restricoes.length > 0 && { restricoes }),
    ...(requerentesAdicionais.length > 0 && { requerentes_adicionais: requerentesAdicionais })
  };

  return JSON.stringify([dadosJSONC], null, 2);
};

/**
 * Faz upload do arquivo JSONC para o Storage
 */
const uploadJSONC = async (jsoncContent: string, customerCode: string, nomeTitular: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileName = `(${customerCode}) ${nomeTitular}.jsonc`;
    const filePath = `Primeiro Passaporte/${fileName}`;

    const blob = new Blob([jsoncContent], { type: 'application/json;charset=utf-8;' });
    const file = new File([blob], fileName, { type: 'application/json' });

    const { data, error } = await supabase()
      .storage
      .from('documentos')
      .upload(filePath, file);

    if (error) {
      console.error('Erro ao fazer upload JSONC:', error);
      return { success: false, error: error.message };
    }

    const { data: publicUrlData } = supabase()
      .storage
      .from('documentos')
      .getPublicUrl(filePath);

    console.log('JSONC salvo no Storage:', publicUrlData.publicUrl);

    return { success: true, url: publicUrlData.publicUrl };
  } catch (error) {
    console.error('Erro ao fazer upload JSONC (catch):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Envia email de confirmação para o cliente
 */
const enviarEmailCliente = async (customer: Record<string, unknown> & { customer_code: string; created_at: string }) => {
  try {
    const apiBaseUrl = import.meta.env.MODE === 'production'
      ? '/api'
      : 'http://localhost:3001/api';

    const response = await fetch(`${apiBaseUrl}/send-client-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agendamento: customer })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Email de confirmação enviado para cliente:', result.messageId);
      return { success: true, messageId: result.messageId };
    } else {
      console.error('Erro ao enviar email para cliente:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Erro ao enviar email para cliente (catch):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Envia email com anexos após o agendamento
 */
const enviarEmailAgendamento = async (
  customer: Record<string, unknown> & { customer_code: string; created_at: string; restriction_periods?: PeriodoRestricao[] },
  jsoncUrl: string,
  arquivos: ArquivoEmail[],
  requerentesAdicionais?: Array<AdditionalApplicantInsert & { nome_completo: string }>
) => {
  try {
    const apiBaseUrl = import.meta.env.MODE === 'production'
      ? '/api'
      : 'http://localhost:3001/api';

    const agendamentoComDadosEmail = {
      ...customer,
      requerentes_adicionais: requerentesAdicionais || [],
      periodos_restricao_email: customer.restriction_periods || []
    };

    const response = await fetch(`${apiBaseUrl}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agendamento: agendamentoComDadosEmail,
        jsoncUrl,
        arquivos
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Email administrativo enviado com sucesso:', result.messageId);
      return { success: true, messageId: result.messageId };
    } else {
      console.error('Erro ao enviar email administrativo:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Erro ao enviar email administrativo (catch):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
};

/**
 * Salva um customer no banco de dados e gera JSONC
 */
export const salvarAgendamento = async (formData: FormData) => {
  try {
    // Transformar dados do formulário para o banco
    const dadosBanco = transformarParaCustomer(formData);

    // Inserir customer no Supabase
    const { data, error } = await supabase()
      .from('customers')
      .insert(dadosBanco)
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar customer:', error);
      return { success: false, error: error.message, details: error };
    }

    console.log('Customer salvo com sucesso:', data);

    // Inserir additional_applicants se houver
    let applicantsParaInserir: AdditionalApplicantInsert[] = [];
    if (formData.requerentes.length > 0) {
      applicantsParaInserir = criarAdditionalApplicants(formData, data.id);

      if (applicantsParaInserir.length > 0) {
        const { error: errorApplicants } = await supabase()
          .from('additional_applicants')
          .insert(applicantsParaInserir);

        if (errorApplicants) {
          console.error('Erro ao salvar additional_applicants:', errorApplicants);
          return {
            success: true,
            data: data,
            requerentesError: errorApplicants.message,
            jsoncUrl: undefined,
            jsoncError: null,
            error: null,
            emailResult: null
          };
        }

        console.log('Additional applicants salvos com sucesso:', applicantsParaInserir.length);
      }
    }

    // Gerar JSONC e fazer upload
    const jsoncContent = gerarJSONC(formData);
    const uploadResult = await uploadJSONC(jsoncContent, data.customer_code, formData.clienteNome);

    // Preparar dados dos requerentes para o email
    const requerentesParaEmail = formData.requerentes.length > 0 ? formData.requerentes.map((req, index) => ({
      ...applicantsParaInserir?.[index],
      nome_completo: req.nomeCompleto || ''
    })) : [];

    // Preparar arquivos para o email
    const arquivosEmail = await prepararArquivosEmail(formData, data.customer_code);

    // Enviar email administrativo se o JSONC foi salvo com sucesso
    let emailResult = null;
    if (uploadResult.success && uploadResult.url) {
      console.log('Enviando email de notificação administrativo...');
      const agendamentoParaEmail = {
        ...data,
        periodos_restricao_email: data.restriction_periods || []
      };
      emailResult = await enviarEmailAgendamento(agendamentoParaEmail, uploadResult.url, arquivosEmail, requerentesParaEmail);
    } else if (uploadResult.error) {
      console.warn('JSONC não foi salvo, email não será enviado:', uploadResult.error);
    }

    // Enviar email de confirmação para o cliente (não bloqueia o fluxo se falhar)
    let emailClienteResult = null;
    try {
      console.log('Enviando email de confirmação para o cliente...');
      const agendamentoParaEmailCliente = {
        ...data,
        requerentes_adicionais: requerentesParaEmail || [],
        periodos_restricao_email: data.restriction_periods || []
      };
      emailClienteResult = await enviarEmailCliente(agendamentoParaEmailCliente);
    } catch (error) {
      console.error('Erro ao enviar email para cliente (não crítico):', error);
    }

    return {
      success: true,
      data: data,
      jsoncUrl: uploadResult.success ? uploadResult.url : undefined,
      jsoncError: uploadResult.error,
      error: null,
      emailResult: emailResult,
      emailClienteResult: emailClienteResult
    };
  } catch (error) {
    console.error('Erro ao salvar customer (catch):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error
    };
  }
};

/**
 * Lista todos os customers (opcional, para dashboard)
 */
export const listarAgendamentos = async () => {
  try {
    const { data, error } = await supabase()
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao listar customers:', error);
      return { success: false, error: error.message, data: null };
    }

    return { success: true, data: data, error: null };
  } catch (error) {
    console.error('Erro ao listar customers (catch):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null
    };
  }
};