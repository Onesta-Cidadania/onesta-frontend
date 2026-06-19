import { supabase } from "@/lib/supabase/client";
import { UserRole } from "@/lib/auth/access-control";
import type { ApiResponse, PaginatedPartners, Partner, PartnerPayload } from "@/lib/supabase/types";

const TABLE_NAME = "partners";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleError = (error: any): ApiResponse<null> => {
  console.error("Erro na operação do Supabase:", error);

  return {
    data: null,
    error: {
      message: error.message || "Erro desconhecido",
      details: error.details,
      hint: error.hint,
      code: error.code,
    },
  };
};

export const partnerService = {
  async getPartners(
    filterName: string,
    page: number,
    pageSize: number,
    userAccess: { role: UserRole | null; partnerId: string | null },
  ): Promise<ApiResponse<PaginatedPartners>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase()
        .from(TABLE_NAME)
        .select("id,full_name,email,phone,document,corporate_name,full_address,created_at,updated_at,created_by,updated_by", {
          count: userAccess.role === UserRole.Admin ? "exact" : undefined,
        })
        .order("full_name", { ascending: true });

      if (userAccess.role === UserRole.Partner) {
        if (!userAccess.partnerId) {
          return {
            data: { partners: [], total: 0, page, pageSize, totalPages: 0 },
            error: null,
          };
        }

        query = query.eq("id", userAccess.partnerId);
      } else {
        const searchName = filterName.trim();

        if (searchName) {
          query = query.ilike("full_name", `%${searchName}%`);
        }
      }

      if (userAccess.role === UserRole.Admin) {
        query = query.range(from, to);
      }

      const { data, error, count } = await query;

      if (error) {
        return handleError(error);
      }

      const partners = (data ?? []) as Partner[];
      const total = userAccess.role === UserRole.Admin ? count ?? 0 : partners.length;

      return {
        data: {
          partners,
          total,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async isDocumentAvailable(document: string, currentPartnerId?: string): Promise<ApiResponse<boolean>> {
    try {
      let query = supabase()
        .from(TABLE_NAME)
        .select("id")
        .ilike("document", document)
        .limit(1);

      if (currentPartnerId) {
        query = query.neq("id", currentPartnerId);
      }

      const { data, error } = await query;

      if (error) {
        return handleError(error);
      }

      return {
        data: (data ?? []).length === 0,
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async createPartner(payload: PartnerPayload): Promise<ApiResponse<Partner>> {
    try {
      const { data, error } = await supabase().from(TABLE_NAME).insert(payload).select("*").single();

      if (error) {
        return handleError(error);
      }

      return {
        data: data as Partner,
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async updatePartner(id: string, payload: PartnerPayload): Promise<ApiResponse<Partner>> {
    try {
      const { data, error } = await supabase().from(TABLE_NAME).update(payload).eq("id", id).select("*").single();

      if (error) {
        return handleError(error);
      }

      return {
        data: data as Partner,
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async hasLinkedUserRoles(partnerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { count, error } = await supabase()
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partnerId);

      if (error) {
        return handleError(error);
      }

      return {
        data: (count ?? 0) > 0,
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async hasLinkedCustomers(partnerId: string): Promise<ApiResponse<boolean>> {
    try {
      const { count, error } = await supabase()
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("partner_id", partnerId);

      if (error) {
        return handleError(error);
      }

      return {
        data: (count ?? 0) > 0,
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async deletePartner(partnerId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase().from(TABLE_NAME).delete().eq("id", partnerId);

      if (error) {
        return handleError(error);
      }

      return {
        data: null,
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },
};

export default partnerService;
