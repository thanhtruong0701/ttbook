const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const USERS_PATH = path.join(__dirname, 'users.json');

async function createAdmin() {
  const username = 'kene0701';
  const password = '123456';
  
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);
  
  const adminUser = {
    id: `u_${Date.now()}`,
    username: username,
    passwordHash: passwordHash,
    balance: 100000, // Tặng sẵn 100k vào ví Admin để test chạy thật luôn cho sướng!
    role: 'admin',
    createdAt: new Date().toISOString()
  };
  
  let users = [];
  if (fs.existsSync(USERS_PATH)) {
    try {
      users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf-8'));
    } catch (e) {
      users = [];
    }
  }
  
  // Kiểm tra trùng
  const existsIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (existsIndex !== -1) {
    users[existsIndex] = adminUser;
    console.log('Tài khoản đã tồn tại, tiến hành ghi đè cập nhật mật khẩu và số dư...');
  } else {
    users.push(adminUser);
    console.log('Đang tạo mới tài khoản Admin...');
  }
  
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
  console.log(`=========================================`);
  console.log(`🎉 ĐÃ TẠO THÀNH CÔNG TÀI KHOẢN ADMIN!`);
  console.log(`👤 Username: ${username}`);
  console.log(`🔑 Password: ${password}`);
  console.log(`💰 Số dư ví tặng sẵn: 100,000đ`);
  console.log(`=========================================`);
}

createAdmin();
