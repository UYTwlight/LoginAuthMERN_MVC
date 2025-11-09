# Tính Năng Xóa Session - Admin Only

## ✨ Tính Năng Mới

### **Admin có thể xóa session camera/video**
- Chỉ user có role `admin` mới thấy nút xóa
- Có modal xác nhận trước khi xóa
- Xóa cả database record và thư mục face_logs

---

## 🔧 Backend API

### **DELETE** `/api/emotions/face-logs/sessions/:sessionId`
- **Auth Required**: Yes (JWT Token)
- **Role Required**: Admin
- **Middleware**: `verifyToken`, `isAdmin`

#### Request
```http
DELETE /api/emotions/face-logs/sessions/Camera_0_20251109_123456
Authorization: Bearer <admin_token>
```

#### Response Success (200)
```json
{
    "success": true,
    "message": "Đã xóa session thành công"
}
```

#### Response Errors
- **401**: Unauthorized (không có token)
- **403**: Forbidden (không phải admin)
- **404**: Session không tồn tại
- **500**: Server error

---

## 🎨 Frontend UI

### **Nút Xóa trong Session Card**
- Xuất hiện khi hover vào session card
- Icon 🗑️ màu đỏ ở góc phải trên
- Chỉ hiển thị nếu `userRole === 'admin'`

### **Modal Xác Nhận**
Khi click nút xóa:
1. Hiển thị modal overlay tối
2. Modal trắng với header đỏ
3. Nội dung cảnh báo:
   - Session ID
   - Cảnh báo: "Hành động này sẽ xóa vĩnh viễn..."
4. 2 nút:
   - ❌ Hủy (màu xám)
   - 🗑️ Xóa (màu đỏ)

### **Sau khi xóa thành công:**
- Alert thông báo "✅ Đã xóa session thành công!"
- Session biến mất khỏi danh sách
- Nếu đang xem session đó → Clear selection
- Auto-select session đầu tiên còn lại

---

## 📁 Files Đã Thay Đổi

### **1. Backend**

#### `Backend/src/routes/EmotionRoutes.js`
```javascript
// Import thêm
import { deleteFaceLogSession } from '../controllers/EmotionController.js';

// Route mới
router.delete('/face-logs/sessions/:sessionId', verifyToken, isAdmin, deleteFaceLogSession);
```

#### `Backend/src/controllers/EmotionController.js`
```javascript
export const deleteFaceLogSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        // Tìm session trong MongoDB
        const session = await FaceLogSession.findOne({ sessionId });
        if (!session) {
            return res.status(404).json({
                success: false,
                error: 'Session không tồn tại'
            });
        }

        // Xóa thư mục face_logs
        if (session.directoryPath) {
            const fullPath = path.join(process.cwd(), '..', 'Emotion-statistics', session.directoryPath);
            if (fs.existsSync(fullPath)) {
                fs.rmSync(fullPath, { recursive: true, force: true });
            }
        }

        // Xóa MongoDB document
        await FaceLogSession.deleteOne({ sessionId });

        res.json({
            success: true,
            message: 'Đã xóa session thành công'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Lỗi khi xóa session',
            details: error.message
        });
    }
};
```

### **2. Frontend**

#### `Frontend/src/Components/Reports/Reports.js`
**Added States:**
```javascript
const [userRole, setUserRole] = useState(null);
const [deleteConfirm, setDeleteConfirm] = useState(null);
```

**New Functions:**
```javascript
// Fetch user role from JWT
const fetchUserRole = async () => {
    const token = localStorage.getItem('accessToken');
    const payload = JSON.parse(atob(token.split('.')[1]));
    setUserRole(payload.role);
};

// Delete session
const handleDeleteSession = async (sessionId) => {
    const token = localStorage.getItem('accessToken');
    await axios.delete(
        `${API_URL}/api/emotions/face-logs/sessions/${sessionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    // Remove from list and clear selection
    setSessions(sessions.filter(s => s.sessionId !== sessionId));
    if (selectedSession === sessionId) {
        setSelectedSession(sessions[0]?.sessionId || null);
    }
    setDeleteConfirm(null);
    alert('✅ Đã xóa session thành công!');
};
```

**Updated Session Card:**
```jsx
<div className="session-card">
    <div className="session-clickable" onClick={() => setSelectedSession(session.sessionId)}>
        {/* Session content */}
    </div>
    
    {/* Delete Button - Only for Admin */}
    {userRole === 'admin' && (
        <button
            className="delete-session-btn"
            onClick={(e) => {
                e.stopPropagation();
                setDeleteConfirm(session.sessionId);
            }}
            title="Xóa session"
        >
            🗑️
        </button>
    )}
