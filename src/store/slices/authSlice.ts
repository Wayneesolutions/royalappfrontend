// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../navigation/types';
import { apiService, LoginRequest, LoginResponse } from '../../services/api';

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  roleSpecificData: any;
}

// Initial state
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  roleSpecificData: null,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.login(credentials);
      if (response.success && response.data) {
        return response.data;
      } else {
        return rejectWithValue(response.message || 'Login failed');
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Login failed'
      );
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      return true;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Logout failed'
      );
    }
  }
);

export const checkAuthStatus = createAsyncThunk(
  'auth/checkAuthStatus',
  async (_, { rejectWithValue }) => {
    try {
      const token = await apiService.getStoredToken();
      const userData = await apiService.getStoredUser();
      
      if (token && userData) {
        return userData;
      } else {
        return rejectWithValue('No valid session found');
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Auth check failed'
      );
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Login user
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = {
          ...action.payload.user,
          id: action.payload.user._id, // Map _id to id for backward compatibility
        };
        state.roleSpecificData = action.payload.roleSpecificData;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.roleSpecificData = null;
        state.error = action.payload as string;
      });

    // Logout user
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.roleSpecificData = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Check auth status
    builder
      .addCase(checkAuthStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuthStatus.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = {
          ...action.payload,
          id: action.payload._id, // Map _id to id for backward compatibility
        };
        state.error = null;
      })
      .addCase(checkAuthStatus.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.roleSpecificData = null;
        state.error = null;
      });
  },
});

// Export actions
export const { clearError, updateUser, setLoading } = authSlice.actions;

// Export reducer
export default authSlice.reducer;

