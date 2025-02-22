const User = require('../models/Users');
const mongoose = require('mongoose');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const crypto = require('crypto');

// Load environment variables
const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  SMTP_FROM,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE === 'true',
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

// Generate a random 6-digit code
exports.generateTempCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate backup codes
exports.generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex'));
  }
  return codes;
};

// Generate TOTP secret
exports.generateTOTPSecret = () => {
  return speakeasy.generateSecret({
    name: 'Grey Mongoose',
    length: 20
  });
};

// Send MFA code via email
exports.sendEmailMFA = async (email, code) => {
  const mailOptions = {
    from: SMTP_FROM,
    to: email,
    subject: 'Your MFA Code',
    text: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
    html: `<p>Your verification code is: <strong>${code}</strong></p><p>This code will expire in 10 minutes.</p>`,
  };

  await transporter.sendMail(mailOptions);
};

// Send MFA code via SMS
exports.sendSMSMFA = async (phone, code) => {
  await twilioClient.messages.create({
    body: `Your verification code is: ${code}. This code will expire in 10 minutes.`,
    to: phone,
    from: TWILIO_PHONE_NUMBER,
  });
};

// Enable MFA for a user
exports.enableMFA = async (req, res) => {
  try {
    const { method, phone } = req.body;
    const userId = req.user.userId;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.mfaEnabled = true;
    user.mfaMethod = method;

    if (method === 'authenticator') {
      const secret = this.generateTOTPSecret();
      user.mfaSecret = secret.base32;
      const otpauthUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: encodeURIComponent(user.email),
        issuer: 'Grey Mongoose'
      });
      const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
      user.mfaBackupCodes = this.generateBackupCodes();

      await user.save();
      return res.status(200).json({
        message: 'MFA enabled successfully',
        method: 'authenticator',
        qrCode: qrCodeUrl,
        backupCodes: user.mfaBackupCodes
      });
    }

    if (method === 'sms' && phone) {
      user.mfaPhone = phone;
    }

    await user.save();

    res.status(200).json({
      message: 'MFA enabled successfully',
      method: user.mfaMethod,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error enabling MFA', error: error.message });
  }
};

// Disable MFA for a user
exports.disableMFA = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.mfaEnabled = false;
    user.mfaMethod = 'email';
    user.mfaPhone = undefined;
    user.mfaSecret = undefined;
    user.mfaSecretExpiry = undefined;
    user.mfaBackupCodes = undefined;

    await user.save();

    res.status(200).json({ message: 'MFA disabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error disabling MFA', error: error.message });
  }
};

// Generate and send MFA code
exports.generateMFACode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mfaEnabled) {
      return res.status(400).json({ message: 'MFA is not enabled for this user' });
    }

    if (user.mfaMethod === 'authenticator') {
      return res.status(200).json({
        message: 'Please use your authenticator app to generate a code',
        method: 'authenticator'
      });
    }

    const code = this.generateTempCode();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.mfaTempSecret = code;
    user.mfaTempSecretExpiry = expiryTime;
    await user.save();

    if (user.mfaMethod === 'email') {
      await this.sendEmailMFA(user.email, code);
    } else if (user.mfaMethod === 'sms' && user.mfaPhone) {
      await this.sendSMSMFA(user.mfaPhone, code);
    }

    res.status(200).json({
      message: 'MFA code generated and sent successfully',
      method: user.mfaMethod,
      expiresAt: expiryTime
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating MFA code', error: error.message });
  }
};

// Get MFA settings for a user
exports.getMFASettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
      mfaPhone: user.mfaPhone
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching MFA settings', error: error.message });
  }
};

// Verify MFA code
exports.verifyMFACode = async (req, res) => {
  try {
    const { email, code, isBackupCode } = req.body;

    const user = await User.findOne({ email }).select('+email');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isBackupCode) {
      const backupCodeIndex = user.mfaBackupCodes.indexOf(code);
      if (backupCodeIndex === -1) {
        return res.status(400).json({ message: 'Invalid backup code' });
      }
      // Remove used backup code
      user.mfaBackupCodes.splice(backupCodeIndex, 1);
      await user.save();
      return res.status(200).json({ message: 'Backup code verified successfully' });
    }

    if (user.mfaMethod === 'authenticator') {
      const verified = speakeasy.totp.verify({
        secret: user.mfaSecret,
        encoding: 'base32',
        token: code,
        window: 1 // Allow 30 seconds clock skew
      });

      if (!verified) {
        return res.status(400).json({ message: 'Invalid MFA code' });
      }

      return res.status(200).json({ message: 'MFA code verified successfully' });
    }

    // For email/SMS verification
    if (!user.mfaTempSecret || !user.mfaTempSecretExpiry) {
      return res.status(400).json({ message: 'No MFA code has been generated' });
    }

    if (new Date() > user.mfaTempSecretExpiry) {
      return res.status(400).json({ message: 'MFA code has expired' });
    }

    if (user.mfaTempSecret !== code) {
      return res.status(400).json({ message: 'Invalid MFA code' });
    }

    // Clear the temporary MFA code after successful verification
    user.mfaTempSecret = undefined;
    user.mfaTempSecretExpiry = undefined;
    await user.save();

    res.status(200).json({ message: 'MFA code verified successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error verifying MFA code', error: error.message });
  }
};
