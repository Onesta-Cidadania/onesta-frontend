/**
 * Serviço de Agendamento
 * Responsável por transformar dados do formulário e salvar no Supabase
 */

import { supabase } from '@/lib/supabase/client';
import type { AgendamentoInsert, RequerenteAdicionalInsert } from '@/lib/supabase/types';
import type { FormData } from '@/hooks/useLocalStorageForm';

/**
 * Converte um arquivo File para string Base64
 * @param file - Arquivo a ser convertido
 * @returns Promise com string base64
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remover prefixo "data:application/pdf;base64,"
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Interface para arquivos do email
 */
interface ArquivoEmail {
  nome: string;
  conteudoBase64: string;
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY
 * @param date - Data no formato YYYY-MM-DD
 * @returns Data no formato DD/MM/YYYY ou string vazia
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
  
  return date; // Retorna original se falhar
};

/**
 * Formata endereço completo a partir dos campos separados
 * @param formData - Dados do formulário
 * @returns Endereço formatado em uma string
 */
const formatarEndereco = (formData: FormData): string => {
  const partes: string[] = [];
  
  if (formData.titularLogradouro) {
    partes.push(formData.titularLogradouro);
  }
  
  if (formData.titularNumero) {
    partes.push(formData.titularNumero);
  }
  
  if (formData.titularBairro) {
    partes.push(formData.titularBairro);
  }
  
  if (formData.titularCidade) {
    partes.push(formData.titularCidade);
  }
  
  if (formData.titularEstado) {
    partes.push(formData.titularEstado);
  }
  
  if (formData.titularComplemento) {
    partes.push(`(${formData.titularComplemento})`);
  }
  
  return partes.join(' ');
};

/**
 * Extrai sobrenome e nome a partir do nome completo
 * @param nomeCompleto - Nome completo
 * @returns Objeto com sobrenome e nome separados
 */
const separarNome = (nomeCompleto: string): { sobrenome: string; nome: string } => {
  if (!nomeCompleto) {
    return { sobrenome: '', nome: '' };
  }
  
  const partes = nomeCompleto.trim().split(' ');
  
  // Se tiver só uma parte, é o nome
  if (partes.length === 1) {
    return { sobrenome: '', nome: partes[0] };
  }
  
  // A última parte é o nome, o resto é sobrenome
  const nome = partes.pop() || '';
  const sobrenome = partes.join(' ');
  
  return { sobrenome, nome };
};

/**
 * Interface para períodos de restrição
 */
interface PeriodoRestricao {
  inicio: string;
  fim: string;
}

/**
 * Transforma dados do formulário para formato do banco de dados
 * @param formData - Dados do formulário
 * @returns Objeto com dados para o banco (incluindo periodos_restricao como JSONB)
 */
const transformarParaAgendamento = (formData: FormData): AgendamentoInsert => {
    // Processar todos os períodos de restrição para o banco (JSONB)
    const periodosRestricao: Array<{ inicio: string; fim: string }> = formData.datasRestricao
      .filter(range => range.inicio && range.fim)
      .map(range => ({
        inicio: formatarData(range.inicio!.toISOString().split('T')[0]),
        fim: formatarData(range.fim!.toISOString().split('T')[0])
      }));

    const dataAlvo = formData.data_alvo ? formatarData(formData.data_alvo) : null;

  // Dados para o banco de dados (incluindo periodos_restricao JSONB)
  const dadosBanco: AgendamentoInsert = {
    // Dados do Titular (com prefixo titular_)
    titular_nome_completo: formData.clienteNome || '',
    titular_email: formData.prenotamiEmail || '',
    titular_senha: formData.prenotamiSenha || '',
    titular_cor_olhos: formData.prenotamiCorOlhos || '',
    titular_altura_cm: parseInt(formData.prenotamiAltura) || 0,
    titular_endereco: formatarEndereco(formData),
    titular_estado_civil: formData.titularEstadoCivil || '',
    titular_qtde_filhos: formData.qtde_filhos || 0,
    
    // Dados do Assessor (opcionais)
    assessor_nome_completo: formData.assessorNome || null,
    assessor_email: formData.assessorEmail || null,
    assessor_telefone: formData.assessorTelefone || null,
    
    // Observações e campos do bot
    anotacoes: formData.observacoes || null,
    email_otp: formData.email_otp || null,
    senha_email_otp: formData.senha_email_otp || null,
    // Períodos de restrição (JSONB - suporta múltiplos ranges)
    periodos_restricao: periodosRestricao.length > 0 ? periodosRestricao : null,
    data_alvo: dataAlvo,
  };

  return dadosBanco;
};

