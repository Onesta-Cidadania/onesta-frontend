/**
 * Serviço de Consulta de Clientes
 * @description Operações relacionadas à tabela customers_new com filtros e paginação
 */

import { supabase } from '@/lib/supabase/client';
import type {
  CustomerFilters,
  CustomerWithRelations,
  FormService,
  Partner,
  PaginatedCustomers,
  ApiResponse,
  UserRole,
} from '@/lib/supabase/types';
import { startOfDay, endOfDay, formatISO } from 'date-fns';

// Nome da tabela (usar customers_new enquanto a tabela antiga existe)
const TABLE_NAME = 'customers_new';

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
    pageSize: number = 20
  ): Promise<ApiResponse<PaginatedCustomers>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Query principal com joins
      let query = supabase()
        .from(TABLE_NAME)
        .select('*, partners(id, full_name, email), form_services(id, code, name)', { count: 'exact' })
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

      // Controle de acesso por role
      const userRole = await customerService.getUserRole();
      if (userRole?.role === 'partner') {
        query = query.eq('partner_id', userRole.partner_id);
      }
      if (userRole?.role === 'customer') {
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
   * Busca todos os serviços de formulário ativos
   * @returns Promise com array de FormService
   */
  async getFormServices(): Promise<ApiResponse<FormService[]>> {
    try {
      const { data, error } = await supabase()
        .from('form_services')
        .select('*')
        .eq('active', true)
        .order('sort_order', { ascending: true });

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
        .select('*')
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
   * Busca o role do usuário autenticado
   * @returns Promise com dados do role
   */
  async getUserRole(): Promise<UserRole | null> {
    const { data: { user } } = await supabase().auth.getUser();
    if (!user) return null;

    const { data } = await supabase()
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    return data;
  },
};

export default customerService;