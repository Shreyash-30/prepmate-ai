#!/bin/bash
# Quick Start Script for PrepMate AI - Phase 2B-3 Complete System

set -e

echo "🚀 PrepMate AI - Phase 2B-3 Quick Start"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Track if all checks pass
ALL_CHECKS_PASSED=true

# Check 1: Node.js
echo -n "📦 Checking Node.js... "
if command -v node &> /dev/null; then
  NODE_VERSION=$(node -v)
  echo -e "${GREEN}OK${NC} ($NODE_VERSION)"
else
  echo -e "${RED}MISSING${NC}"
  ALL_CHECKS_PASSED=false
fi

# Check 2: npm
echo -n "📦 Checking npm... "
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm -v)
  echo -e "${GREEN}OK${NC} ($NPM_VERSION)"
else
  echo -e "${RED}MISSING${NC}"
  ALL_CHECKS_PASSED=false
fi

# Check 3: MongoDB
echo -n "🗄️  Checking MongoDB connection... "
if command -v mongosh &> /dev/null || command -v mongo &> /dev/null; then
  echo -e "${GREEN}OK${NC} (CLI available)"
else
  echo -e "${YELLOW}WARNING${NC} (CLI not found, skipping)"
fi

# Check 4: Redis
echo -n "⚙️  Checking Redis... "
if command -v redis-cli &> /dev/null; then
  REDIS_STATUS=$(redis-cli ping 2>/dev/null || echo "DISCONNECTED")
  if [ "$REDIS_STATUS" = "PONG" ]; then
    echo -e "${GREEN}OK${NC} (Running)"
  else
    echo -e "${YELLOW}INSTALLED${NC} (Not running)"
  fi
else
  echo -e "${YELLOW}NOT INSTALLED${NC}"
fi

echo ""
echo "📂 Directory Structure:"
echo "  ✅ Backend:  backend/"
echo "  ✅ Frontend: frontend/"
echo "  ✅ AI:       ai-services/"
echo ""

echo "🔧 Setting up environment..."
echo ""

# Check for central .env file
if [ ! -f ".env" ]; then
  echo -n "Central .env file not found! Creating from .env.example... "
  if [ -f ".env.example" ]; then
    cp .env.example .env
    echo -e "${GREEN}Done${NC}"
    echo "⚠️  Please update .env with your configuration values"
  else
    echo -e "${RED}Failed${NC}"
    echo ".env.example not found! Cannot create .env"
  fi
else
  echo -e "✅ Central .env file exists"
fi

echo ""
echo "📚 Installing Dependencies..."
echo ""

# Install backend dependencies
echo "📦 Backend dependencies..."
cd backend
npm install --silent 2>/dev/null || {
  echo -e "${YELLOW}Note: Some packages may require installation${NC}"
  npm install
}
cd ..

# Install frontend dependencies
echo "📦 Frontend dependencies..."
cd frontend
npm install --silent 2>/dev/null || {
  echo -e "${YELLOW}Note: Some packages may require installation${NC}"
  npm install
}
cd ..

echo ""
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""

echo "🎯 Next Steps:"
echo ""
echo "1️⃣  Make sure MongoDB is running:"
echo "   mongod --dbpath /path/to/data"
echo ""
echo "2️⃣  Make sure Redis is running:"
echo "   redis-server"
echo ""
echo "3️⃣  Start the backend server:"
echo "   cd backend && npm start"
echo ""
echo "4️⃣  In another terminal, start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "5️⃣  Start the AI services:"
echo "   cd ai-services && python main.py"
echo ""
echo "6️⃣  Run integration tests (port 5000 must be active):"
echo "   cd backend && node test_integration.js"
echo ""

echo "📖 Documentation Files:"
echo "  • PHASE_2B3_INTEGRATION_GUIDE.md - Complete API documentation"
echo "  • PHASE_2B3_COMPLETION_SUMMARY.md - What was built"
echo "  • README.md - Original project docs"
echo ""

echo "🚀 System Architecture Overview:"
echo ""
echo "┌─ FRONTEND (React/Vite) ────────────────────────────────┐"
echo "│  • Integrations (connect platforms)                    │"
echo "│  • SyncDashboard (real-time sync status)              │"
echo "│  • PCIIndicator (problem completion progress)         │"
echo "│  • ContestPerformanceCharts (rating trends)           │"
echo "│  • RoadmapProgress (topic breakdown)                  │"
echo "└────────────────────────────────────────────────────────┘"
echo "                        ↓ HTTP"
echo "┌─ BACKEND (Express/Node.js) ────────────────────────────┐"
echo "│  • Health Monitoring (9 endpoints)                     │"
echo "│  • AI Telemetry (7 endpoints)                          │"
echo "│  • Sync Queue (Bull + Redis)                           │"
echo "│  • Platform Services (CodeForces, LeetCode, etc)      │"
echo "└────────────────────────────────────────────────────────┘"
echo "                        ↓ TCP"
echo "┌─ DATA LAYER ───────────────────────────────────────────┐"
echo "│  • MongoDB (4.6+) - Telemetry Data                     │"
echo "│  • Redis (6.0+) - Queue State                          │"
echo "└────────────────────────────────────────────────────────┘"
echo ""

echo "🧪 Quick Test Without Full Setup:"
echo "  npm run test:integration  (in backend directory)"
echo ""

echo "📊 Key APIs to Test:"
echo "  GET    /api/health/status         - Health check (public)"
echo "  GET    /api/health/system         - System metrics"
echo "  GET    /api/health/user           - User metrics"
echo "  GET    /api/integrations/status   - Integration status"
echo "  GET    /api/ai/insights/:userId   - AI insights"
echo ""

if [ "$ALL_CHECKS_PASSED" = false ]; then
  echo -e "${YELLOW}⚠️  Some checks did not pass. Please verify setup.${NC}"
else
  echo -e "${GREEN}✅ All prerequisites found!${NC}"
fi

echo ""
echo "📞 For detailed API documentation, see: PHASE_2B3_INTEGRATION_GUIDE.md"
echo ""
