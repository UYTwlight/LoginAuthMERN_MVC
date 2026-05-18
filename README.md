# LoginAuthMERN_MVC - Camera Emotion Detection System

A system for detecting and analyzing emotions from camera using MERN Stack (MongoDB, Express, React, Node.js) and C++ OpenCV.

## 📋 System Requirements

- **Node.js**: >= 16.x
- **npm**: >= 8.x
- **MongoDB**: >= 5.x (or MongoDB Atlas)
- **Visual Studio 2019 or 2022**: Community/Professional/Enterprise
- **OpenCV**: 4.10.0 (already included in `Emotion-statistics/opencv/`)
- **Windows**: 10/11 (64-bit)

---

## 🛠️ Visual Studio Installation

### Step 1: Download Visual Studio
1. Go to: https://visualstudio.microsoft.com/downloads/
2. Download **Visual Studio 2022 Community** (free) or a higher edition

### Step 2: Install Workloads
During installation, select the following workloads:

✅ **Desktop development with C++**
   - MSVC v142 or v143 (C++ build tools)
   - Windows 10 SDK or Windows 11 SDK
   - C++ CMake tools for Windows
   - C++ ATL for latest build tools

### Step 3: Verify Installation
After installation is complete:
```powershell
# Check if cl.exe (C++ compiler) is in PATH
cl.exe
# If not found, build_main.bat will automatically locate Visual Studio
```

### Step 4: Build C++ Emotion Detection
```powershell
cd Emotion-statistics
.\build_main.bat
```

**The script will automatically:**
- Locate Visual Studio using `vswhere.exe`
- Load Developer Command Prompt
- Compile `main.cpp` with OpenCV
- Generate `main.exe`

---

## ⚙️ Environment Variables Configuration

### Backend `.env`

Create a `.env` file in the `Backend/` directory:

```env
# Database Configuration
MONGO_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority"

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT Secrets (Generate a complex random string)
ACCESS_SECRET=<your-access-secret-key-here>
REFRESH_SECRET=<your-refresh-secret-key-here>

# API Configuration
API_HOST=localhost
API_PORT=3001
```

**Instructions:**
1. **MONGO_URL**:
   - If using MongoDB Atlas: Get the connection string from the Atlas Dashboard
   - If using local MongoDB: `mongodb://localhost:27017/emotion-detection`

2. **JWT Secrets**:
   - Generate a strong random string (at least 32 characters)
   - You can use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

3. **PORT**: Backend port (default 3001)

4. **FRONTEND_URL**: Frontend URL for CORS configuration

### Frontend `.env`

Create a `.env` file in the `Frontend/` directory:

