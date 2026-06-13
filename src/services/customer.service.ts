/**
 * Serviço de Consulta de Clientes
 * @description Operações relacionadas à tabela customers com filtros e paginação
 */

import { supabase } from '@/lib/supabase/client';
import { UserRole as UserRoleEnum } from '@/lib/auth/access-control';
import type {
  CustomerFilters,
  CustomerWithRelations,
  Service,
  CustomerStatusOption,
  Partner,
  PaginatedCustomers,
  ApiResponse,
} from '@/lib/supabase/types';
import { startOfDay, endOfDay, formatISO } from 'date-fns';

// Nome da tabela
const TABLE_NAME = 'customers';

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
 * Serviço de Clientes
 */
export const customerService = {
  /**
   * Busca clientes com filtros e paginação
   * @param filters - Filtros opcionais
   * @param page - Página atual (começa em 1)
   * @param pageSize - Itens por página
   * @returns Promise com resposta paginada
   */
  async getCustomers(
    filters: CustomerFilters = {},
    page: number = 1,
    pageSize: number = 20,
    userAccess?: { role: UserRoleEnum | null; partnerId: string | null }
  ): Promise<ApiResponse<PaginatedCustomers>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Query principal com joins (projeção explícita — apenas campos necessários para a tabela)
      let query = supabase()
        .from(TABLE_NAME)
        .select(
          'id,customer_code,full_name,email,status,scheduled_at,reservation_date,created_at,partner_id,service_id,partners(id,full_name),services(id,name)',
          { count: 'exact' }
        )
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters.service_id) {
        query = query.eq('service_id', filters.service_id);
      }

      if (filters.name) {
        query = query.ilike('full_name', `%${filters.name}%`);
      }

      if (filters.email) {
        query = query.ilike('email', `%${filters.email}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.partner_id) {
        query = query.eq('partner_id', filters.partner_id);
      }

      // Filtro de data de inclusão (created_at) - sem considerar horário
      if (filters.created_at_start) {
        query = query.gte('created_at', formatISO(startOfDay(filters.created_at_start)));
      }
      if (filters.created_at_end) {
        query = query.lte('created_at', formatISO(endOfDay(filters.created_at_end)));
      }

      // Filtro de data de agendamento (scheduled_at) - sem considerar horário
      if (filters.scheduled_at_start) {
        query = query.gte('scheduled_at', formatISO(startOfDay(filters.scheduled_at_start)));
      }
      if (filters.scheduled_at_end) {
        query = query.lte('scheduled_at', formatISO(endOfDay(filters.scheduled_at_end)));
      }

      // Filtro de data de reserva (reservation_date) - sem considerar horário
      if (filters.reservation_date_start) {
        query = query.gte('reservation_date', formatISO(startOfDay(filters.reservation_date_start)));
      }
      if (filters.reservation_date_end) {
        query = query.lte('reservation_date', formatISO(endOfDay(filters.reservation_date_end)));
      }

      // Controle de acesso por role (usa dados do AuthContext - cache)
      if (userAccess?.role === UserRoleEnum.Partner) {
        query = query.eq('partner_id', userAccess.partnerId);
      }
      if (userAccess?.role === UserRoleEnum.Customer) {
        return { data: { customers: [], total: 0, page, pageSize, totalPages: 0 }, error: null };
      }

      // Paginação
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        return handleError(error);
      }

      const customers = (data || []) as unknown as CustomerWithRelations[];
      const total = count || 0;
      const totalPages = Math.ceil(total / pageSize);

      return {
        data: {
          customers,
          total,
          page,
          pageSize,
          totalPages,
        },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Busca todos os serviços disponíveis
   * @returns Promise com array de Service
   */
  async getServices(): Promise<ApiResponse<Service[]>> {
    try {
      const { data, error } = await supabase()
        .from('services')
        .select('id,name')
        .order('name', { ascending: true });

      if (error) {
        return handleError(error);
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Busca todos os status disponíveis para clientes
   * @returns Promise com array de CustomerStatusOption
   */
  async getStatuses(): Promise<ApiResponse<CustomerStatusOption[]>> {
    try {
      const { data, error } = await supabase()
        .from('customer_statuses')
        .select('*');

      if (error) {
        return handleError(error);
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Busca todos os parceiros
   * @returns Promise com array de Partner
   */
  async getPartners(): Promise<ApiResponse<Partner[]>> {
    try {
      const { data, error } = await supabase()
        .from('partners')
        .select('id,full_name,email')
        .order('full_name', { ascending: true });

      if (error) {
        return handleError(error);
      }

      return {
        data: data || [],
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Atualiza o status de um cliente individual
   * @param customerId - ID do cliente
   * @param newStatus - Novo status
   * @returns Promise com resposta
   */
  async updateCustomerStatus(
    customerId: string,
    newStatus: string,
    currentStatus?: string,
    updatedBy?: string
  ): Promise<ApiResponse<{ id: string; status: string }>> {
    try {
      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
        previous_status: currentStatus
      };

      const { data, error } = await supabase()
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', customerId)
        .select('id,status')
        .single();

      if (error) {
        return handleError(error);
      }

      return {
        data: data as unknown as { id: string; status: string },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Atualiza o status de múltiplos clientes em lote
   * @param customerIds - Array de IDs dos clientes
   * @param newStatus - Novo status
   * @returns Promise com resposta contendo successes e failures
   */
  async batchUpdateCustomerStatus(
    items: { id: string; currentStatus: string }[],
    newStatus: string,
    updatedBy?: string
  ): Promise<ApiResponse<{ success: string[]; failed: string[] }>> {
    try {
      const updatePayload: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      const results = await Promise.allSettled(
        items.map(async (item) => {
          const payload = {
            ...updatePayload,
            previous_status: item.currentStatus,
            ...(updatedBy ? { updated_by: updatedBy } : {}),
          };
          const { error } = await supabase()
            .from(TABLE_NAME)
            .update(payload)
            .eq('id', item.id);

          if (error) throw error;
          return item.id;
        })
      );

      const success: string[] = [];
      const failed: string[] = [];

      results.forEach((result, index) => {
        const id = items[index].id;
        if (result.status === 'fulfilled') {
          success.push(id);
        } else {
          failed.push(id);
        }
      });

      return {
        data: { success, failed },
        error: failed.length > 0
          ? {
              message: `${failed.length} de ${items.length} atualizações falharam`,
              code: 'PARTIAL_FAILURE',
            }
          : null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

};

export default customerService;
