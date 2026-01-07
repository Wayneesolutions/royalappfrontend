// src/navigation/types.ts
export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  GROUP_USER = 'groupuser', // Regular users without specific roles - all get same dashboard
  DEALER = 'dealers', // Backend uses 'dealers' (plural)
  SUB_DEALER = 'subdealer', // Backend uses 'subdealer' (no hyphen)
  // Removed roles: ZONAL, RSM, ASM, DISTRIBUTOR, SALESMAN - no longer used
}

export interface User {
  _id: string;
  email: string;
  role: UserRole;
  name: string;
  mobile?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  defaultCompany?: any;
  companies?: any[];
  hierarchy?: any;
  createdBy?: any;
  lastLogin?: string;
  // Legacy fields for backward compatibility
  id?: string;
  phone?: string;
  company?: string;
  avatar?: string;
  joinedDate?: string;
}

// ==================== COMMON SCREENS ====================
// Accessible to all roles
type CommonStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  ForgotPassword: undefined;
  OTPVerification: { emailOrPhone: string };
  ResetPassword: { emailOrPhone: string };
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
  Groups: undefined;
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
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ApprovedOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
  OutstandingScreen: undefined;
  TargetAssignmentScreen: undefined;
      ProductCatalog: undefined;
      AdminCreateOrder: undefined;
      AdminOrderList: undefined;
      AdminEditOrder: undefined;
      DealersList: undefined;
      SubDealersList: undefined;
} & CommonStackParamList;

// ==================== ZONAL SCREENS (ZSM - Zonal Sales Manager) ====================
// Same as Admin but without create product/user functionality
type ZonalStackParamList = {
  DashboardZonal: undefined;
  TeamManagementScreen: undefined;
  SalesReportScreen: undefined;
  OrderManagementScreen: undefined;
  TargetManagementScreen: undefined;
  ZonalCreateOrder: undefined;
  ZonalOrderList: undefined;
  ZonalEditOrder: { order: any };
  // Admin screens (same functionality)
  AdminCreateOrder: undefined;
  AdminOrderList: undefined;
  AdminEditOrder: undefined;
  Companies: undefined;
  Product: undefined;
  ProductSummary: { cart: any[] };
  Sales: undefined;
  SaleOrders: undefined;
  SaleOrderStart: undefined;
  SaleOrderEntry: undefined;
  SaleOrderItemSelect: undefined;
  SaleOrderItemDetail: undefined;
  SaleOrderApprove: undefined;
  Users: undefined;
  ZonalScreen: undefined;
  RSMScreen: undefined;
  ASMScreen: undefined;
  DistributorsScreen: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ApprovedOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
  OutstandingScreen: undefined;
  TargetAssignmentScreen: undefined;
} & CommonStackParamList;

// ==================== RSM SCREENS ====================
// Same as Admin but without create product/user functionality
export type RSMStackParamList = {
  DashboardRSM: undefined;
  TeamManagementScreen: undefined;
  SalesReportScreen: undefined;
  OrderManagementScreen: undefined;
  TargetManagementScreen: undefined;
  RSMCreateOrder: undefined;
  RSMOrderList: undefined;
  RSMEditOrder: { order: any };
  // Admin screens (same functionality)
  AdminCreateOrder: undefined;
  AdminOrderList: undefined;
  AdminEditOrder: undefined;
  Companies: undefined;
  Product: undefined;
  ProductSummary: { cart: any[] };
  Sales: undefined;
  SaleOrders: undefined;
  SaleOrderStart: undefined;
  SaleOrderEntry: undefined;
  SaleOrderItemSelect: undefined;
  SaleOrderItemDetail: undefined;
  SaleOrderApprove: undefined;
  Users: undefined;
  ZonalScreen: undefined;
  RSMScreen: undefined;
  ASMScreen: undefined;
  DistributorsScreen: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ApprovedOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
  OutstandingScreen: undefined;
  TargetAssignmentScreen: undefined;
} & CommonStackParamList;

// ==================== ASM SCREENS ====================
// Same as Admin but without create product/user functionality
export type ASMStackParamList = {
  DashboardASM: undefined;
  TeamManagementScreen: undefined;
  SalesReportScreen: undefined;
  OrderManagementScreen: undefined;
  TargetManagementScreen: undefined;
  ASMCreateOrder: undefined;
  ASMOrderList: undefined;
  ASMEditOrder: { order: any };
  // Admin screens (same functionality)
  AdminCreateOrder: undefined;
  AdminOrderList: undefined;
  AdminEditOrder: undefined;
  Companies: undefined;
  Product: undefined;
  ProductSummary: { cart: any[] };
  Sales: undefined;
  SaleOrders: undefined;
  SaleOrderStart: undefined;
  SaleOrderEntry: undefined;
  SaleOrderItemSelect: undefined;
  SaleOrderItemDetail: undefined;
  SaleOrderApprove: undefined;
  Users: undefined;
  ZonalScreen: undefined;
  RSMScreen: undefined;
  ASMScreen: undefined;
  DistributorsScreen: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ApprovedOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
  OutstandingScreen: undefined;
  TargetAssignmentScreen: undefined;
} & CommonStackParamList;

// ==================== GROUP USER SCREENS ====================
type GroupUserStackParamList = {
  DashboardGroupUser: undefined;
  AdminCreateOrder: undefined;
  AdminOrderList: undefined;
  AdminEditOrder: { order: any };
  DealersListScreen: undefined;
} & CommonStackParamList;

// ==================== DISTRIBUTOR SCREENS ====================
type DistributorStackParamList = {
  DashboardDistributor: undefined;
  DistributorCreateOrder: undefined;
  DistributorOrderList: undefined;
  DistributorEditOrder: { order: any };
  SalesReportScreen: undefined;
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
  DealerCreateOrder: undefined;
  DealerOrderList: undefined;
  DealerReceivedOrders: undefined;
  DealerEditOrder: { order: any };
  SalesScreen: undefined;
  SalesReportScreen: undefined;
  TeamManagement: undefined;
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
  SalesmanCreateOrder: undefined;
  SalesmanOrderList: undefined;
  SalesmanEditOrder: { order: any };
  PendingApprovalsScreen: undefined;
  SalesScreen: undefined;
  InvoiceScreen: undefined;
  TargetScreen: undefined;
} & CommonStackParamList;

// ==================== ROOT STACK (UNION OF ALL) ====================
// This allows TypeScript to know about all possible screens
export type RootStackParamList = 
  & SuperAdminStackParamList 
  & AdminStackParamList 
  & GroupUserStackParamList
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
  T extends UserRole.GROUP_USER ? GroupUserStackParamList :
  T extends UserRole.DEALER ? DealerStackParamList :
  T extends UserRole.SUB_DEALER ? SubDealerStackParamList :
  // Removed: ZONAL, RSM, ASM, DISTRIBUTOR, SALESMAN - no longer used
  never;