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
    if (text === null || text === undefined) return text;
    
    try {
      // Convert to string if not already a string
      const textToEncrypt = typeof text !== 'string' ? String(text) : text;
      
      // Check if the text is already encrypted (contains a colon which would indicate our format)
      if (textToEncrypt.includes(':')) {
        // Try to decrypt and re-encrypt to ensure consistent format
        try {
          const decrypted = this.decrypt(textToEncrypt);
          // If decryption succeeded, proceed with fresh encryption
          // If it fails, it will throw and we'll continue with normal encryption
          console.log(`Re-encrypting already encrypted data`);
        } catch (error) {
          // Text contains a colon but isn't in our encryption format
          // Continue with normal encryption
          console.log(`Text contains colon but is not encrypted, proceeding with encryption`);
        }
      }
      
      const cipher = crypto.createCipheriv(this.algorithm, this.key, this.iv);
      let encrypted = cipher.update(textToEncrypt, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');
      
      return `${encrypted}:${authTag}`;
    } catch (error) {
      console.error('Error encrypting data:', error.message);
      console.error('Error stack:', error.stack);
      // Return original text if encryption fails
      return text;
    }
  }

  decrypt(encryptedText) {
    if (encryptedText === null || encryptedText === undefined) return encryptedText;
    
    try {
      // Ensure we're working with a string
      const textToDecrypt = typeof encryptedText !== 'string' ? String(encryptedText) : encryptedText;
      
      // Check if the text is in our expected format (contains a colon)
      if (!textToDecrypt.includes(':')) {
        // Not in our format, return as is
        return encryptedText;
      }
      
      const [encrypted, authTag] = textToDecrypt.split(':');
      
      // Validate that both parts exist and look like hex
      if (!encrypted || !authTag || !/^[0-9a-f]+$/i.test(encrypted) || !/^[0-9a-f]+$/i.test(authTag)) {
        // Only log in debug mode or for specific fields to reduce noise
        return encryptedText;
      }
      
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, this.iv);
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Error decrypting data:', error.message);
      console.error('Error stack:', error.stack);
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
  'assessment',
  'email',
  'phone',
  'streetAddress',
  'city',
  'state',
  'zipCode',
  'birthday'
];

// Middleware to encrypt/decrypt sensitive data
const encryptionMiddleware = (req, res, next) => {
  try {
    // Skip encryption for authentication routes
    if (req.path.startsWith('/api/auth')) {
      return next();
    }
    
    // Debug logging to track middleware execution
    // console.log(`Processing request for path: ${req.path}`);
    
    // Encrypt request data
    if (req.body) {
      sensitiveFields.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== null) {
          try {
            let valueToEncrypt;
            if (field === 'birthday' && req.body[field]) {
              console.log(`Encrypting ${field}:`, req.body[field], "Type:", typeof req.body[field]);
              
              if (req.body[field] instanceof Date) {
                valueToEncrypt = req.body[field].toISOString().split('T')[0]; // Format as YYYY-MM-DD
                console.log(`Formatted ${field} from Date:`, valueToEncrypt);
              } else if (typeof req.body[field] === 'string') {
                try {
                  const date = new Date(req.body[field]);
                  if (!isNaN(date.getTime())) {
                    valueToEncrypt = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                    console.log(`Formatted ${field} from string:`, valueToEncrypt);
                  } else {
                    console.error(`Invalid date format for ${field}:`, req.body[field]);
                    valueToEncrypt = req.body[field];
                  }
                } catch (error) {
                  console.error(`Error formatting date for ${field}:`, error);
                  valueToEncrypt = req.body[field];
                }
              } else {
                valueToEncrypt = String(req.body[field]);
              }
            } else {
              valueToEncrypt = req.body[field];
            }
            
            console.log(`Encrypting ${field}:`, typeof valueToEncrypt);
            req.body[field] = fieldEncryption.encrypt(valueToEncrypt);
          } catch (encryptError) {
            console.error(`Error encrypting field ${field}:`, encryptError);
            // Continue with original data
          }
        }
      });
    }

    // Store the original res.json function
    const originalJson = res.json;
    
    // Override res.json to decrypt data before sending
    res.json = function(data) {
      try {
        // Only process arrays or objects
        if (data && typeof data === 'object') {
          // Handle arrays of objects (e.g., lists of clients)
          if (Array.isArray(data)) {
            data.forEach(item => {
              if (item && typeof item === 'object') {
                decryptObjectFields(item);
              }
            });
          } else {
            // Handle single objects
            decryptObjectFields(data);
          }
        }
      } catch (error) {
        console.error('Error in response decryption middleware:', error);
      }
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    next();
  } catch (error) {
    console.error('Error in encryption middleware:', error);
    next(error);
  }
};

// Helper function to decrypt fields in an object
function decryptObjectFields(obj) {
  sensitiveFields.forEach(field => {
    if (obj[field] !== null && obj[field] !== undefined) {
      try {
        const decrypted = fieldEncryption.decrypt(obj[field]);
        
        // Handle special case for Date objects
        if (field === 'birthday' && decrypted) {
          try {
            // If it's a valid date string, convert it back to a Date object
            const dateObj = new Date(decrypted);
            if (!isNaN(dateObj.getTime())) {
              obj[field] = dateObj;
              return;
            }
          } catch (dateError) {
            console.error(`Error parsing date for field ${field}:`, dateError);
          }
        }
        
        // Check if the decrypted text is JSON
        if (typeof decrypted === 'string' && (decrypted.startsWith('{') || decrypted.startsWith('['))) {
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

module.exports = {
  encryptionMiddleware,
  FieldEncryption,
  fieldEncryption
};
