// src/navigation/roleConfig.ts
import { UserRole } from './types';

export interface RoleScreenAccess {
  dashboard: string;
  allowedScreens: string[];
  hierarchyLevel: number;
}

export const ROLE_HIERARCHY: Record<UserRole, RoleScreenAccess> = {
  [UserRole.ADMIN]: {
    dashboard: 'DashboardAdmin',
    hierarchyLevel: 1,
    allowedScreens: [
      // Admin has access to everything
      'DashboardAdmin',
      'Companies',
      'Users',
      'Sales',
      'Product',
      'ProductSummary',
      'SaleOrders',
      'SaleOrderStart',
      'SaleOrderEntry',
      'SaleOrderItemSelect',
      'SaleOrderItemDetail',
      'SaleOrderApprove',
      'ZonalScreen',
      'RSMScreen',
      'ASMScreen',
      'SalesScreen',
      'DealerScreen',
      'DistributorsScreen',
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'PendingOrdersScreen',
      'ClearOrdersScreen',
      'SettingsScreen',
      'ProfileScreen',
      'CreateScreen'
    ]
  },
  [UserRole.ZONAL]: {
    dashboard: 'DashboardZonal',
    hierarchyLevel: 2,
    allowedScreens: [
      'DashboardZonal',
      'RSMScreen',
      'ASMScreen',
      'SalesScreen',
      'DealerScreen',
      'DistributorsScreen',
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'PendingOrdersScreen',
      'ClearOrdersScreen',
      'SettingsScreen',
      'ProfileScreen'
    ]
  },
  [UserRole.RSM]: {
    dashboard: 'DashboardRSM',
    hierarchyLevel: 3,
    allowedScreens: [
      'DashboardRSM',
      'ASMScreen',
      'SalesScreen',
      'DealerScreen',
      'DistributorsScreen',
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'PendingOrdersScreen',
      'ClearOrdersScreen',
      'SettingsScreen',
      'ProfileScreen'
    ]
  },
  [UserRole.ASM]: {
    dashboard: 'DashboardASM',
    hierarchyLevel: 4,
    allowedScreens: [
      'DashboardASM',
      'SalesScreen',
      'DealerScreen',
      'DistributorsScreen',
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'PendingOrdersScreen',
      'ClearOrdersScreen',
      'SettingsScreen',
      'ProfileScreen'
    ]
  },
  [UserRole.DISTRIBUTOR]: {
    dashboard: 'DashboardDistributor',
    hierarchyLevel: 5,
    allowedScreens: [
      'DashboardDistributor',
      'SalesScreen',
      'DealerScreen',
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'PendingOrdersScreen',
      'ClearOrdersScreen',
      'SettingsScreen',
      'ProfileScreen'
    ]
  },
  [UserRole.DEALER]: {
    dashboard: 'DashboardDealer',
    hierarchyLevel: 6,
    allowedScreens: [
      'DashboardDealer',
      'SalesScreen',
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'PendingOrdersScreen',
      'ClearOrdersScreen',
      'SettingsScreen',
      'ProfileScreen'
    ]
  },
  [UserRole.SUB_DEALER]: {
    dashboard: 'DashboardSubDealer',
    hierarchyLevel: 7,
    allowedScreens: [
      'DashboardSubDealer',
      'SalesScreen',
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'PendingOrdersScreen',
      'SettingsScreen',
      'ProfileScreen'
    ]
  },
  [UserRole.SALESMAN]: {
    dashboard: 'DashboardSalesman',
    hierarchyLevel: 8,
    allowedScreens: [
      'DashboardSalesman',
      'SalesScreen',
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'SettingsScreen',
      'ProfileScreen'
    ]
  }
};

export const getDashboardForRole = (role: UserRole): string => {
  return ROLE_HIERARCHY[role]?.dashboard || 'DashboardHome';
};

export const isScreenAllowedForRole = (role: UserRole, screenName: string): boolean => {
  const roleConfig = ROLE_HIERARCHY[role];
  if (!roleConfig) return false;
  
  return roleConfig.allowedScreens.includes(screenName);
};

export const getHierarchyLevel = (role: UserRole): number => {
  return ROLE_HIERARCHY[role]?.hierarchyLevel || 999;
};