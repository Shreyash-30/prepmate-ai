# Backend Setup Guide - PrepMate AI

This guide will help you get the backend server up and running and integrate it with your React frontend.

## Quick Start

### Prerequisites
- Node.js (v14 or higher) installed
- MongoDB running locally or MongoDB Atlas account
- npm installed

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

All required packages are already listed in `package.json`:
- express
- mongoose
- cors
- dotenv
- jsonwebtoken
- bcryptjs
- helmet
- morgan
- nodemon (dev)

### Step 2: Configure Environment Variables

The `.env.example` file is already in the backend folder. Create your `.env` file:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/prepmate-ai
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/prepmate-ai?retryWrites=true&w=majority

# JWT
JWT_SECRET=change_this_to_a_strong_secret_key
JWT_EXPIRES_IN=7d

# Frontend  
CLIENT_URL=http://localhost:5173
```

### Step 3: Start the Server

**Development mode** (with hot reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm start
```

You should see:
```
🚀 Server running in development mode on port 5000
📍 Frontend URL: http://localhost:5173
✅ MongoDB Connected: localhost
```

## API Testing

### Health Check
```bash
curl http://localhost:5000/health
```

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get Current User (Protected)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Project Architecture

### Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection setup
│   ├── controllers/
│   │   └── authController.js  # Authentication logic
│   ├── routes/
│   │   ├── index.js           # Main route aggregator
│   │   ├── authRoutes.js      # /api/auth
│   │   ├── usersRoutes.js     # /api/users
│   │   ├── dashboardRoutes.js # /api/dashboard
│   │   ├── roadmapRoutes.js   # /api/roadmap
│   │   ├── tasksRoutes.js     # /api/tasks
│   │   ├── analyticsRoutes.js # /api/analytics
│   │   ├── practiceRoutes.js  # /api/practice
│   │   └── mentorRoutes.js    # /api/mentor
│   ├── models/
│   │   └── User.js            # Mongoose User schema
│   ├── middlewares/
│   │   ├── authMiddleware.js  # JWT verification
│   │   └── errorHandler.js    # Error handling & async wrapper
│   ├── utils/
│   │   └── generateToken.js   # JWT token generation & verification
│   ├── services/              # Business logic (future implementation)
│   ├── app.js                 # Express app configuration
│   └── server.js              # Server entry point
├── package.json
├── .env.example
├── .env                       # Your actual configuration
└── README.md
```

## Middleware Stack

The server includes these middlewares (in order):

1. **Helmet** - Security headers
2. **CORS** - Enable cross-origin requests from frontend
3. **JSON Parser** - Parse incoming JSON requests
4. **Morgan** - HTTP request logging
5. **Custom Auth** - JWT verification for protected routes
6. **Error Handler** - Centralized error handling

## Database Setup

### Using Local MongoDB

1. Install MongoDB Community Edition
2. Start MongoDB service:
   ```bash
   # Windows
   mongod
   
   # macOS (via Homebrew)
   brew services start mongodb-community
   
   # Linux (via apt)
   sudo systemctl start mongod
   ```

3. MongoDB will be available at `mongodb://localhost:27017`

### Using MongoDB Atlas (Cloud)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account and cluster
3. Get your connection string
4. Update `.env`:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/prepmate-ai
   ```

## Frontend Integration

### Install Client-Side

In your React frontend (`frontend/` directory), update your API client:

```typescript
// frontend/src/services/apiClient.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### Usage in Frontend

```typescript
// Registration
const response = await apiClient.post('/auth/register', {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
});
localStorage.setItem('token', response.data.data.token);

// Login
const loginResponse = await apiClient.post('/auth/login', {
  email: 'john@example.com',
  password: 'password123',
});
localStorage.setItem('token', loginResponse.data.data.token);

// Get current user
const userResponse = await apiClient.get('/auth/me');
console.log(userResponse.data.data.user);
```

## Available Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (auth required)
- `POST /api/auth/logout` - Logout (auth required)

### Users (Placeholder)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Dashboard (Placeholder)
- `GET /api/dashboard` - Get dashboard data
- `GET /api/dashboard/summary` - Get dashboard summary

### Roadmap (Placeholder)
- `GET /api/roadmap` - Get all roadmaps
- `GET /api/roadmap/:id` - Get roadmap details
- `POST /api/roadmap` - Create roadmap
- `PUT /api/roadmap/:id` - Update roadmap

