# Environment Configuration Guide

## Backend Environment Variables

Tạo file `Backend/.env` với các biến sau:

```env
# MongoDB Connection
MONGO_URL="mongodb://localhost:27017/emotion-detection"
# Hoặc MongoDB Atlas:
# MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/emotion-detection"

# JWT Secrets
JWT_SECRET="your-jwt-secret-key"
REFRESH_SECRET="your-refresh-token-secret"
ACCESS_SECRET="your-access-token-secret"

# Server Configuration
PORT=3001

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

### Giải thích:

- **MONGO_URL**: Connection string MongoDB
  - Local: `mongodb://localhost:27017/emotion-detection`
  - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/`

- **JWT Secrets**: Các key bảo mật cho JWT tokens
  - Nên sử dụng string dài, random, và khác nhau cho mỗi secret

- **PORT**: Port mà Backend server lắng nghe (mặc định: 3001)

- **FRONTEND_URL**: URL của Frontend để cấu hình CORS (mặc định: http://localhost:3000)

## Frontend Environment Variables

Tạo file `Frontend/.env` với các biến sau:

```env
# Backend API URLs
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### Giải thích:

- **REACT_APP_API_URL**: Base URL của Backend server
- **REACT_APP_API_BASE_URL**: Base URL cho API endpoints

### Lưu ý:
- React yêu cầu prefix `REACT_APP_` cho tất cả environment variables
- Sau khi thay đổi `.env`, cần restart Frontend để áp dụng

## Production Configuration

### Backend (Production)

```env
MONGO_URL="mongodb+srv://prod-user:password@production-cluster.mongodb.net/emotion-detection"
JWT_SECRET="super-secure-production-jwt-secret"
REFRESH_SECRET="super-secure-production-refresh-secret"
ACCESS_SECRET="super-secure-production-access-secret"
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (Production)

```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_API_BASE_URL=https://your-backend-domain.com/api
```

## Deployment Checklist

### Backend:
- [ ] Set strong, unique JWT secrets
- [ ] Use MongoDB Atlas or production MongoDB instance
- [ ] Configure correct FRONTEND_URL for CORS
- [ ] Set appropriate PORT (usually 5000, 8080, or 3001)
- [ ] Enable SSL/HTTPS in production
- [ ] Add rate limiting and security headers

### Frontend:
- [ ] Update API URLs to production backend
- [ ] Build for production: `npm run build`
- [ ] Serve static files with proper caching headers
- [ ] Enable HTTPS
- [ ] Configure CSP headers

### C++ Application:
- [ ] Update API_HOST and API_PORT in main.cpp
- [ ] Rebuild: `.\build_main.bat`
- [ ] Test connection to production backend

## Environment Variables trong Code

### Backend (`src/app.js`):
```javascript
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
```

### Frontend Components:
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

## Testing Configuration

Sau khi cập nhật .env:

1. **Restart Backend:**
   ```bash
   cd Backend
   npm start
   ```

2. **Restart Frontend:**
   ```bash
   cd Frontend
   npm start
   ```

3. **Verify:**
   - Backend console: `Server is running on http://localhost:3001`
   - Frontend: Mở browser console, check API calls đến đúng URL
   - Test login và Reports page

## Troubleshooting

### Lỗi: "CORS policy blocked"
- **Nguyên nhân**: FRONTEND_URL trong Backend .env không khớp với URL Frontend thực tế
- **Giải pháp**: Cập nhật FRONTEND_URL trong Backend/.env và restart Backend

### Lỗi: "Failed to connect to API"
- **Nguyên nhân**: REACT_APP_API_URL sai hoặc Backend không chạy
- **Giải pháp**: 
  1. Check Backend có đang chạy không
  2. Verify REACT_APP_API_URL trong Frontend/.env
  3. Restart Frontend sau khi sửa .env

### Lỗi: "MongoDB connection failed"
- **Nguyên nhân**: MONGO_URL sai hoặc MongoDB không chạy
- **Giải pháp**:
  1. Verify MONGO_URL format
  2. Check MongoDB service đang chạy
  3. Test connection: `node Backend/testMongoConnection.js`

### Lỗi: "Invalid JWT token"
- **Nguyên nhân**: JWT secrets thay đổi sau khi token được issue
- **Giải pháp**: User cần login lại để lấy token mới

## Security Best Practices

1. **Không commit .env files** vào Git
   - Đã có trong `.gitignore`
   - Share .env qua secure channels (1Password, LastPass, etc.)

2. **Use strong secrets** (JWT_SECRET, etc.)
   - Ít nhất 32 ký tự
   - Random characters
   - Khác nhau cho mỗi environment (dev, staging, prod)

3. **Rotate secrets** định kỳ
   - 3-6 tháng một lần
   - Sau security incidents
   - Khi có team members rời đi

4. **Use environment-specific configs**
   - Development: Local MongoDB, relaxed CORS
   - Staging: Test database, strict CORS
   - Production: Production database, strictest security

## Example .env Files

### Development
Backend/.env:
```env
MONGO_URL="mongodb://localhost:27017/emotion-detection"
JWT_SECRET="dev-jwt-secret-do-not-use-in-production"
REFRESH_SECRET="dev-refresh-secret"
ACCESS_SECRET="dev-access-secret"
PORT=3001
FRONTEND_URL=http://localhost:3000
```

Frontend/.env:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### Production
Backend/.env:
```env
MONGO_URL="mongodb+srv://prod:xxxxx@cluster.mongodb.net/emotion-detection"
JWT_SECRET="<64-char-random-string>"
REFRESH_SECRET="<64-char-random-string>"
ACCESS_SECRET="<64-char-random-string>"
PORT=5000
FRONTEND_URL=https://emotion-app.yourcompany.com
```

Frontend/.env.production:
```env
REACT_APP_API_URL=https://api.emotion-app.yourcompany.com
REACT_APP_API_BASE_URL=https://api.emotion-app.yourcompany.com/api
```
