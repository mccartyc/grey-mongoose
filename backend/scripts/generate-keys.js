const crypto = require('crypto');

// Generate encryption key (32 bytes)
const encryptionKey = crypto.randomBytes(32);
console.log('\nEncryption Key (add to ENCRYPTION_KEY in .env):');
console.log(encryptionKey.toString('hex'));

// Generate initialization vector (16 bytes)
const iv = crypto.randomBytes(16);
console.log('\nInitialization Vector (add to ENCRYPTION_IV in .env):');
console.log(iv.toString('hex'));

// Generate session secret
const sessionSecret = crypto.randomBytes(32);
console.log('\nSession Secret (add to SESSION_SECRET in .env):');
console.log(sessionSecret.toString('hex'));

// Generate JWT secret
const jwtSecret = crypto.randomBytes(32);
console.log('\nJWT Secret (add to JWT_SECRET in .env):');
console.log(jwtSecret.toString('hex'));

console.log('\nMake sure to keep these keys secure and never commit them to version control!\n');
