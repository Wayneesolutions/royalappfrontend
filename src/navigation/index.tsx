import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Splash from '../screens/auth/Splash';
import SignIn from '../screens/auth/SignIn';
import ForgotPasswordMethod from "../screens/auth/ForgotPasswordMethod"
import PasswordRecoveryEmail from "../screens/auth/PasswordRecoveryEmail"
import EmailVerification from '../screens/auth/EmailVerification';
import SuccessMessage from '../screens/auth/SuccessMessage';
import ErrorMessage from '../screens/auth/ErrorMessage';


import DashboardHome from '../screens/dashboard/DashboardHome';
import SaleOrders from '../screens/dashboard/SalesOrders';


import SaleOrderStart from '../screens/saleOrder/SaleOrderStart';
import SaleOrderEntry from '../screens/saleOrder/SaleOrderEntry';
import SaleOrderItemSelect from '../screens/saleOrder/SaleOrderItemSelect';
import SaleOrderItemDetail from '../screens/saleOrder/SaleOrderItemDetail';
import SaleOrderApprove from '../screens/saleOrder/SaleOrderApprove';


export type RootStackParamList = {
  Splash: undefined;
  SignIn: undefined;
  ForgotPasswordMethod: undefined;
  PasswordRecoveryEmail: undefined;
  EmailVerification: undefined;
  SuccessMessage: undefined;
  ErrorMessage: undefined;
  DashboardHome: undefined;
SaleOrders: undefined;

  SaleOrderStart: undefined;
  SaleOrderEntry: undefined;
  SaleOrderItemSelect: undefined;
  SaleOrderItemDetail: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="ForgotPasswordMethod" component={ForgotPasswordMethod} />
      <Stack.Screen name="PasswordRecoveryEmail" component={PasswordRecoveryEmail} />
      <Stack.Screen name="EmailVerification" component={EmailVerification} />
      <Stack.Screen name="SuccessMessage" component={SuccessMessage} />
      <Stack.Screen name="ErrorMessage" component={ErrorMessage} />

      <Stack.Screen name="DashboardHome" component={DashboardHome} />
      <Stack.Screen name="SaleOrders" component={SaleOrders} options={{ title: "Sale Orders" }} />


      <Stack.Screen name="SaleOrderStart" component={SaleOrderStart} />
      <Stack.Screen name="SaleOrderEntry" component={SaleOrderEntry} />
      <Stack.Screen name="SaleOrderItemSelect" component={SaleOrderItemSelect} />
      <Stack.Screen name="SaleOrderItemDetail" component={SaleOrderItemDetail} />

    </Stack.Navigator>
  );
}
