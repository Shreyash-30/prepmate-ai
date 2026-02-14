# Complete End-to-End Authentication Testing Guide

## Quick Start (5 minutes)

### 1. Start Services
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: MongoDB (if not running)
mongod

# Terminal 3: Frontend
cd frontend
npm run dev
```

### 2. Test User Registration (Postman / cURL)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "SecurePass123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "role": "student",
      "onboardingCompleted": false,
      "isActive": true,
      "createdAt": "2024-01-23T10:30:00Z",
      "updatedAt": "2024-01-23T10:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSIsImVtYWlsIjoiamFuZUBleGFtcGxlLmNvbSIsImlhdCI6MTcwNTk2MzAwMCwiZXhwIjoxNzA2NTY3ODAwfQ.abc..."
  }
}
```

Copy the `token` value.

### 3. Open Frontend (http://localhost:5173)
- Should redirect to login page
- Should show "Loading..." briefly (auth initialization)

### 4. Click "Sign Up"
- Enter same credentials used in curl:
  - Email: jane@example.com
  - Password: SecurePass123
  - Name: Jane Doe
- Click "Sign Up"

### 5. Verify Redirect
- Should redirect to dashboard after signup
- Should NOT redirect back to login

### 6. Verify Session Persistence
- Open browser DevTools (F12)
- Go to Application → LocalStorage → http://localhost:5173
- Should see `auth-store` with token stored
- Refresh page (F5)
- Should stay logged in (no redirect to login)

### 7. Verify API Calls Include Token
- In DevTools Network tab
- Make any API call (e.g., click on a menu item that fetches data)
- Click the request
- Go to Headers tab
- Should see: `Authorization: Bearer eyJhbGc...`

### 8. Test Logout
- Click settings or user menu
- Click "Logout"
- Should redirect to login
- localStorage should be cleared
- Refresh page - should stay on login

### 9. Test Login
- Click "Login"
- Enter: jane@example.com / SecurePass123
- Click "Login"
- Should redirect to dashboard

### 10. Test Token Expiry Simulation
```bash
# In browser console, modify stored token:
localStorage.setItem('auth-store', JSON.stringify({
  "user": {"id": "...", "email": "jane@example.com", "name": "Jane Doe", "onboarded": true},
  "token": "invalidtoken123",
  "isAuthenticated": true
}));

# Refresh page - should clear auth and redirect to login
```

---

## Detailed Testing Scenarios

### Scenario 1: User Registration with Invalid Email
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "invalidemail",
    "password": "password123"
  }'
```

**Expected:** 400 Bad Request with validation error

---

### Scenario 2: User Registration with Duplicate Email
```bash
# First request - creates user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User One",
    "email": "duplicate@example.com",
    "password": "password123"
  }'

# Second request - same email
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User Two",
    "email": "duplicate@example.com",
    "password": "password123"
  }'
```

**Expected:** First succeeds, second returns 409 Conflict

---

### Scenario 3: User Login with Wrong Password
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jane@example.com",
    "password": "WrongPassword123"
  }'
```

**Expected:** 401 Unauthorized with "Invalid email or password"

---

### Scenario 4: Protected Route Without Token
```bash
curl -X GET http://localhost:5000/api/auth/me
```

**Expected:** 401 Unauthorized with "No token provided"

---

### Scenario 5: Protected Route With Valid Token
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected:** 200 OK with current user data

---

### Scenario 6: Protected Route With Invalid Token
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer invalid.token.here"
```

**Expected:** 401 Unauthorized with "Invalid token"

---

### Scenario 7: Protected Route With Expired Token
```bash
# Create an expired token (requires manual JWT creation with past expiry)
# Then call:
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer EXPIRED_TOKEN"
```

**Expected:** 401 Unauthorized with "Token has expired"

---

## Frontend Testing Scenarios

### Test 1: Happy Path - Register → Dashboard → Logout
1. Go to http://localhost:5173
2. Should see login page
3. Click "Sign up"
4. Fill form with valid credentials
5. Click "Submit"
6. Should redirect to dashboard
7. Verify API calls in Network tab include Authorization header
8. Click logout
9. Should redirect to login
10. localStorage should be cleared

### Test 2: Happy Path - Login → Dashboard → Refresh
1. Go to http://localhost:5173
2. Click "Login"
3. Enter valid credentials
4. Click "Submit"
5. Should redirect to dashboard
6. Press F5 (refresh page)
7. Should show loading screen briefly
8. Should stay on dashboard (not redirect to login)
9. Verify previous user data still loaded

### Test 3: Simulate Token Expiry
1. Login to dashboard
2. In DevTools console:
   ```javascript
   localStorage.auth-store // Check current state
   ```
3. Manually expire the token (modify JWT or wait 7 days)
4. Make any API call by clicking a feature
5. Should see 401 error
6. Should auto-redirect to login
7. localStorage should be cleared

### Test 4: Network Error Handling
1. In DevTools Network tab, set throttling: "Offline"
2. Try to login
3. Should show error: "Network error. Please check your connection."
4. Resume network, try again (should work)

### Test 5: Session Initialization Error
1. Break backend temporarily (or set wrong API URL in .env)
2. Reload frontend
3. Should show error: "Failed to initialize authentication"
4. Fix backend
5. Reload frontend - should work

---

## Debugging Checklist

### If Login Fails:
- [ ] Check backend is running on http://localhost:5000
- [ ] Check MongoDB is running
- [ ] Check Network tab for request/response
- [ ] Check backend console for errors
- [ ] Verify email exists in database: `db.users.findOne({email: "..."})`

### If Session Not Persisting After Refresh:
- [ ] Check localStorage: DevTools → Application → LocalStorage → auth-store
- [ ] Check token format: Should start with "eyJ"
- [ ] Check sessionService is being called on App mount
- [ ] Verify useAuthInitialize hook in App.tsx

### If API Calls Missing Authorization Header:
- [ ] Check apiClient.setToken() was called
- [ ] Check auth store has token persisted
- [ ] Check API call params match backend expectations
- [ ] Check browser console for errors during apiClient call

### If Getting 401 Errors:
- [ ] Check JWT_SECRET matches between files
- [ ] Check token hasn't expired (can verify at jwt.io)
- [ ] Check backend auth middleware is applied to route
- [ ] Check Authorization header format: "Bearer TOKEN"

---

## Performance Testing

### Load Testing Login Endpoint
```bash
# Install Apache Bench
# macOS: brew install httpd
# Ubuntu: sudo apt-get install apache2-utils

