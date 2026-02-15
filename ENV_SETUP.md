# Environment Configuration Guide

## Overview

PrepMate AI uses a **single centralized `.env` file** at the project root as the source of truth for all environment variables across all services:
- **Backend** (Node.js) - Port 5000
- **Frontend** (Vite React) - Port 8080
- **AI Services** (Python FastAPI) - Port 8000

## Quick Start

### 1. Create Central `.env` File

```bash
# Copy the example to create your .env file
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` and update the values for your environment:

```bash
# Database
MONGO_URI=mongodb://localhost:27017/prepmate-ai

# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_AI_SERVICE_URL=http://localhost:8000/api

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# AI Services
GEMINI_API_KEY=your-gemini-api-key

# Environment
NODE_ENV=development
```

### 3. (Optional) Local Overrides

For local development, you can create optional local overrides:

**Backend:**
```bash
# backend/.env (optional, overrides root .env)
# Add backend-specific settings here
```

**Frontend:**
```bash
# frontend/.env.local (optional, overrides root .env)
# VITE_DEBUG_MODE=true
```

**AI Services:**
```bash
# ai-services/.env (optional, overrides root .env)
# Add AI service-specific settings here
```

## File Structure

```
prepmate-ai/
├── .env                    ← CENTRAL configuration (DO NOT COMMIT)
├── .env.example           ← Template for .env (commit this)
│
├── backend/
│   ├── .env               ← Optional local overrides
│   ├── .env.example       ← Documentation
│   └── src/server.js      ← Loads root .env
│
├── frontend/
│   ├── .env               ← Optional local overrides
│   ├── .env.local         ← Optional local development
│   ├── .env.example       ← Documentation
│   ├── vite.config.ts     ← Configured to load root .env
│   └── src/services/apiClient.ts ← Uses import.meta.env
│
└── ai-services/
    ├── .env               ← Optional local overrides
    ├── .env.example       ← Documentation
    ├── config.py          ← Loads root .env
    └── main.py            ← Uses config
```

## How It Works

### Backend (Node.js)
- Loads `.env` from project root first
- Then loads from `backend/.env` (if it exists), allowing overrides
- Uses `process.env` to access variables

**Code (backend/src/server.js):**
```javascript
const dotenv = require('dotenv');
const path = require('path');

// Load root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Load local .env (overrides root)
dotenv.config();
```

### Frontend (Vite)
- Loads `.env` from project root via vite.config.ts
- Then loads from `frontend/.env` and `frontend/.env.local` (if they exist)
- Uses `import.meta.env.VITE_*` for VITE_-prefixed variables

**Code (frontend/vite.config.ts):**
```typescript
import dotenv from "dotenv";

// Load root .env
dotenv.config({ path: path.join(__dirname, "../.env") });

// Load local .env files
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, ".env.local") });
```

### AI Services (Python)
- Loads `.env` from project root via python-dotenv
- Then loads from `ai-services/.env` (if it exists), allowing overrides
- Uses environment variables or Config class

**Code (ai-services/config.py):**
```python
from pathlib import Path
from dotenv import load_dotenv

# Load root .env
root_dir = Path(__file__).parent.parent
load_dotenv(dotenv_path=root_dir / '.env', override=True)

# Load local .env (overrides root)
load_dotenv(override=True)
```

## Environment Variables Reference

### Core Configuration

| Variable | Purpose | Example |
|----------|---------|---------|
| `NODE_ENV` | Environment mode | `development`, `staging`, `production` |
| `BACKEND_PORT` | Backend API port | `5000` |
| `AI_SERVICE_PORT` | AI service port | `8000` |

### Database

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGO_URI` | MongoDB connection | `mongodb://localhost:27017/prepmate-ai` |

### API Configuration

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api` |
| `VITE_AI_SERVICE_URL` | AI service URL | `http://localhost:8000/api` |

### Authentication

| Variable | Purpose | Example |
|----------|---------|---------|
| `JWT_SECRET` | JWT signing key | `your-secret-key-here` |
| `JWT_EXPIRES_IN` | Token expiration | `7d`, `24h` |

### AI Services

| Variable | Purpose | Example |
|----------|---------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `ALLOWED_ORIGINS` | CORS origins | `http://localhost:3000,http://localhost:5000` |

### Feature Flags

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_ENABLE_MOCK_API` | Mock API responses | `true`, `false` |
| `VITE_DEBUG_MODE` | Debug mode | `true`, `false` |

### Logging

| Variable | Purpose | Example |
|----------|---------|---------|
| `LOG_LEVEL` | Log level | `INFO`, `DEBUG`, `ERROR` |

## Important Notes

### 1. Never Commit `.env` to Version Control

The `.env` file should **never** be committed:

```bash
# .gitignore
.env
node_modules/
*.pyc
__pycache__/
```

### 2. Always Commit `.env.example`

The `.env.example` file serves as a template and **should** be committed:
- Developers can use it as a reference
- CI/CD pipelines can validate required variables
- New team members see what configuration is needed

### 3. Production Configuration

For production deployments:
1. Set environment variables directly in your deployment platform (AWS, Heroku, etc.)
2. Do NOT use `.env` files
3. Use encrypted secret management (AWS Secrets Manager, etc.)

### 4. Local Development

Each developer can have their own local overrides in:
- `backend/.env` (for backend-specific changes)
- `frontend/.env.local` (for frontend-specific changes)
- `ai-services/.env` (for AI service-specific changes)

These files override the central `.env` but should be documented in the subdirectory `.env.example` and `.gitignore`.

## Troubleshooting

### Variables Not Loading

**Problem:** Environment variables are not being read

**Solution:**
1. Verify `.env` file exists at project root: `ls .env`
2. Check for typos in variable names
3. Ensure `.env` is in `.gitignore`
4. Restart your services after changing `.env`

### Port Conflicts

**Problem:** "Port 5000 is already in use"

**Solution:**
1. Change the port in `.env`: `BACKEND_PORT=5001`
2. Kill the process using the port: `lsof -i :5000` (macOS/Linux)
3. Update any hardcoded references to match the new port

### Database Connection Errors

**Problem:** "Cannot connect to MongoDB"

**Solution:**
1. Verify MongoDB is running: `mongosh`
2. Check `MONGO_URI` in `.env`: `echo $MONGO_URI`
3. Test connection: `mongosh "$MONGO_URI"`

### API URL Mismatches

**Problem:** Frontend cannot connect to backend

**Solution:**
1. Verify `VITE_API_BASE_URL` in `.env` matches your backend URL
2. Check that backend is running on the specified `BACKEND_PORT`
3. Verify CORS is properly configured: `ALLOWED_ORIGINS`

## Migration from Old Setup

If you're migrating from individual `.env` files:

1. **Gather all variables** from old `.env` files in each subdirectory
2. **Consolidate** into central `.env` at project root
3. **Update** code to load from root (already done in latest version)
4. **Backup** old `.env` files before deletion
5. **Test** that all services can still access their configuration
6. **Delete** old subdirectory `.env` files (keep `.env.example` only)

## References

- [Node.js dotenv Package](https://www.npmjs.com/package/dotenv)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Python python-dotenv](https://github.com/theskumar/python-dotenv)
- [MongoDB Connection String](https://docs.mongodb.com/manual/reference/connection-string/)
