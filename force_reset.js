const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');

function forceReset() {
  const passwordHash = bcrypt.hashSync('mk123456', 10);
  const users = [
    {
      "id": "u_1779775917318",
      "username": "kene0701",
      "passwordHash": passwordHash,
      "balance": 100000,
      "role": "admin",
      "createdAt": new Date().toISOString()
    }
  ];
  
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
  console.log('Đã ghi đè sạch sẽ users.json! Password "mk123456" đã băm chuẩn xác.');
  console.log('Hash mới:', passwordHash);
}

forceReset();
