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

REM Check for central .env file
if not exist ".env" (
  echo ⚠️  Central .env file not found!
  echo Creating .env from .env.example...
  if exist ".env.example" (
    copy ".env.example" ".env"
    echo ✅ Created .env from .env.example
    echo ⚠️  Please update .env with your configuration values
  ) else (
    echo ❌ .env.example not found! Cannot create .env
  )
) else (
  echo ✅ Central .env file exists
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
