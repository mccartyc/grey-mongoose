const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Import the encryption utility
const encryptionMiddleware = require('../middleware/encryption');
const { FieldEncryption } = require('../middleware/encryption');

// Create an instance of FieldEncryption to use directly
const fieldEncryption = new FieldEncryption();

const clientSchema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // Using ObjectId as the primary key
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: "Tenant", required: true }, // Reference to Tenant
  userId: {  type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  clientId: { type: String, default: uuidv4, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  streetAddress: { type: String, required: false },
  birthday: { type: String }, // Changed from Date to String to support encrypted values
  gender: {type: String},
  city: { type: String, required: false },
  state: { type: String, required: false },
  zipcode: { type: String, required: false },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, required: true, default: true }
});

// Middleware to ensure tenantId and userId are valid
clientSchema.pre('save', async function(next) {
  try {
    console.log(`[Client pre-save] Processing client: ${this._id || 'new'}`);
    
    // Validate user exists
    const user = await mongoose.model('User').findOne({ _id: this.userId });
    if (!user) {
      console.error(`[Client pre-save] User not found: ${this.userId}`);
      throw new Error(`User not found with ID: ${this.userId}`);
    }
    
    this.tenantId = user.tenantId; // Ensure tenantId is consistent
    console.log(`[Client pre-save] Using tenantId: ${this.tenantId} from user: ${this.userId}`);
    
    // Encrypt sensitive fields before saving
    const sensitiveFields = ['email', 'phone', 'streetAddress', 'city', 'state', 'zipcode', 'birthday'];
    
    for (const field of sensitiveFields) {
      if (this[field] !== undefined && this[field] !== null) {
        // Skip if already encrypted
        if (typeof this[field] === 'string' && this[field].includes(':')) {
          console.log(`[Client pre-save] Field ${field} is already encrypted, skipping`);
          continue;
        }
        
        // Convert Date objects to ISO string for consistent encryption
        let valueToEncrypt;
        if (field === 'birthday' && this[field]) {
          console.log(`[Client pre-save] Processing ${field}:`, this[field], "Type:", typeof this[field]);
          
          if (this[field] instanceof Date) {
            valueToEncrypt = this[field].toISOString().split('T')[0]; // Format as YYYY-MM-DD
            console.log(`[Client pre-save] Formatted ${field} from Date:`, valueToEncrypt);
          } else if (typeof this[field] === 'string') {
            // Check if it's already in ISO format (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(this[field])) {
              valueToEncrypt = this[field];
              console.log(`[Client pre-save] Already in ISO format ${field}:`, valueToEncrypt);
            } else {
              try {
                const date = new Date(this[field]);
                if (!isNaN(date.getTime())) {
                  valueToEncrypt = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                  console.log(`[Client pre-save] Formatted ${field} from string:`, valueToEncrypt);
                } else {
                  console.error(`[Client pre-save] Invalid date format for ${field}:`, this[field]);
                  valueToEncrypt = this[field];
                }
              } catch (error) {
                console.error(`[Client pre-save] Error formatting date for ${field}:`, error);
                valueToEncrypt = this[field];
              }
            }
          } else {
            console.log(`[Client pre-save] Converting ${field} to string:`, this[field]);
            valueToEncrypt = String(this[field]);
          }
        } else {
          valueToEncrypt = this[field];
        }
        
        try {
          console.log(`[Client pre-save] Encrypting ${field}:`, typeof valueToEncrypt);
          this[field] = fieldEncryption.encrypt(valueToEncrypt);
          console.log(`[Client pre-save] Successfully encrypted ${field}`);
        } catch (encryptError) {
          console.error(`[Client pre-save] Error encrypting ${field}:`, encryptError);
          throw new Error(`Error encrypting ${field}: ${encryptError.message}`);
        }
      }
    }
    
    console.log(`[Client pre-save] Successfully processed client: ${this._id || 'new'}`);
    next();
  } catch (error) {
    console.error("[Client pre-save] Error in pre-save middleware:", error.message);
    console.error("[Client pre-save] Error stack:", error.stack);
    next(error);
  }
});

