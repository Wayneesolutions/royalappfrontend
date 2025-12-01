// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getApiBaseUrl, getApiTimeout, logApiConfig } from '../config/api';

// Base API configuration
const API_BASE_URL = getApiBaseUrl();
const API_TIMEOUT = getApiTimeout();
const DEFAULT_UNIT_LABEL = 'units';

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
  emailOrMobile: string;
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
  tallySerialId?: string;
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
        // Log all API requests in development
        if (__DEV__) {
          console.log('📡 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
            headers: config.headers
          });
        }
        
        // Add auth token to requests
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log('✅ API Response:', {
            status: response.status,
            url: response.config.url,
            baseURL: response.config.baseURL,
            data: response.data
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        // Only log non-network errors in detail
        if (error.response) {
          // Server responded with error status
          if (__DEV__) {
            console.error('❌ API Error:', {
              status: error.response.status,
              statusText: error.response.statusText,
              url: error.config?.url,
              baseURL: error.config?.baseURL,
              message: error.message,
              data: error.response.data
            });
          }
          
          if (error.response.status === 401) {
            this.clearAuthHeaders();
          }
        } else if (error.request) {
          // Network error - silently handle, error will be returned to caller
          // No console logging to avoid noise
        } else {
          // Setup error
          if (__DEV__) {
            console.error('❌ API Setup Error:', error.message);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  private clearAuthHeaders() {
    this.token = null;
    delete this.axiosInstance.defaults.headers.common['Authorization'];
  }

  private handleApiError(error: AxiosError): never {
    if (error.response) {
      // Server responded with error status
      const message = (error.response.data as any)?.message || error.message;
      console.error('API Error Response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
      throw new Error(message);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error - No Response:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        timeout: error.config?.timeout
      });
      throw new Error(`Network error. Please check your connection and ensure the backend server is running at ${API_BASE_URL}`);
    } else {
      // Something else happened
      console.error('API Setup Error:', {
        message: error.message,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      });
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
      // Return error response instead of throwing to avoid undefined upstream
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        return {
          success: false,
          message: message
        } as any;
      } else if (axiosError.request) {
        return {
          success: false,
          message: `Network error. Please check your connection and ensure the backend server is running at ${API_BASE_URL}`
        } as any;
      } else {
        return {
          success: false,
          message: axiosError.message || 'Unknown error'
        } as any;
      }
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

  async superadminGetCompanyDetails(companyId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/superadmin/company/${companyId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminUpdateCompany(companyId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.patch(`/superadmin/update-company/${companyId}`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminGetSystemStats(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/superadmin/system-stats`);
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

  async superadminUpdateAdmin(adminId: string, data: { name: string; email: string; mobile: string; password?: string; companyId?: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.patch(`/superadmin/update-admin/${adminId}`, data);
      return response.data;
    } catch (error) {
      throw this.handleApiError(error as AxiosError);
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

  async superadminGetSalesReport(params?: { 
    period?: string; 
    companyId?: string; 
    startDate?: string; 
    endDate?: string 
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/superadmin/sales-report', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminExportSalesReport(params?: { 
    format?: string; 
    period?: string 
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/superadmin/sales-report/export', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // Super Admin Outstanding Management
  async superadminGetOutstandingSummary(params?: {
    companyId?: string;
    status?: string;
    riskLevel?: string;
    daysOverdue?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/superadmin/outstanding-summary', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminGetOutstandingList(params?: {
    page?: number;
    limit?: number;
    companyId?: string;
    status?: string;
    riskLevel?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/superadmin/outstanding-list', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminGetOutstandingDetails(outstandingId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/superadmin/outstanding/${outstandingId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminUpdateOutstanding(outstandingId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.patch(`/superadmin/outstanding/${outstandingId}/update`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async superadminAddCollectionNote(outstandingId: string, note: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post(`/superadmin/outstanding/${outstandingId}/add-note`, { note });
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
      if (!this.token) {
        return { success: false, message: 'Not authenticated' };
      }

      const params = companyId ? { companyId } : {};
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/admin/company-data', { params });
      return response.data;
    } catch (error) {
      // Return error response instead of throwing to avoid undefined upstream
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        return {
          success: false,
          message: message
        } as any;
      } else if (axiosError.request) {
        return {
          success: false,
          message: `Network error. Please check your connection and ensure the backend server is running at ${API_BASE_URL}`
        } as any;
      } else {
        return {
          success: false,
          message: axiosError.message || 'Unknown error'
        } as any;
      }
    }
  }

  async adminGetUsersByCompany(params?: { 
    companyId?: string; 
    role?: string; 
    page?: number; 
    limit?: number; 
  }): Promise<ApiResponse<any>> {
    try {
      if (!this.token) {
        return { success: false, message: 'Not authenticated' };
      }

      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/admin/users-by-company', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminGetUsersForParentSelection(excludeUserId?: string): Promise<ApiResponse<any>> {
    try {
      if (!this.token) {
        return { success: false, message: 'Not authenticated' };
      }

      const params = excludeUserId ? { excludeUserId } : {};
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/admin/users-for-parent', { params });
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

  async switchCompany(companyId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/user/switch-company', { companyId });
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

  async deleteUser(userId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.delete(`/user/delete/${userId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async adminGetUsersByRole(role: string): Promise<ApiResponse<any>> {
    try {
      if (!this.token) {
        return { success: false, message: 'Not authenticated' };
      }

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
    parentUserId?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
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
    parentUserId?: string;
    isActive?: boolean;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/admin/edit-user/${userId}`, userData);
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
      unitPrice?: number;
      discount?: number;
      gstRate?: number;
    }>;
    deliveryDate?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    paymentMethod?: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'credit' | 'other';
    modeSelection?: string;
    mode?: string;
    customMode?: string;
    termsOfPayment?: string;
    otherReference?: string;
    termsOfDelivery1?: string;
    termsOfDelivery2?: string;
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
    orderType?: string;
    createdBy?: string; // Filter by createdBy (user ID)
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
      // Return error response instead of throwing to avoid undefined upstream
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        return {
          success: false,
          message: message
        } as any;
      } else if (axiosError.request) {
        return {
          success: false,
          message: 'Network error - No response received'
        } as any;
      } else {
        return {
          success: false,
          message: axiosError.message || 'Unknown error'
        } as any;
      }
    }
  }

  async updateOrder(orderId: string, data: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/orders/${orderId}`, data);
      return response.data;
    } catch (error) {
      // Return error response instead of throwing to avoid undefined upstream
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        return {
          success: false,
          message: message
        } as any;
      } else if (axiosError.request) {
        return {
          success: false,
          message: 'Network error - No response received'
        } as any;
      } else {
        return {
          success: false,
          message: axiosError.message || 'Unknown error'
        } as any;
      }
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
    price: number;
    stock?: number;
    isActive?: boolean;
    gstRate?: number;
  }): Promise<ApiResponse<any>> {
    console.log('🌐 API Service createProduct called with:', data);
    try {
      console.log('📡 Making POST request to /products...');
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/products', data);
      console.log('📡 POST response received:', response.data);
      const result: any = response.data;

      if (result?.success && result.product) {
        const stockValue =
          typeof result.product.stock === 'number'
            ? result.product.stock
            : (result.product.stock?.current ?? 0);

        result.product = {
          ...result.product,
          unit: result.product.unit ?? DEFAULT_UNIT_LABEL,
          stock: {
            current: stockValue,
            minimum: result.product.stock?.minimum ?? 0,
            maximum: result.product.stock?.maximum ?? Math.max(stockValue, 0),
          },
          stockQuantity: stockValue,
        };
      }

      return result;
    } catch (error) {
      console.log('❌ API Service createProduct error:', error);
      // Return error response instead of throwing
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        console.log('📡 Returning error response:', { success: false, message });
        return {
          success: false,
          message: message
        };
      } else if (axiosError.request) {
        console.log('📡 Returning network error response');
        return {
          success: false,
          message: 'Network error - No response received'
        };
      } else {
        console.log('📡 Returning unexpected error response');
        return {
          success: false,
          message: axiosError.message || 'An unexpected error occurred'
        };
      }
    }
  }

  async getProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/products', { params });
      const data: any = response.data;

      if (data?.products && Array.isArray(data.products)) {
        data.products = data.products.map((product: any) => {
          const stockValue =
            typeof product.stock === 'number'
              ? product.stock
              : (product.stock?.current ?? 0);

          return {
            ...product,
            unit: product.unit ?? DEFAULT_UNIT_LABEL,
            stock: {
              current: stockValue,
              minimum: product.stock?.minimum ?? 0,
              maximum: product.stock?.maximum ?? Math.max(stockValue, 0),
            },
            stockQuantity: stockValue,
          };
        });
      }

      return data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getProductById(productId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/products/${productId}`);
      const data: any = response.data;

      if (data?.success && data.product) {
        const stockValue =
          typeof data.product.stock === 'number'
            ? data.product.stock
            : (data.product.stock?.current ?? 0);

        data.product = {
          ...data.product,
          unit: data.product.unit ?? DEFAULT_UNIT_LABEL,
          stock: {
            current: stockValue,
            minimum: data.product.stock?.minimum ?? 0,
            maximum: data.product.stock?.maximum ?? Math.max(stockValue, 0),
          },
          stockQuantity: stockValue,
        };
      }

      return data;
    } catch (error) {
      // Return error response instead of throwing to avoid undefined upstream
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        return {
          success: false,
          message: message
        } as any;
      } else if (axiosError.request) {
        return {
          success: false,
          message: 'Network error - No response received'
        } as any;
      } else {
        return {
          success: false,
          message: axiosError.message || 'Unknown error'
        } as any;
      }
    }
  }

  async updateProduct(productId: string, data: {
    productName?: string;
    description?: string;
    category?: string;
    subCategory?: string;
    brand?: string;
    price?: number;
    stock?: number;
    isActive?: boolean;
    gstRate?: number;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/products/${productId}`, data);
      const result: any = response.data;

      if (result?.success && result.product) {
        const stockValue =
          typeof result.product.stock === 'number'
            ? result.product.stock
            : (result.product.stock?.current ?? 0);

        result.product = {
          ...result.product,
          unit: result.product.unit ?? DEFAULT_UNIT_LABEL,
          stock: {
            current: stockValue,
            minimum: result.product.stock?.minimum ?? 0,
            maximum: result.product.stock?.maximum ?? Math.max(stockValue, 0),
          },
          stockQuantity: stockValue,
        };
      }

      return result;
    } catch (error) {
      // Return error response instead of throwing
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        return {
          success: false,
          message: message
        };
      } else if (axiosError.request) {
        return {
          success: false,
          message: 'Network error - No response received'
        };
      } else {
        return {
          success: false,
          message: axiosError.message || 'An unexpected error occurred'
        };
      }
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
      // Return error response instead of throwing
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        const message = (axiosError.response.data as any)?.message || axiosError.message;
        return {
          success: false,
          message: message
        };
      } else if (axiosError.request) {
        return {
          success: false,
          message: 'Network error - No response received'
        };
      } else {
        return {
          success: false,
          message: axiosError.message || 'An unexpected error occurred'
        };
      }
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

  // ==================== DEALER TEAM MANAGEMENT ====================

  async createSubDealer(data: {
    email: string;
    password: string;
    name: string;
    mobile: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.post('/dealer/create-subdealer', data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getSubDealers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/dealer/subdealers', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getSubDealerById(subDealerId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get(`/dealer/subdealers/${subDealerId}`);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async updateSubDealer(subDealerId: string, data: {
    name?: string;
    mobile?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
      country?: string;
    };
    isActive?: boolean;
  }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.put(`/dealer/subdealers/${subDealerId}`, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async deactivateSubDealer(subDealerId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.delete(`/dealer/subdealers/${subDealerId}`);
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
      if (!this.token) {
        return { success: false, message: 'Not authenticated' };
      }

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

  async getZonalRecentActivity(params?: { limit?: number; days?: number }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/zonal/recent-activity', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // ==================== RSM MANAGEMENT ====================
  async getRSMDashboardData(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/rsm/dashboard');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getRSMTeamMembers(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/rsm/team', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getRSMTeamPerformance(params?: { period?: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/rsm/team-performance', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getRSMRecentActivity(params?: { limit?: number; days?: number }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/rsm/recent-activity', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  // ==================== ASM MANAGEMENT ====================
  async getASMDashboardData(): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/asm/dashboard');
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getASMTeamMembers(params?: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/asm/team', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getASMTeamPerformance(params?: { period?: string }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/asm/team-performance', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }

  async getASMRecentActivity(params?: { limit?: number; days?: number }): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<ApiResponse<any>> = await this.axiosInstance.get('/asm/recent-activity', { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
    }
  }
}

// Create and export a singleton instance
export const apiService = new ApiService();
export default apiService;