/**
 * Cria array de requerentes adicionais para inserção no banco
 * @param formData - Dados do formulário
 * @param agendamentoId - ID do agendamento pai
 * @returns Array de requerentes adicionais para inserção
 */
const criarRequerentesAdicionais = (formData: FormData, agendamentoId: string): RequerenteAdicionalInsert[] => {
  const requerentes: RequerenteAdicionalInsert[] = [];
  
  formData.requerentes.forEach((requerente, index) => {
    if (index >= 3) return; // Limite de 3 requerentes
    
    const { sobrenome, nome } = separarNome(requerente.nomeCompleto);
    
    requerentes.push({
      agendamento_id: agendamentoId,
      sobrenome: sobrenome || '',
      nome: nome || '',
      nascimento: requerente.dataNascimento ? formatarData(requerente.dataNascimento) : '',
      altura_cm: requerente.altura ? parseInt(requerente.altura) : null,
      cor_olhos: requerente.corOlhos || null,
      ordem: index + 1,
    });
  });
  
  return requerentes;
};

/**
 * Prepara os arquivos do formulário para envio por email
 * @param formData - Dados do formulário
 * @param codigoAgendamento - Código do agendamento
 * @returns Array de arquivos em base64
 */
const prepararArquivosEmail = async (formData: FormData, codigoAgendamento: string): Promise<ArquivoEmail[]> => {
  const arquivos: ArquivoEmail[] = [];

  // Identidade do Titular
  if (formData.titularDocumentoIdentidadeFile) {
    const base64 = await fileToBase64(formData.titularDocumentoIdentidadeFile);
    const nomeArquivo = `(${codigoAgendamento}) ${formData.clienteNome} - Identidade.pdf`;
    arquivos.push({ nome: nomeArquivo, conteudoBase64: base64 });
  }

  // Comprovante de Residência (opcional)
  if (formData.clientePdfFileObject) {
    const base64 = await fileToBase64(formData.clientePdfFileObject);
    const nomeArquivo = `(${codigoAgendamento}) ${formData.clienteNome} - Comprovante Residência.pdf`;
    arquivos.push({ nome: nomeArquivo, conteudoBase64: base64 });
  }

  // Identidade dos Requerentes Adicionais
  for (let i = 0; i < formData.requerentes.length; i++) {
    const requerente = formData.requerentes[i];
    if (requerente.documentoIdentidadeFile) {
      const base64 = await fileToBase64(requerente.documentoIdentidadeFile);
      const nomeArquivo = `(${codigoAgendamento}) ${requerente.nomeCompleto} - Identidade Requerente ${i + 1}.pdf`;
      arquivos.push({ nome: nomeArquivo, conteudoBase64: base64 });
    }
  }

  return arquivos;
};

/**
 * Gera string JSONC a partir dos dados do formulário
 * @param formData - Dados do formulário
 * @returns String JSONC formatada
 */
