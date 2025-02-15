// src/utils/encryption.js

import CryptoJS from 'crypto-js';

// This class handles all encryption/decryption operations to ensure consistent security
export class EncryptionService {
  constructor(encryptionKey) {
    if (!encryptionKey) {
      throw new Error('Encryption key is required');
    }
    this.key = encryptionKey;
  }

  // Encrypts any data (objects, strings, etc) using AES encryption
  encrypt(data) {
    try {
      const stringData = typeof data === 'object' ? JSON.stringify(data) : String(data);
      return CryptoJS.AES.encrypt(stringData, this.key).toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypts encrypted data back to its original form
  decrypt(encryptedData) {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.key);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      // Try to parse as JSON, return as string if parsing fails
      try {
        return JSON.parse(decryptedString);
      } catch {
        return decryptedString;
      }
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

export default EncryptionService;