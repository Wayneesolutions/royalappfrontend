// src/navigation/rolebasednavigator/GroupUserNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Group User Dashboard
import DashboardGroupUser from '../../screens/dashboard/GroupUser/DashboardHome';

// Order Management
import AdminCreateOrder from '../../screens/dashboard/admin/AdminCreateOrder';
import AdminOrderList from '../../screens/dashboard/admin/AdminOrderList';
import AdminEditOrder from '../../screens/dashboard/admin/AdminEditOrder';

// Dealer Management
import DealersListScreen from '../../screens/dashboard/GroupUser/DealersListScreen';
import LedgerReportScreen from '../../screens/dashboard/GroupUser/LedgerReportScreen';

// Common Screens
import ProfileScreen from '../../screens/common/ProfileScreen';
import SettingsScreen from '../../screens/dashboard/admin/SettingsScreen';

const GroupUserStack = createNativeStackNavigator<RootStackParamList>();

export default function GroupUserNavigator() {
  return (
    <GroupUserStack.Navigator
      initialRouteName="DashboardGroupUser"
      screenOptions={{ headerShown: false }}
    >
      {/* Group User Dashboard */}
      <GroupUserStack.Screen name="DashboardGroupUser" component={DashboardGroupUser} />

      {/* Order Management */}
      <GroupUserStack.Screen name="AdminCreateOrder" component={AdminCreateOrder} />
      <GroupUserStack.Screen name="AdminOrderList" component={AdminOrderList} />
      <GroupUserStack.Screen name="AdminEditOrder" component={AdminEditOrder} />

      {/* Dealer Management */}
      <GroupUserStack.Screen name="DealersListScreen" component={DealersListScreen} />
      <GroupUserStack.Screen name="LedgerReportScreen" component={LedgerReportScreen} />
      {/* Common Screens */}
      <GroupUserStack.Screen name="ProfileScreen" component={ProfileScreen} />
      <GroupUserStack.Screen name="SettingsScreen" component={SettingsScreen} />
    </GroupUserStack.Navigator>
  );
}

