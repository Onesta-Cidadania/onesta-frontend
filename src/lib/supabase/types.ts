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

// ============================================================
// New Schema Types (partners, customers, services, etc.)
// ============================================================

/**
 * Status possíveis do cliente (vinculados à tabela customer_statuses)
 */
export type CustomerStatus =
  | 'EM_ANALISE'
  | 'AGUARDANDO_CORRECAO'
  | 'EM_ANDAMENTO'
  | 'PAUSADO'
  | 'CANCELADO'
  | 'AGENDADO';

/**
 * Papel do usuário no sistema
 */
export type UserRoleType = 'admin' | 'partner' | 'customer';

/**
 * Estrutura da tabela partners
 */
export interface Partner {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Estrutura da tabela services (já existente no banco)
 */
export interface Service {
  id: number;
  service_id: number;
  name: string;
  url: string;
  days_target: number | null;
  seconds_loop: number | null;
  timer_hour: number | null;
  timer_minute: number | null;
  timer_second: number | null;
  usar_novo_html: boolean;
  form_mode: number | null;
  is_monitoring: boolean | null;
  cavalo_louco: boolean;
  weeks_minimum_calendar: number | null;
  days_minimum_calendar: number | null;
  days_maximum_calendar: number | null;
  check_email_booking: boolean | null;
  default_password: string | null;
}

/**
 * Estrutura da tabela customer_statuses
 */
export interface CustomerStatusOption {
  code: string;
  label: string;
  description: string | null;
}

/**
 * Estrutura da tabela customers
 * @description Tabela de clientes
 */
export interface Customer {
  id: string;
  customer_code: string;
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
  scheduled_at: string | null;
  reservation_date: string | null;
  status: string;
  previous_status: string | null;
  pending_issues: string | null;
  last_attempt: string | null;
  partner_id: string;
  service_id: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Estrutura da tabela additional_applicants
 */
export interface AdditionalApplicant {
  id: string;
  customer_id: string;
  last_name: string;
  first_name: string;
  birth_date: string;
  height_cm: number | null;
  eye_color: string | null;
  sort_order: number;
  created_at: string;
}

/**
 * Estrutura da tabela user_roles
 */
export interface UserRole {
  id: string;
  user_id: string;
  role: UserRoleType;
  partner_id: string | null;
  created_at: string;
}

/**
 * Customer com dados relacionados (join)
 */
export interface CustomerWithRelations extends Customer {
  partners?: Partner;
  services?: Service;
}

/**
 * Filtros para busca de clientes
 */
export interface CustomerFilters {
  service_id?: number;
  name?: string;
  email?: string;
  status?: string | '';
  partner_id?: string;
  created_at_start?: Date;
  created_at_end?: Date;
  scheduled_at_start?: Date;
  scheduled_at_end?: Date;
  reservation_date_start?: Date;
  reservation_date_end?: Date;
}

/**
 * Resposta paginada de clientes
 */
export interface PaginatedCustomers {
  customers: CustomerWithRelations[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// Configurations Types
// ============================================================

/**
 * Estrutura da tabela configurations
 * @description Armazena configurações globais do sistema
 */
export interface Configuration {
  id: number;
  threads_calendar: number | null;
  threads_form: number | null;
  otp_requests: number | null;
  seconds_to_otp: number | null;
  seconds_to_form: number | null;
  minutes_to_logout: number | null;
  seconds_to_post_booking: number | null;
  form_send_retries: number | null;
  minutes_to_ignore_giornaliero: number | null;
  updated_at: string;
  updated_by: string | null;
}

/**
 * Campos que podem ser atualizados na tabela configurations
 */
export type ConfigurationUpdate = Partial<Pick<Configuration,
  | 'threads_calendar'
  | 'threads_form'
  | 'otp_requests'
  | 'seconds_to_otp'
  | 'seconds_to_form'
  | 'minutes_to_logout'
  | 'seconds_to_post_booking'
  | 'form_send_retries'
  | 'minutes_to_ignore_giornaliero'
>> & { updated_by?: string };
