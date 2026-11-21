// src/navigation/RoleNavigators.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Dashboard Screens
import DashboardZonal from '../screens/dashboard/Zonal/DashboardHome';
import TeamManagementScreen from '../screens/dashboard/Zonal/TeamManagementScreen';
import SalesReportScreen from '../screens/dashboard/Zonal/SalesReportScreen';
import OrderManagementScreen from '../screens/dashboard/Zonal/OrderManagementScreen';
import TargetManagementScreen from '../screens/dashboard/Zonal/TargetManagementScreen';
import ZonalCreateOrder from '../screens/dashboard/Zonal/ZonalCreateOrder';
import ZonalOrderList from '../screens/dashboard/Zonal/ZonalOrderList';
import ZonalEditOrder from '../screens/dashboard/Zonal/ZonalEditOrder';
import DashboardRSM from '../screens/dashboard/RSM/DashboardHome';
import RSMCreateOrder from '../screens/dashboard/RSM/RSMCreateOrder';
import RSMOrderList from '../screens/dashboard/RSM/RSMOrderList';
import RSMEditOrder from '../screens/dashboard/RSM/RSMEditOrder';
import RSMTeamManagementScreen from '../screens/dashboard/RSM/TeamManagementScreen';
import RSMSalesReportScreen from '../screens/dashboard/RSM/SalesReportScreen';
import RSMOrderManagementScreen from '../screens/dashboard/RSM/OrderManagementScreen';
import RSMTargetManagementScreen from '../screens/dashboard/RSM/TargetManagementScreen';
import DashboardASM from '../screens/dashboard/ASM/DashboardHome';
import ASMCreateOrder from '../screens/dashboard/ASM/ASMCreateOrder';
import ASMOrderList from '../screens/dashboard/ASM/ASMOrderList';
import ASMEditOrder from '../screens/dashboard/ASM/ASMEditOrder';
import ASMTeamManagementScreen from '../screens/dashboard/ASM/TeamManagementScreen';
import ASMSalesReportScreen from '../screens/dashboard/ASM/SalesReportScreen';
import ASMOrderManagementScreen from '../screens/dashboard/ASM/OrderManagementScreen';
import ASMTargetManagementScreen from '../screens/dashboard/ASM/TargetManagementScreen';
import DashboardDistributor from '../screens/dashboard/Distributor/DashboardHome';
import DistributorCreateOrder from '../screens/dashboard/Distributor/DistributorCreateOrder';
import DistributorOrderList from '../screens/dashboard/Distributor/DistributorOrderList';
import DistributorEditOrder from '../screens/dashboard/Distributor/DistributorEditOrder';
import DistributorSalesReportScreen from '../screens/dashboard/Distributor/SalesReportScreen';
import DashboardDealer from '../screens/dashboard/Dealer/DashboardHome';
import ProductCatalog from '../screens/dashboard/Dealer/ProductCatalog';
import ProductManagement from '../screens/dashboard/Dealer/ProductManagement';
import CreateOrder from '../screens/dashboard/Dealer/CreateOrder';
import OrderList from '../screens/dashboard/Dealer/OrderList';
import DealerCreateOrder from '../screens/dashboard/Dealer/DealerCreateOrder';
import DealerOrderList from '../screens/dashboard/Dealer/DealerOrderList';
import DealerReceivedOrders from '../screens/dashboard/Dealer/DealerReceivedOrders';
import DealerEditOrder from '../screens/dashboard/Dealer/DealerEditOrder';
import DealerSalesReportScreen from '../screens/dashboard/Dealer/SalesReportScreen';
import TeamManagement from '../screens/dashboard/Dealer/TeamManagement';
import TargetAssignmentScreen from '../screens/dashboard/admin/target/TargetAssignmentScreen';
import MyTargetsScreen from '../screens/dashboard/common/MyTargetsScreen';
import DashboardSubDealer from '../screens/dashboard/SubDealer/DashboardHome';
import DashboardSalesman from '../screens/dashboard/Salesman/DashboardHome';
import ProductCatalogSalesman from '../screens/dashboard/Salesman/ProductCatalog';
import ProductManagementSalesman from '../screens/dashboard/Salesman/ProductManagement';
import CreateOrderSalesman from '../screens/dashboard/Salesman/CreateOrder';
import OrderListSalesman from '../screens/dashboard/Salesman/OrderList';
import SalesmanCreateOrder from '../screens/dashboard/Salesman/SalesmanCreateOrder';
import SalesmanOrderList from '../screens/dashboard/Salesman/SalesmanOrderList';
import SalesmanEditOrder from '../screens/dashboard/Salesman/SalesmanEditOrder';

