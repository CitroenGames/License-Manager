const fs = require('fs');
const crypto = require('crypto');

// Generate a random secret key
const secretKey = crypto.randomBytes(32).toString('hex');

// Save the secret key to a .env file
fs.writeFileSync('.env', `SECRET_KEY=${secretKey}\n`, 'utf8');

console.log('Secret key generated and saved to .env file!');
