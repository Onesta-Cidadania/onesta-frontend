/**
 * Serviço de Serviços e Configurações de Campos
 * Responsável por buscar serviços e suas configurações de campos do Supabase
 * Usa tabela `services` (bigint) e `field_configurations` do novo schema (pistacchio)
 *
 * IMPORTANTE: A tabela `services` precisa das colunas code, description, active, sort_order
 * A tabela `field_configurations` precisa ter service_id alterado de uuid para bigint
 */

import { supabase } from '@/lib/supabase/client';
import type { Servico, ConfiguracaoCampo, ConfiguracaoServico } from '@/types/servicos';

/**
 * Busca todos os serviços ativos ordenados pela ordem definida
 * @returns Lista de serviços ativos
 */
export const getAllServicos = async (): Promise<{ data: Servico[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase()
      .from('services')
      .select('id, service_id, code, name, description, active, sort_order, created_at')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar serviços:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar serviços (catch):', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar serviços' 
    };
  }
};

/**
 * Busca configurações de campos para um serviço específico
 * @param servicoId - ID do serviço (bigint)
 * @returns Configurações de campos do serviço
 */
export const getConfiguracaoByServicoId = async (
  servicoId: number
): Promise<{ data: ConfiguracaoCampo[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase()
      .from('field_configurations')
      .select('*')
      .eq('service_id', servicoId)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar configurações:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar configurações (catch):', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar configurações' 
    };
  }
};

/**
 * Busca configurações de campos pelo código do serviço
 * @param codigo - Código do serviço (ex: 'PASS_SP')
 * @returns Configurações de campos do serviço
 */
export const getConfiguracaoByCodigo = async (
  codigo: string
): Promise<{ data: ConfiguracaoCampo[] | null; error: string | null }> => {
  try {
    // Primeiro busca o serviço pelo código para obter o ID
    const { data: servico, error: servicoError } = await supabase()
      .from('services')
      .select('id')
      .eq('code', codigo)
      .eq('active', true)
      .single();

    if (servicoError || !servico) {
      console.error('Erro ao buscar serviço:', servicoError);
      return { data: null, error: 'Serviço não encontrado' };
    }

    // Depois busca as configurações usando o ID do serviço
    return await getConfiguracaoByServicoId(servico.id);
  } catch (error) {
    console.error('Erro ao buscar configurações por código (catch):', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar configurações' 
    };
  }
};

/**
 * Busca configurações completas de todos os serviços (serviço + campos)
 * Útil para carregar tudo de uma vez e usar em cache
 * @returns Lista completa de configurações de serviços
 */
export const getConfiguracoesCompletas = async (): Promise<{
  data: ConfiguracaoServico[] | null;
  error: string | null;
}> => {
  try {
    // Busca todos os serviços
    const { data: servicos, error: servicosError } = await getAllServicos();

    if (servicosError || !servicos) {
      return { data: null, error: servicosError || 'Erro ao buscar serviços' };
    }

    // Para cada serviço, busca suas configurações de campos
    const configuracoes: ConfiguracaoServico[] = [];

    for (const servico of servicos) {
      const { data: campos } = await getConfiguracaoByServicoId(servico.id);

      if (campos) {
        configuracoes.push({
          servico,
          camposTitular: campos.filter(c => c.entity === 'titular'),
          camposRequerente: campos.filter(c => c.entity === 'requerente'),
        });
      }
    }

    return { data: configuracoes, error: null };
  } catch (error) {
    console.error('Erro ao buscar configurações completas (catch):', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar configurações' 
    };
  }
};

/**
 * Busca um serviço específico pelo código
 * @param codigo - Código do serviço
 * @returns Dados do serviço
 */
export const getServicoByCodigo = async (
  codigo: string
): Promise<{ data: Servico | null; error: string | null }> => {
  try {
    const { data, error } = await supabase()
      .from('services')
      .select('id, service_id, code, name, description, active, sort_order, created_at')
      .eq('code', codigo)
      .eq('active', true)
      .single();

    if (error) {
      console.error('Erro ao buscar serviço:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar serviço por código (catch):', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar serviço' 
    };
  }
};