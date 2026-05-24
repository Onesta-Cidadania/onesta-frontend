/**
 * Hook para buscar apenas a lista de serviços disponíveis
 * Usado na tela de seleção de serviço (StepTipoUsuario)
 */

import { useState, useEffect } from 'react';
import { getAllServicos } from '@/services/servicos.service';
import type { Servico } from '@/types/servicos';

interface UseServicosState {
  servicos: Servico[];
  loading: boolean;
  error: string | null;
}

export const useServicos = () => {
  const [state, setState] = useState<UseServicosState>({
    servicos: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    const loadServicos = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const { data, error } = await getAllServicos();

        if (error || !data) {
          throw new Error(error || 'Erro ao carregar serviços');
        }

        setState({
          servicos: data,
          loading: false,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar serviços';
        console.error('Erro no useServicos:', errorMessage);

        setState({
          servicos: [],
          loading: false,
          error: errorMessage,
        });
      }
    };

    loadServicos();
  }, []);

  return state;
};

export default useServicos;