// Middleware to encrypt contact information on update
clientSchema.pre('findOneAndUpdate', function(next) {
  try {
    const update = this.getUpdate();
    console.log(`[Client pre-update] Processing update for client`);
    
    const sensitiveFields = ['email', 'phone', 'streetAddress', 'city', 'state', 'zipcode', 'birthday'];
    
    for (const field of sensitiveFields) {
      if (update[field] !== undefined && update[field] !== null) {
        // Skip if already encrypted
        if (typeof update[field] === 'string' && update[field].includes(':')) {
          console.log(`[Client pre-update] Field ${field} is already encrypted, skipping`);
          continue;
        }
        
        // Convert Date objects to ISO string for consistent encryption
        let valueToEncrypt;
        if (field === 'birthday' && update[field]) {
          console.log(`[Client pre-update] Processing ${field}:`, update[field], "Type:", typeof update[field]);
          
          if (update[field] instanceof Date) {
            valueToEncrypt = update[field].toISOString().split('T')[0]; // Format as YYYY-MM-DD
            console.log(`[Client pre-update] Formatted ${field} from Date:`, valueToEncrypt);
          } else if (typeof update[field] === 'string') {
            // Check if it's already in ISO format (YYYY-MM-DD)
            if (/^\d{4}-\d{2}-\d{2}$/.test(update[field])) {
              valueToEncrypt = update[field];
              console.log(`[Client pre-update] Already in ISO format ${field}:`, valueToEncrypt);
            } else {
              try {
                const date = new Date(update[field]);
                if (!isNaN(date.getTime())) {
                  valueToEncrypt = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
                  console.log(`[Client pre-update] Formatted ${field} from string:`, valueToEncrypt);
                } else {
                  console.error(`[Client pre-update] Invalid date format for ${field}:`, update[field]);
                  valueToEncrypt = update[field];
                }
              } catch (error) {
                console.error(`[Client pre-update] Error formatting date for ${field}:`, error);
                valueToEncrypt = update[field];
              }
            }
          } else {
            console.log(`[Client pre-update] Converting ${field} to string:`, update[field]);
            valueToEncrypt = String(update[field]);
          }
        } else {
          valueToEncrypt = update[field];
        }
        
        try {
          console.log(`[Client pre-update] Encrypting ${field}:`, typeof valueToEncrypt);
          update[field] = fieldEncryption.encrypt(valueToEncrypt);
          console.log(`[Client pre-update] Successfully encrypted ${field}`);
        } catch (encryptError) {
          console.error(`[Client pre-update] Error encrypting ${field}:`, encryptError);
          throw new Error(`Error encrypting ${field}: ${encryptError.message}`);
        }
      }
    }
    
    console.log(`[Client pre-update] Successfully processed update`);
    next();
  } catch (error) {
    console.error("[Client pre-update] Error in pre-update middleware:", error.message);
    console.error("[Client pre-update] Error stack:", error.stack);
    next(error);
  }
});

// Method to decrypt contact information when retrieving client data
clientSchema.methods.decryptContactInfo = function() {
  try {
    console.log(`[Client decrypt] Decrypting client: ${this._id}`);
    const client = this.toObject();
    
    const sensitiveFields = ['email', 'phone', 'streetAddress', 'city', 'state', 'zipcode', 'birthday'];
    
    for (const field of sensitiveFields) {
      if (client[field] !== undefined && client[field] !== null) {
        try {
          console.log(`[Client decrypt] Decrypting ${field}:`, typeof client[field]);
          
          // Check if the field is actually encrypted
          if (typeof client[field] !== 'string' || !client[field].includes(':')) {
            console.log(`[Client decrypt] Field ${field} is not encrypted, skipping`);
            continue;
          }
          
          const decrypted = fieldEncryption.decrypt(client[field]);
          
          // Handle special case for birthday field
          if (field === 'birthday' && decrypted) {
            try {
              console.log(`[Client decrypt] Decrypted ${field}:`, decrypted, "Type:", typeof decrypted);
              
              // Check if it's already in ISO format (YYYY-MM-DD)
              if (/^\d{4}-\d{2}-\d{2}$/.test(decrypted)) {
                // Create a Date object from the ISO string
                const date = new Date(decrypted);
                if (!isNaN(date.getTime())) {
                  client[field] = date;
                  console.log(`[Client decrypt] Converted ISO ${field} to Date:`, client[field]);
                } else {
                  console.error(`[Client decrypt] Invalid ISO date format for ${field}:`, decrypted);
                  client[field] = decrypted;
                }
              } else {
                // Try to parse the date string
                const date = new Date(decrypted);
                if (!isNaN(date.getTime())) {
                  // If it's a valid date, store it as a Date object
                  client[field] = date;
                  console.log(`[Client decrypt] Converted ${field} to Date:`, client[field]);
                } else {
                  // If it's not a valid date, just use the decrypted string
                  console.error(`[Client decrypt] Invalid date format for decrypted ${field}:`, decrypted);
                  client[field] = decrypted;
                }
              }
            } catch (dateError) {
              console.error(`[Client decrypt] Error parsing date for ${field}:`, dateError);
              client[field] = decrypted;
            }
          } else {
            client[field] = decrypted;
            console.log(`[Client decrypt] Successfully decrypted ${field}`);
          }
        } catch (error) {
          console.error(`[Client decrypt] Error decrypting ${field}:`, error.message);
          // Keep the original value if decryption fails
        }
      }
    }
    
    console.log(`[Client decrypt] Successfully decrypted client: ${client._id}`);
    return client;
  } catch (error) {
    console.error("[Client decrypt] Error in decryptContactInfo:", error.message);
    console.error("[Client decrypt] Error stack:", error.stack);
    return this.toObject(); // Return unmodified object if decryption fails
  }
};

// Virtual to get decrypted email
clientSchema.virtual('decryptedEmail').get(function() {
  return this.email ? fieldEncryption.decrypt(this.email) : '';
});

// Virtual to get decrypted phone
clientSchema.virtual('decryptedPhone').get(function() {
  return this.phone ? fieldEncryption.decrypt(this.phone) : '';
});

// Virtual to get decrypted birthday as a Date object
clientSchema.virtual('birthdayAsDate').get(function() {
  if (!this.birthday) return null;
  
  try {
    // If it's encrypted, decrypt it first
    let birthdayValue = this.birthday;
    if (typeof this.birthday === 'string' && this.birthday.includes(':')) {
      birthdayValue = fieldEncryption.decrypt(this.birthday);
    }
    
    // Try to convert to a Date object
    if (/^\d{4}-\d{2}-\d{2}$/.test(birthdayValue)) {
      const date = new Date(birthdayValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting birthdayAsDate:', error);
    return null;
  }
});

const Client = mongoose.model('Client', clientSchema);
module.exports = Client;
