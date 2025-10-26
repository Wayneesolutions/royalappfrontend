// src/navigation/types.ts
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  ZONAL = 'zonal',
  RSM = 'rsm',
  ASM = 'asm',
  DISTRIBUTOR = 'distibutors', // Backend uses 'distibutors' (with typo)
  DEALER = 'dealers', // Backend uses 'dealers' (plural)
  SUB_DEALER = 'subdealer', // Backend uses 'subdealer' (no hyphen)
  SALESMAN = 'salesman',
}

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  name: string;
  mobile?: string;
  defaultCompany?: any;
  companies?: any[];
  hierarchy?: any;
  createdBy?: any;
  lastLogin?: string;
  // Legacy fields for backward compatibility
  id?: string;
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
  MyTargetsScreen: undefined;
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
  // New Order Management Screens
  OrderManagement: undefined;
  ProductManagement: undefined;
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
  PendingApprovalsScreen: undefined;
  ApprovedOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
  OutstandingScreen: undefined;
  TargetAssignmentScreen: undefined;
} & CommonStackParamList;

// ==================== ZONAL SCREENS ====================
type ZonalStackParamList = {
  DashboardZonal: undefined;
  TeamManagementScreen: undefined;
  SalesReportScreen: undefined;
  OrderManagementScreen: undefined;
  TargetManagementScreen: undefined;
  RSMScreen: undefined;
  ASMScreen: undefined;
  SalesScreen: undefined;
  DealerScreen: undefined;
  DistributorsScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  PendingApprovalsScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== RSM SCREENS ====================
export type RSMStackParamList = {
  DashboardRSM: undefined;
  TeamManagementScreen: undefined;
  SalesReportScreen: undefined;
  OrderManagementScreen: undefined;
  TargetManagementScreen: undefined;
  ASMScreen: undefined;
  SalesScreen: undefined;
  DealerScreen: undefined;
  DistributorsScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  PendingApprovalsScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== ASM SCREENS ====================
export type ASMStackParamList = {
  DashboardASM: undefined;
  TeamManagementScreen: undefined;
  SalesReportScreen: undefined;
  OrderManagementScreen: undefined;
  TargetManagementScreen: undefined;
  SalesScreen: undefined;
  DealerScreen: undefined;
  DistributorsScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  PendingApprovalsScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== DISTRIBUTOR SCREENS ====================
type DistributorStackParamList = {
  DashboardDistributor: undefined;
  PendingApprovalsScreen: undefined;
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
  ProductCatalog: undefined;
  ProductManagement: undefined;
  CreateOrder: { selectedProduct?: any } | undefined;
  OrderList: undefined;
  SalesScreen: undefined;
  SalesReportScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== SUB DEALER SCREENS ====================
type SubDealerStackParamList = {
  DashboardSubDealer: undefined;
  PendingApprovalsScreen: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
} & CommonStackParamList;

// ==================== SALESMAN SCREENS ====================
type SalesmanStackParamList = {
  DashboardSalesman: undefined;
  ProductCatalog: undefined;
  ProductManagement: undefined;
  CreateOrder: { selectedProduct?: any } | undefined;
  OrderList: undefined;
  PendingApprovalsScreen: undefined;
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