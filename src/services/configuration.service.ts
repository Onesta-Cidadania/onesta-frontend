/**
 * Serviço de Configurações
 * @description Operações relacionadas à tabela configurations
 */

import { supabase } from '@/lib/supabase/client';
import type {
  Configuration,
  ApiResponse,
} from '@/lib/supabase/types';

const TABLE_NAME = 'configurations';

/**
 * Campos editáveis na tela de configurações
 */
const EDITABLE_FIELDS = [
  'threads_calendar',
  'threads_form',
  'otp_requests',
  'seconds_to_otp',
  'seconds_to_form',
  'minutes_to_logout',
  'seconds_to_post_booking',
  'form_send_retries',
  'minutes_to_ignore_giornaliero',
] as const;

/**
 * Trata erros do Supabase e retorna um formato padronizado
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleError = (error: any): ApiResponse<null> => {
  console.error('Erro na operação do Supabase:', error);

  return {
    data: null,
    error: {
      message: error.message || 'Erro desconhecido',
      details: error.details,
      hint: error.hint,
      code: error.code,
    },
  };
};

/**
 * Serviço de Configurações
 */
export const configurationService = {
  /**
   * Busca o registro único de configurações
   * @returns Promise com Configuration ou erro
   */
  async get(): Promise<ApiResponse<Configuration>> {
    try {
      const { data, error } = await supabase()
        .from(TABLE_NAME)
        .select([
        'id',
          ...EDITABLE_FIELDS,
          'updated_at',
          'updated_by',
        ].join(','))
        .limit(1)
        .single();

      if (error) {
        return handleError(error);
      }

      return {
        data: data as Configuration,
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Atualiza o registro de configurações
   * @param id - ID do registro
   * @param updates - Campos a serem atualizados (valores numéricos ou string do form)
   * @param userEmail - Email do usuário que está fazendo a alteração
   * @returns Promise com Configuration atualizada ou erro
   */
  async update(
    id: number,
    updates: Record<string, string | number | null | undefined>,
    userEmail: string
  ): Promise<ApiResponse<Configuration>> {
    try {
      // Monta objeto com apenas campos permitidos
      const sanitizedUpdates: Record<string, unknown> = {};

      for (const field of EDITABLE_FIELDS) {
        if (field in updates) {
          const value = updates[field];
          sanitizedUpdates[field] = (value === '' || value === undefined || value === null)
            ? null
            : Number(value);
        }
      }

      sanitizedUpdates.updated_by = userEmail;

      const { data, error } = await supabase()
        .from(TABLE_NAME)
        .update(sanitizedUpdates)
        .eq('id', id)
        .select([
          'id',
          ...EDITABLE_FIELDS,
          'updated_at',
          'updated_by',
        ].join(','))
        .single();

      if (error) {
        return handleError(error);
      }

      return {
        data: data as Configuration,
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },
};

export default configurationService;