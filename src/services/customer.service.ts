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
 * Envia email de notificação de alteração de status (individual)
 * @param customerData - Dados do cliente e da alteração
 * @param userRole - Role do usuário que fez a alteração
 */
async function sendStatusChangeEmail(
  customerData: {
    customerName: string;
    customerCode: string;
    customerEmail: string;
    previousStatus: string;
    newStatus: string;
    userEmail: string;
  },
  userRole: UserRoleEnum | null
): Promise<void> {
  try {
    // Não enviar email se for Admin
    if (userRole === UserRoleEnum.Admin) {
      console.log('ℹ️  Alteração por Admin - email não enviado');
      return;
    }

    // Em produção usa /api (path relativo), em desenvolvimento usa localhost:3001/api
    const apiBaseUrl = import.meta.env.MODE === 'production'
      ? '/api'
      : 'http://localhost:3001/api';

    const response = await fetch(`${apiBaseUrl}/emails/status-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...customerData,
        userRole: userRole || 'Unknown'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('⚠️  Erro ao enviar email de notificação:', errorData);
    } else {
      const result = await response.json();
      console.log('✅ Email de notificação enviado:', result);
    }
  } catch (error) {
    // Erro no envio de email não deve interromper o fluxo principal
    console.warn('⚠️  Falha ao enviar email de notificação:', error);
  }
}

/**
 * Envia email de notificação de alteração de status em lote
 * @param changes - Array de alterações de status
 * @param userEmail - Email do usuário que fez as alterações
 * @param userRole - Role do usuário que fez as alterações
 */
async function sendBatchStatusChangeEmail(
  changes: Array<{
    customerCode: string;
    customerEmail: string;
    previousStatus: string;
    newStatus: string;
  }>,
  userEmail: string,
  userRole: UserRoleEnum | null
): Promise<void> {
  try {
    // Não enviar email se for Admin
    if (userRole === UserRoleEnum.Admin) {
      console.log('ℹ️  Alterações por Admin - email não enviado');
      return;
    }

    if (changes.length === 0) {
      console.log('ℹ️  Nenhuma alteração para notificar');
      return;
    }

    // Em produção usa /api (path relativo), em desenvolvimento usa localhost:3001/api
    const apiBaseUrl = import.meta.env.MODE === 'production'
      ? '/api'
      : 'http://localhost:3001/api';

    const response = await fetch(`${apiBaseUrl}/emails/status-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        changes,
        userEmail,
        userRole: userRole || 'Unknown'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('⚠️  Erro ao enviar email de notificação em lote:', errorData);
    } else {
      const result = await response.json();
      console.log('✅ Email de notificação em lote enviado:', result);
    }
  } catch (error) {
    // Erro no envio de email não deve interromper o fluxo principal
    console.warn('⚠️  Falha ao enviar email de notificação em lote:', error);
  }
}

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
          'id,customer_code,full_name,email,status,scheduled_at,reservation_date,last_attempt,created_at,partner_id,service_id,priority,partners(id,full_name),services(id,name)',
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

      if (filters.priority !== undefined) {
        query = query.eq('priority', filters.priority);
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
   * @param currentStatus - Status atual
   * @param updatedBy - Email do usuário que está atualizando
   * @param customerData - Dados adicionais do cliente para envio de email
   * @param userRole - Role do usuário que está atualizando
   * @returns Promise com resposta
   */
  async updateCustomerStatus(
    customerId: string,
    newStatus: string,
    currentStatus?: string,
    updatedBy?: string,
    customerData?: {
      customerName: string;
      customerCode: string;
      customerEmail: string;
    },
    userRole?: UserRoleEnum | null
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

      // Enviar email de notificação após atualização bem-sucedida
      if (customerData && updatedBy && currentStatus) {
        // Email enviado de forma assíncrona, não bloqueia o fluxo principal
        sendStatusChangeEmail(
          {
            customerName: customerData.customerName,
            customerCode: customerData.customerCode,
            customerEmail: customerData.customerEmail,
            previousStatus: currentStatus,
            newStatus: newStatus,
            userEmail: updatedBy,
          },
          userRole || null
        );
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
   * Atualiza a prioridade de um cliente individual
   * @param customerId - ID do cliente
   * @param priority - Nova prioridade (true = prioritário)
   * @param updatedBy - Email do usuário que está atualizando
   * @returns Promise com resposta
   */
  async updateCustomerPriority(
    customerId: string,
    priority: boolean,
    updatedBy?: string
  ): Promise<ApiResponse<{ id: string; priority: boolean }>> {
    try {
      const updateData: Record<string, unknown> = {
        priority,
        updated_at: new Date().toISOString(),
        ...(updatedBy ? { updated_by: updatedBy } : {}),
      };

      const { data, error } = await supabase()
        .from(TABLE_NAME)
        .update(updateData)
        .eq('id', customerId)
        .select('id,priority')
        .single();

      if (error) {
        return handleError(error);
      }

      return {
        data: data as unknown as { id: string; priority: boolean },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  /**
   * Atualiza o status de múltiplos clientes em lote
   * @param items - Array de items com id, currentStatus, customerCode e customerEmail
   * @param newStatus - Novo status
   * @param updatedBy - Email do usuário que está atualizando
   * @param userRole - Role do usuário que está atualizando
   * @returns Promise com resposta contendo successes e failures
   */
  async batchUpdateCustomerStatus(
    items: Array<{
      id: string;
      currentStatus: string;
      customerCode?: string;
      customerEmail?: string;
    }>,
    newStatus: string,
    updatedBy?: string,
    userRole?: UserRoleEnum | null
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

      // Enviar email de notificação em lote apenas se houver alterações bem-sucedidas
      if (success.length > 0 && updatedBy) {
        const changes = items
          .filter((item, index) => results[index].status === 'fulfilled')
          .map((item) => ({
            customerCode: item.customerCode || '',
            customerEmail: item.customerEmail || '',
            previousStatus: item.currentStatus,
            newStatus,
          }));

        // Email enviado de forma assíncrona, não bloqueia o fluxo principal
        sendBatchStatusChangeEmail(changes, updatedBy, userRole || null);
      }

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