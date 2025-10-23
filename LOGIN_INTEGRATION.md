# Login Integration Documentation

## Overview
This document describes the integration of the universal login system with Axios and Redux for state management in the mobile app.

## Architecture

### 1. Redux Store Structure
- **Store**: Configured with Redux Toolkit and Redux Persist
- **Auth Slice**: Manages authentication state including user data, loading states, and errors
- **Persistence**: Auth state is persisted using AsyncStorage

### 2. API Service (Axios)
- **Base Configuration**: Centralized API configuration with environment-specific URLs
- **Interceptors**: Automatic token handling and error management
- **Error Handling**: Comprehensive error handling with user-friendly messages

### 3. Authentication Flow
1. User enters credentials in SignIn screen
2. Credentials are sent to `/api/v1/auth/login` endpoint
3. Backend validates credentials and returns user data with role-specific information
4. Redux store is updated with user data and authentication state
5. Navigation is handled based on user role

## Key Features

### Universal Login
- Single endpoint for all user types (superadmin, admin, zonal, rsm, asm, salesman, dealers, distributors, subdealer)
- Role-specific data returned based on user type
- Automatic token management

### State Management
- Redux Toolkit for predictable state updates
- Redux Persist for offline state persistence
- TypeScript support for type safety

### API Integration
- Axios for HTTP requests with interceptors
- Automatic token attachment to requests
- Centralized error handling
- Request/response logging in development

## File Structure

```
src/
├── config/
│   └── api.ts                 # API configuration
├── services/
│   └── api.ts                 # Axios API service
├── store/
│   ├── index.ts              # Redux store configuration
│   ├── hooks.ts              # Typed Redux hooks
│   └── slices/
│       └── authSlice.ts      # Authentication state management
├── context/
│   └── AuthContext.tsx       # Auth context (Redux wrapper)
└── screens/
    └── auth/
        └── SignIn.tsx        # Login screen
```

## Usage

### Login Process
```typescript
// In SignIn component
const { login, error, clearError } = useAuth();

const handleLogin = async () => {
  try {
    await login(email, password);
    // Navigation handled automatically
  } catch (error) {
    // Error displayed to user
  }
};
```

### Accessing Auth State
```typescript
// Using Redux hooks directly
const { user, isAuthenticated, isLoading } = useAppSelector(state => state.auth);

// Using Auth context
const { user, isAuthenticated, isLoading } = useAuth();
```

## Configuration

### API Base URL
Update the API base URL in `src/config/api.ts`:
```typescript
export const getApiBaseUrl = () => {
  if (__DEV__) {
    return 'http://localhost:3000/api/v1'; // Development
  }
  return 'https://your-production-api.com/api/v1'; // Production
};
```

### Backend Endpoint
The login endpoint expects:
```typescript
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response format:
```typescript
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "admin",
      // ... other user fields
    },
    "roleSpecificData": {
      // Role-specific dashboard data
    },
    "token": "jwt_token"
  }
}
```

## Error Handling

### Network Errors
- Automatic retry for network failures
- User-friendly error messages
- Offline state handling

### Authentication Errors
- Token expiration handling
- Automatic logout on 401 responses
- Clear error states on new login attempts

## Testing

### Demo Credentials
The SignIn screen includes demo credentials for testing different roles:
- SuperAdmin: `superadmin` / `123456`
- Admin: `admin` / `123456`
- RSM: `rsm` / `123456`
- ASM: `asm` / `123456`
- Distributor: `distributor` / `123456`
- Dealer: `dealer` / `123456`
- Sub Dealer: `subdealer` / `123456`
- Salesman: `salesman` / `123456`

## Security Considerations

1. **Token Storage**: JWT tokens are stored securely in AsyncStorage
2. **Token Expiration**: Automatic logout on token expiration
3. **HTTPS**: Use HTTPS in production for secure communication
4. **Input Validation**: Client-side validation before API calls

## Troubleshooting

### Common Issues

1. **Network Errors**: Check API base URL configuration
2. **Token Issues**: Clear app data and re-login
3. **State Persistence**: Check Redux Persist configuration
4. **Navigation Issues**: Verify user role mapping in navigation

### Debug Mode
Enable debug logging by setting `__DEV__` to true in development builds.
