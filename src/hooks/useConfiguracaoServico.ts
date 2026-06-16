/**
 * Hook para gerenciar configurações de campos dinâmicos de serviços
 * Carrega a configuração sob demanda (lazy) apenas do serviço selecionado
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getConfiguracaoByCodigo } from '@/services/servicos.service';
import type { ConfiguracaoServico, ConfiguracaoCampo } from '@/types/servicos';

interface UseConfiguracaoServicoState {
  configuracao: ConfiguracaoServico | null;
  loading: boolean;
  error: string | null;
}

// Cache global simples para evitar re-buscar o mesmo serviço
const configuracaoCache = new Map<string, ConfiguracaoServico>();

/**
 * Hook para gerenciar configurações de campos dinâmicos
 * @param servicoCodigo - Código do serviço selecionado. Só carrega quando fornecido.
 * @returns Estado com configuração e funções auxiliares
 * 
 * @example
 * ```tsx
 * const { shouldShowField, isRequiredField, loading } = useConfiguracaoServico(servicoSelecionado);
 * 
 * // Verificar se campo deve ser exibido
 * {shouldShowField('titular', 'estadoCivil') && (
 *   <CampoEstadoCivil />
 * )}
 * ```
 */
export const useConfiguracaoServico = (servicoCodigo: string = '') => {
  const [state, setState] = useState<UseConfiguracaoServicoState>({
    configuracao: null,
    loading: false,
    error: null,
  });

  // Track the last loaded codigo to avoid stale updates
  const lastLoadedCodigo = useRef<string>('');

  // Carregar configuração quando o codigo mudar
  useEffect(() => {
    if (!servicoCodigo) {
      setState({ configuracao: null, loading: false, error: null });
      lastLoadedCodigo.current = '';
      return;
    }

    // Verificar cache primeiro
    const cached = configuracaoCache.get(servicoCodigo);
    if (cached) {
      setState({ configuracao: cached, loading: false, error: null });
      lastLoadedCodigo.current = servicoCodigo;
      return;
    }

    const loadConfiguracao = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const { data: campos, error } = await getConfiguracaoByCodigo(servicoCodigo);

        if (error || !campos) {
          throw new Error(error || 'Erro ao carregar configurações');
        }

        // Buscar dados do serviço a partir dos campos (o service_id está em cada campo)
        const servicoId = campos[0]?.service_id || 0;

        const configuracao: ConfiguracaoServico = {
          servico: {
            id: servicoId,
            code: servicoCodigo,
            name: '',
            description: null,
            active: true,
            sort_order: 0,
            created_at: '',
          },
          camposTitular: campos.filter(c => c.entity === 'titular'),
          camposRequerente: campos.filter(c => c.entity === 'requerente'),
        };

        // Salvar no cache
        configuracaoCache.set(servicoCodigo, configuracao);

        // Só atualizar se ainda é o serviço atual
        if (lastLoadedCodigo.current !== servicoCodigo || servicoCodigo === servicoCodigo) {
          lastLoadedCodigo.current = servicoCodigo;
          setState({
            configuracao,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar configurações';
        console.error('Erro no useConfiguracaoServico:', errorMessage);

        setState({
          configuracao: null,
          loading: false,
          error: errorMessage,
        });
      }
    };

    loadConfiguracao();
  }, [servicoCodigo]);

  /**
   * Verifica se um campo deve ser exibido
   * @param entidade - 'titular' ou 'requerente'
   * @param campo - Nome do campo
   * @returns true se o campo deve ser exibido, false caso contrário
   */
  const shouldShowField = useCallback((
    entidade: 'titular' | 'requerente',
    campo: string
  ): boolean => {
    const configuracao = state.configuracao;
    if (!configuracao) return true; // Padrão: mostrar se não configurado

    const campos = entidade === 'titular'
      ? configuracao.camposTitular
      : configuracao.camposRequerente;

    const campoConfig = campos.find((c) => c.field_name === campo);

    // Se não tiver configuração específica, mostra o campo (comportamento padrão)
    if (!campoConfig) return true;

    return campoConfig.visible;
  }, [state.configuracao]);

  /**
   * Verifica se um campo é obrigatório
   * @param entidade - 'titular' ou 'requerente'
   * @param campo - Nome do campo
   * @returns true se o campo é obrigatório, false caso contrário
   */
  const isRequiredField = useCallback((
    entidade: 'titular' | 'requerente',
    campo: string
  ): boolean => {
    const configuracao = state.configuracao;
    if (!configuracao) return false; // Padrão: não obrigatório se não configurado

    const campos = entidade === 'titular'
      ? configuracao.camposTitular
      : configuracao.camposRequerente;

    const campoConfig = campos.find((c) => c.field_name === campo);

    // Se não tiver configuração específica, não é obrigatório (comportamento padrão)
    if (!campoConfig) return false;

    return campoConfig.required;
  }, [state.configuracao]);

  /**
   * Busca todos os campos de uma entidade
   * @param entidade - 'titular' ou 'requerente'
   * @returns Lista de configurações de campos
   */
  const getFieldsByEntidade = useCallback((
    entidade: 'titular' | 'requerente'
  ): ConfiguracaoCampo[] => {
    const configuracao = state.configuracao;
    if (!configuracao) return [];

    return entidade === 'titular'
      ? configuracao.camposTitular
      : configuracao.camposRequerente;
  }, [state.configuracao]);

  /**
   * Busca campos visíveis de uma entidade
   * @param entidade - 'titular' ou 'requerente'
   * @returns Lista de campos que devem ser exibidos
   */
  const getVisibleFields = useCallback((
    entidade: 'titular' | 'requerente'
  ): ConfiguracaoCampo[] => {
    return getFieldsByEntidade(entidade)
      .filter((c) => c.visible)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [getFieldsByEntidade]);

  /**
   * Busca campos obrigatórios de uma entidade
   * @param entidade - 'titular' ou 'requerente'
   * @returns Lista de campos que são obrigatórios
   */
  const getRequiredFields = useCallback((
    entidade: 'titular' | 'requerente'
  ): ConfiguracaoCampo[] => {
    return getFieldsByEntidade(entidade)
      .filter((c) => c.visible && c.required)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [getFieldsByEntidade]);

  return {
    configuracao: state.configuracao,
    loading: state.loading,
    error: state.error,

    // Funções auxiliares
    shouldShowField,
    isRequiredField,
    getFieldsByEntidade,
    getVisibleFields,
    getRequiredFields,
  };
};

export default useConfiguracaoServico;