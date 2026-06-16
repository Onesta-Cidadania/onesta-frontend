/**
 * Tipos para o sistema de serviços e configurações de campos dinâmicos
 * Usa tabela `services` (bigint) do novo schema (pistacchio)
 *
 * IMPORTANTE: A tabela `services` precisa das colunas code, description, active, sort_order
 */

export interface Servico {
  id: number; // bigint na tabela services
  code: string; // NOVO - precisa adicionar na tabela services
  name: string;
  description: string | null; // NOVO - precisa adicionar na tabela services
  active: boolean; // NOVO - precisa adicionar na tabela services
  sort_order: number; // NOVO - precisa adicionar na tabela services
  created_at?: string;
}

export interface ConfiguracaoCampo {
  id: string;
  service_id: number | null; // bigint (FK → services.id) - precisa alterar de uuid para bigint
  entity: 'titular' | 'requerente';
  field_name: string;
  visible: boolean;
  required: boolean;
  sort_order: number;
  created_at: string;
}

/**
 * Lista de campos disponíveis para o titular
 */
export type CampoTitular = 
  | 'estadoCivil'
  | 'documentoIdentidade'
  | 'altura'
  | 'corOlhos'
  | 'comprovanteResidencia';

/**
 * Lista de campos disponíveis para o requerente
 */
export type CampoRequerente = 
  | 'dataNascimento'
  | 'altura'
  | 'corOlhos'
  | 'documentoIdentidade';

/**
 * Configuração completa de um serviço
 */
export interface ConfiguracaoServico {
  servico: Servico;
  camposTitular: ConfiguracaoCampo[];
  camposRequerente: ConfiguracaoCampo[];
}

/**
 * Mapeamento de campo para descrição amigável
 */
export const CAMPO_TITULAR_LABELS: Record<CampoTitular, string> = {
  estadoCivil: 'Estado Civil',
  documentoIdentidade: 'Documento de Identidade',
  altura: 'Altura',
  corOlhos: 'Cor dos Olhos',
  comprovanteResidencia: 'Comprovante de Residência',
};

export const CAMPO_REQUERENTE_LABELS: Record<CampoRequerente, string> = {
  dataNascimento: 'Data de Nascimento',
  altura: 'Altura',
  corOlhos: 'Cor dos Olhos',
  documentoIdentidade: 'Documento de Identidade',
};