// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

// Common Auth Screens
import Splash from '../screens/auth/Splash';
import SignIn from '../screens/auth/SignIn';
import ForgotPassword from '../screens/auth/ForgotPassword';
import OTPVerification from '../screens/auth/OTPVerification';
import ResetPassword from '../screens/auth/ResetPassword';

const AuthStack = createNativeStackNavigator<RootStackParamList>();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator 
      initialRouteName="Splash" 
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Splash" component={Splash} />
      <AuthStack.Screen name="SignIn" component={SignIn} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
      <AuthStack.Screen name="OTPVerification" component={OTPVerification} />
      <AuthStack.Screen name="ResetPassword" component={ResetPassword} />
    </AuthStack.Navigator>
  );
}