// src/navigation/roleConfig.ts
import { UserRole } from './types';

export interface RoleScreenAccess {
  dashboard: string;
  allowedScreens: string[];
  hierarchyLevel: number;
}

export const ROLE_HIERARCHY: Record<UserRole, RoleScreenAccess> = {
  // ==================== SUPER ADMIN (Highest Level) ====================
  [UserRole.SUPERADMIN]: {
    dashboard: 'DashboardSuperAdmin',
    hierarchyLevel: 0, // Highest hierarchy
    allowedScreens: [
      // Super Admin Dashboard
      'DashboardSuperAdmin',
      
      // Company Management
      'CompaniesListScreen',
      'CreateCompanyScreen',
      'CompanyDetailsScreen',
      
      // Admin Management
      'AdminsListScreen',
      'CreateAdminScreen',
      
      // Read-only Data Views (across all companies)
      'LedgerScreen',
      'OutstandingScreen',
      'PendingOrdersScreen',
      'TargetScreen',
      'SalesReportScreen',
      
      // Common Screens
      'SettingsScreen',
      'ProfileScreen'
    ]
  },

  // ==================== ADMIN (Company Level) ====================
  [UserRole.ADMIN]: {
    dashboard: 'DashboardAdmin',
    hierarchyLevel: 1,
    allowedScreens: [
      // Admin Dashboard
      'DashboardAdmin',
      
      // Company Management
      'Companies',
      'Users',
      
      // Product Management
      'Product',
      'ProductSummary',
      
      // Sales & Orders
      'Sales',
      'SaleOrders',
      'SaleOrderStart',
      'SaleOrderEntry',
      'SaleOrderItemSelect',
      'SaleOrderItemDetail',
      'SaleOrderApprove',
      
      // Order Management (Admin can only monitor, not create)
      // 'OrderManagement',
      // 'ProductManagement',
      
      // Hierarchy Management
      'ZonalScreen',
      'RSMScreen',
      'ASMScreen',
      'SalesScreen',
      'DealerScreen',
      'DistributorsScreen',
      
      // Financial
      'InvoiceScreen',
      'LedgerScreen',
      'TargetScreen',
      'PendingOrdersScreen',
      'ClearOrdersScreen',
      
      // Common
      'SettingsScreen',
      'ProfileScreen',
      'CreateScreen'
    ]
  },

  // ==================== GROUP USER ====================
  [UserRole.GROUP_USER]: {
    dashboard: 'DashboardGroupUser',
    hierarchyLevel: 10, // No hierarchy - just grouping
    allowedScreens: [
      'DashboardGroupUser',
      'SettingsScreen',
      'ProfileScreen'
    ]
  },

  // ==================== DEALER ====================
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

  // ==================== SUB DEALER ====================
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

  // Removed roles: ZONAL, RSM, ASM, DISTRIBUTOR, SALESMAN - no longer used
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Get the dashboard screen name for a specific role
 */
export const getDashboardForRole = (role: UserRole): string => {
  return ROLE_HIERARCHY[role]?.dashboard || 'DashboardAdmin';
};

/**
 * Check if a role has permission to access a specific screen
 */
export const isScreenAllowedForRole = (role: UserRole, screenName: string): boolean => {
  const roleConfig = ROLE_HIERARCHY[role];
  if (!roleConfig) return false;
  
  return roleConfig.allowedScreens.includes(screenName);
};

/**
 * Get the hierarchy level for a role (lower number = higher authority)
 */
export const getHierarchyLevel = (role: UserRole): number => {
  return ROLE_HIERARCHY[role]?.hierarchyLevel || 999;
};

/**
 * Check if role1 has higher authority than role2
 */
export const hasHigherAuthority = (role1: UserRole, role2: UserRole): boolean => {
  return getHierarchyLevel(role1) < getHierarchyLevel(role2);
};

/**
 * Get all screens accessible to a role
 */
export const getAllowedScreens = (role: UserRole): string[] => {
  return ROLE_HIERARCHY[role]?.allowedScreens || [];
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Super Administrator',
    [UserRole.ADMIN]: 'Company Admin',
    [UserRole.GROUP_USER]: 'Group User',
    [UserRole.DEALER]: 'Dealer',
    [UserRole.SUB_DEALER]: 'Sub Dealer',
  };
  
  return roleNames[role] || 'Group User'; // Default to Group User for unknown roles
};