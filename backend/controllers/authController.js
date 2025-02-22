// File: backend/controllers/authControllers.js
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const { generateTempCode, sendEmailMFA, sendSMSMFA } = require('./mfaController');

// Generate Tokens
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { id: user._id, tenantId: user.tenantId, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRATION }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
  );

  return { accessToken, refreshToken };
};

// Login User
exports.login = async (req, res) => {
  const { email, password, mfaCode, isBackupCode } = req.body;

  try {
    const user = await User.findOne({ email }).select('+email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // If MFA is enabled, handle MFA verification
    if (user.mfaEnabled) {
      if (!mfaCode) {
        // If using authenticator app, no need to generate code
        if (user.mfaMethod === 'authenticator') {
          return res.status(200).json({
            requireMFA: true,
            message: 'Please enter the code from your authenticator app',
            method: 'authenticator'
          });
        }

        // For email/SMS, generate and send a new code
        const code = generateTempCode();
        const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.mfaTempSecret = code;
        user.mfaTempSecretExpiry = expiryTime;
        await user.save();

        if (user.mfaMethod === 'email') {
          await sendEmailMFA(user.email, code);
        } else if (user.mfaMethod === 'sms' && user.mfaPhone) {
          await sendSMSMFA(user.mfaPhone, code);
        }

        return res.status(200).json({
          requireMFA: true,
          message: `MFA code sent to your ${user.mfaMethod}`,
          method: user.mfaMethod
        });
      }

      // Handle backup code verification
      if (isBackupCode) {
        const backupCodeIndex = user.mfaBackupCodes.indexOf(mfaCode);
        if (backupCodeIndex === -1) {
          return res.status(400).json({ message: 'Invalid backup code' });
        }
        // Remove used backup code
        user.mfaBackupCodes.splice(backupCodeIndex, 1);
        await user.save();
      } else {
        // Handle regular MFA verification
        if (user.mfaMethod === 'authenticator') {
          const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token: mfaCode,
            window: 1 // Allow 30 seconds clock skew
          });

          if (!verified) {
            return res.status(400).json({ message: 'Invalid MFA code' });
          }
        } else {
          // Verify email/SMS code
          if (!user.mfaTempSecret || !user.mfaTempSecretExpiry) {
            return res.status(400).json({ message: 'No MFA code was generated' });
          }

          if (new Date() > user.mfaTempSecretExpiry) {
            return res.status(400).json({ message: 'MFA code has expired' });
          }

          if (user.mfaTempSecret !== mfaCode) {
            return res.status(400).json({ message: 'Invalid MFA code' });
          }

          // Clear temporary MFA code after successful verification
          user.mfaTempSecret = undefined;
          user.mfaTempSecretExpiry = undefined;
        }
      }

      await user.save();
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user._id, tenantId: user.tenantId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION});
    const refreshToken = jwt.sign({ userId: user._id, tenantId: user.tenantId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRATION });

    // Save refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // Send tokens
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update refresh token in DB
    user.refreshToken = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token', error: error.message });
  }
};

// Logout User
exports.logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  try {
    const user = await User.findOneAndUpdate(
      { refreshToken },
      { refreshToken: null }
    );

    res.clearCookie('refreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
