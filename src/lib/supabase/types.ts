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
export type DatabaseTable = 'services_done';

/**
 * Operações de consulta
 */
export type QueryOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

// ============================================================
// New Schema Types (partners, customers_new, form_services, etc.)
// ============================================================

/**
 * Status possíveis do cliente
 */
export type CustomerStatus =
  | 'EM_ANALISE'
  | 'AGENDADO'
  | 'RESERVADO'
  | 'CONCLUIDO'
  | 'CANCELADO'
  | 'PENDENTE';

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
 * Estrutura da tabela form_services
 */
export interface FormService {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

/**
 * Estrutura da tabela customers_new
 * @description Nova tabela de clientes (schema atualizado)
 */
export interface CustomerNew {
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
  status: CustomerStatus;
  previous_status: string | null;
  pending_issues: string | null;
  last_attempt: string | null;
  partner_id: string;
  service_id: string;
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
export interface CustomerWithRelations extends CustomerNew {
  partners?: Partner;
  form_services?: FormService;
}

/**
 * Filtros para busca de clientes
 */
export interface CustomerFilters {
  service_id?: string;
  name?: string;
  email?: string;
  status?: CustomerStatus | '';
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
