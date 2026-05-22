/**
 * Tipos TypeScript para o Supabase
 * Baseados na tabela services_done
 */

/**
 * Estrutura da tabela services_done
 * @description Armazena estatísticas de serviços realizados por ano
 */
export interface ServicesDone {
  id: number;
  outros: number | null;
  passaporte: number | null;
  cidadania_fila: number | null;
  identidade: number | null;
  cidadania_menores: number | null;
  updated_at: string;
  total: number | null; // Coluna calculada
  comments: string | null;
  total_prenotami: number | null; // Coluna calculada
  year: number;
}

/**
 * Estrutura para inserir novos dados em services_done
 * @description Campos necessários para criar um novo registro
 */
export type ServicesDoneInsert = Omit<ServicesDone, 'id' | 'updated_at' | 'total' | 'total_prenotami'>;

/**
 * Estrutura para atualizar dados em services_done
 * @description Campos que podem ser atualizados
 */
export type ServicesDoneUpdate = Partial<Pick<ServicesDone, 
  'outros' | 
  'passaporte' | 
  'cidadania_fila' | 
  'identidade' | 
  'cidadania_menores' | 
  'comments'
>>;

/**
 * Filtros para busca de estatísticas
 */
export interface StatsFilters {
  year?: number;
  limit?: number;
}

/**
 * Estrutura para exibir estatísticas no componente Stats
 * @description Formato padronizado para exibir estatísticas na UI
 */
export interface StatDisplay {
  value: number;
  suffix?: string;
  label: string;
}

/**
 * Resposta de erro da API
 */
export interface ApiError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Tipo para resposta da API com tratamento de erro
 */
export type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

/**
 * Configurações do cliente Supabase
 */
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Tabelas disponíveis no banco de dados
 */
export type DatabaseTable = 'services_done' | 'agendamentos' | 'requerentes_adicionais';

/**
 * Estrutura da tabela agendamentos (nova estrutura normalizada)
 * @description Armazena agendamentos para integração com bot de processamento
 */
export interface Agendamento {
  id: string;
  codigo_agendamento: string;
  // Dados do Titular (Prenotami)
  titular_nome_completo: string;
  titular_email: string;
  titular_senha: string;
  titular_cor_olhos: string;
  titular_altura_cm: number;
  titular_endereco: string;
  titular_estado_civil: string;
  titular_qtde_filhos: number;
  // Dados do Assessor (opcionais, complementares)
  assessor_nome_completo: string | null;
  assessor_email: string | null;
  assessor_telefone: string | null;
  // Quantidade de requerentes adicionais
  qtde_requerentes_adicionais: number;
  // Observações
  anotacoes: string | null;
  // Campos do Bot
  email_otp: string | null;
  senha_email_otp: string | null;
  // Períodos de restrição (JSONB com múltiplos ranges)
  periodos_restricao: Array<{ inicio: string; fim: string }> | null;
  data_alvo: string | null;
  // Timestamp
  criado_em: string;
}

/**
 * Estrutura para inserir novos agendamentos
 * @description Campos necessários para criar um novo agendamento
 */
export type AgendamentoInsert = Omit<Agendamento, 'id' | 'criado_em' | 'qtde_requerentes_adicionais' | 'codigo_agendamento'>;

/**
 * Estrutura da tabela requerentes_adicionais
 * @description Armazena requerentes adicionais vinculados aos agendamentos
 */
export interface RequerenteAdicional {
  id: string;
  agendamento_id: string;
  sobrenome: string;
  nome: string;
  nascimento: string;
  altura_cm: number | null;
  cor_olhos: string | null;
  ordem: number;
  criado_em: string;
}

/**
 * Estrutura para inserir novos requerentes adicionais
 * @description Campos necessários para criar um novo requerente adicional
 */
export type RequerenteAdicionalInsert = Omit<RequerenteAdicional, 'id' | 'criado_em'>;

/**
 * Operações de consulta
 */
export type QueryOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';