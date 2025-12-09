// src/navigation/AppNavigator.tsx
import React from 'react';
import { UserRole, User } from './types';
import AuthNavigator from './AuthNavigator';
import AdminNavigator from './rolebasednavigator/AdminNavigator';
import SuperAdminNavigator from './rolebasednavigator/SuperAdminNavigator';
import {
  DealerNavigator,
  SubDealerNavigator,
} from './RoleNavigators';
import GroupUserNavigator from './rolebasednavigator/GroupUserNavigator';

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
  // Only superadmin, admin, dealer, subdealer, and groupuser roles are supported
  switch (user.role) {
    case UserRole.SUPERADMIN:
      return <SuperAdminNavigator />;

    case UserRole.ADMIN:
      return <AdminNavigator />;
    
    case UserRole.DEALER:
      return <DealerNavigator />;
    
    case UserRole.SUB_DEALER:
      return <SubDealerNavigator />;
    
    case UserRole.GROUP_USER:
    case 'groupuser': // Handle string literal as well
      return <GroupUserNavigator />;
    
    default:
      // For users without roles or unknown roles, treat as group users
      if (!user.role || user.role === '' || user.role === null || user.role === undefined) {
        return <GroupUserNavigator />;
      }
      // Fallback to group user navigator for legacy roles
      console.warn(`Unknown user role: ${user.role}, routing to GroupUserNavigator`);
      return <GroupUserNavigator />;
  }
}