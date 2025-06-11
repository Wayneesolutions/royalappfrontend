// /src/utils/auth.ts
import { UserRole } from "../constants/roles";

export const getUserRole = (username: string): UserRole | null => {
  const roleMap: Record<string, UserRole> = {
    admin: UserRole.ADMIN,
    rsm: UserRole.RSM,
    asm: UserRole.ASM,
    distributor: UserRole.DISTRIBUTOR,
    dealer: UserRole.DEALER,
    subdealer: UserRole.SUB_DEALER,
    salesman: UserRole.SALESMAN,
  };

  return roleMap[username.toLowerCase()] ?? null;
};
