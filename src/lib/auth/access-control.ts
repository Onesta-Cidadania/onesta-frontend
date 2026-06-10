export enum UserRole {
  Admin = "admin",
  Partner = "partner",
  Customer = "customer",
}

export const USER_ROLES = [UserRole.Admin, UserRole.Partner, UserRole.Customer] as const;

export interface UserRoleProfile {
  id: string;
  user_id: string;
  role: UserRole;
  partner_id: string | null;
  created_at: string | null;
}

export const isUserRole = (value: unknown): value is UserRole =>
  typeof value === "string" && USER_ROLES.includes(value as UserRole);

export const isRoleIn = (role: UserRole | null | undefined, allowedRoles: readonly UserRole[]) =>
  role !== null && role !== undefined && allowedRoles.includes(role);

export const roleLabels: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Partner]: "Partner",
  [UserRole.Customer]: "Customer",
};
