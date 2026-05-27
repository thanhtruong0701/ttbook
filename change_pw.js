const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');

async function updatePassword() {
  const username = 'kene0701';
  const password = 'mk123456'; // Đặt mật khẩu chính xác là chữ "mk123456" luôn!
  
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  
  let users = [];
  if (fs.existsSync(USERS_PATH)) {
    try {
      users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
    } catch (e) {
      users = [];
    }
  }
  
  const existsIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (existsIndex !== -1) {
    users[existsIndex].passwordHash = passwordHash;
    users[existsIndex].balance = 100000; // Tặng sẵn 100k
    users[existsIndex].role = 'admin';
  } else {
    users.push({
      id: `u_${Date.now()}`,
      username: username,
      passwordHash: passwordHash,
      balance: 100000,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  }
  
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
  console.log('Đã cập nhật mật khẩu Admin thành công sang chữ: "mk123456"');
}

updatePassword();
