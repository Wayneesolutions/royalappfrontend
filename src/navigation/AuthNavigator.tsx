// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Common Auth Screens
import Splash from '../screens/auth/Splash';
import SignIn from '../screens/auth/SignIn';
import ForgotPasswordMethod from "../screens/auth/ForgotPasswordMethod";
import PasswordRecoveryEmail from "../screens/auth/PasswordRecoveryEmail";
import EmailVerification from '../screens/auth/EmailVerification';
import SuccessMessage from '../screens/auth/SuccessMessage';
import ErrorMessage from '../screens/auth/ErrorMessage';

const AuthStack = createNativeStackNavigator<RootStackParamList>();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      initialRouteName="Splash" 
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Splash" component={Splash} />
      <AuthStack.Screen name="SignIn" component={SignIn} />
      <AuthStack.Screen name="ForgotPasswordMethod" component={ForgotPasswordMethod} />
      <AuthStack.Screen name="PasswordRecoveryEmail" component={PasswordRecoveryEmail} />
      <AuthStack.Screen name="EmailVerification" component={EmailVerification} />
      <AuthStack.Screen name="SuccessMessage" component={SuccessMessage} />
      <AuthStack.Screen name="ErrorMessage" component={ErrorMessage} />
    </AuthStack.Navigator>
  );
}