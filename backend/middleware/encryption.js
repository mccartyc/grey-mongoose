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
    
    try {
      // Check if the text is already encrypted (contains a colon which would indicate our format)
      if (typeof text === 'string' && text.includes(':')) {
        // Try to decrypt and re-encrypt to ensure consistent format
        try {
          const decrypted = this.decrypt(text);
          // If decryption succeeded, proceed with fresh encryption
          // If it fails, it will throw and we'll continue with normal encryption
        } catch (error) {
          // Text contains a colon but isn't in our encryption format
          // Continue with normal encryption
        }
      }
      
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      
      return `${encrypted}:${authTag}`;
    } catch (error) {
      console.error('Error encrypting data:', error.message);
      // Return original text if encryption fails
      return text;
    }
  }

  decrypt(encryptedText) {
    if (!encryptedText) return encryptedText;
    
    try {
      // Check if the text is in our expected format (contains a colon)
      if (!encryptedText.includes(':')) {
        // Not in our format, return as is
        return encryptedText;
      }
      
      const [encrypted, authTag] = encryptedText.split(':');
      
      // Validate that both parts exist and look like hex
      if (!encrypted || !authTag || !/^[0-9a-f]+$/i.test(encrypted) || !/^[0-9a-f]+$/i.test(authTag)) {
        console.warn('Invalid encrypted format, returning original text');
        return encryptedText;
      }
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting data:', error.message);
      // Return original text if decryption fails
      return encryptedText;
    }
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
  'transcript',
  'assessment'
];

// Middleware to encrypt/decrypt sensitive data
const encryptionMiddleware = (req, res, next) => {
  try {
    // Encrypt request data
    if (req.body) {
      sensitiveFields.forEach(field => {
        if (req.body[field]) {
          try {
            req.body[field] = fieldEncryption.encrypt(
              typeof req.body[field] === 'object' 
                ? JSON.stringify(req.body[field])
                : req.body[field]
            );
          } catch (encryptError) {
            console.error(`Error encrypting field ${field}:`, encryptError);
            // Continue with original data
          }
        }
      });
    }

    // Decrypt response data
    const originalJson = res.json;
    res.json = function(data) {
      if (data) {
        // Handle single object
        if (!Array.isArray(data)) {
          decryptObjectFields(data);
        } 
        // Handle array of objects
        else if (Array.isArray(data)) {
          data.forEach(item => {
            if (item && typeof item === 'object') {
              decryptObjectFields(item);
            }
          });
        }
      }
      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Error in encryption middleware:', error);
    next();
  }
};

// Helper function to decrypt fields in an object
function decryptObjectFields(obj) {
  sensitiveFields.forEach(field => {
    if (obj[field]) {
      try {
        const decrypted = fieldEncryption.decrypt(obj[field]);
        // Check if the decrypted text is JSON
        if (decrypted.startsWith('{') || decrypted.startsWith('[')) {
          try {
            obj[field] = JSON.parse(decrypted);
          } catch (parseError) {
            // If parsing fails, use the decrypted string
            obj[field] = decrypted;
          }
        } else {
          obj[field] = decrypted;
        }
      } catch (decryptError) {
        console.error(`Error decrypting field ${field}:`, decryptError);
        // Keep original data if decryption fails
      }
    }
  });
}

module.exports = encryptionMiddleware;
