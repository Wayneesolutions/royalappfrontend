// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiBaseUrl, getApiTimeout, logApiConfig } from '../config/api';

// Base API configuration
const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = getApiTimeout();

// Log API configuration on initialization
logApiConfig();

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface LoginResponse {
  user: {
    _id: string;
    email: string;
    name: string;
    mobile: string;
    role: string;
    defaultCompany?: any;
    companies: any[];
    hierarchy: any;
    createdBy?: any;
    lastLogin: string;
  };
  roleSpecificData: any;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

// Super Admin API DTOs
export interface CreateCompanyRequest {
  companyName: string;
  companyState?: string;
  companyCountry?: string;
  companyMobile: string;
  companyEmail: string;
  companyCode: string;
  maxUser: number;
  guid: number;
  contactDetails?: any;
}

export interface CompanyListResponse {
  companies: any[];
  pagination: any;
}

export interface CreateAdminRequest {
  email: string;
  password: string;
  name: string;
  mobile: string;
  companyId: string;
}

export interface AdminListResponse {
  admins: any[];
  pagination: any;
}

export interface AssignCompanyRequest {
  adminId: string;
  companyId: string;
  setAsDefault?: boolean;
}

class ApiService {
  private axiosInstance: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.initializeToken();
    this.setupInterceptors();
  }

  private async initializeToken() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
      if (this.token) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    } catch (error) {
      console.error('Failed to initialize token:', error);
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token to requests
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, clear auth data
          await this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  private handleApiError(error: AxiosError): never {
    if (error.response) {
      // Server responded with error status
      const message = (error.response.data as any)?.message || error.message;
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message);
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<LoginResponse>> = await this.axiosInstance.post('/auth/login', credentials);
      const data = response.data;

      if (data.success && data.data?.token) {
        this.token = data.data.token;
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        await AsyncStorage.setItem('authToken', data.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // Super Admin methods
  async superadminCreateCompany(data: CreateCompanyRequest): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/superadmin/create-company', data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminListCompanies(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<CompanyListResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<CompanyListResponse>> = await this.axiosInstance.get('/superadmin/list-all-companies', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminCreateAdmin(data: CreateAdminRequest): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/superadmin/create-admin', data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminListAdmins(params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<AdminListResponse>> {
    try {
      const response: AxiosResponse<ApiResponse<AdminListResponse>> = await this.axiosInstance.get('/superadmin/list-admins', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminAssignCompanyToAdmin(adminId: string, data: { companyId: string; setAsDefault?: boolean }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post(`/superadmin/assign-company/${adminId}`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // Admin methods
  async adminSwitchCompany(companyId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/admin/switch-company', { companyId });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminGetCompanyData(companyId?: string): Promise<ApiResponse<any>> {
    try {
      const params = companyId ? { companyId } : {};
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/admin/company-data', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminGetUsersByCompany(params?: { 
    companyId?: string; 
    role?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/admin/users-by-company', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // General user endpoints (accessible by all roles)
  async getUserUsersByCompany(params?: { 
    companyId?: string; 
    role?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/user/users-by-company', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getUserUsersByRole(role: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/user/role/${role}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getUserProfile(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/user/profile');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateUserProfile(userData: {
    name?: string;
    email?: string;
    mobile?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put('/user/profile', userData);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminGetUsersByRole(role: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/admin/role/${role}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminCreateUser(userData: {
    name: string;
    email?: string;
    mobile: string;
    password: string;
    role: string;
    userName?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/admin/create-user', userData);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminUpdateUserStatus(userId: string, isActive: boolean): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/admin/user/${userId}/status`, { isActive });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminEditUser(userId: string, userData: {
    name: string;
    email?: string;
    mobile: string;
    role: string;
    userName?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/admin/user/${userId}`, userData);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminDeleteUser(userId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.delete(`/admin/user/${userId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async logout(): Promise<void> {
    try {
      // Clear local storage
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('userData');
      this.token = null;
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  async getStoredUser(): Promise<any | null> {
    try {
      const userData = await AsyncStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Failed to get stored user:', error);
      return null;
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Failed to get stored token:', error);
      return null;
    }
  }

  // Generic API methods for future use
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.get(endpoint);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.post(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.put(endpoint, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.axiosInstance.delete(endpoint);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // Order Management APIs
  async createOrder(data: {
    customerId: string;
    customerName?: string;
    customerEmail?: string;
    customerMobile?: string;
    customerAddress?: any;
    items: Array<{
      productId: string;
      quantity: number;
      discount?: number;
      tax?: number;
    }>;
    deliveryDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    paymentMethod?: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'credit';
    notes?: string;
    shippingAddress?: any;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/orders', data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/orders', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getOrderById(orderId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateOrderStatus(orderId: string, data: { status: string; notes?: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.patch(`/orders/${orderId}/status`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateOrder(orderId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/orders/${orderId}`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async deleteOrder(orderId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.delete(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getOrderStats(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/orders/stats', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // Approval Workflow APIs
  async submitOrderForApproval(orderId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post(`/approvals/submit/${orderId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getPendingApprovals(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/approvals/pending', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async approveRejectOrder(orderId: string, action: 'approved' | 'rejected', notes?: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post(`/approvals/${orderId}/action`, {
        action,
        notes
      });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getApprovalHistory(orderId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/approvals/${orderId}/history`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getMyOrders(params?: { page?: number; limit?: number; status?: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/approvals/my-orders', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // Product Management APIs
  async createProduct(data: {
    productCode: string;
    productName: string;
    description?: string;
    category: string;
    subCategory?: string;
    brand?: string;
    unit: string;
    price: number;
    costPrice?: number;
    mrp?: number;
    discount?: number;
    taxRate?: number;
    stock?: {
      current?: number;
      minimum?: number;
      maximum?: number;
    };
    images?: Array<{ url: string; alt?: string; isPrimary?: boolean }>;
    specifications?: any;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/products', data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isAvailable?: boolean;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/products', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getProductById(productId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/products/${productId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateProduct(productId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/products/${productId}`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async deleteProduct(productId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.delete(`/products/${productId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getProductCategories(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/products/categories');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateProductStock(productId: string, data: { quantity: number; operation: 'add' | 'subtract' }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.patch(`/products/${productId}/stock`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getLowStockProducts(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/products/low-stock');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // ==================== TARGET MANAGEMENT ====================

  async getMyTargets(params?: { period?: string; year?: number; month?: number }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/targets/my-targets', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getUsersForTargetAssignment(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/targets/users-for-assignment');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async assignTargets(targets: any[]): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/targets/assign', { targets });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getTargetPerformanceReport(params?: { year?: number; month?: number; role?: string; hierarchyLevel?: number }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/targets/performance-report', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateTarget(targetId: string, data: { targetAmount?: number; targetQuantity?: number; notes?: string; status?: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/targets/${targetId}`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async calculateTargetAchievements(params?: { companyId?: string; year?: number; month?: number }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/targets/calculate-achievements', params);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // ==================== OUTSTANDING MANAGEMENT ====================

  async getOutstandingSummary(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/outstanding/summary', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getOutstandingList(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/outstanding/list', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getOutstandingDetails(outstandingId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/outstanding/${outstandingId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateOutstanding(outstandingId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/outstanding/${outstandingId}`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async addCollectionNote(outstandingId: string, data: { note: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post(`/outstanding/${outstandingId}/notes`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async assignOutstanding(outstandingId: string, data: { assignedTo: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post(`/outstanding/${outstandingId}/assign`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getUsersForAssignment(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/outstanding/users/for-assignment');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // ==================== LEDGER MANAGEMENT ====================
  async getLedgers(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/ledger', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getLedgerDetails(ledgerId: string, params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/ledger/${ledgerId}`, { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async createLedger(data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/ledger', data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateLedger(ledgerId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/ledger/${ledgerId}`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async addLedgerTransaction(ledgerId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post(`/ledger/${ledgerId}/transactions`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getLedgerSummary(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/ledger/summary', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getUsersForLedger(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/ledger/users', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // ==================== STOCK MANAGEMENT ====================
  async getStockSummary(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/stock/summary', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getStocks(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/stock', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getStockDetails(stockId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/stock/${stockId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async createOrUpdateStock(data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/stock', data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateStockQuantity(stockId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/stock/${stockId}/quantity`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getLowStockAlerts(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/stock/alerts');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // ==================== ZONAL MANAGEMENT ====================
  async getZonalDashboardData(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/zonal/dashboard');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getZonalTeamMembers(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/zonal/team', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
