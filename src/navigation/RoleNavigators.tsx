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
import DashboardRSM from '../screens/dashboard/RSM/DashboardHome';
import DashboardASM from '../screens/dashboard/ASM/DashboardHome';
import DashboardDistributor from '../screens/dashboard/Distributor/DashboardHome';
import DashboardDealer from '../screens/dashboard/Dealer/DashboardHome';
import ProductCatalog from '../screens/dashboard/Dealer/ProductCatalog';
import ProductManagement from '../screens/dashboard/Dealer/ProductManagement';
import CreateOrder from '../screens/dashboard/Dealer/CreateOrder';
import OrderList from '../screens/dashboard/Dealer/OrderList';
import DealerSalesReportScreen from '../screens/dashboard/Dealer/SalesReportScreen';
import TeamManagement from '../screens/dashboard/Dealer/TeamManagement';
import PendingApprovalsScreen from '../screens/dashboard/admin/approval/PendingApprovalsScreen';
import TargetAssignmentScreen from '../screens/dashboard/admin/target/TargetAssignmentScreen';
import MyTargetsScreen from '../screens/dashboard/common/MyTargetsScreen';
import DashboardSubDealer from '../screens/dashboard/SubDealer/DashboardHome';
import DashboardSalesman from '../screens/dashboard/Salesman/DashboardHome';
import ProductCatalogSalesman from '../screens/dashboard/Salesman/ProductCatalog';
import ProductManagementSalesman from '../screens/dashboard/Salesman/ProductManagement';
import CreateOrderSalesman from '../screens/dashboard/Salesman/CreateOrder';
import OrderListSalesman from '../screens/dashboard/Salesman/OrderList';

// Common Screens
// import ZonalScreen from '../screens/common/ZonalScreen';
// import RSMScreen from '../screens/common/RSMScreen';
// import ASMScreen from '../screens/common/ASMScreen';
// import SalesScreen from '../screens/common/SalesScreen';
// import DealerScreen from '../screens/common/DealerScreen';
// import DistributorsScreen from '../screens/common/DistributorsScreen';
// import InvoiceScreen from '../screens/common/InvoiceScreen';
// import LedgerScreen from '../screens/common/LedgerScreen';
// import TargetScreen from '../screens/common/TargetScreen';
// import PendingOrdersScreen from '../screens/common/PendingOrdersScreen';
// import ClearOrdersScreen from '../screens/common/ClearOrdersScreen';
// import SettingsScreen from '../screens/common/SettingsScreen';
// import ProfileScreen from '../screens/common/ProfileScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Zonal Navigator
export function ZonalNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardZonal" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardZonal" component={DashboardZonal} />
      <Stack.Screen name="TeamManagementScreen" component={TeamManagementScreen} />
      <Stack.Screen name="SalesReportScreen" component={SalesReportScreen} />
      <Stack.Screen name="OrderManagementScreen" component={OrderManagementScreen} />
      <Stack.Screen name="TargetManagementScreen" component={TargetManagementScreen} />
      <Stack.Screen name="PendingApprovalsScreen" component={PendingApprovalsScreen} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      {/* <Stack.Screen name="RSMScreen" component={RSMScreen} />
      <Stack.Screen name="ASMScreen" component={ASMScreen} />
      <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="DealerScreen" component={DealerScreen} />
      <Stack.Screen name="DistributorsScreen" component={DistributorsScreen} />
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

// RSM Navigator
export function RSMNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardRSM" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardRSM" component={DashboardRSM} />
      <Stack.Screen name="TeamManagementScreen" component={TeamManagementScreen} />
      <Stack.Screen name="SalesReportScreen" component={SalesReportScreen} />
      <Stack.Screen name="OrderManagementScreen" component={OrderManagementScreen} />
      <Stack.Screen name="TargetManagementScreen" component={TargetManagementScreen} />
      <Stack.Screen name="PendingApprovalsScreen" component={PendingApprovalsScreen} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      {/* <Stack.Screen name="ASMScreen" component={ASMScreen} />
      <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="DealerScreen" component={DealerScreen} />
      <Stack.Screen name="DistributorsScreen" component={DistributorsScreen} />
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

// ASM Navigator
export function ASMNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardASM" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardASM" component={DashboardASM} />
      <Stack.Screen name="TeamManagementScreen" component={TeamManagementScreen} />
      <Stack.Screen name="SalesReportScreen" component={SalesReportScreen} />
      <Stack.Screen name="OrderManagementScreen" component={OrderManagementScreen} />
      <Stack.Screen name="TargetManagementScreen" component={TargetManagementScreen} />
      <Stack.Screen name="PendingApprovalsScreen" component={PendingApprovalsScreen} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      {/* <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="DealerScreen" component={DealerScreen} />
      <Stack.Screen name="DistributorsScreen" component={DistributorsScreen} />
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

// Distributor Navigator
export function DistributorNavigator() {
  return (
    <Stack.Navigator initialRouteName="DashboardDistributor" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DashboardDistributor" component={DashboardDistributor} />
      <Stack.Screen name="PendingApprovalsScreen" component={PendingApprovalsScreen} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      {/* <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="DealerScreen" component={DealerScreen} />
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
      <Stack.Screen name="PendingApprovalsScreen" component={PendingApprovalsScreen} />
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
      <Stack.Screen name="PendingApprovalsScreen" component={PendingApprovalsScreen} />
      <Stack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
      {/* <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="LedgerScreen" component={LedgerScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
    </Stack.Navigator>
  );
}