const gerarJSONC = (formData: FormData): string => {
  // Processar datas de restrição para formato JSONC
  const restricoes: Array<{ inicio: string; fim: string }> = [];
  formData.datasRestricao.forEach((range) => {
    if (range.inicio && range.fim) {
      restricoes.push({
        inicio: formatarData(range.inicio.toISOString().split('T')[0]),
        fim: formatarData(range.fim.toISOString().split('T')[0])
      });
    }
  });

  // Processar requerentes adicionais
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

  // Criar objeto principal do JSONC
  const dadosJSONC = {
    email: formData.prenotamiEmail || 'REVISAR',
    senha: formData.prenotamiSenha || 'REVISAR',
    cor_olhos: formData.prenotamiCorOlhos || 'REVISAR',
    altura_cm: formData.prenotamiAltura || 'REVISAR',
    endereco: formatarEndereco(formData) || 'REVISAR',
    estado_civil: formData.titularEstadoCivil || 'REVISAR',
    qtde_filhos: formData.qtde_filhos?.toString() || 'REVISAR',
    tipo_reserva: formData.requerentes.length > 0 ? '2' : '1',
    anotacoes: formData.observacoes || 'REVISAR',
    email_otp: formData.email_otp || 'REVISAR',
    senha_email_otp: formData.senha_email_otp || 'REVISAR',
    ...(restricoes.length > 0 && { restricoes }),
    ...(requerentesAdicionais.length > 0 && { requerentes_adicionais: requerentesAdicionais })
  };

  // Converter para string JSON com formatação bonita
  return JSON.stringify([dadosJSONC], null, 2);
};

/**
 * Faz upload do arquivo JSONC para o Storage
 * @param jsoncContent - Conteúdo do arquivo JSONC
 * @param codigoAgendamento - Código do agendamento (5 dígitos)
 * @param nomeTitular - Nome completo do titular
 * @returns Promise com URL pública do arquivo
 */
