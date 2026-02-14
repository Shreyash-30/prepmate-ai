# Backend Quick Reference

## 🚀 Server Commands

```bash
# Development (hot reload)
npm run dev

# Production
npm start

# Test environment
npm run test
```

## 🔗 Base URLs

- **Local Development**: `http://localhost:5000`
- **API Base**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/health`

## 🔐 Authentication

### Get Token
```bash
# Register
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

# Login
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "password123"
}

# Response contains:
{
  "success": true,
  "message": "...",
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Use Token
```
Authorization: Bearer YOUR_TOKEN
```

## 📋 Available Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/auth/register | ❌ | Register user |
| POST | /api/auth/login | ❌ | Login user |
| GET | /api/auth/me | ✅ | Get current user |
| POST | /api/auth/logout | ✅ | Logout |
| GET | /api/users | ✅ | Get all users |
| GET | /api/users/:id | ✅ | Get user by ID |
| PUT | /api/users/:id | ✅ | Update user |
| DELETE | /api/users/:id | ✅ | Delete user |
| GET | /api/dashboard | ✅ | Get dashboard |
| GET | /api/dashboard/summary | ✅ | Dashboard summary |
| GET | /api/roadmap | ✅ | Get roadmaps |
| GET | /api/roadmap/:id | ✅ | Get roadmap details |
| POST | /api/roadmap | ✅ | Create roadmap |
| PUT | /api/roadmap/:id | ✅ | Update roadmap |
| GET | /api/tasks | ✅ | Get tasks |
| GET | /api/tasks/:id | ✅ | Get task details |
| POST | /api/tasks | ✅ | Create task |
| PUT | /api/tasks/:id | ✅ | Update task |
| GET | /api/analytics | ✅ | Get analytics |
| GET | /api/analytics/:metric | ✅ | Get metric |
| POST | /api/analytics/events | ✅ | Track event |
| GET | /api/practice | ✅ | Get sessions |
| GET | /api/practice/:id | ✅ | Get session |
| POST | /api/practice | ✅ | Create session |
| POST | /api/practice/:id/submit | ✅ | Submit answer |
| GET | /api/mentor/feedback | ✅ | Get feedback |
| GET | /api/mentor/feedback/:id | ✅ | Get feedback item |
| POST | /api/mentor/request | ✅ | Request help |
| GET | /api/mentor/chat/:id | ✅ | Get chat |

## 🗂️ Project Structure Quick Lookup

```
backend/src/
├── server.js              # Start here to understand flow
├── app.js                 # Express configuration
├── config/db.js           # Database setup
├── models/User.js         # User schema
├── controllers/           # Route logic
├── routes/                # API endpoints
├── middlewares/           # Auth, errors
└── utils/generateToken.js # JWT utility
```

## 🔧 Configuration

**Environment Variables (.env)**
```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/prepmate-ai
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
API_PREFIX=/api
```

## 🗄️ MongoDB Setup

### Local MongoDB
```bash
# Start MongoDB
mongod

# Connect
mongo
```

### MongoDB Atlas (Cloud)
1. Go to mongodb.com/cloud/atlas
2. Create cluster
3. Get connection string
4. Update MONGO_URI in .env

## 📝 Common Tasks

### Add New Route
1. Create controller in `src/controllers/`
2. Create route in `src/routes/`
3. Import in `src/routes/index.js`

### Add New Model
1. Create schema in `src/models/`
2. Import in controller
3. Use in business logic

### Add Middleware
1. Create in `src/middlewares/`
2. Import in app.js or specific routes
3. Use with `app.use()` or `router.use()`

## 🐛 Common Errors & Fixes

| Error | Solution |
|-------|----------|
| MongoDB ECONNREFUSED | Start MongoDB: `mongod` |
| Port 5000 already in use | Change PORT in .env |
| Token verification failed | Check JWT_SECRET in .env |
| CORS error from React | Verify CLIENT_URL in .env |
| Module not found | Run `npm install` |

## 📦 Dependencies

```json
{
  "express": "4.18.2",
  "mongoose": "7.5.0",
  "jsonwebtoken": "9.0.0",
  "bcryptjs": "2.4.3",
  "cors": "2.8.5",
  "helmet": "7.0.0",
  "morgan": "1.10.0",
  "dotenv": "16.0.3"
}
```

## 🧪 Testing with cURL

```bash
# Health check
curl http://localhost:5000/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'

# Protected endpoint (replace TOKEN)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## 🔐 Security Checklist

- [ ] Change JWT_SECRET
- [ ] MongoDB password set
- [ ] HTTPS in production
- [ ] Rate limiting added
- [ ] Input validation added
- [ ] CORS properly configured
- [ ] .env in .gitignore
- [ ] Error messages sanitized
- [ ] Dependencies up to date

## 📚 File Locations

| What | Where |
|------|-------|
| Server entry | src/server.js |
| Express app | src/app.js |
| Routes | src/routes/ |
| Controllers | src/controllers/ |
| Models | src/models/ |
| Auth logic | src/middlewares/authMiddleware.js |
| Error handling | src/middlewares/errorHandler.js |
| JWT logic | src/utils/generateToken.js |
| DB config | src/config/db.js |

## 🎯 Integration Checklist

Frontend developers:
- [ ] Clone backend
- [ ] npm install
- [ ] Configure .env
- [ ] Run npm run dev
- [ ] Test endpoints with cURL
- [ ] Set API_BASE_URL in React
- [ ] Add Authorization header
- [ ] Implement token storage
- [ ] Implement logout

## 📖 Full Documentation

For complete details, see:
- `README.md` - Full API reference
- `SETUP_GUIDE.md` - Detailed setup instructions
- `BACKEND_SETUP_SUMMARY.md` - Implementation summary

---

**Tip**: Use Postman for easier API testing instead of cURL
