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
  // Target Management
  getMyTargets: (params?: any) => Promise<any>;
  getUsersForTargetAssignment: () => Promise<any>;
  assignTargets: (targets: any[]) => Promise<any>;
  getTargetPerformanceReport: (params?: any) => Promise<any>;
  updateTarget: (targetId: string, data: any) => Promise<any>;
  calculateTargetAchievements: (params?: any) => Promise<any>;
  // Outstanding Management
  getOutstandingSummary: (params?: any) => Promise<any>;
  getOutstandingList: (params?: any) => Promise<any>;
  getOutstandingDetails: (outstandingId: string) => Promise<any>;
  updateOutstanding: (outstandingId: string, data: any) => Promise<any>;
  addCollectionNote: (outstandingId: string, data: { note: string }) => Promise<any>;
  assignOutstanding: (outstandingId: string, data: { assignedTo: string }) => Promise<any>;
  getUsersForAssignment: () => Promise<any>;
  // Ledger Management
  getLedgers: (params?: any) => Promise<any>;
  getLedgerDetails: (ledgerId: string, params?: any) => Promise<any>;
  createLedger: (data: any) => Promise<any>;
  updateLedger: (ledgerId: string, data: any) => Promise<any>;
  addLedgerTransaction: (ledgerId: string, data: any) => Promise<any>;
  getLedgerSummary: (params?: any) => Promise<any>;
  getUsersForLedger: (params?: any) => Promise<any>;
  // Stock Management
  getStockSummary: (params?: any) => Promise<any>;
  getStocks: (params?: any) => Promise<any>;
  getStockDetails: (stockId: string) => Promise<any>;
  createOrUpdateStock: (data: any) => Promise<any>;
  updateStockQuantity: (stockId: string, data: any) => Promise<any>;
  getLowStockAlerts: () => Promise<any>;
  // Zonal Management
  getZonalDashboardData: () => Promise<any>;
  getZonalTeamMembers: (params?: any) => Promise<any>;
  getZonalRecentActivity: (params?: { limit?: number; days?: number }) => Promise<any>;
  // RSM Management
  getRSMDashboardData: () => Promise<any>;
  getRSMTeamMembers: (params?: any) => Promise<any>;
  getRSMTeamPerformance: (params?: { period?: string }) => Promise<any>;
  getRSMRecentActivity: (params?: { limit?: number; days?: number }) => Promise<any>;
  // ASM Management
  getASMDashboardData: () => Promise<any>;
  getASMTeamMembers: (params?: any) => Promise<any>;
  getASMTeamPerformance: (params?: { period?: string }) => Promise<any>;
  getASMRecentActivity: (params?: { limit?: number; days?: number }) => Promise<any>;
  // Super Admin methods
  superadminCreateCompany: (data: any) => Promise<any>;
  superadminListCompanies: (params?: any) => Promise<any>;
  superadminGetCompanyDetails: (companyId: string) => Promise<any>;
  superadminUpdateCompany: (companyId: string, data: any) => Promise<any>;
  superadminGetSystemStats: () => Promise<any>;
  superadminCreateAdmin: (data: any) => Promise<any>;
  superadminListAdmins: (params?: any) => Promise<any>;
  superadminUpdateAdmin: (adminId: string, data: any) => Promise<any>;
  superadminAssignCompanyToAdmin: (adminId: string, data: any) => Promise<any>;
  superadminGetSalesReport: (params?: any) => Promise<any>;
  superadminExportSalesReport: (params?: any) => Promise<any>;
  superadminGetOutstandingSummary: (params?: any) => Promise<any>;
  superadminGetOutstandingList: (params?: any) => Promise<any>;
  superadminGetOutstandingDetails: (outstandingId: string) => Promise<any>;
  superadminUpdateOutstanding: (outstandingId: string, data: any) => Promise<any>;
  superadminAddCollectionNote: (outstandingId: string, note: string) => Promise<any>;
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
      const result = await apiService.deleteUser(userId);
      return result;
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  };

  // Order Management Methods
  const createOrder = async (orderData: any): Promise<any> => {
    try {
      const result = await apiService.createOrder(orderData);
      console.log('API service result:', result);
      return result; // Return the full result, not result.data
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  };

  const getOrders = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getOrders(params);
      return result; // apiService already returns the response data
    } catch (error) {
      console.error('Failed to get orders:', error);
      throw error;
    }
  };

  const getOrderById = async (orderId: string): Promise<any> => {
    try {
      const result = await apiService.getOrderById(orderId);
      return result;
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

  // ==================== TARGET MANAGEMENT ====================

  const getMyTargets = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getMyTargets(params);
      return result;
    } catch (error) {
      console.error('Failed to get my targets:', error);
      throw error;
    }
  };

  const getUsersForTargetAssignment = async (): Promise<any> => {
    try {
      const result = await apiService.getUsersForTargetAssignment();
      return result;
    } catch (error) {
      console.error('Failed to get users for target assignment:', error);
      throw error;
    }
  };

  const assignTargets = async (targets: any[]): Promise<any> => {
    try {
      const result = await apiService.assignTargets(targets);
      return result;
    } catch (error) {
      console.error('Failed to assign targets:', error);
      throw error;
    }
  };

  const getTargetPerformanceReport = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getTargetPerformanceReport(params);
      return result;
    } catch (error) {
      console.error('Failed to get target performance report:', error);
      throw error;
    }
  };

  const updateTarget = async (targetId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.updateTarget(targetId, data);
      return result;
    } catch (error) {
      console.error('Failed to update target:', error);
      throw error;
    }
  };

  const calculateTargetAchievements = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.calculateTargetAchievements(params);
      return result;
    } catch (error) {
      console.error('Failed to calculate target achievements:', error);
      throw error;
    }
  };

  // ==================== OUTSTANDING MANAGEMENT ====================

  const getOutstandingSummary = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getOutstandingSummary(params);
      return result;
    } catch (error) {
      console.error('Failed to get outstanding summary:', error);
      throw error;
    }
  };

  const getOutstandingList = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getOutstandingList(params);
      return result;
    } catch (error) {
      console.error('Failed to get outstanding list:', error);
      throw error;
    }
  };

  const getOutstandingDetails = async (outstandingId: string): Promise<any> => {
    try {
      const result = await apiService.getOutstandingDetails(outstandingId);
      return result;
    } catch (error) {
      console.error('Failed to get outstanding details:', error);
      throw error;
    }
  };

  const updateOutstanding = async (outstandingId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.updateOutstanding(outstandingId, data);
      return result;
    } catch (error) {
      console.error('Failed to update outstanding:', error);
      throw error;
    }
  };

  const addCollectionNote = async (outstandingId: string, data: { note: string }): Promise<any> => {
    try {
      const result = await apiService.addCollectionNote(outstandingId, data);
      return result;
    } catch (error) {
      console.error('Failed to add collection note:', error);
      throw error;
    }
  };

  const assignOutstanding = async (outstandingId: string, data: { assignedTo: string }): Promise<any> => {
    try {
      const result = await apiService.assignOutstanding(outstandingId, data);
      return result;
    } catch (error) {
      console.error('Failed to assign outstanding:', error);
      throw error;
    }
  };

  const getUsersForAssignment = async (): Promise<any> => {
    try {
      const result = await apiService.getUsersForAssignment();
      return result;
    } catch (error) {
      console.error('Failed to get users for assignment:', error);
      throw error;
    }
  };

  // ==================== LEDGER MANAGEMENT ====================
  const getLedgers = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getLedgers(params);
      return result;
    } catch (error) {
      console.error('Failed to get ledgers:', error);
      throw error;
    }
  };

  const getLedgerDetails = async (ledgerId: string, params?: any): Promise<any> => {
    try {
      const result = await apiService.getLedgerDetails(ledgerId, params);
      return result;
    } catch (error) {
      console.error('Failed to get ledger details:', error);
      throw error;
    }
  };

  const createLedger = async (data: any): Promise<any> => {
    try {
      const result = await apiService.createLedger(data);
      return result;
    } catch (error) {
      console.error('Failed to create ledger:', error);
      throw error;
    }
  };

  const updateLedger = async (ledgerId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.updateLedger(ledgerId, data);
      return result;
    } catch (error) {
      console.error('Failed to update ledger:', error);
      throw error;
    }
  };

  const addLedgerTransaction = async (ledgerId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.addLedgerTransaction(ledgerId, data);
      return result;
    } catch (error) {
      console.error('Failed to add ledger transaction:', error);
      throw error;
    }
  };

  const getLedgerSummary = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getLedgerSummary(params);
      return result;
    } catch (error) {
      console.error('Failed to get ledger summary:', error);
      throw error;
    }
  };

  const getUsersForLedger = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getUsersForLedger(params);
      return result;
    } catch (error) {
      console.error('Failed to get users for ledger:', error);
      throw error;
    }
  };

  // ==================== STOCK MANAGEMENT ====================
  const getStockSummary = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getStockSummary(params);
      return result;
    } catch (error) {
      console.error('Failed to get stock summary:', error);
      throw error;
    }
  };

  const getStocks = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getStocks(params);
      return result;
    } catch (error) {
      console.error('Failed to get stocks:', error);
      throw error;
    }
  };

  const getStockDetails = async (stockId: string): Promise<any> => {
    try {
      const result = await apiService.getStockDetails(stockId);
      return result;
    } catch (error) {
      console.error('Failed to get stock details:', error);
      throw error;
    }
  };

  const createOrUpdateStock = async (data: any): Promise<any> => {
    try {
      const result = await apiService.createOrUpdateStock(data);
      return result;
    } catch (error) {
      console.error('Failed to create/update stock:', error);
      throw error;
    }
  };

  const updateStockQuantity = async (stockId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.updateStockQuantity(stockId, data);
      return result;
    } catch (error) {
      console.error('Failed to update stock quantity:', error);
      throw error;
    }
  };

  const getLowStockAlerts = async (): Promise<any> => {
    try {
      const result = await apiService.getLowStockAlerts();
      return result;
    } catch (error) {
      console.error('Failed to get low stock alerts:', error);
      throw error;
    }
  };

  // ==================== ZONAL MANAGEMENT ====================
  const getZonalDashboardData = async (): Promise<any> => {
    try {
      const result = await apiService.getZonalDashboardData();
      return result;
    } catch (error) {
      console.error('Failed to get Zonal dashboard data:', error);
      throw error;
    }
  };

  const getZonalTeamMembers = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getZonalTeamMembers(params);
      return result;
    } catch (error) {
      console.error('Failed to get Zonal team members:', error);
      throw error;
    }
  };

  const getZonalRecentActivity = async (params?: { limit?: number; days?: number }): Promise<any> => {
    try {
      const result = await apiService.getZonalRecentActivity(params);
      return result;
    } catch (error) {
      console.error('Failed to get Zonal recent activity:', error);
      throw error;
    }
  };

  // ==================== RSM MANAGEMENT ====================
  const getRSMDashboardData = async (): Promise<any> => {
    try {
      const result = await apiService.getRSMDashboardData();
      return result;
    } catch (error) {
      console.error('Failed to get RSM dashboard data:', error);
      throw error;
    }
  };

  const getRSMTeamMembers = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getRSMTeamMembers(params);
      return result;
    } catch (error) {
      console.error('Failed to get RSM team members:', error);
      throw error;
    }
  };

  const getRSMTeamPerformance = async (params?: { period?: string }): Promise<any> => {
    try {
      const result = await apiService.getRSMTeamPerformance(params);
      return result;
    } catch (error) {
      console.error('Failed to get RSM team performance:', error);
      throw error;
    }
  };

  const getRSMRecentActivity = async (params?: { limit?: number; days?: number }): Promise<any> => {
    try {
      const result = await apiService.getRSMRecentActivity(params);
      return result;
    } catch (error) {
      console.error('Failed to get RSM recent activity:', error);
      throw error;
    }
  };

  // ==================== ASM MANAGEMENT ====================
  const getASMDashboardData = async (): Promise<any> => {
    try {
      const result = await apiService.getASMDashboardData();
      return result;
    } catch (error) {
      console.error('Failed to get ASM dashboard data:', error);
      throw error;
    }
  };

  const getASMTeamMembers = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.getASMTeamMembers(params);
      return result;
    } catch (error) {
      console.error('Failed to get ASM team members:', error);
      throw error;
    }
  };

  const getASMTeamPerformance = async (params?: { period?: string }): Promise<any> => {
    try {
      const result = await apiService.getASMTeamPerformance(params);
      return result;
    } catch (error) {
      console.error('Failed to get ASM team performance:', error);
      throw error;
    }
  };

  const getASMRecentActivity = async (params?: { limit?: number; days?: number }): Promise<any> => {
    try {
      const result = await apiService.getASMRecentActivity(params);
      return result;
    } catch (error) {
      console.error('Failed to get ASM recent activity:', error);
      throw error;
    }
  };

  // Super Admin methods
  const superadminCreateCompany = async (data: any): Promise<any> => {
    try {
      const result = await apiService.superadminCreateCompany(data);
      return result;
    } catch (error) {
      console.error('Failed to create company:', error);
      throw error;
    }
  };

  const superadminListCompanies = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.superadminListCompanies(params);
      return result;
    } catch (error) {
      console.error('Failed to list companies:', error);
      throw error;
    }
  };

  const superadminGetCompanyDetails = async (companyId: string): Promise<any> => {
    try {
      const result = await apiService.superadminGetCompanyDetails(companyId);
      return result;
    } catch (error) {
      console.error('Failed to get company details:', error);
      throw error;
    }
  };

  const superadminUpdateCompany = async (companyId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.superadminUpdateCompany(companyId, data);
      return result;
    } catch (error) {
      console.error('Failed to update company:', error);
      throw error;
    }
  };

  const superadminGetSystemStats = async (): Promise<any> => {
    try {
      const result = await apiService.superadminGetSystemStats();
      return result;
    } catch (error) {
      console.error('Failed to get system stats:', error);
      throw error;
    }
  };

  const superadminCreateAdmin = async (data: any): Promise<any> => {
    try {
      const result = await apiService.superadminCreateAdmin(data);
      return result;
    } catch (error) {
      console.error('Failed to create admin:', error);
      throw error;
    }
  };

  const superadminListAdmins = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.superadminListAdmins(params);
      return result;
    } catch (error) {
      console.error('Failed to list admins:', error);
      throw error;
    }
  };

  const superadminUpdateAdmin = async (adminId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.superadminUpdateAdmin(adminId, data);
      return result;
    } catch (error) {
      console.error('Failed to update admin:', error);
      throw error;
    }
  };

  const superadminAssignCompanyToAdmin = async (adminId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.superadminAssignCompanyToAdmin(adminId, data);
      return result;
    } catch (error) {
      console.error('Failed to assign company to admin:', error);
      throw error;
    }
  };

  const superadminGetSalesReport = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.superadminGetSalesReport(params);
      return result;
    } catch (error) {
      console.error('Failed to get sales report:', error);
      throw error;
    }
  };

  const superadminExportSalesReport = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.superadminExportSalesReport(params);
      return result;
    } catch (error) {
      console.error('Failed to export sales report:', error);
      throw error;
    }
  };

  const superadminGetOutstandingSummary = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.superadminGetOutstandingSummary(params);
      return result;
    } catch (error) {
      console.error('Failed to get outstanding summary:', error);
      throw error;
    }
  };

  const superadminGetOutstandingList = async (params?: any): Promise<any> => {
    try {
      const result = await apiService.superadminGetOutstandingList(params);
      return result;
    } catch (error) {
      console.error('Failed to get outstanding list:', error);
      throw error;
    }
  };

  const superadminGetOutstandingDetails = async (outstandingId: string): Promise<any> => {
    try {
      const result = await apiService.superadminGetOutstandingDetails(outstandingId);
      return result;
    } catch (error) {
      console.error('Failed to get outstanding details:', error);
      throw error;
    }
  };

  const superadminUpdateOutstanding = async (outstandingId: string, data: any): Promise<any> => {
    try {
      const result = await apiService.superadminUpdateOutstanding(outstandingId, data);
      return result;
    } catch (error) {
      console.error('Failed to update outstanding:', error);
      throw error;
    }
  };

  const superadminAddCollectionNote = async (outstandingId: string, note: string): Promise<any> => {
    try {
      const result = await apiService.superadminAddCollectionNote(outstandingId, note);
      return result;
    } catch (error) {
      console.error('Failed to add collection note:', error);
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
    getLowStockProducts,
    // Target Management
    getMyTargets,
    getUsersForTargetAssignment,
    assignTargets,
    getTargetPerformanceReport,
    updateTarget,
    calculateTargetAchievements,
    // Outstanding Management
    getOutstandingSummary,
    getOutstandingList,
    getOutstandingDetails,
    updateOutstanding,
    addCollectionNote,
    assignOutstanding,
    getUsersForAssignment,
    // Ledger Management
    getLedgers,
    getLedgerDetails,
    createLedger,
    updateLedger,
    addLedgerTransaction,
    getLedgerSummary,
    getUsersForLedger,
    // Stock Management
    getStockSummary,
    getStocks,
    getStockDetails,
    createOrUpdateStock,
    updateStockQuantity,
    getLowStockAlerts,
    // Zonal Management
    getZonalDashboardData,
    getZonalTeamMembers,
    getZonalRecentActivity,
    // RSM Management
    getRSMDashboardData,
    getRSMTeamMembers,
    getRSMTeamPerformance,
    getRSMRecentActivity,
    // ASM Management
    getASMDashboardData,
    getASMTeamMembers,
    getASMTeamPerformance,
    getASMRecentActivity,
    // Super Admin methods
    superadminCreateCompany,
    superadminListCompanies,
    superadminGetCompanyDetails,
    superadminUpdateCompany,
    superadminGetSystemStats,
    superadminCreateAdmin,
    superadminListAdmins,
    superadminUpdateAdmin,
    superadminAssignCompanyToAdmin,
    superadminGetSalesReport,
    superadminExportSalesReport,
    superadminGetOutstandingSummary,
    superadminGetOutstandingList,
    superadminGetOutstandingDetails,
    superadminUpdateOutstanding,
    superadminAddCollectionNote
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