// Admin screens for ZSM (Zonal Sales Manager)
import ZonalScreen from '../screens/dashboard/admin/ZonalScreen';
import RSMScreen from '../screens/dashboard/admin/RSMScreen';
import ASMScreen from '../screens/dashboard/admin/ASMScreen';
import SalesScreen from '../screens/dashboard/admin/SalesScreen';
import DistributorsScreen from '../screens/dashboard/admin/DistributorsScreen';
import InvoiceScreen from '../screens/dashboard/admin/InvoiceScreen';
import TargetScreen from '../screens/dashboard/admin/TargetScreen';
import PendingOrdersScreen from '../screens/dashboard/admin/PendingOrdersScreen';
import ClearOrdersScreen from '../screens/dashboard/admin/ClearOrdersScreen';
import SettingsScreen from '../screens/dashboard/admin/SettingsScreen';
import ProfileScreen from '../screens/common/ProfileScreen';
import Users from '../screens/dashboard/admin/saleOrder/Users';
import Companies from '../screens/dashboard/admin/saleOrder/Companies';
import ProductManagementAdmin from '../screens/dashboard/admin/saleOrder/ProductManagement';
import ProductSummary from '../screens/dashboard/admin/saleOrder/ProductSummary';
import Sales from '../screens/dashboard/admin/saleOrder/Sales';
import SalesOrders from '../screens/dashboard/admin/saleOrder/SalesOrders';
import SaleOrderStart from '../screens/dashboard/admin/saleOrder/SaleOrderStart';
import SaleOrderEntry from '../screens/dashboard/admin/saleOrder/SaleOrderEntry';
import SaleOrderItemSelect from '../screens/dashboard/admin/saleOrder/SaleOrderItemSelect';
import SaleOrderItemDetail from '../screens/dashboard/admin/saleOrder/SaleOrderItemDetail';
import SaleOrderApprove from '../screens/dashboard/admin/saleOrder/SaleOrderApprove';
import AdminCreateOrder from '../screens/dashboard/admin/AdminCreateOrder';
import AdminOrderList from '../screens/dashboard/admin/AdminOrderList';
import AdminEditOrder from '../screens/dashboard/admin/AdminEditOrder';
import { OutstandingScreen } from '../screens/dashboard/superadmin/OutstandingScreen';
import ApprovedOrdersScreen from '../screens/dashboard/admin/ApprovedOrdersScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Zonal Navigator (ZSM - Zonal Sales Manager) - Same as Admin but without create product/user
export function ZonalNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardZonal" screenOptions={{ headerShown: false }}>
      {/* ZSM Dashboard */}
      <Stack.Screen name="DashboardZonal" component={DashboardZonal} />

      {/* Team Management */}
      <Stack.Screen name="TeamManagementScreen" component={TeamManagementScreen} />
      <Stack.Screen name="SalesReportScreen" component={SalesReportScreen} />
      <Stack.Screen name="OrderManagementScreen" component={OrderManagementScreen} />
      <Stack.Screen name="TargetManagementScreen" component={TargetManagementScreen} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      <Stack.Screen name="TargetAssignmentScreen" component={TargetAssignmentScreen} />

      {/* Order Management */}
      <Stack.Screen name="ZonalCreateOrder" component={ZonalCreateOrder} />
      <Stack.Screen name="ZonalOrderList" component={ZonalOrderList} />
      <Stack.Screen name="ZonalEditOrder" component={ZonalEditOrder} />
      <Stack.Screen name="AdminCreateOrder" component={AdminCreateOrder} />
      <Stack.Screen name="AdminOrderList" component={AdminOrderList} />
      <Stack.Screen name="AdminEditOrder" component={AdminEditOrder} />

      {/* Role Screens */}
      <Stack.Screen name="ZonalScreen" component={ZonalScreen} />
      <Stack.Screen name="RSMScreen" component={RSMScreen} />
      <Stack.Screen name="ASMScreen" component={ASMScreen} />
      <Stack.Screen name="DistributorsScreen" component={DistributorsScreen} />

      {/* Business Operations */}
      <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
      <Stack.Screen name="ApprovedOrdersScreen" component={ApprovedOrdersScreen} />
      <Stack.Screen name="ClearOrdersScreen" component={ClearOrdersScreen} />
      <Stack.Screen name="OutstandingScreen" component={OutstandingScreen} />

      {/* Sale Order Screens */}
      <Stack.Screen name="Companies" component={Companies} />
      <Stack.Screen name="Product" component={ProductManagementAdmin} />
      <Stack.Screen name="ProductSummary" component={ProductSummary} />
      <Stack.Screen name="Sales" component={Sales} />
      <Stack.Screen name="SaleOrders" component={SalesOrders} />
      <Stack.Screen name="SaleOrderStart" component={SaleOrderStart} />
      <Stack.Screen name="SaleOrderEntry" component={SaleOrderEntry} />
      <Stack.Screen name="SaleOrderItemSelect" component={SaleOrderItemSelect} />
      <Stack.Screen name="SaleOrderItemDetail" component={SaleOrderItemDetail} />
      <Stack.Screen name="SaleOrderApprove" component={SaleOrderApprove} />

      {/* User Management - View only, no create */}
      <Stack.Screen name="Users" component={Users} />

      {/* Settings & Profile */}
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// RSM Navigator - Same as Admin but without create product/user
export function RSMNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardRSM" screenOptions={{ headerShown: false }}>
      {/* RSM Dashboard */}
      <Stack.Screen name="DashboardRSM" component={DashboardRSM} />

      {/* Team Management */}
      <Stack.Screen name="TeamManagementScreen" component={RSMTeamManagementScreen} />
      <Stack.Screen name="SalesReportScreen" component={RSMSalesReportScreen} />
      <Stack.Screen name="OrderManagementScreen" component={RSMOrderManagementScreen} />
      <Stack.Screen name="TargetManagementScreen" component={RSMTargetManagementScreen} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      <Stack.Screen name="TargetAssignmentScreen" component={TargetAssignmentScreen} />

      {/* Order Management */}
      <Stack.Screen name="RSMCreateOrder" component={RSMCreateOrder} />
      <Stack.Screen name="RSMOrderList" component={RSMOrderList} />
      <Stack.Screen name="RSMEditOrder" component={RSMEditOrder} />
      <Stack.Screen name="AdminCreateOrder" component={AdminCreateOrder} />
      <Stack.Screen name="AdminOrderList" component={AdminOrderList} />
      <Stack.Screen name="AdminEditOrder" component={AdminEditOrder} />

      {/* Role Screens */}
      <Stack.Screen name="ZonalScreen" component={ZonalScreen} />
      <Stack.Screen name="RSMScreen" component={RSMScreen} />
      <Stack.Screen name="ASMScreen" component={ASMScreen} />
      <Stack.Screen name="DistributorsScreen" component={DistributorsScreen} />

      {/* Business Operations */}
      <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
      <Stack.Screen name="ApprovedOrdersScreen" component={ApprovedOrdersScreen} />
      <Stack.Screen name="ClearOrdersScreen" component={ClearOrdersScreen} />
      <Stack.Screen name="OutstandingScreen" component={OutstandingScreen} />

      {/* Sale Order Screens */}
      <Stack.Screen name="Companies" component={Companies} />
      <Stack.Screen name="Product" component={ProductManagementAdmin} />
      <Stack.Screen name="ProductSummary" component={ProductSummary} />
      <Stack.Screen name="Sales" component={Sales} />
      <Stack.Screen name="SaleOrders" component={SalesOrders} />
      <Stack.Screen name="SaleOrderStart" component={SaleOrderStart} />
      <Stack.Screen name="SaleOrderEntry" component={SaleOrderEntry} />
      <Stack.Screen name="SaleOrderItemSelect" component={SaleOrderItemSelect} />
      <Stack.Screen name="SaleOrderItemDetail" component={SaleOrderItemDetail} />
      <Stack.Screen name="SaleOrderApprove" component={SaleOrderApprove} />

      {/* User Management - View only, no create */}
      <Stack.Screen name="Users" component={Users} />

      {/* Settings & Profile */}
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// ASM Navigator - Same as Admin but without create product/user
export function ASMNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardASM" screenOptions={{ headerShown: false }}>
      {/* ASM Dashboard */}
      <Stack.Screen name="DashboardASM" component={DashboardASM} />

      {/* Team Management */}
      <Stack.Screen name="TeamManagementScreen" component={ASMTeamManagementScreen} />
      <Stack.Screen name="SalesReportScreen" component={ASMSalesReportScreen} />
      <Stack.Screen name="OrderManagementScreen" component={ASMOrderManagementScreen} />
      <Stack.Screen name="TargetManagementScreen" component={ASMTargetManagementScreen} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      <Stack.Screen name="TargetAssignmentScreen" component={TargetAssignmentScreen} />

      {/* Order Management */}
      <Stack.Screen name="ASMCreateOrder" component={ASMCreateOrder} />
      <Stack.Screen name="ASMOrderList" component={ASMOrderList} />
      <Stack.Screen name="ASMEditOrder" component={ASMEditOrder} />
      <Stack.Screen name="AdminCreateOrder" component={AdminCreateOrder} />
      <Stack.Screen name="AdminOrderList" component={AdminOrderList} />
      <Stack.Screen name="AdminEditOrder" component={AdminEditOrder} />

      {/* Role Screens */}
      <Stack.Screen name="ZonalScreen" component={ZonalScreen} />
      <Stack.Screen name="RSMScreen" component={RSMScreen} />
      <Stack.Screen name="ASMScreen" component={ASMScreen} />
      <Stack.Screen name="DistributorsScreen" component={DistributorsScreen} />

      {/* Business Operations */}
      <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
      <Stack.Screen name="ApprovedOrdersScreen" component={ApprovedOrdersScreen} />
      <Stack.Screen name="ClearOrdersScreen" component={ClearOrdersScreen} />
      <Stack.Screen name="OutstandingScreen" component={OutstandingScreen} />

      {/* Sale Order Screens */}
      <Stack.Screen name="Companies" component={Companies} />
      <Stack.Screen name="Product" component={ProductManagementAdmin} />
      <Stack.Screen name="ProductSummary" component={ProductSummary} />
      <Stack.Screen name="Sales" component={Sales} />
      <Stack.Screen name="SaleOrders" component={SalesOrders} />
      <Stack.Screen name="SaleOrderStart" component={SaleOrderStart} />
      <Stack.Screen name="SaleOrderEntry" component={SaleOrderEntry} />
      <Stack.Screen name="SaleOrderItemSelect" component={SaleOrderItemSelect} />
      <Stack.Screen name="SaleOrderItemDetail" component={SaleOrderItemDetail} />
      <Stack.Screen name="SaleOrderApprove" component={SaleOrderApprove} />

      {/* User Management - View only, no create */}
      <Stack.Screen name="Users" component={Users} />

      {/* Settings & Profile */}
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

