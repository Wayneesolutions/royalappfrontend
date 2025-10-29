// src/navigation/RSMNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// RSM Dashboard
import DashboardRSM from '../../screens/dashboard/RSM/DashboardHome';

// Common Screens (shared across roles)
import ASMScreen from '../../screens/dashboard/admin/ASMScreen';
import SalesScreen from '../../screens/dashboard/admin/SalesScreen';
import DealerScreen from '../../screens/dashboard/admin/DealerScreen';
import DistributorsScreen from '../../screens/dashboard/admin/DistributorsScreen';
import InvoiceScreen from '../../screens/dashboard/admin/InvoiceScreen';
import LedgerScreen from '../../screens/dashboard/admin/LedgerScreen';
import TargetScreen from '../../screens/dashboard/admin/TargetScreen';
import PendingOrdersScreen from '../../screens/dashboard/admin/PendingOrdersScreen';
import ClearOrdersScreen from '../../screens/dashboard/admin/ClearOrdersScreen';
import SettingsScreen from '../../screens/dashboard/admin/SettingsScreen';
import ProfileScreen from '../../screens/common/ProfileScreen';
import MyTargetsScreen from '../../screens/dashboard/common/MyTargetsScreen';

// RSM Specific Screens (to be created)
import TeamManagementScreen from '../../screens/dashboard/RSM/TeamManagementScreen';
import SalesReportScreen from '../../screens/dashboard/RSM/SalesReportScreen';
import OrderManagementScreen from '../../screens/dashboard/RSM/OrderManagementScreen';
import TargetManagementScreen from '../../screens/dashboard/RSM/TargetManagementScreen';
import RSMCreateOrder from '../../screens/dashboard/RSM/RSMCreateOrder';
import RSMOrderList from '../../screens/dashboard/RSM/RSMOrderList';
import RSMEditOrder from '../../screens/dashboard/RSM/RSMEditOrder';

const RSMStack = createNativeStackNavigator<RootStackParamList>();

export default function RSMNavigator() {
    return (
        <RSMStack.Navigator
            initialRouteName="DashboardRSM"
            screenOptions={{ headerShown: false }}
        >
            {/* RSM Dashboard */}
            <RSMStack.Screen name="DashboardRSM" component={DashboardRSM} />

            {/* RSM Specific Screens */}
            <RSMStack.Screen name="TeamManagementScreen" component={TeamManagementScreen} />
            <RSMStack.Screen name="SalesReportScreen" component={SalesReportScreen} />
            <RSMStack.Screen name="OrderManagementScreen" component={OrderManagementScreen} />
            <RSMStack.Screen name="TargetManagementScreen" component={TargetManagementScreen} />
            <RSMStack.Screen name="RSMCreateOrder" component={RSMCreateOrder} />
            <RSMStack.Screen name="RSMOrderList" component={RSMOrderList} />
            <RSMStack.Screen name="RSMEditOrder" component={RSMEditOrder} />

            {/* Common Screens */}
            <RSMStack.Screen name="ASMScreen" component={ASMScreen} />
            <RSMStack.Screen name="SalesScreen" component={SalesScreen} />
            <RSMStack.Screen name="DealerScreen" component={DealerScreen} />
            <RSMStack.Screen name="DistributorsScreen" component={DistributorsScreen} />
            <RSMStack.Screen name="InvoiceScreen" component={InvoiceScreen} />
            <RSMStack.Screen name="LedgerScreen" component={LedgerScreen} />
            <RSMStack.Screen name="TargetScreen" component={TargetScreen} />
            <RSMStack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
            <RSMStack.Screen name="ClearOrdersScreen" component={ClearOrdersScreen} />
            <RSMStack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
            <RSMStack.Screen name="SettingsScreen" component={SettingsScreen} />
            <RSMStack.Screen name="ProfileScreen" component={ProfileScreen} />
        </RSMStack.Navigator>
    );
}