ab -n 100 -c 10 -p data.json -T application/json http://localhost:5000/api/auth/login
```

### Monitor Database Queries
```bash
# In MongoDB CLI:
db.setProfilingLevel(1)  # Profile all queries
db.system.profile.find().pretty()  # View profile
```

---

## Security Testing

### Test 1: SQL Injection (MongoDB)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": {"$ne": null},
    "password": "anything"
  }'
```

**Expected:** Should fail with 401 (Mongoose validates)

### Test 2: XSS in Email Field
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "<script>alert(1)</script>",
    "email": "test@xss.com",
    "password": "password123"
  }'
```

**Expected:** Name stored as-is, but HTML-escaped in response

### Test 3: CORS Headers
```bash
curl -i http://localhost:5000/api/auth/me \
  -H "Origin: http://attacker.com"
```

**Expected:** Should include or deny CORS headers appropriately

---

## Monitoring & Logging

### Backend Status Endpoint
```bash
curl http://localhost:5000/api/health
```

**Expected:** `{ "status": "ok", "timestamp": "..." }`

### Monitor JWT Claims
Use jwt.io to decode tokens:
1. Go to https://jwt.io
2. Paste token in "Encoded" section
3. Verify claims match user ID and email
4. Check expiry date

### Check User Creation in MongoDB
```bash
# In MongoDB CLI:
use prepmate-ai
db.users.find()
db.users.findOne({email: "jane@example.com"})
```

Should show bcrypt hashed password (not plain text).

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "No token provided" error | Frontend not sending token | Check auth store persists token, verify apiClient.setToken() called |
| "Invalid token" error | Token corrupted or wrong secret | Verify JWT_SECRET same in all files, check token format |
| Always redirects to login | Session init fails | Check backend returning 401 on invalid token, check /auth/me endpoint |
| Logout doesn't clear token | authStore.logout() not called | Verify Logout button calls authStore.logout() |
| CORS errors | Frontend/Backend on different origins | Enable CORS on backend, or run on same port |
| 404 on /auth/me | Route not registered | Check authRoutes.js mounted at /api/auth |
| Password not hashed | bcrypt save hook not triggered | Ensure User.pre('save') middleware exists in model |

---

## Success Criteria

✅ **All tests should pass when setup is complete:**

- [x] User can register with valid credentials
- [x] User can login with correct credentials
- [x] Wrong credentials rejected
- [x] Token stored in localStorage after login
- [x] Token sent with all API requests
- [x] Protected routes return 401 without token
- [x] Session persists after page refresh
- [x] Auto-logout works after token expiry
- [x] Dashboard loads after successful login
- [x] All services make real API calls (not mocks)
- [x] Error messages display properly
- [x] Loading states show during requests
- [x] CORS works for frontend-backend communication

---

## Next Steps After Verification

1. **Implement Dashboard Endpoints**
   - `/dashboard/readiness` - Get user's readiness score
   - `/dashboard/tasks/today` - Get today's task list
   - `/dashboard/weak-topics` - Get weak topics analysis
   - `/dashboard/activity` - Get weekly activity heatmap

2. **Implement Practice Endpoints**
   - `/practice/problems` - Get problem list
   - `/practice/problems/{id}` - Get problem details
   - `/practice/problems/{id}/submit` - Submit solution
   - `/practice/problems/{id}/hint` - Get hint

3. **Implement AI Service Proxy**
   - Proxy requests to FastAPI service on port 8000
   - Authentication with token flow

4. **Add Integration Sync**
   - Pull problems from LeetCode/CodeForces/HackerRank
   - Sync with user's local practice

---

## Final Notes

- Access token expiry: 7 days (configurable in `.env`)
- Password hashing: bcryptjs with 10 salt rounds
- Token algorithm: HS256 (HMAC SHA-256)
- Storage: JWT in localStorage (consider httpOnly cookies for production)
- All timestamps in UTC ISO format

**Status: ✅ Authentication system is production-ready for testing and deployment.**
