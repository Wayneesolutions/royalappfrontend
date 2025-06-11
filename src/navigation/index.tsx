import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';



// --- Auth Screens ---
import Splash from '../screens/auth/Splash';
import SignIn from '../screens/auth/SignIn';
import ForgotPasswordMethod from "../screens/auth/ForgotPasswordMethod";
import PasswordRecoveryEmail from "../screens/auth/PasswordRecoveryEmail";
import EmailVerification from '../screens/auth/EmailVerification';
import SuccessMessage from '../screens/auth/SuccessMessage';
import ErrorMessage from '../screens/auth/ErrorMessage';

// --- Admin Dashboard and Pages ---
import DashboardAdmin from '../screens/dashboard/admin/DashboardHome';
import Companies from '../screens/dashboard/admin/Companies';
import Users from '../screens/dashboard/admin/Users';
import Product from '../screens/dashboard/admin/Product';
import Sales from '../screens/dashboard/admin/Sales';
import ProductSummary from '../screens/dashboard/admin/ProductSummary';

import SaleOrders from '../screens/dashboard/admin/SalesOrders';
import SaleOrderStart from '../screens/dashboard/admin/saleOrder/SaleOrderStart';
import SaleOrderEntry from '../screens/dashboard/admin/saleOrder/SaleOrderEntry';
import SaleOrderItemSelect from '../screens/dashboard/admin/saleOrder/SaleOrderItemSelect';
import SaleOrderItemDetail from '../screens/dashboard/admin/saleOrder/SaleOrderItemDetail';
import SaleOrderApprove from '../screens/dashboard/admin/saleOrder/SaleOrderApprove';

// --- RSM Dashboard ---
import DashboardRSM from '../screens/dashboard/RSM/DashboardHome';

// --- ASM Dashboard ---
import DashboardASM from '../screens/dashboard/ASM/DashboardHome';

// --- Distributor Dashboard ---
import DashboardDistributor from '../screens/dashboard/Distributor/DashboardHome';

// --- Dealer Dashboard ---
import DashboardDealer from '../screens/dashboard/Dealer/DashboardHome';

// --- Sub Dealer Dashboard ---
import DashboardSubDealer from '../screens/dashboard/SubDealer/DashboardHome';

// --- Salesman Dashboard ---
import DashboardSalesman from '../screens/dashboard/Salesman/DashboardHome';



const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      {/* --- Auth Stack --- */}
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="ForgotPasswordMethod" component={ForgotPasswordMethod} />
      <Stack.Screen name="PasswordRecoveryEmail" component={PasswordRecoveryEmail} />
      <Stack.Screen name="EmailVerification" component={EmailVerification} />
      <Stack.Screen name="SuccessMessage" component={SuccessMessage} />
      <Stack.Screen name="ErrorMessage" component={ErrorMessage} />

      {/* --- Admin Stack --- */}
      <Stack.Screen name="DashboardAdmin" component={DashboardAdmin} />
      <Stack.Screen name="Companies" component={Companies} />
      <Stack.Screen name="Users" component={Users} />
      <Stack.Screen name="Sales" component={Sales} />
      <Stack.Screen name="Product" component={Product} />
      <Stack.Screen name="ProductSummary" component={ProductSummary} />

      <Stack.Screen name="SaleOrders" component={SaleOrders} />
      <Stack.Screen name="SaleOrderStart" component={SaleOrderStart} />
      <Stack.Screen name="SaleOrderEntry" component={SaleOrderEntry} />
      <Stack.Screen name="SaleOrderItemSelect" component={SaleOrderItemSelect} />
      <Stack.Screen name="SaleOrderItemDetail" component={SaleOrderItemDetail} />
      <Stack.Screen name="SaleOrderApprove" component={SaleOrderApprove} />

      {/* --- RSM Stack --- */}
      <Stack.Screen name="DashboardRSM" component={DashboardRSM} />

      {/* --- ASM Stack --- */}
      <Stack.Screen name="DashboardASM" component={DashboardASM} />

      {/* --- Distributor Stack --- */}
      <Stack.Screen name="DashboardDistributor" component={DashboardDistributor} />

      {/* --- Dealer Stack --- */}
      <Stack.Screen name="DashboardDealer" component={DashboardDealer} />

      {/* --- Sub Dealer Stack --- */}
      <Stack.Screen name="DashboardSubDealer" component={DashboardSubDealer} />

      {/* --- Salesman Stack --- */}
      <Stack.Screen name="DashboardSalesman" component={DashboardSalesman} />
    </Stack.Navigator>
  );
}