```env
# API Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

**Instructions:**
- `REACT_APP_API_URL`: Full URL of the Backend server
- `REACT_APP_API_BASE_URL`: Base URL for API endpoints

**Note**: All environment variables in React must start with `REACT_APP_`

---

## 📦 Installing Dependencies

### 1. Install Root Dependencies
```powershell
# From the root directory
npm install
```

### 2. Install Backend Dependencies
```powershell
cd Backend
npm install
```

**Main packages:**
- `express`: Web framework
- `mongoose`: MongoDB ODM
- `jsonwebtoken`: JWT authentication
- `bcryptjs`: Password hashing
- `cors`: CORS middleware
- `multer`: File upload
- `dotenv`: Environment variables

### 3. Install Frontend Dependencies
```powershell
cd Frontend
npm install
```

**Main packages:**
- `react`: UI library
- `react-router-dom`: Routing
- `axios`: HTTP client
- `recharts`: Data visualization
- `react-hook-form`: Form handling

### 4. Return to Root Directory
```powershell
cd ..
```

---

## 🚀 Running the Application

### Option 1: Run Everything at Once (Recommended)

```powershell
# From the root directory
.\start-all.bat
```

**The script will automatically:**
1. Start the Backend server (port 3001)
2. Start the Frontend development server (port 3000)
3. Open 2 separate terminal windows

**Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api

### Option 2: Run Each Service Individually

**Terminal 1 - Backend:**
```powershell
cd Backend
npm start
# Or: npm run dev (nodemon - auto restart)
```

**Terminal 2 - Frontend:**
```powershell
cd Frontend
npm start
```

### Stopping the Application

```powershell
# From the root directory
.\stop-all.bat
```

Or:
- Press `Ctrl + C` in each terminal
- Close the terminal windows

---

## 📁 Directory Structure

```
LoginAuthMERN_MVC/
├── Backend/
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, validation
│   │   ├── config/         # Database config
│   │   └── app.js          # Express app
│   ├── .env                # Backend environment variables
│   └── package.json
│
├── Frontend/
│   ├── src/
│   │   ├── Components/     # React components
│   │   │   ├── Auth/       # Login, Register
│   │   │   ├── Dashboard/  # Main dashboard
│   │   │   ├── Camera/     # Camera view
│   │   │   ├── Reports/    # Analytics reports
│   │   │   └── UserManagement/
│   │   ├── utils/          # API utilities
│   │   └── App.js
│   ├── .env                # Frontend environment variables
│   └── package.json
│
├── Emotion-statistics/
│   ├── main.cpp            # C++ emotion detection
│   ├── build_main.bat      # Build script
│   ├── run_main.bat        # Run script
│   ├── *.onnx              # AI models
│   ├── opencv/             # OpenCV library
│   └── face_logs/          # Detection results
│
├── start-all.bat           # Start all services
├── stop-all.bat            # Stop all services
└── package.json
```

---

## 🎯 Usage Workflow

### 1. Login
- Go to: http://localhost:3000
- Login with an account:
  - **Admin**: Manages the entire system
  - **User**: Can only view their own reports

### 2. Run Camera Detection
1. Go to **Camera Dashboard**
2. Select a camera or upload a file
3. Click **Start** to begin detection
4. The C++ app will:
   - Detect faces
   - Analyze emotions in real-time
   - Save data to MongoDB
   - Save logs to `Emotion-statistics/face_logs/`

### 3. View Reports
1. Go to **Overview Report**
2. Select the session to view
3. Analyze:
   - Pie chart: Emotion distribution
   - Bar chart: Face comparison
   - Line chart: Emotion timeline per frame

---

## 🔐 Permissions

### Admin
- ✅ View all reports (all users)
- ✅ Manage users
- ✅ Manage models
- ✅ Upload files for analysis
- ✅ Unlimited session duration

### User
- ✅ View their own reports
- ✅ Run camera detection
- ❌ Cannot view other users' reports
- ⏱️ Session timeout: 30 minutes of inactivity

---

## 🐛 Troubleshooting

### C++ Build Error
```
Error: Cannot find Visual Studio
```
**Solution:**
- Install Visual Studio 2019/2022 with the C++ workload
- The script will automatically find VS via `vswhere.exe`

### MongoDB Connection Error
```
MongoServerError: Authentication failed
```
**Solution:**
- Check `MONGO_URL` in `Backend/.env`
- Ensure username/password are correct
- If using Atlas: Whitelist your IP address

### Port Already In Use Error
```
Error: listen EADDRINUSE: address already in use :::3001
```
**Solution:**
```powershell
# Find the process using the port
netstat -ano | findstr :3001

# Kill the process (replace <PID> with the Process ID)
taskkill /PID <PID> /F
```

### Frontend Cannot Connect to Backend
```
Network Error
```
**Solution:**
- Verify the Backend is running: http://localhost:3001/api
- Check `REACT_APP_API_URL` in `Frontend/.env`
- Clear cache: restart Frontend with `npm start`

### C++ App Not Sending Data to API
**Solution:**
- Verify the Backend is running
- Check the C++ app's console log
- Check `API_HOST` and `API_PORT` in main.cpp

---

## 📝 Available Scripts

### Root Level
- `npm start`: Run both Backend and Frontend
- `.\start-all.bat`: Start all services (Windows)
- `.\stop-all.bat`: Stop all services (Windows)

### Backend
- `npm start`: Run in production mode
- `npm run dev`: Run in development mode (nodemon)

### Frontend
- `npm start`: Run development server
- `npm run build`: Build for production
- `npm test`: Run tests

### Emotion-statistics
- `.\build_main.bat`: Build the C++ app
- `.\run_main.bat`: Run the C++ app with the default model

---

## 🔄 Git Workflow

### Clone Repository
```bash
git clone https://github.com/UYTwlight/LoginAuthMERN_MVC.git
cd LoginAuthMERN_MVC
```

### Create a New Branch
```bash
git checkout -b feature/your-feature-name
```

### Commit Changes
```bash
git add .
git commit -m "Description of changes"
git push origin feature/your-feature-name
```

---

## 📞 Support

If you encounter any issues:
1. Check the **Troubleshooting** section above
2. Review logs in the console (Backend/Frontend/C++)
3. Create an issue on the GitHub repository

---


---

## 👥 Contributors

- **UYTwlight** - Initial work and maintenance
- **KienHCMUS** - Train model
- **ldhv-04** - run C++ code

---

**Last updated:** November 10, 2025
