// src/navigation/RoleNavigators.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Dashboard Screens
import DashboardZonal from '../screens/dashboard/Zonal/DashboardHome';
import DashboardRSM from '../screens/dashboard/RSM/DashboardHome';
import DashboardASM from '../screens/dashboard/ASM/DashboardHome';
import DashboardDistributor from '../screens/dashboard/Distributor/DashboardHome';
import DashboardDealer from '../screens/dashboard/Dealer/DashboardHome';
import DashboardSubDealer from '../screens/dashboard/SubDealer/DashboardHome';
import DashboardSalesman from '../screens/dashboard/Salesman/DashboardHome';

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
      {/* <Stack.Screen name="SalesScreen" component={SalesScreen} />
      <Stack.Screen name="InvoiceScreen" component={InvoiceScreen} />
      <Stack.Screen name="LedgerScreen" component={LedgerScreen} />
      <Stack.Screen name="TargetScreen" component={TargetScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} /> */}
    </Stack.Navigator>
  );
}