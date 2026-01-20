import crypto from 'crypto';

/**
 * Generate a secure random token
 * @param {Number} length - Length of the token in bytes (default: 32)
 * @returns {String} Hexadecimal token string
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate email verification token with expiry
 * @returns {Object} Object containing token and expiry time
 */
export const generateVerificationToken = () => {
  const token = generateSecureToken();
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  return { token, expiry };
};

/**
 * Generate password reset token with expiry
 * @returns {Object} Object containing token and expiry time
 */
export const generateResetToken = () => {
  const token = generateSecureToken();
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  return { token, expiry };
};

/**
 * Hash a string using SHA-256
 * @param {String} string - String to hash
 * @returns {String} Hashed string
 */
export const hashString = (string) => {
  return crypto.createHash('sha256').update(string).digest('hex');
};
