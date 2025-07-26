// src/navigation/AppNavigator.tsx
import React from 'react';
import { UserRole, User } from './types';
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import {
  ZonalNavigator,
  RSMNavigator,
  ASMNavigator,
  DistributorNavigator,
  DealerNavigator,
  SubDealerNavigator,
  SalesmanNavigator
} from './RoleNavigators';

interface AppNavigatorProps {
  user: User | null;
  isAuthenticated: boolean;
}

export default function AppNavigator({ user, isAuthenticated }: AppNavigatorProps) {
  // If user is not authenticated, show auth flow
  if (!isAuthenticated || !user) {
    return <AuthNavigator />;
  }

  // Route to appropriate navigator based on user role
  switch (user.role) {
    case UserRole.ADMIN:
      return <AdminNavigator />;
    
    case UserRole.ZONAL:
      return <ZonalNavigator />;
    
    case UserRole.RSM:
      return <RSMNavigator />;
    
    case UserRole.ASM:
      return <ASMNavigator />;
    
    case UserRole.DISTRIBUTOR:
      return <DistributorNavigator />;
    
    case UserRole.DEALER:
      return <DealerNavigator />;
    
    case UserRole.SUB_DEALER:
      return <SubDealerNavigator />;
    
    case UserRole.SALESMAN:
      return <SalesmanNavigator />;
    
    default:
      // Fallback to auth if role is unknown
      console.warn(`Unknown user role: ${user.role}`);
      return <AuthNavigator />;
  }
}