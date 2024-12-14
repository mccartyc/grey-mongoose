const jwt = require("jsonwebtoken");

/**
 * Generates an access token.
 */
exports.generateAccessToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION || "15m" }
  );
};

/**
 * Generates a refresh token.
 */
exports.generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || "7d" }
  );
};
