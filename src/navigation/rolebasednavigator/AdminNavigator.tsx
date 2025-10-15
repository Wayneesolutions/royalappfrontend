// src/navigation/AdminNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Admin Dashboard and Pages
import DashboardAdmin from '../../screens/dashboard/admin/DashboardHome';

// Common Screens (you'll need to create these)
import ZonalScreen from '../../screens/dashboard/admin/ZonalScreen';
import RSMScreen from '../../screens/dashboard/admin/RSMScreen';
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


const AdminStack = createNativeStackNavigator<RootStackParamList>();

export default function AdminNavigator() {
    return (
        <AdminStack.Navigator
            initialRouteName="DashboardAdmin"
            screenOptions={{ headerShown: false }}
        >
            {/* Admin Dashboard */}
            <AdminStack.Screen name="DashboardAdmin" component={DashboardAdmin} />


            <AdminStack.Screen name="ZonalScreen" component={ZonalScreen} />
            <AdminStack.Screen name="RSMScreen" component={RSMScreen} />
            <AdminStack.Screen name="ASMScreen" component={ASMScreen} />
            <AdminStack.Screen name="DealerScreen" component={DealerScreen} />
            <AdminStack.Screen name="DistributorsScreen" component={DistributorsScreen} />

            {/* Business Operations */}
            <AdminStack.Screen name="SalesScreen" component={SalesScreen} />
            <AdminStack.Screen name="InvoiceScreen" component={InvoiceScreen} />
            <AdminStack.Screen name="LedgerScreen" component={LedgerScreen} />
            <AdminStack.Screen name="TargetScreen" component={TargetScreen} />
            <AdminStack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
            <AdminStack.Screen name="ClearOrdersScreen" component={ClearOrdersScreen} />

            {/* Settings & Profile */}
            <AdminStack.Screen name="ProfileScreen" component={ProfileScreen} />
        </AdminStack.Navigator>
    );
}