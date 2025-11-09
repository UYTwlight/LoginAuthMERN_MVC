# 🔒 Hướng dẫn xóa file .env khỏi Git History

## ⚠️ Vấn đề:
File `Backend/.env` đã bị commit lên GitHub, có thể chứa thông tin nhạy cảm (DB credentials, JWT secrets, etc.)

## ✅ Các bước đã thực hiện:

### 1. Xóa file khỏi tracking (DONE ✓)
```bash
git rm --cached Backend/.env
```

### 2. Cập nhật .gitignore (DONE ✓)
Đã thêm:
```
.env
Backend/.env
Frontend/.env
```

### 3. Commit thay đổi (DONE ✓)
```bash
git commit -m "Remove .env file from tracking and update .gitignore"
```

## 🚨 QUAN TRỌNG - Các bước tiếp theo:

### Cách 1: Sử dụng BFG Repo-Cleaner (Khuyến nghị)

1. **Tải BFG Repo-Cleaner**:
   ```bash
   # Download từ: https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **Chạy BFG để xóa file**:
   ```bash
   java -jar bfg.jar --delete-files .env
   ```

3. **Cleanup và force push**:
   ```bash
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push origin --force --all
   ```

### Cách 2: Sử dụng git filter-repo (Khuyến nghị)

1. **Cài đặt git-filter-repo**:
   ```bash
   pip install git-filter-repo
   ```

2. **Xóa file khỏi history**:
   ```bash
   git filter-repo --path Backend/.env --invert-paths
   ```

3. **Force push**:
   ```bash
   git remote add origin https://github.com/UYTwlight/LoginAuthMERN_MVC.git
   git push origin --force --all
   ```

### Cách 3: Sử dụng git filter-branch (Không khuyến nghị nhưng có sẵn)

```bash
git filter-branch --force --index-filter \
"git rm --cached --ignore-unmatch Backend/.env" \
--prune-empty --tag-name-filter cat -- --all

git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

## 🔐 BẢO MẬT SAU KHI XÓA:

### 1. Đổi tất cả credentials trong file .env cũ:
- ✅ Đổi `MONGODB_URI` (connection string)
- ✅ Đổi `SECRET_KEY` (JWT secret)  
- ✅ Đổi `REFRESH_SECRET_KEY`
- ✅ Đổi các API keys khác (nếu có)

### 2. Tạo file .env.example (template):
```bash
MONGODB_URI=mongodb://localhost:27017/your-database
PORT=3001
SECRET_KEY=your-secret-key-here
REFRESH_SECRET_KEY=your-refresh-secret-here
```

### 3. Xác nhận file đã bị xóa:
```bash
git log --all --full-history -- Backend/.env
```
(Không nên thấy gì nếu xóa thành công)

## 📝 Lưu ý:

1. **Force push sẽ ghi đè lịch sử trên GitHub** - Cảnh báo team members trước!
2. **Ai đã clone repo cũ** sẽ cần:
   ```bash
   git fetch origin
   git reset --hard origin/Main
   ```
3. **Backup local** trước khi thực hiện
4. **Không thể hoàn tác** sau khi force push

## ⚡ Quick Action (Nếu chưa push lên GitHub):

Nếu commit `.env` chưa được push lên GitHub:
```bash
# Undo commit cuối cùng (giữ changes)
git reset --soft HEAD~1

# Hoặc undo và xóa luôn changes
git reset --hard HEAD~1
```

## 🎯 Kết luận:

File `.env` ĐÃ bị xóa khỏi working directory Git tracking, nhưng VẪN TỒN TẠI trong Git history.

**Cần thực hiện một trong 3 cách trên để xóa hoàn toàn khỏi history!**

Sau đó, ĐỔI TẤT CẢ credentials trong file .env cũ để đảm bảo an toàn.
