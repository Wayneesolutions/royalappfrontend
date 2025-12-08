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
import DistributorsScreen from '../../screens/dashboard/admin/DistributorsScreen';
import InvoiceScreen from '../../screens/dashboard/admin/InvoiceScreen';
import TargetScreen from '../../screens/dashboard/admin/TargetScreen';
import PendingOrdersScreen from '../../screens/dashboard/admin/PendingOrdersScreen';
import ClearOrdersScreen from '../../screens/dashboard/admin/ClearOrdersScreen';
import SettingsScreen from '../../screens/dashboard/admin/SettingsScreen';
import ProfileScreen from '../../screens/common/ProfileScreen';
import Users from '../../screens/dashboard/admin/saleOrder/Users';
import Groups from '../../screens/dashboard/admin/saleOrder/Groups';
import Companies from '../../screens/dashboard/admin/saleOrder/Companies';
import ProductManagement from '../../screens/dashboard/admin/saleOrder/ProductManagement';
import ProductSummary from '../../screens/dashboard/admin/saleOrder/ProductSummary';
import Sales from '../../screens/dashboard/admin/saleOrder/Sales';
import SalesOrders from '../../screens/dashboard/admin/saleOrder/SalesOrders';
import SaleOrderStart from '../../screens/dashboard/admin/saleOrder/SaleOrderStart';
import SaleOrderEntry from '../../screens/dashboard/admin/saleOrder/SaleOrderEntry';
import SaleOrderItemSelect from '../../screens/dashboard/admin/saleOrder/SaleOrderItemSelect';
import SaleOrderItemDetail from '../../screens/dashboard/admin/saleOrder/SaleOrderItemDetail';
import SaleOrderApprove from '../../screens/dashboard/admin/saleOrder/SaleOrderApprove';
import TargetAssignmentScreen from '../../screens/dashboard/admin/target/TargetAssignmentScreen';
import MyTargetsScreen from '../../screens/dashboard/common/MyTargetsScreen';
import ApprovedOrdersScreen from '../../screens/dashboard/admin/ApprovedOrdersScreen';
import AdminCreateOrder from '../../screens/dashboard/admin/AdminCreateOrder';
import AdminOrderList from '../../screens/dashboard/admin/AdminOrderList';
import AdminEditOrder from '../../screens/dashboard/admin/AdminEditOrder';
import DealersListScreen from '../../screens/dashboard/admin/DealersListScreen';
import SubDealersListScreen from '../../screens/dashboard/admin/SubDealersListScreen';
// Order Management Screens (Admin can only monitor, not create)
// import OrderManagement from '../../screens/dashboard/admin/saleOrder/OrderManagement';
// import ProductManagement from '../../screens/dashboard/admin/saleOrder/ProductManagement';
import { OutstandingScreen } from '../../screens/dashboard/superadmin/OutstandingScreen';


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
            <AdminStack.Screen name="DistributorsScreen" component={DistributorsScreen} />

            {/* Business Operations */}
            <AdminStack.Screen name="SalesScreen" component={SalesScreen} />
            <AdminStack.Screen name="InvoiceScreen" component={InvoiceScreen} />
            <AdminStack.Screen name="TargetScreen" component={TargetScreen} />
            <AdminStack.Screen name="PendingOrdersScreen" component={PendingOrdersScreen} />
        <AdminStack.Screen name="TargetAssignmentScreen" component={TargetAssignmentScreen} />
        <AdminStack.Screen name="MyTargetsScreen" component={MyTargetsScreen} />
        <AdminStack.Screen name="ApprovedOrdersScreen" component={ApprovedOrdersScreen} />
            <AdminStack.Screen name="ClearOrdersScreen" component={ClearOrdersScreen} />
            <AdminStack.Screen name="OutstandingScreen" component={OutstandingScreen} />

            <AdminStack.Screen name="AdminCreateOrder" component={AdminCreateOrder} />
            <AdminStack.Screen name="AdminOrderList" component={AdminOrderList} />
            <AdminStack.Screen name="AdminEditOrder" component={AdminEditOrder} />

            {/* Sale Order Screens */}
            <AdminStack.Screen name="Companies" component={Companies} />
            <AdminStack.Screen name="Product" component={ProductManagement} />
            <AdminStack.Screen name="ProductSummary" component={ProductSummary} />
            <AdminStack.Screen name="Sales" component={Sales} />
            <AdminStack.Screen name="SaleOrders" component={SalesOrders} />
            <AdminStack.Screen name="SaleOrderStart" component={SaleOrderStart} />
            <AdminStack.Screen name="SaleOrderEntry" component={SaleOrderEntry} />
            <AdminStack.Screen name="SaleOrderItemSelect" component={SaleOrderItemSelect} />
            <AdminStack.Screen name="SaleOrderItemDetail" component={SaleOrderItemDetail} />
            <AdminStack.Screen name="SaleOrderApprove" component={SaleOrderApprove} />
            
            {/* Order Management Screens (Admin can only monitor, not create) */}
            {/* <AdminStack.Screen name="OrderManagement" component={OrderManagement} />
            <AdminStack.Screen name="ProductManagement" component={ProductManagement} /> */}

            {/* User Management */}
            <AdminStack.Screen name="Users" component={Users} />
            <AdminStack.Screen name="Groups" component={Groups} />
            <AdminStack.Screen name="DealersList" component={DealersListScreen} />
            <AdminStack.Screen name="SubDealersList" component={SubDealersListScreen} />

            {/* Settings & Profile */}
            <AdminStack.Screen name="ProfileScreen" component={ProfileScreen} />
        </AdminStack.Navigator>
    );
}