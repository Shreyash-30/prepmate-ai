const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { asyncHandler, AppError } = require('../middlewares/errorHandler');

// Register user
const register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Validation
  if (!name || !email || !password) {
    return next(new AppError('Please provide name, email, and password', 400));
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new AppError('User with this email already exists', 409));
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Generate token
  const token = generateToken(user._id, user.email);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

// Login user
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  // Check if user exists and get password
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.log(`[AUTH] Login failed - User not found: ${email}`);
    return next(new AppError('Invalid email or password', 401));
  }

  console.log(`[AUTH] User found: ${email}`);

  // Check password
  const isPasswordMatch = await user.matchPassword(password);
  console.log(`[AUTH] Password match result: ${isPasswordMatch}`);
  
  if (!isPasswordMatch) {
    console.log(`[AUTH] Login failed - Password mismatch for: ${email}`);
    return next(new AppError('Invalid email or password', 401));
  }

  // Generate token
  const token = generateToken(user._id, user.email);

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

// Get current user
const getMe = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authenticated', 401));
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  res.status(200).json({
    success: true,
    data: {
      user: user.toJSON(),
    },
  });
});

// Logout (frontend should clear token)
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully. Please clear the token from client.',
  });
});

module.exports = {
  register,
  login,
  getMe,
  logout,
};
