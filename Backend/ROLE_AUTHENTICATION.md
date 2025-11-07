# Role-Based Authentication System

## Overview
The backend now supports role-based authentication with two roles:
- **user**: Regular user with standard access
- **admin**: Administrator with elevated privileges

## Changes Made

### 1. User Model (User.js)
- Added `role` field with enum values: ['user', 'admin']
- Default role is 'user'

### 2. Token Generation (token.js)
- Updated to include role information in JWT tokens
- Both access and refresh tokens now contain userId and role

### 3. Authentication Middleware (middleware/auth.js)
New middleware functions:
- `verifyToken`: Validates JWT token and attaches user info to request
- `isAdmin`: Checks if user has admin role
- `isUser`: Checks if user has user or admin role

### 4. Controllers (UserController.js)
Updated endpoints:
- **registerUser**: Now accepts optional `role` parameter
- **loginUser**: Returns user role in response
- **getUserDetails**: Simplified to use middleware
- **refreshAccessToken**: Includes role in new token

New admin-only endpoints:
- **getAllUsers**: Get list of all users
- **deleteUser**: Delete a user by ID
- **updateUserRole**: Change user's role

## API Endpoints

### Public Routes
```
POST /register          - Register new user (optionally specify role)
POST /login            - Login and receive access token with role
POST /logout           - Logout user
GET  /refresh          - Refresh access token
```

### Protected Routes (User/Admin)
```
GET /getUserDetails    - Get current user details (requires authentication)
```

### Admin Only Routes
```
GET    /users              - Get all users
DELETE /users/:userId      - Delete a user
PATCH  /users/:userId/role - Update user role
```

## Usage Examples

### 1. Register a Regular User
```json
POST /register
{
  "name": "John Doe",
  "email": "john@example.com",
  "mobile": "1234567890",
  "password": "password123"
}
```

### 2. Register an Admin User
```json
POST /register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "mobile": "1234567890",
  "password": "admin123",
  "role": "admin"
}
```

### 3. Login Response
```json
{
  "message": "Login Successfull",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "role": "admin",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  }
}
```

### 4. Access Protected Route
```
GET /getUserDetails
Headers: {
  "Authorization": "Bearer <accessToken>"
}
```

### 5. Get All Users (Admin Only)
```
GET /users
Headers: {
  "Authorization": "Bearer <adminAccessToken>"
}
```

### 6. Update User Role (Admin Only)
```
PATCH /users/:userId/role
Headers: {
  "Authorization": "Bearer <adminAccessToken>"
}
Body: {
  "role": "admin"
}
```

## Security Features

1. **JWT Tokens**: Include role information for authorization
2. **Middleware Protection**: Routes are protected by authentication and role checks
3. **Password Hashing**: Passwords are hashed using bcrypt
4. **Password Exclusion**: User password is excluded from responses

## Frontend Integration

When a user logs in, store both:
1. **accessToken**: For API authentication
2. **role**: For UI conditional rendering

Example frontend logic:
```javascript
// After login
const { accessToken, role, user } = response.data;
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('userRole', role);

// Conditional rendering
{role === 'admin' && <AdminDashboard />}
{role === 'user' && <UserDashboard />}
```

## Testing

### Create Admin User
1. Register a user with `role: "admin"`
2. Login and note the access token
3. Use the token to access admin routes

### Test Role Protection
1. Try accessing `/users` with a regular user token - should get 403 error
2. Try accessing `/users` with an admin token - should succeed

## Notes

- Default role for new users is 'user'
- **Token Expiration Times:**
  - **Admin Users:**
    - Access token: 365 days (essentially infinite)
    - Refresh token: 365 days
    - Cookie: 365 days
  - **Regular Users:**
    - Access token: 30 minutes
    - Refresh token: 7 days
    - Cookie: 7 days
- Admin users can perform all user operations plus admin-specific operations
- Admin tokens are long-lived for convenience while maintaining security through role-based access control
