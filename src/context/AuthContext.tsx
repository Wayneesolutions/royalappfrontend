// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loginUser, logoutUser, checkAuthStatus, clearError, updateUser } from '../store/slices/authSlice';
import { persistor } from '../store';
import { apiService } from '../services/api';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: any) => void;
  roleSpecificData: any;
  clearError: () => void;
  switchCompany: (companyId: string) => Promise<void>;
  getCompanyData: (companyId?: string) => Promise<any>;
  getUsersByCompany: (params?: { companyId?: string; role?: string; page?: number; limit?: number; }) => Promise<any>;
  getUsersByRole: (role: string) => Promise<any>;
  createUser: (userData: any) => Promise<any>;
  editUser: (userId: string, userData: any) => Promise<any>;
  deleteUser: (userId: string) => Promise<any>;
  // Order Management
  createOrder: (orderData: any) => Promise<any>;
  getOrders: (params?: any) => Promise<any>;
  getOrderById: (orderId: string) => Promise<any>;
  updateOrderStatus: (orderId: string, data: any) => Promise<any>;
  updateOrder: (orderId: string, data: any) => Promise<any>;
  deleteOrder: (orderId: string) => Promise<any>;
  getOrderStats: (params?: any) => Promise<any>;
  // Approval Workflow
  submitOrderForApproval: (orderId: string) => Promise<any>;
  getPendingApprovals: (params?: any) => Promise<any>;
  approveRejectOrder: (orderId: string, action: 'approved' | 'rejected', notes?: string) => Promise<any>;
  getApprovalHistory: (orderId: string) => Promise<any>;
  getMyOrders: (params?: any) => Promise<any>;
  // Product Management
  createProduct: (productData: any) => Promise<any>;
  getProducts: (params?: any) => Promise<any>;
  getProductById: (productId: string) => Promise<any>;
  updateProduct: (productId: string, data: any) => Promise<any>;
  deleteProduct: (productId: string) => Promise<any>;
  getProductCategories: () => Promise<any>;
  updateProductStock: (productId: string, data: any) => Promise<any>;
  getLowStockProducts: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, error, roleSpecificData } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const result = await dispatch(loginUser({ email, password }));
      if (loginUser.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Clear local storage first
      await apiService.logout();
      // Dispatch logout action to clear Redux state
      await dispatch(logoutUser());
      // Ensure all persisted auth data is cleared for every role
      try { 
        await persistor.purge(); 
      } catch (purgeError) {
        console.warn('Persistor purge failed:', purgeError);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, try to clear local state
      try {
        await apiService.logout();
        await dispatch(logoutUser());
      } catch (fallbackError) {
        console.error('Fallback logout failed:', fallbackError);
      }
    }
  };

  const handleUpdateUser = (userData: any) => {
    dispatch(updateUser(userData));
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  const switchCompany = async (companyId: string): Promise<void> => {
    try {
      const result = await apiService.adminSwitchCompany(companyId);
      if (result.success && result.data?.admin) {
        // Update user data in store
        dispatch(updateUser(result.data.admin));
        // Update stored user data
        await apiService.getStoredUser().then(async (storedUser) => {
          if (storedUser) {
            const updatedUser = { ...storedUser, ...result.data.admin };
            await apiService.getStoredToken().then(async (token) => {
              if (token) {
                await apiService.post('/auth/update-stored-user', { userData: updatedUser });
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Company switch failed:', error);
      throw error;
    }
  };

  const getCompanyData = async (companyId?: string): Promise<any> => {
    try {
      const result = await apiService.adminGetCompanyData(companyId);
      return result.data;
    } catch (error) {
      console.error('Failed to get company data:', error);
      throw error;
    }
  };

  const getUsersByCompany = async (params?: { 
    companyId?: string; 
    role?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<any> => {
    try {
      // Use admin endpoint for admin users, general user endpoint for others
      if (user?.role === 'admin') {
        const result = await apiService.adminGetUsersByCompany(params);
        return result.data;
      } else {
        const result = await apiService.getUserUsersByCompany(params);
        return result.data;
      }
    } catch (error) {
      console.error('Failed to get users by company:', error);
      throw error;
    }
  };

  const getUsersByRole = async (role: string): Promise<any> => {
    try {
      // Use admin endpoint for admin users, general user endpoint for others
      if (user?.role === 'admin') {
        const result = await apiService.adminGetUsersByRole(role);
        return result.data;
      } else {
        const result = await apiService.getUserUsersByRole(role);
        return result.data;
      }
    } catch (error) {
      console.error('Failed to get users by role:', error);
      throw error;
    }
  };

  const createUser = async (userData: any): Promise<any> => {
    try {
      const result = await apiService.adminCreateUser(userData);
      return result.data;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  };

  const editUser = async (userId: string, userData: any): Promise<any> => {
    try {
      const result = await apiService.adminEditUser(userId, userData);
      return result.data;
    } catch (error) {
      console.error('Failed to edit user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId: string): Promise<any> => {
    try {
      const result = await apiService.adminDeleteUser(userId);
      return result.data;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  };

  // Order Management Methods
  const createOrder = async (orderData: any): Promise<any> => {
    try {
      const result = await apiService.createOrder(orderData);
      return result.data;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };

  const getOrders = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getOrders(params);
      console.log('AuthContext getOrders result:', result);
      return result; // apiService already returns the response data
    } catch (error) {
      console.error('Failed to get orders:', error);
      throw error;
    }
  };

  const getOrderById = async (orderId: string): Promise<any> => {
    try {
      const result = await apiService.getOrderById(orderId);
      return result.data;
    } catch (error) {
      console.error('Failed to get order:', error);
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.updateOrderStatus(orderId, data);
      return result.data;
    } catch (error) {
      console.error('Failed to update order status:', error);
      throw error;
    }
  };

  const updateOrder = async (orderId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.updateOrder(orderId, data);
      return result.data;
    } catch (error) {
      console.error('Failed to update order:', error);
      throw error;
    }
  };

  const deleteOrder = async (orderId: string): Promise<any> => {
    try {
      const result = await apiService.deleteOrder(orderId);
      return result.data;
    } catch (error) {
      console.error('Failed to delete order:', error);
      throw error;
    }
  };

  const getOrderStats = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getOrderStats(params);
      return result; // apiService already returns the response data
    } catch (error) {
      console.error('Failed to get order stats:', error);
      throw error;
    }
  };

  // Approval Workflow Methods
  const submitOrderForApproval = async (orderId: string): Promise<any> => {
    try {
      const result = await apiService.submitOrderForApproval(orderId);
      return result;
    } catch (error) {
      console.error('Failed to submit order for approval:', error);
      throw error;
    }
  };

  const getPendingApprovals = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getPendingApprovals(params);
      return result;
    } catch (error) {
      console.error('Failed to get pending approvals:', error);
      throw error;
    }
  };

  const approveRejectOrder = async (orderId: string, action: 'approved' | 'rejected', notes?: string): Promise<any> => {
    try {
      const result = await apiService.approveRejectOrder(orderId, action, notes);
      return result;
    } catch (error) {
      console.error('Failed to approve/reject order:', error);
      throw error;
    }
  };

  const getApprovalHistory = async (orderId: string): Promise<any> => {
    try {
      const result = await apiService.getApprovalHistory(orderId);
      return result;
    } catch (error) {
      console.error('Failed to get approval history:', error);
      throw error;
    }
  };

  const getMyOrders = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getMyOrders(params);
      return result;
    } catch (error) {
      console.error('Failed to get my orders:', error);
      throw error;
    }
  };

  // Product Management Methods
  const createProduct = async (productData: any): Promise<any> => {
    try {
      const result = await apiService.createProduct(productData);
      return result.data;
    } catch (error) {
      console.error('Failed to create product:', error);
      throw error;
    }
  };

  const getProducts = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getProducts(params);
      console.log('getProducts API result:', result);
      return result; // apiService already returns the response data
    } catch (error) {
      console.error('Failed to get products:', error);
      throw error;
    }
  };

  const getProductById = async (productId: string): Promise<any> => {
    try {
      const result = await apiService.getProductById(productId);
      return result.data;
    } catch (error) {
      console.error('Failed to get product:', error);
      throw error;
    }
  };

  const updateProduct = async (productId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.updateProduct(productId, data);
      return result.data;
    } catch (error) {
      console.error('Failed to update product:', error);
      throw error;
    }
  };

  const deleteProduct = async (productId: string): Promise<any> => {
    try {
      const result = await apiService.deleteProduct(productId);
      return result.data;
    } catch (error) {
      console.error('Failed to delete product:', error);
      throw error;
    }
  };

  const getProductCategories = async (): Promise<any> => {
    try {
      const result = await apiService.getProductCategories();
      return result.data;
    } catch (error) {
      console.error('Failed to get product categories:', error);
      throw error;
    }
  };

  const updateProductStock = async (productId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.updateProductStock(productId, data);
      return result.data;
    } catch (error) {
      console.error('Failed to update product stock:', error);
      throw error;
    }
  };

  const getLowStockProducts = async (): Promise<any> => {
    try {
      const result = await apiService.getLowStockProducts();
      return result.data;
    } catch (error) {
      console.error('Failed to get low stock products:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateUser: handleUpdateUser,
    roleSpecificData,
    clearError: handleClearError,
    switchCompany,
    getCompanyData,
    getUsersByCompany,
    getUsersByRole,
    createUser,
    editUser,
    deleteUser,
    // Order Management
    createOrder,
    getOrders,
    getOrderById,
    updateOrderStatus,
    updateOrder,
    deleteOrder,
    getOrderStats,
    // Approval Workflow
    submitOrderForApproval,
    getPendingApprovals,
    approveRejectOrder,
    getApprovalHistory,
    getMyOrders,
    // Product Management
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getProductCategories,
    updateProductStock,
    getLowStockProducts
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};