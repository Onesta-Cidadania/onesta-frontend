/**
 * Serviço de Parceiros (Partners)
 * Busca parceiros/assessores disponíveis para associação com clientes
 * Tabela: partners (novo schema - pistacchio)
 */

import { supabase } from '@/lib/supabase/client';
import type { Partner } from '@/lib/supabase/types';

/**
 * Busca todos os parceiros ativos ordenados por nome
 * @returns Lista de parceiros
 */
export const getAllPartners = async (): Promise<{ data: Partner[] | null; error: string | null }> => {
  try {
    const { data, error } = await supabase()
      .from('partners')
      .select('id, full_name, email, phone, created_by, updated_by, created_at, updated_at')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar parceiros:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar parceiros (catch):', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar parceiros',
    };
  }
};

/**
 * Busca um parceiro pelo ID
 * @param id - UUID do parceiro
 * @returns Dados do parceiro
 */
export const getPartnerById = async (
  id: string
): Promise<{ data: Partner | null; error: string | null }> => {
  try {
    const { data, error } = await supabase()
      .from('partners')
      .select('id, full_name, email, phone, created_by, updated_by, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar parceiro:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Erro ao buscar parceiro por ID (catch):', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao buscar parceiro',
    };
  }
};

/**
 * Busca ou cria um parceiro pelo email (upsert por email)
 * Usado quando o usuário é um "assessor" e fornece seus dados
 * @param fullName - Nome completo do parceiro
 * @param email - Email do parceiro
 * @param phone - Telefone do parceiro (opcional)
 * @returns Parceiro criado/encontrado
 */
export const getOrCreatePartner = async (
  fullName: string,
  email: string,
  phone?: string
): Promise<{ data: Partner | null; error: string | null }> => {
  try {
    // Primeiro tenta buscar pelo email
    const { data: existing, error: searchError } = await supabase()
      .from('partners')
      .select('id, full_name, email, phone, created_by, updated_by, created_at, updated_at')
      .eq('email', email)
      .maybeSingle();

    if (searchError) {
      console.error('Erro ao buscar parceiro por email:', searchError);
      return { data: null, error: searchError.message };
    }

    if (existing) {
      return { data: existing, error: null };
    }

    // Se não encontrou, cria um novo
    const { data: created, error: createError } = await supabase()
      .from('partners')
      .insert({
        full_name: fullName,
        email,
        phone: phone || null,
      })
      .select('id, full_name, email, phone, created_by, updated_by, created_at, updated_at')
      .single();

    if (createError) {
      console.error('Erro ao criar parceiro:', createError);
      return { data: null, error: createError.message };
    }

    return { data: created, error: null };
  } catch (error) {
    console.error('Erro ao buscar/criar parceiro (catch):', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
};