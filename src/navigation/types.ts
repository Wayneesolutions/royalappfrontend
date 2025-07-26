export enum UserRole {
  ADMIN = 'admin',
  ZONAL = 'zonal',
  RSM = 'rsm',
  ASM = 'asm',
  DISTRIBUTOR = 'distributor',
  DEALER = 'dealer',
  SUB_DEALER = 'sub-dealer',
  SALESMAN = 'salesman',
}


export type RootStackParamList = {
  // Common Auth Screens
  Splash: undefined;
  SignIn: undefined;
  ForgotPasswordMethod: undefined;
  PasswordRecoveryEmail: undefined;
  EmailVerification: { email: string };
  OTPVerification: undefined;
  SuccessMessage: undefined;
  ErrorMessage: undefined;

  // Role-based Dashboard Screens
  DashboardAdmin: undefined;
  DashboardZonal: undefined;
  DashboardRSM: undefined;
  DashboardASM: undefined;
  DashboardDistributor: undefined;
  DashboardDealer: undefined;
  DashboardSubDealer: undefined;
  DashboardSalesman: undefined;

  // Admin Specific Screens
  Companies: undefined;
  Users: undefined;
  Product: undefined;
  ProductSummary: { cart: any[] };

  // Sales Related Screens (Available to multiple roles)
  Sales: undefined;
  SaleOrders: undefined;
  SaleOrderStart: undefined;
  SaleOrderEntry: undefined;
  SaleOrderItemSelect: undefined;
  SaleOrderItemDetail: undefined;
  SaleOrderApprove: undefined;

  // Common Management Screens
  ZonalScreen: undefined;
  RSMScreen: undefined;
  ASMScreen: undefined;
  SalesScreen: undefined;
  DealerScreen: undefined;
  DistributorsScreen: undefined;
  
  // Business Operations Screens
  InvoiceScreen: undefined;
  LedgerScreen: undefined;
  TargetScreen: undefined;
  PendingOrdersScreen: undefined;
  ClearOrdersScreen: undefined;
  
  // Profile & Settings
  SettingsScreen: undefined;
  ProfileScreen: undefined;
  CreateScreen: undefined;

  // Generic Dashboard Home (fallback)
  DashboardHome: undefined;
};

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  // Add other user properties as needed
}