</div>
```

**Modal:**
```jsx
{deleteConfirm && (
    <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h3>⚠️ Xác nhận xóa</h3>
            </div>
            <div className="modal-body">
                <p>Bạn có chắc chắn muốn xóa session này?</p>
                <p className="warning-text">
                    <strong>Session ID:</strong> {deleteConfirm}
                </p>
                <p className="warning-text">
                    ⚠️ Hành động này sẽ xóa vĩnh viễn tất cả dữ liệu!
                </p>
            </div>
            <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setDeleteConfirm(null)}>
                    ❌ Hủy
                </button>
                <button className="btn-confirm-delete" onClick={() => handleDeleteSession(deleteConfirm)}>
                    🗑️ Xóa
                </button>
            </div>
        </div>
    </div>
)}
```

#### `Frontend/src/Components/Reports/Reports_New.css`
**New Styles:**
- `.session-card` - Position relative
- `.session-clickable` - Flex 1, cursor pointer
- `.delete-session-btn` - Nút xóa màu đỏ, opacity 0 → 1 khi hover
- `.modal-overlay` - Full screen overlay
- `.modal-content` - Modal trắng với animation
- `.modal-header` - Header gradient đỏ
- `.modal-body` - Padding content
- `.warning-text` - Text đỏ với background nhạt
- `.modal-actions` - Buttons container
- `.btn-cancel`, `.btn-confirm-delete` - Button styles

---

## 🧪 Test

### **Method 1: Manual Test (Recommended)**

1. **Start hệ thống:**
```powershell
.\start-all.bat
```

2. **Login as Admin:**
   - Email: `sonhotboy82@gmail.com`
   - Password: (your admin password)

3. **Navigate to Reports page**

4. **Hover vào session card**
   - Nút 🗑️ màu đỏ xuất hiện ở góc phải trên

5. **Click nút xóa**
   - Modal xác nhận xuất hiện
   - Hiển thị session ID và cảnh báo

6. **Click "🗑️ Xóa"**
   - Alert: "✅ Đã xóa session thành công!"
   - Session biến mất khỏi danh sách

7. **Verify deletion:**
   - Check MongoDB Compass → session không còn trong `facelogsessions`
   - Check folder `Emotion-statistics/face_logs/` → thư mục đã bị xóa

### **Method 2: API Test Script**

```powershell
cd Backend
node testDeleteSession.js
```

**Output mong đợi:**
```
=== Testing Delete Face Log Session API ===

Step 1: Creating a test session...
✅ Test session created: test_delete_session_1762666500000

Step 2: Logging in as admin...
✅ Admin logged in, token received

Step 3: Deleting session...
✅ DELETE SUCCESS!
Response: {
  "success": true,
  "message": "Đã xóa session thành công"
}

Step 4: Verifying deletion...
✅ Confirmed: Session successfully deleted from database

=== Test Complete ===
```

### **Method 3: Test as Non-Admin**

1. **Login as regular user:**
   - Email: `kien123@gmail.com`

2. **Navigate to Reports**
   - ❌ Nút xóa KHÔNG hiển thị
   - Chỉ admin mới thấy nút xóa

3. **Try API call directly:**
```bash
curl -X DELETE http://localhost:3001/api/emotions/face-logs/sessions/test_session \
  -H "Authorization: Bearer <user_token>"
```
Expected: `403 Forbidden`

---

## 🔒 Security Features

### **1. Role-Based Access Control (RBAC)**
- Middleware `isAdmin` kiểm tra user role
- Chỉ admin có thể gọi DELETE endpoint

### **2. JWT Verification**
- Middleware `verifyToken` xác thực token
- Token phải valid và không expired

### **3. Frontend Protection**
```javascript
// Nút xóa chỉ hiển thị cho admin
{userRole === 'admin' && (
    <button className="delete-session-btn">🗑️</button>
)}
```

### **4. User Confirmation**
- Modal xác nhận trước khi xóa
- Hiển thị session ID để user kiểm tra
- Cảnh báo rõ ràng: "xóa vĩnh viễn, không thể hoàn tác"

### **5. Database + File System Cleanup**
```javascript
// Xóa MongoDB document
await FaceLogSession.deleteOne({ sessionId });

// Xóa thư mục face_logs
fs.rmSync(fullPath, { recursive: true, force: true });
```

---

## ⚠️ Important Notes

### **1. Không thể hoàn tác**
- Khi xóa, dữ liệu bị xóa vĩnh viễn
- Cần backup trước nếu cần giữ lại

### **2. Admin Responsibility**
- Chỉ admin mới có quyền xóa
- Cần cẩn thận khi xóa session

### **3. Cascade Delete**
- Xóa MongoDB document
- Xóa thư mục face_logs và tất cả CSV files
- Xóa tất cả ảnh first_frame

### **4. Error Handling**
```javascript
try {
    // Delete operation
} catch (error) {
    // Show error to user
    alert('❌ Lỗi khi xóa session: ' + error.message);
}
```

---

## 📊 User Flow

```
Admin vào Reports page
    ↓
Hover vào session card
    ↓
Nút 🗑️ xuất hiện
    ↓
Click nút xóa
    ↓
Modal xác nhận hiển thị
    ↓
[Option 1] Click "Hủy" → Đóng modal, không làm gì
    ↓
[Option 2] Click "Xóa" → API Call
    ↓
Backend verify JWT + role
    ↓
Xóa MongoDB document
    ↓
Xóa thư mục face_logs
    ↓
Response 200 OK
    ↓
Frontend remove session khỏi danh sách
    ↓
Alert thành công
    ↓
UI cập nhật tự động
```

---

## 🎯 Benefits

1. **Clean Database**: Xóa sessions không cần thiết
2. **Free Disk Space**: Xóa thư mục face_logs cũ
3. **Better Management**: Admin quản lý dữ liệu hiệu quả
4. **User-Friendly**: UI đơn giản, modal xác nhận rõ ràng
5. **Secure**: Role-based, JWT verified, confirmation required

---

**Build Date**: 2025-11-09
**Feature**: Admin Delete Session
**Status**: ✅ Ready for Testing
