const jwt = require('jsonwebtoken');

const generateToken = (userId, email) => {
  const payload = {
    id: userId,
    email: email,
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };

  try {
    const token = jwt.sign(payload, process.env.JWT_SECRET, options);
    return token;
  } catch (error) {
    throw new Error(`Token generation failed: ${error.message}`);
  }
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
