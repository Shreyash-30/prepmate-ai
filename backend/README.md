# PrepMate AI - Backend Server

Production-ready backend for the AI Interview Preparation Platform built with Node.js, Express.js, and MongoDB.

## Features

- ✅ Express.js REST API server
- ✅ MongoDB with Mongoose ORM
- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ Security middleware (Helmet, CORS)
- ✅ Request logging (Morgan)
- ✅ Comprehensive error handling
- ✅ Environment-based configuration
- ✅ Modular, scalable architecture

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   └── authController.js  # Auth logic
│   ├── routes/
│   │   ├── authRoutes.js      # Auth routes
│   │   ├── usersRoutes.js     # User routes
│   │   ├── dashboardRoutes.js # Dashboard routes
│   │   └── ...                # Other routes
│   ├── models/
│   │   └── User.js            # User schema
│   ├── middlewares/
│   │   ├── authMiddleware.js  # JWT verification
│   │   └── errorHandler.js    # Error handling
│   ├── utils/
│   │   └── generateToken.js   # JWT generation
│   ├── services/              # Business logic (future)
│   ├── app.js                 # Express app configuration
│   └── server.js              # Server entry point
├── package.json
├── .env.example
└── .gitignore
```

## Prerequisites

- Node.js (14.x or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd prepmate-ai/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env file**
   ```
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/prepmate-ai
   JWT_SECRET=your_super_secret_key_change_in_production
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

## Running the Server

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000` by default.

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/logout` - Logout (requires auth)

### Base Routes (Ready for Implementation)
- `/api/users` - User management
- `/api/dashboard` - Dashboard data
- `/api/roadmap` - Learning roadmap
- `/api/tasks` - Task management
- `/api/analytics` - User analytics
- `/api/practice` - Practice sessions
- `/api/mentor` - Mentor assistance

## Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Getting a Token
1. Register or login to get a token
2. Include token in request headers:
   ```
   Authorization: Bearer <your_token_here>
   ```

### Example Login Request
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## Middleware Stack

- **Helmet**: Security headers
- **CORS**: Cross-Origin requests from frontend
- **Morgan**: HTTP request logging
- **Express JSON**: Request body parsing
- **Custom Auth**: JWT verification
- **Error Handler**: Centralized error handling

## Error Handling

The API follows a consistent error response format:

```json
{
  "success": false,
  "message": "Error description",
  "stack": "Error stack (development only)"
}
```

## Database Models

### User Model
- `name` - User full name
- `email` - Unique email address
- `password` - Hashed password
- `role` - User role (user/admin)
- `isEmailVerified` - Email verification status
- `lastLogin` - Last login timestamp
- `timestamps` - createdAt, updatedAt

## Security Features

- ✅ Password hashing with bcryptjs (salt rounds: 10)
- ✅ JWT token expiration (default: 7 days)
- ✅ CORS protection
- ✅ Helmet security headers
- ✅ Input validation
- ✅ Error message sanitization
- ✅ Environment-based secrets

## Frontend Integration

The backend is configured to work with the React frontend:

- **Frontend URL**: `http://localhost:5173`
- **API Prefix**: `/api`
- **CORS**: Enabled for development

### Connecting Frontend

In your React frontend's `apiClient`:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';

// Include token in requests
headers: {
  'Authorization': `Bearer ${token}`
}
```

## Future Implementation

The following endpoints are prepared but need business logic:

- User profile and settings management
- Dashboard statistics and insights
- Learning roadmap creation and tracking
- Task management system
- Practice session recording
- Analytics tracking
- AI mentor feedback system

## Development Tips

1. **Use nodemon**: Automatically restarts server on file changes
2. **Check logs**: Morgan provides detailed request logs
3. **Environment variables**: Always use `.env` for sensitive data
4. **Test endpoints**: Use Postman or curl for testing
5. **Error messages**: Check console for detailed error information

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests (placeholder)

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env`
- Verify connection string format

### JWT Errors
- Ensure `JWT_SECRET` is set in `.env`
- Check token format in Authorization header
- Verify token hasn't expired

### CORS Errors
- Verify `CLIENT_URL` matches your frontend URL
- Check that CORS headers are being sent
- Ensure credentials: true if needed

## License

MIT

## Support

For issues or questions, refer to the main project README.
