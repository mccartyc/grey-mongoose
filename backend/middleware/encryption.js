const crypto = require('crypto');

class FieldEncryption {
  constructor() {
    if (!process.env.ENCRYPTION_KEY || !process.env.ENCRYPTION_IV) {
      throw new Error('Encryption key and IV must be set in environment variables');
    }
    
    this.algorithm = 'aes-256-gcm';
    this.key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    this.iv = Buffer.from(process.env.ENCRYPTION_IV, 'hex');
  }

  encrypt(text) {
    if (!text) return text;
    
    const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${encrypted}:${authTag}`;
  }

  decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    
    const [encrypted, authTag] = encryptedText.split(':');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

const fieldEncryption = new FieldEncryption();

// Fields that need encryption
const sensitiveFields = [
  'ssn',
  'dateOfBirth',
  'medicalHistory',
  'diagnosis',
  'medications',
  'notes',
  'transcription',
  'assessment'
];

// Middleware to encrypt/decrypt sensitive data
const encryptionMiddleware = (req, res, next) => {
  // Encrypt request data
  if (req.body) {
    sensitiveFields.forEach(field => {
      if (req.body[field]) {
        req.body[field] = fieldEncryption.encrypt(
          typeof req.body[field] === 'object' 
            ? JSON.stringify(req.body[field])
            : req.body[field]
        );
      }
    });
  }

  // Decrypt response data
  const originalJson = res.json;
  res.json = function(data) {
    if (data) {
      sensitiveFields.forEach(field => {
        if (data[field]) {
          try {
            const decrypted = fieldEncryption.decrypt(data[field]);
            data[field] = decrypted.startsWith('{') || decrypted.startsWith('[')
              ? JSON.parse(decrypted)
              : decrypted;
          } catch (error) {
            console.error(`Error decrypting field ${field}:`, error);
          }
        }
      });
    }
    return originalJson.call(this, data);
  };

  next();
};

module.exports = encryptionMiddleware;
