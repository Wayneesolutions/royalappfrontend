// src/navigation/SuperAdminNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

// Super Admin Dashboard
import DashboardSuperAdmin from '../../screens/dashboard/superadmin/DashboardHome';

import CompanyDetailsScreen from '../../screens/dashboard/superadmin/CompanyDetailsScreen';

// Admin Management
import AdminsListScreen from '../../screens/dashboard/superadmin/AdminsListScreen';


import { LedgerScreen } from '../../screens/dashboard/superadmin/LedgerScreen';
import { OutstandingScreen } from '../../screens/dashboard/superadmin/OutstandingScreen';
import { PendingOrdersScreen } from '../../screens/dashboard/superadmin/PendingOrdersScreen';
import { TargetScreen } from '../../screens/dashboard/superadmin/TargetScreen';
import { SalesReportScreen } from '../../screens/dashboard/superadmin/SalesReportScreen';

import ProfileScreen from '../../screens/common/ProfileScreen';

const SuperAdminStack = createNativeStackNavigator<RootStackParamList>();

export default function SuperAdminNavigator() {
    return (
        <SuperAdminStack.Navigator
            initialRouteName="DashboardSuperAdmin"
            screenOptions={{ headerShown: false }}
        >
            {/* Super Admin Dashboard */}
            <SuperAdminStack.Screen
                name="DashboardSuperAdmin"
                component={DashboardSuperAdmin}
            />

            <SuperAdminStack.Screen
                name="CompaniesListScreen"
                component={CompanyDetailsScreen}
            />


            <SuperAdminStack.Screen
                name="AdminsListScreen"
                component={AdminsListScreen}
            />

            <SuperAdminStack.Screen
                name="LedgerScreen"
                component={LedgerScreen}
            />
            <SuperAdminStack.Screen
                name="OutstandingScreen"
                component={OutstandingScreen}
            />
            <SuperAdminStack.Screen
                name="PendingOrdersScreen"
                component={PendingOrdersScreen}
            />

            <SuperAdminStack.Screen
                name="TargetScreen"
                component={TargetScreen}
            />
            <SuperAdminStack.Screen
                name="SalesReportScreen"
                component={SalesReportScreen}
            />


            <SuperAdminStack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
            />
        </SuperAdminStack.Navigator>
    );
}