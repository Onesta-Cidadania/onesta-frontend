import { supabase } from "@/lib/supabase/client";
import type {
  AccessProfile,
  AccessProfilePayload,
  ApiResponse,
  PaginatedAccessProfiles,
  PartnerOption,
  UserOption,
} from "@/lib/supabase/types";

const TABLE_NAME = "user_roles";

interface UserRoleRow {
  id: string;
  user_id: string;
  role: "admin" | "partner" | "customer";
  partner_id: string | null;
  created_at: string | null;
}

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

export const accessProfileService = {
  async getUserOptions(search: string): Promise<ApiResponse<{ options: UserOption[]; hasMore: boolean }>> {
    try {
      const normalizedSearch = search.trim();

      let query = supabase()
        .from("user_profiles")
        .select("user_id,email")
        .order("email", { ascending: true })
        .limit(normalizedSearch ? 100 : 50);

      if (normalizedSearch) {
        query = query.ilike("email", `%${normalizedSearch}%`);
      }

      const { data, error } = await query;

      if (error) {
        return handleError(error);
      }

      const profileOptions = (data ?? []) as UserOption[];
      const userIds = profileOptions.map((option) => option.user_id);
      let linkedUserIds = new Set<string>();

      if (userIds.length > 0) {
        const { data: linkedRoles, error: linkedRolesError } = await supabase()
          .from(TABLE_NAME)
          .select("user_id")
          .in("user_id", userIds);

        if (linkedRolesError) {
          return handleError(linkedRolesError);
        }

        linkedUserIds = new Set(((linkedRoles ?? []) as Array<{ user_id: string }>).map((roleRow) => roleRow.user_id));
      }

      const options = profileOptions.filter((option) => !linkedUserIds.has(option.user_id));
      const limit = normalizedSearch ? 20 : 5;

      return {
        data: {
          options: options.slice(0, limit),
          hasMore: options.length > limit,
        },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async getPartnerOptions(search: string): Promise<ApiResponse<{ options: PartnerOption[]; hasMore: boolean }>> {
    try {
      const normalizedSearch = search.trim();

      let query = supabase()
        .from("partners")
        .select("id,full_name,email")
        .order("full_name", { ascending: true })
        .limit(normalizedSearch ? 21 : 6);

      if (normalizedSearch) {
        query = query.or(`full_name.ilike.%${normalizedSearch}%,email.ilike.%${normalizedSearch}%`);
      }

      const { data, error } = await query;

      if (error) {
        return handleError(error);
      }

      const options = (data ?? []) as PartnerOption[];
      const limit = normalizedSearch ? 20 : 5;

      return {
        data: {
          options: options.slice(0, limit),
          hasMore: options.length > limit,
        },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async getProfiles(
    emailFilter: string,
    page: number,
    pageSize: number,
  ): Promise<ApiResponse<PaginatedAccessProfiles>> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const normalizedEmail = emailFilter.trim();

      let userIdsByEmail: string[] | null = null;

      if (normalizedEmail) {
        const { data: users, error: usersError } = await supabase()
          .from("user_profiles")
          .select("user_id")
          .ilike("email", `%${normalizedEmail}%`);

        if (usersError) {
          return handleError(usersError);
        }

        userIdsByEmail = ((users ?? []) as Array<{ user_id: string }>).map((item) => item.user_id);

        if (userIdsByEmail.length === 0) {
          return {
            data: { profiles: [], total: 0, page, pageSize, totalPages: 0 },
            error: null,
          };
        }
      }

      let query = supabase()
        .from(TABLE_NAME)
        .select("id,user_id,role,partner_id,created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (userIdsByEmail) {
        query = query.in("user_id", userIdsByEmail);
      }

      const { data, error, count } = await query;

      if (error) {
        return handleError(error);
      }

      const rows = (data ?? []) as UserRoleRow[];
      const userIds = [...new Set(rows.map((row) => row.user_id))];
      const partnerIds = [...new Set(rows.map((row) => row.partner_id).filter((id): id is string => Boolean(id)))];

      const [usersResult, partnersResult] = await Promise.all([
        userIds.length
          ? supabase().from("user_profiles").select("user_id,email").in("user_id", userIds)
          : Promise.resolve({ data: [], error: null }),
        partnerIds.length
          ? supabase().from("partners").select("id,full_name,email").in("id", partnerIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (usersResult.error) {
        return handleError(usersResult.error);
      }

      if (partnersResult.error) {
        return handleError(partnersResult.error);
      }

      const usersById = new Map(
        ((usersResult.data ?? []) as UserOption[]).map((item) => [item.user_id, item]),
      );
      const partnersById = new Map(
        ((partnersResult.data ?? []) as PartnerOption[]).map((item) => [item.id, item]),
      );

      return {
        data: {
          profiles: rows.map<AccessProfile>((row) => ({
            id: row.id,
            userId: row.user_id,
            email: usersById.get(row.user_id)?.email ?? "-",
            role: row.role,
            partnerId: row.partner_id,
            partnerName: row.partner_id ? partnersById.get(row.partner_id)?.full_name ?? null : null,
            createdAt: row.created_at,
          })),
          total: count ?? 0,
          page,
          pageSize,
          totalPages: Math.max(1, Math.ceil((count ?? 0) / pageSize)),
        },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async createProfile(payload: AccessProfilePayload): Promise<ApiResponse<{ id: string }>> {
    try {
      const { data, error } = await supabase().from(TABLE_NAME).insert(payload).select("id").single();

      if (error) {
        return handleError(error);
      }

      return {
        data: data as { id: string },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async updateProfile(id: string, payload: AccessProfilePayload): Promise<ApiResponse<{ id: string }>> {
    try {
      const { data, error } = await supabase().from(TABLE_NAME).update(payload).eq("id", id).select("id").single();

      if (error) {
        return handleError(error);
      }

      return {
        data: data as { id: string },
        error: null,
      };
    } catch (error) {
      return handleError(error);
    }
  },

  async deleteProfile(id: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase().from(TABLE_NAME).delete().eq("id", id);

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

export default accessProfileService;