### Tasks (Placeholder)
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task details  
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task

### Analytics (Placeholder)
- `GET /api/analytics` - Get analytics data
- `GET /api/analytics/:metric` - Get specific metric
- `POST /api/analytics/events` - Track event

### Practice (Placeholder)
- `GET /api/practice` - Get practice sessions
- `GET /api/practice/:id` - Get session details
- `POST /api/practice` - Create session
- `POST /api/practice/:id/submit` - Submit answer

### Mentor (Placeholder)
- `GET /api/mentor/feedback` - Get feedback
- `GET /api/mentor/feedback/:id` - Get specific feedback
- `POST /api/mentor/request` - Request assistance
- `GET /api/mentor/chat/:id` - Get mentor chat

## Authentication Flow

### JWT Token Structure

The JWT token contains:
- User ID
- Email
- Expiration time (default: 7 days)

### Security Features

1. **Password Hashing** - Bcryptjs with 10 salt rounds
2. **JWT Expiration** - Tokens expire based on JWT_EXPIRES_IN
3. **CORS Protection** - Only accepts requests from configured frontend URL
4. **Helmet Headers** - Security headers on all responses
5. **Input Validation** - Basic validation on all endpoints
6. **Error Sanitization** - Sensitive errors not exposed in production

## Development Guidelines

### Adding New Routes

1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Register route in `src/routes/index.js`
4. Use `asyncHandler` for error handling

Example:
```javascript
// src/routes/newRoutes.js
const express = require('express');
const { newController } = require('../controllers/newController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../middlewares/errorHandler');

const router = express.Router();
router.post('/', authMiddleware, asyncHandler(newController));
module.exports = router;
```

### Error Handling

Use `AppError` for consistent error responses:

```javascript
const { AppError } = require('../middlewares/errorHandler');

if (!resource) {
  return next(new AppError('Resource not found', 404));
}
```

### Async Operations

Always wrap async route handlers with `asyncHandler`:

```javascript
const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});
```

## Troubleshooting

### MongoDB Connection Error
```
❌ MongoDB Connection Error: connect ECONNREFUSED
```

**Solution:** Ensure MongoDB is running:
```bash
# Check if MongoDB is running
mongo  # or mongosh

# If not running, start it:
mongod
```

### Port Already In Use
```
Error: EADDRINUSE: address already in use :::5000
```

**Solution:** Change port in `.env`:
```env
PORT=5001
```

### JWT Errors
- **Token verification failed**: Check JWT_SECRET in `.env`
- **Token has expired**: Token needs to be refreshed (implement refresh token logic)
- **Invalid token format**: Token must be sent as `Bearer <token>`

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:** Verify `CLIENT_URL` in `.env` matches your frontend URL:
```env
CLIENT_URL=http://localhost:5173
```

## Performance Considerations

1. **Mongoose Indexes** - Add appropriate indexes to frequently queried fields
2. **Connection Pooling** - Mongoose handles this automatically
3. **Caching** - Consider implementing caching for frequently accessed data
4. **Pagination** - Implement for list endpoints as data grows
5. **Rate Limiting** - Add rate limiting for production

## Security Checklist

- [ ] Change `JWT_SECRET` in `.env` to a strong random string
- [ ] Keep `.env` file in `.gitignore`
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add input validation/sanitization
- [ ] Implement refresh tokens
- [ ] Add password reset functionality
- [ ] Implement email verification
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Keep dependencies updated

## Next Steps

1. **Run the server**: `npm run dev`
2. **Test endpoints**: Use the curl commands above
3. **Connect frontend**: Update your React API client
4. **Implement features**: Replace placeholder routes with actual business logic
5. **Add tests**: Create test suites for routes and controllers
6. **Deploy**: Deploy to production (Heroku, AWS, Azure, etc.)

## Running Both Frontend and Backend

### Terminal 1 (Backend)
```bash
cd backend
npm run dev
```

### Terminal 2 (Frontend)
```bash
cd frontend
npm run dev
# or
bun run dev
```

Your stack will be:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API: http://localhost:5000/api

## Support

For detailed API documentation, see [README.md](./README.md)

For frontend integration, check the frontend's API client setup.
