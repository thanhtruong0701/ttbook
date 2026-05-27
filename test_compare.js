const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');
const users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
const admin = users[0];

console.log('Testing login for:', admin.username);
console.log('Comparing "mk123456":', bcrypt.compareSync('mk123456', admin.passwordHash));
console.log('Comparing "123456":', bcrypt.compareSync('123456', admin.passwordHash));
