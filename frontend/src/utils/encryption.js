import CryptoJS from 'crypto-js';

/**
 * Decrypts encrypted text using the application's encryption key
 * @param {string} encryptedText - The text to decrypt
 * @returns {string} - The decrypted text or an error message
 */
export const decryptText = (encryptedText) => {
  if (!encryptedText) return '';
  
  // Check if it's already plain text
  if (typeof encryptedText === 'string' && 
      (encryptedText.includes(' ') || 
       encryptedText.includes('.') || 
       encryptedText.includes('\n'))) {
    return encryptedText;
  }
  
  // Get the key from the environment variable
  const key = process.env.REACT_APP_ENCRYPTION_KEY;
  if (!key) {
    console.error('Encryption key not found in environment variables');
    return 'Error: Encryption key not configured';
  }
  
  try {
    // Check if the text contains a colon which would indicate the special format
    if (encryptedText.includes(':')) {
      console.log('Found special encryption format with IV');
      const [ciphertext, iv] = encryptedText.split(':');
      
      // Create key and IV word arrays
      const keyWordArray = CryptoJS.enc.Hex.parse(key.substring(0, 32)); // Use first 32 chars (16 bytes)
      const ivWordArray = CryptoJS.enc.Hex.parse(iv);
      
      // Decrypt with the parsed key and IV
      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) },
        keyWordArray,
        { iv: ivWordArray }
      ).toString(CryptoJS.enc.Utf8);
      
      if (decrypted && decrypted.length > 0) {
        console.log('Successfully decrypted content with IV');
        return decrypted;
      }
    }
    
    // Try standard decryption as fallback
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key).toString(CryptoJS.enc.Utf8);
    
    if (decrypted && decrypted.length > 0) {
      console.log('Successfully decrypted content with standard method');
      return decrypted;
    }
    
    console.log('All decryption attempts failed');
    return 'Unable to decrypt content';
  } catch (error) {
    console.error('Error during decryption:', error.message);
    return 'Error decrypting content';
  }
};

/**
 * Encrypts text using the application's encryption key
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text in the format ciphertext:iv
 */
export const encryptText = (text) => {
  if (!text) return '';
  
  // Get the key from the environment variable
  const key = process.env.REACT_APP_ENCRYPTION_KEY;
  if (!key) {
    console.error('Encryption key not found in environment variables');
    throw new Error('Encryption key not configured');
  }
  
  try {
    // Create key word array
    const keyWordArray = CryptoJS.enc.Hex.parse(key.substring(0, 32));
    
    // Use fixed IV if available, otherwise generate random
    let iv;
    if (process.env.REACT_APP_ENCRYPTION_IV) {
      console.log('Using fixed IV from environment variables');
      iv = CryptoJS.enc.Hex.parse(process.env.REACT_APP_ENCRYPTION_IV);
    } else {
      console.log('Using random IV');
      iv = CryptoJS.lib.WordArray.random(16);
    }
    
    // Encrypt the text
    const encrypted = CryptoJS.AES.encrypt(text, keyWordArray, {
      iv: iv
    });
    
    // Format as ciphertext:iv
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex) + ':' + iv.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Error during encryption:', error.message);
    throw new Error('Failed to encrypt content');
  }
};
