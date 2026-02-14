@echo off
REM Quick Start Script for PrepMate AI - Phase 2B-3 Complete System
REM Windows Batch Version

setlocal enabledelayedexpansion

echo 🚀 PrepMate AI - Phase 2B-3 Quick Start
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
  echo ✅ Node.js !NODE_VERSION!
) else (
  echo ❌ Node.js not found
)

REM Check npm
echo Checking npm...
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
  echo ✅ npm !NPM_VERSION!
) else (
  echo ❌ npm not found
)

REM Check MongoDB
echo Checking MongoDB...
where mongosh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  echo ✅ MongoDB (CLI available)
) else (
  where mongo >nul 2>nul
  if %ERRORLEVEL% EQU 0 (
    echo ✅ MongoDB (mongo CLI available)
  ) else (
    echo ⚠️  MongoDB not found
  )
)

REM Check Redis
echo Checking Redis...
where redis-cli >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  redis-cli ping >nul 2>nul
  if %ERRORLEVEL% EQU 0 (
    echo ✅ Redis (Running)
  ) else (
    echo ⚠️  Redis (Installed but not running)
  )
) else (
  echo ⚠️  Redis not installed
)

echo.
echo 📂 Directory Structure:
echo   ✅ Backend:  backend\
echo   ✅ Frontend: frontend\
echo   ✅ AI:       ai-services\
echo.

REM Create .env if it doesn't exist
if not exist "backend\.env" (
  echo Creating backend\.env...
  (
    echo # MongoDB
    echo MONGODB_URI=mongodb://localhost:27017/prepmate
    echo.
    echo # JWT
    echo JWT_SECRET=your-secret-key-here-change-in-production
    echo JWT_EXPIRY=7d
    echo.
    echo # AI Services
    echo AI_SERVICES_URL=http://localhost:8000
    echo.
    echo # Redis
    echo REDIS_HOST=localhost
    echo REDIS_PORT=6379
    echo.
    echo # Platform APIs
    echo CODEFORCES_API=https://codeforces.com/api
    echo LEETCODE_API=https://leetcode.com/api
    echo HACKERRANK_API=https://www.hackerrank.com/rest
    echo GEEKSFORGEEKS_API=https://api.geeksforgeeks.org
    echo.
    echo # Sync Configuration
    echo DEFAULT_SYNC_INTERVAL=0 * * * *
    echo QUEUE_MAX_RETRIES=3
    echo QUEUE_INITIAL_DELAY=2000
    echo NODE_ENV=development
    echo PORT=5000
  ) > "backend\.env"
  echo ✅ Created backend\.env
) else (
  echo ✅ backend\.env already exists
)

echo.
echo 📚 Installing Dependencies...
echo.

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd backend
call npm install
cd ..

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo ✨ Setup complete!
echo.

echo 🎯 Next Steps:
echo.
echo 1️⃣  Start MongoDB:
echo    mongod --dbpath C:\data\db
echo.
echo 2️⃣  Start Redis:
echo    redis-server
echo.
echo 3️⃣  Start backend server:
echo    cd backend
echo    npm start
echo.
echo 4️⃣  In another terminal, start frontend:
echo    cd frontend
echo    npm run dev
echo.
echo 5️⃣  Start AI services:
echo    cd ai-services
echo    python main.py
echo.
echo 6️⃣  Run integration tests (port 5000 must be active):
echo    cd backend
echo    node test_integration.js
echo.

echo 📖 Documentation:
echo   • PHASE_2B3_INTEGRATION_GUIDE.md - API documentation
echo   • PHASE_2B3_COMPLETION_SUMMARY.md - What was built
echo.

echo 🚀 System Architecture:
echo.
echo ┌─ FRONTEND (React/Vite) ────────────────────────────────┐
echo │  • Integrations (connect platforms)                    │
echo │  • SyncDashboard (real-time sync status)              │
echo │  • PCIIndicator (problem completion progress)         │
echo │  • ContestPerformanceCharts (rating trends)           │
echo │  • RoadmapProgress (topic breakdown)                  │
echo └────────────────────────────────────────────────────────┘
echo                         ↓ HTTP
echo ┌─ BACKEND (Express/Node.js) ────────────────────────────┐
echo │  • Health Monitoring (9 endpoints)                     │
echo │  • AI Telemetry (7 endpoints)                          │
echo │  • Sync Queue (Bull + Redis)                           │
echo │  • Platform Services (CodeForces, LeetCode, etc)      │
echo └────────────────────────────────────────────────────────┘
echo                         ↓ TCP
echo ┌─ DATA LAYER ───────────────────────────────────────────┐
echo │  • MongoDB (4.6+) - Telemetry Data                     │
echo │  • Redis (6.0+) - Queue State                          │
echo └────────────────────────────────────────────────────────┘
echo.

echo ✅ All done! You're ready to start the system.
echo.
echo 📞 For detailed API documentation, see: PHASE_2B3_INTEGRATION_GUIDE.md
echo.

pause