// Distributor Navigator
export function DistributorNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardDistributor" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardDistributor" component={DashboardDistributor} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      <Stack.Screen name="DistributorCreateOrder" component={DistributorCreateOrder} />
      <Stack.Screen name="DistributorOrderList" component={DistributorOrderList} />
      <Stack.Screen name="DistributorEditOrder" component={DistributorEditOrder} />
      <Stack.Screen name="SalesReportScreen" component={DistributorSalesReportScreen} />
      {/* <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="LedgerScreen" component={LedgerScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
      <Stack.Screen name="ClearOrdersScreen" component={ClearOrdersScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
    </Stack.Navigator>
  );
}

// Dealer Navigator
export function DealerNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardDealer" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardDealer" component={DashboardDealer} />
      <Stack.Screen name="ProductCatalog" component={ProductCatalog} />
      <Stack.Screen name="ProductManagement" component={ProductManagement} />
      <Stack.Screen name="CreateOrder" component={CreateOrder} />
      <Stack.Screen name="OrderList" component={OrderList} />
      <Stack.Screen name="DealerCreateOrder" component={DealerCreateOrder} />
      <Stack.Screen name="DealerOrderList" component={DealerOrderList} />
      <Stack.Screen name="DealerReceivedOrders" component={DealerReceivedOrders} />
      <Stack.Screen name="DealerEditOrder" component={DealerEditOrder} />
      <Stack.Screen name="SalesReportScreen" component={DealerSalesReportScreen} />
      <Stack.Screen name="TeamManagement" component={TeamManagement} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      {/* <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="LedgerScreen" component={LedgerScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
      <Stack.Screen name="ClearOrdersScreen" component={ClearOrdersScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
    </Stack.Navigator>
  );
}

// Sub Dealer Navigator
export function SubDealerNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardSubDealer" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardSubDealer" component={DashboardSubDealer} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      {/* <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="LedgerScreen" component={LedgerScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
    </Stack.Navigator>
  );
}

// Salesman Navigator
export function SalesmanNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardSalesman" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardSalesman" component={DashboardSalesman} />
      <Stack.Screen name="ProductCatalog" component={ProductCatalogSalesman} />
      <Stack.Screen name="ProductManagement" component={ProductManagementSalesman} />
      <Stack.Screen name="CreateOrder" component={CreateOrderSalesman} />
      <Stack.Screen name="OrderList" component={OrderListSalesman} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      <Stack.Screen name="SalesmanCreateOrder" component={SalesmanCreateOrder} />
      <Stack.Screen name="SalesmanOrderList" component={SalesmanOrderList} />
      <Stack.Screen name="SalesmanEditOrder" component={SalesmanEditOrder} />
      {/* <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="LedgerScreen" component={LedgerScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
    </Stack.Navigator>
  );
}