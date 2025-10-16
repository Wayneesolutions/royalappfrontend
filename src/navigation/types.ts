// src/navigation/types.ts
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  ZONAL = 'zonal',
  RSM = 'rsm',
  ASM = 'asm',
  DISTRIBUTOR = 'distributor',
  DEALER = 'dealer',
  SUB_DEALER = 'sub-dealer',
  SALESMAN = 'salesman',
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  phone?: string;
  company?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  avatar?: string;
  joinedDate?: string;
}

// ==================== COMMON SCREENS ====================
// Accessible to all roles
type CommonStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  ProfileScreen: undefined;
  SettingsScreen: undefined;
};

// ==================== SUPER ADMIN SCREENS ====================
type SuperAdminStackParamList = {
  DashboardSuperAdmin: undefined;
  CompaniesListScreen: undefined;
  AdminsListScreen: undefined;
  LedgerScreen: undefined;
  OutstandingScreen: undefined;
  PendingOrdersScreen: undefined;
  TargetScreen: undefined;
  SalesReportScreen: undefined;
} & CommonStackParamList;

// ==================== ADMIN SCREENS ====================
type AdminStackParamList = {
  DashboardAdmin: undefined;
  Companies: undefined;
  Users: undefined;
  Product: undefined;
  ProductSummary: { cart: any[] };
  Sales: undefined;
  SaleOrders: undefined;
  SaleOrderStart: undefined;
  SaleOrderEntry: undefined;
  SaleOrderItemSelect: undefined;
  SaleOrderItemDetail: undefined;
  SaleOrderApprove: undefined;
  ZonalScreen: undefined;
  RSMScreen: undefined;
  ASMScreen: undefined;
  DistributorsScreen: undefined;
  DealerScreen: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== ZONAL SCREENS ====================
type ZonalStackParamList = {
  DashboardZonal: undefined;
  RSMScreen: undefined;
  ASMScreen: undefined;
  SalesScreen: undefined;
  DealerScreen: undefined;
  DistributorsScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== RSM SCREENS ====================
type RSMStackParamList = {
  DashboardRSM: undefined;
  ASMScreen: undefined;
  SalesScreen: undefined;
  DealerScreen: undefined;
  DistributorsScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== ASM SCREENS ====================
type ASMStackParamList = {
  DashboardASM: undefined;
  SalesScreen: undefined;
  DealerScreen: undefined;
  DistributorsScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== DISTRIBUTOR SCREENS ====================
type DistributorStackParamList = {
  DashboardDistributor: undefined;
  SalesScreen: undefined;
  DealerScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== DEALER SCREENS ====================
type DealerStackParamList = {
  DashboardDealer: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== SUB DEALER SCREENS ====================
type SubDealerStackParamList = {
  DashboardSubDealer: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== SALESMAN SCREENS ====================
type SalesmanStackParamList = {
  DashboardSalesman: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
} & CommonStackParamList;

// ==================== ROOT STACK (UNION OF ALL) ====================
// This allows TypeScript to know about all possible screens
export type RootStackParamList = 
  & SuperAdminStackParamList 
  & AdminStackParamList 
  & ZonalStackParamList
  & RSMStackParamList
  & ASMStackParamList
  & DistributorStackParamList
  & DealerStackParamList
  & SubDealerStackParamList
  & SalesmanStackParamList;

// Helper type to get role-specific param list
export type RoleStackParamList<T extends UserRole> = 
  T extends UserRole.SUPERADMIN ? SuperAdminStackParamList :
  T extends UserRole.ADMIN ? AdminStackParamList :
  T extends UserRole.ZONAL ? ZonalStackParamList :
  T extends UserRole.RSM ? RSMStackParamList :
  T extends UserRole.ASM ? ASMStackParamList :
  T extends UserRole.DISTRIBUTOR ? DistributorStackParamList :
  T extends UserRole.DEALER ? DealerStackParamList :
  T extends UserRole.SUB_DEALER ? SubDealerStackParamList :
  T extends UserRole.SALESMAN ? SalesmanStackParamList :
  never;