/**
 * Error Utility Functions
 * Safe error conversion and handling
 */

/**
 * Convert any error type to a user-friendly string message
 */
export function getErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (!error) {
    return 'An unknown error occurred';
  }

  // Handle error objects with message property
  if (error.message) {
    return typeof error.message === 'string' ? error.message : JSON.stringify(error.message);
  }

  // Handle API response error objects
  if (error.error) {
    return typeof error.error === 'string' ? error.error : JSON.stringify(error.error);
  }

  // Handle plain objects - try to extract any messageish field
  if (typeof error === 'object') {
    const errorStr = error.toString ? error.toString() : JSON.stringify(error);
    // Clean up [object Object] strings
    if (errorStr === '[object Object]') {
      return 'An unknown error occurred';
    }
    return errorStr;
  }

  return String(error);
}

/**
 * Safely serialize any value for logging
 */
export function serializeError(error: any): Record<string, any> {
  if (typeof error === 'string') {
    return { message: error };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return error;
  }

  return { message: String(error) };
}
