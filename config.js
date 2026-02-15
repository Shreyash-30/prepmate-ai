/**
 * Root Environment Configuration Loader
 * Loads environment variables from central .env file at project root
 * Called by all services: backend, frontend (via build), ai-services
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load from root .env file
const rootEnvPath = path.join(__dirname, '.env');
const result = dotenv.config({ path: rootEnvPath });

if (result.error) {
  console.warn(`Warning: Could not load root .env file at ${rootEnvPath}`);
  console.warn('Falling back to process.env...');
}

// Export all loaded environment variables
export const env = {
  // Server Configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  BACKEND_PORT: parseInt(process.env.BACKEND_PORT || '5000', 10),
  BACKEND_HOST: process.env.BACKEND_HOST || '0.0.0.0',
  AI_SERVICE_PORT: parseInt(process.env.AI_SERVICE_PORT || '8000', 10),
  AI_SERVICE_HOST: process.env.AI_SERVICE_HOST || '0.0.0.0',

  // Database
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/prepmate-ai',

  // API Endpoints
  API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  AI_SERVICE_URL: process.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api',

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'change-this-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // AI/ML Services
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5000')
    .split(',')
    .map(origin => origin.trim()),

  // Feature Flags
  ENABLE_MOCK_API: process.env.VITE_ENABLE_MOCK_API === 'true',
  DEBUG_MODE: process.env.VITE_DEBUG_MODE === 'true',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
};

export default env;
