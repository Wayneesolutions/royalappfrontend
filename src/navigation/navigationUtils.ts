// src/navigation/navigationUtils.ts
import { UserRole } from './types';
import { isScreenAllowedForRole, getDashboardForRole } from './roleConfig';
import { NavigationProp } from '@react-navigation/native';

export class NavigationGuard {
  static canNavigate(userRole: UserRole, screenName: string): boolean {
    return isScreenAllowedForRole(userRole, screenName);
  }

  static navigateWithRoleCheck(
    navigation: NavigationProp<any>,
    userRole: UserRole,
    screenName: string,
    params?: any
  ): boolean {
    if (this.canNavigate(userRole, screenName)) {
      navigation.navigate(screenName, params);
      return true;
    } else {
      console.warn(`Navigation denied: User role ${userRole} cannot access ${screenName}`);
      // Optionally show a toast or alert here
      return false;
    }
  }

  static getDefaultDashboard(userRole: UserRole): string {
    return getDashboardForRole(userRole);
  }
}

// Hook for role-based navigation
export const useRoleNavigation = (userRole: UserRole, navigation: NavigationProp<any>) => {
  const navigateWithRoleCheck = (screenName: string, params?: any) => {
    return NavigationGuard.navigateWithRoleCheck(navigation, userRole, screenName, params);
  };

  const canNavigateTo = (screenName: string) => {
    return NavigationGuard.canNavigate(userRole, screenName);
  };

  const goToDashboard = () => {
    const dashboard = NavigationGuard.getDefaultDashboard(userRole);
    navigation.navigate(dashboard);
  };

  return {
    navigateWithRoleCheck,
    canNavigateTo,
    goToDashboard
  };
};