const uploadJSONC = async (jsoncContent: string, codigoAgendamento: string, nomeTitular: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Gerar nome do arquivo no formato: (codigo) Nome.jsonc
    const fileName = `(${codigoAgendamento}) ${nomeTitular}.jsonc`;
    const filePath = `Primeiro Passaporte/${fileName}`;

    // Converter string para Blob
    const blob = new Blob([jsoncContent], { type: 'application/json;charset=utf-8;' });
    const file = new File([blob], fileName, { type: 'application/json' });

    // Fazer upload
    const { data, error } = await supabase()
      .storage
      .from('documentos')
      .upload(filePath, file);

    if (error) {
      console.error('Erro ao fazer upload JSONC:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // Obter URL pública
    const { data: publicUrlData } = supabase()
      .storage
      .from('documentos')
      .getPublicUrl(filePath);

    console.log('JSONC salvo no Storage:', publicUrlData.publicUrl);

    return {
      success: true,
      url: publicUrlData.publicUrl
    };
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
 * @param agendamento - Dados do agendamento salvo
 * @returns Promise com o resultado do envio
 */
const enviarEmailCliente = async (
  agendamento: AgendamentoInsert & { codigo_agendamento: string; criado_em: string }
) => {
  try {
    // Determinar a URL base da API (funciona tanto em dev quanto em produção)
    const apiBaseUrl = import.meta.env.MODE === 'production' 
      ? '/api' 
      : 'http://localhost:3000/api';
    
    const response = await fetch(`${apiBaseUrl}/send-client-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agendamento
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Email de confirmação enviado para cliente:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };
    } else {
      console.error('Erro ao enviar email para cliente:', result.error);
      return {
        success: false,
        error: result.error
      };
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
 * @param agendamento - Dados do agendamento salvo
 * @param jsoncUrl - URL pública do JSONC no Supabase Storage
 * @param arquivos - Array de arquivos em base64 para anexar
 * @param requerentesAdicionais - Array com os dados dos requerentes adicionais
 * @returns Promise com o resultado do envio
 */
const enviarEmailAgendamento = async (
  agendamento: AgendamentoInsert & { codigo_agendamento: string; criado_em: string; periodos_restricao_email?: PeriodoRestricao[] }, 
  jsoncUrl: string,
  arquivos: ArquivoEmail[],
  requerentesAdicionais?: Array<RequerenteAdicionalInsert & { nome_completo: string }>
) => {
  try {
    // Determinar a URL base da API (funciona tanto em dev quanto em produção)
    const apiBaseUrl = import.meta.env.MODE === 'production' 
      ? '/api' 
      : 'http://localhost:3000/api';
    
    // Adicionar requerentes adicionais e períodos de restrição ao objeto de agendamento
    const agendamentoComDadosEmail = {
      ...agendamento,
      requerentes_adicionais: requerentesAdicionais || [],
      periodos_restricao_email: agendamento.periodos_restricao_email || []
    };
    
    const response = await fetch(`${apiBaseUrl}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        agendamento: agendamentoComDadosEmail,
        jsoncUrl,
        arquivos
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('Email administrativo enviado com sucesso:', result.messageId);
      return {
        success: true,
        messageId: result.messageId
      };
    } else {
      console.error('Erro ao enviar email administrativo:', result.error);
      return {
        success: false,
        error: result.error
      };
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
 * Salva um agendamento no banco de dados e gera JSONC
 * @param formData - Dados do formulário
 * @returns Promise com o resultado da operação
 */
export const salvarAgendamento = async (formData: FormData) => {
  try {
    // Transformar dados do formulário para o banco
    const dadosBanco = transformarParaAgendamento(formData);
    
    // Inserir agendamento no Supabase
    const { data, error } = await supabase()
      .from('agendamentos')
      .insert(dadosBanco)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao salvar agendamento:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
    
    console.log('Agendamento salvo com sucesso:', data);
    
    // Inserir requerentes adicionais se houver
    let requerentesParaInserir: RequerenteAdicionalInsert[] = [];
    if (formData.requerentes.length > 0) {
      requerentesParaInserir = criarRequerentesAdicionais(formData, data.id);
      
      if (requerentesParaInserir.length > 0) {
        const { error: errorRequerentes } = await supabase()
          .from('requerentes_adicionais')
          .insert(requerentesParaInserir);
        
        if (errorRequerentes) {
          console.error('Erro ao salvar requerentes adicionais:', errorRequerentes);
          // Não falhar completamente se os requerentes não salvarem, mas registrar o erro
          return {
            success: true,
            data: data,
            requerentesError: errorRequerentes.message,
            jsoncUrl: undefined,
            jsoncError: null,
            error: null,
            emailResult: null
          };
        }
        
        console.log('Requerentes adicionais salvos com sucesso:', requerentesParaInserir.length);
      }
    }
    
    // Gerar JSONC e fazer upload
    const jsoncContent = gerarJSONC(formData);
    const uploadResult = await uploadJSONC(jsoncContent, data.codigo_agendamento, formData.clienteNome);
    
    // Preparar dados dos requerentes para o email
    const requerentesParaEmail = formData.requerentes.length > 0 ? formData.requerentes.map((req, index) => ({
      ...requerentesParaInserir?.[index],
      nome_completo: req.nomeCompleto || ''
    })) : [];
    
    // Preparar arquivos para o email
    const arquivosEmail = await prepararArquivosEmail(formData, data.codigo_agendamento);
    
    // Enviar email administrativo se o JSONC foi salvo com sucesso
      let emailResult = null;
      if (uploadResult.success && uploadResult.url) {
        console.log('Enviando email de notificação administrativo...');
        // Mapear periodos_restricao do banco para o formato esperado pelo email
        const agendamentoParaEmail = {
          ...data,
          periodos_restricao_email: data.periodos_restricao || []
        };
        emailResult = await enviarEmailAgendamento(agendamentoParaEmail, uploadResult.url, arquivosEmail, requerentesParaEmail);
    } else if (uploadResult.error) {
      console.warn('JSONC não foi salvo, email não será enviado:', uploadResult.error);
    }
    
    // Enviar email de confirmação para o cliente (não bloqueia o fluxo se falhar)
    let emailClienteResult = null;
    try {
      console.log('Enviando email de confirmação para o cliente...');
      emailClienteResult = await enviarEmailCliente(data);
    } catch (error) {
      console.error('Erro ao enviar email para cliente (não crítico):', error);
      // Não falhar o fluxo se o email do cliente falhar
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
    console.error('Erro ao salvar agendamento (catch):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      details: error
    };
  }
};

/**
 * Lista todos os agendamentos (opcional, para dashboard)
 * @returns Promise com lista de agendamentos
 */
export const listarAgendamentos = async () => {
  try {
    const { data, error } = await supabase()
      .from('agendamentos')
      .select('*')
      .order('criado_em', { ascending: false });
    
    if (error) {
      console.error('Erro ao listar agendamentos:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
    
    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error) {
    console.error('Erro ao listar agendamentos (catch):', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      data: null
    };
  }
};