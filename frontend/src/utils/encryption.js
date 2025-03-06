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
      
      // Split the text into ciphertext and IV parts
      const parts = encryptedText.split(':');
      
      // Handle both formats: ciphertext:iv and ciphertext:authTag
      if (parts.length === 2) {
        const [ciphertext, iv] = parts;
        
        // Create key and IV word arrays
        const keyWordArray = CryptoJS.enc.Hex.parse(key.substring(0, 32)); // Use first 32 chars (16 bytes)
        
        try {
          const ivWordArray = CryptoJS.enc.Hex.parse(iv);
          
          // Decrypt with the parsed key and IV
          const decrypted = CryptoJS.AES.decrypt(
            { ciphertext: CryptoJS.enc.Hex.parse(ciphertext) },
            keyWordArray,
            { iv: ivWordArray, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
          );
          
          // Try to convert to UTF-8 string, if it fails, it's likely not valid UTF-8 data
          try {
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (decryptedText && decryptedText.length > 0) {
              console.log('Successfully decrypted content with IV');
              return decryptedText;
            }
          } catch (utf8Error) {
            console.error('Error converting decrypted data to UTF-8:', utf8Error.message);
            // Continue to try other methods
          }
        } catch (ivError) {
          console.error('Error parsing IV:', ivError.message);
          // Continue to try other methods
        }
      }
    }
    
    // Try standard decryption as fallback
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
      const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (decryptedText && decryptedText.length > 0) {
        console.log('Successfully decrypted content with standard method');
        return decryptedText;
      }
    } catch (standardError) {
      console.error('Error with standard decryption:', standardError.message);
      // Continue to last resort method
    }
    
    // Last resort: try direct base64 decoding if the text looks like base64
    if (/^[A-Za-z0-9+/=]+$/.test(encryptedText)) {
      try {
        const decoded = CryptoJS.enc.Base64.parse(encryptedText).toString(CryptoJS.enc.Utf8);
        if (decoded && decoded.length > 0 && decoded.match(/[a-zA-Z0-9]/)) {
          console.log('Successfully decoded content with base64');
          return decoded;
        }
      } catch (base64Error) {
        console.error('Error with base64 decoding:', base64Error.message);
      }
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
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    // Format as ciphertext:iv
    return encrypted.ciphertext.toString(CryptoJS.enc.Hex) + ':' + iv.toString(CryptoJS.enc.Hex);
  } catch (error) {
    console.error('Error during encryption:', error.message);
    throw new Error('Failed to encrypt content');
  }
};
