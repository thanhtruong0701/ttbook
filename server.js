const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure session management
app.use(session({
  secret: 'tk-boost-saas-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 day session
}));

// Local JSON Database Paths
const USERS_PATH = path.join(__dirname, 'users.json');
const ORDERS_PATH = path.join(__dirname, 'orders.json');
const TRANSACTIONS_PATH = path.join(__dirname, 'transactions.json');
const CONFIG_PATH = path.join(__dirname, 'config.json');

// --- Helper Functions to Manage Database Files Safely ---

function loadJSON(filePath, defaultData = []) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return defaultData;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (e) {
    console.error(`Lỗi đọc tệp ${path.basename(filePath)}:`, e.message);
    return defaultData;
  }
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error(`Lỗi ghi tệp ${path.basename(filePath)}:`, e.message);
    return false;
  }
}

// Load configurations
function getAppConfig() {
  const defaultConfig = {
    apiUrl: 'https://subgiare.net.vn/api/v2',
    apiKey: 'dzkqnMlAUPMinziCFFKgv210yN6EWFHvtIW0nHi5smHXJEvKRPCNNLgKikomukN1Qv45c1ZM8RM6HxyF', // Key của bạn
    defaultServiceId: '80',
    markupPercent: 30, // 30% lợi nhuận mặc định
    bankId: 'mbbank', // ID ngân hàng mặc định
    bankAccount: '03912345678', // Số tài khoản mặc định
    bankName: 'NGUYEN VAN A', // Tên chủ tài khoản mặc định
    comboViewServer: '60',
    comboLikeServer: '29',
    comboCmtServer: '62'
  };

  const current = loadJSON(CONFIG_PATH, defaultConfig);
  // Đảm bảo không bị thiếu các thuộc tính mới
  return { ...defaultConfig, ...current };
}

// --- Middleware for Authentication Check ---

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ error: 'Quyền truy cập bị từ chối. Chỉ dành cho Admin.' });
  }
  next();
}

// Hàm phân giải link rút gọn (vt.tiktok.com) thành link đầy đủ và trích xuất UID phù hợp
async function resolveTiktokUidAndUrl(link, typeApi) {
  let resolvedUrl = link.trim();

  // 1. Phân giải nếu là link rút gọn vt.tiktok.com, vm.tiktok.com hoặc v.tiktok.com
  if (link.includes('vt.tiktok.com') || link.includes('vm.tiktok.com') || link.includes('v.tiktok.com')) {
    try {
      const res = await fetch(resolvedUrl, {
        method: 'HEAD',
        redirect: 'manual'
      });
      const location = res.headers.get('location');
      if (location) {
        resolvedUrl = location;
      }
    } catch (e) {
      console.warn('[RESOLVER] Lỗi phân giải link rút gọn:', e.message);
    }
  }

  // 2. Trích xuất UID dựa trên loại API
  let uid = resolvedUrl;

  if (typeApi === 'tiktok.buff.sub' || typeApi === 'sub' || typeApi === 'Follower') {
    // Tăng follow: Cần lấy USERNAME (ví dụ: goccuake0712)
    const match = resolvedUrl.match(/@([a-zA-Z0-9_\.]+)/);
    if (match && match[1]) {
      uid = match[1];
    } else {
      const parts = resolvedUrl.split('/');
      const lastPart = parts[parts.length - 1];
      if (lastPart && !lastPart.includes('video')) {
        uid = lastPart.replace('@', '');
      }
    }
  } else {
    // Tăng View, Tim, CMT: Cần lấy VIDEO ID (ví dụ: 7123456789012345678) hoặc FULL VIDEO URL
    const videoIdMatch = resolvedUrl.match(/\/video\/(\d+)/);
    if (videoIdMatch && videoIdMatch[1]) {
      uid = videoIdMatch[1]; // Lấy đúng ID video
    } else {
      uid = resolvedUrl;
    }
  }

  console.log(`[RESOLVER] Phân giải Link: Gói=${typeApi} | Gốc=${link} | Đã phân giải=${resolvedUrl} | UID gửi đi=${uid}`);
  return { uid, resolvedUrl };
}

// --- User Registration & Login Endpoints ---

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc.' });
  }

  const users = loadJSON(USERS_PATH);
  const exists = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  
  if (exists) {
    return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại trên hệ thống.' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  // Người dùng đăng ký đầu tiên sẽ được phong làm Admin
  const role = users.length === 0 ? 'admin' : 'user';

  const newUser = {
    id: `u_${Date.now()}`,
    username: username.trim(),
    passwordHash: passwordHash,
    balance: 0, // Mặc định ví 0đ
    role: role,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  saveJSON(USERS_PATH, users);

  res.json({ success: true, message: 'Đăng ký tài khoản thành công!' });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Tên đăng nhập và mật khẩu là bắt buộc.' });
  }

  const users = loadJSON(USERS_PATH);
  const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    return res.status(400).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
  }

  // Khởi tạo session
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.role = user.role;

  const config = getAppConfig();
  res.json({
    success: true,
    user: {
      username: user.username,
      role: user.role,
      balance: user.balance
    },
    comboConfig: {
      comboViewServer: config.comboViewServer || '60',
      comboLikeServer: config.comboLikeServer || '29',
      comboCmtServer: config.comboCmtServer || '62'
    }
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Đã đăng xuất thành công.' });
});

app.get('/api/auth/session', (req, res) => {
  if (!req.session.userId) {
    return res.json({ loggedIn: false });
  }

  const users = loadJSON(USERS_PATH);
  const user = users.find(u => u.id === req.session.userId);

  if (!user) {
    req.session.destroy();
    return res.json({ loggedIn: false });
  }

  const config = getAppConfig();
  res.json({
    loggedIn: true,
    user: {
      username: user.username,
      role: user.role,
      balance: user.balance
    },
    comboConfig: {
      comboViewServer: config.comboViewServer || '60',
      comboLikeServer: config.comboLikeServer || '29',
      comboCmtServer: config.comboCmtServer || '62'
    }
  });
});

// --- Dynamic SMM Services Catalog with Markup ---

app.get('/api/services', async (req, res) => {
  const config = getAppConfig();
  const markup = (100 + parseFloat(config.markupPercent)) / 100;

  try {
    const response = await fetch('https://subgiare.net.vn/api/price.aspx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_token: config.apiKey })
    });

    const data = await response.json();
    if (!data.data) {
      return res.status(502).json({ error: 'Không lấy được bảng giá từ SMM Panel.' });
    }

    const services = [];

    // Duyệt qua tất cả các nền tảng chính
    Object.keys(data.data).forEach(platform => {
      const platformData = data.data[platform];
      if (!platformData || typeof platformData !== 'object') return;

      // Duyệt qua các loại dịch vụ (buff, vip, adb)
      Object.keys(platformData).forEach(serviceType => {
        const typeData = platformData[serviceType];
        if (!typeData || typeof typeData !== 'object') return;

        // Duyệt qua từng phân mục (like, sub, view, cmt, live, share...)
        Object.keys(typeData).forEach(category => {
          const serverList = typeData[category];
          if (!serverList || typeof serverList !== 'object') return;

          // Duyệt qua từng kênh (Server)
          Object.keys(serverList).forEach(serverId => {
            const item = serverList[serverId];
            if (!item || typeof item !== 'object') return;

            // Tính giá đã cộng phần trăm lãi của Admin
            const customerRate = Math.round(item.rate * markup * 100) / 100;

            // Đặt tên nhãn phân loại thân thiện tiếng Việt
            let friendlyCategory = category;
            if (category === 'sub') friendlyCategory = 'Follower / Sub';
            else if (category === 'like') friendlyCategory = 'Tương tác / Tim / Like';
            else if (category === 'cmt') friendlyCategory = 'Bình luận (Comments)';
            else if (category === 'live') friendlyCategory = 'Mắt Livestream';
            else if (category === 'view') friendlyCategory = 'Views / Xem video';
            else if (category === 'share') friendlyCategory = 'Chia sẻ (Share)';
            else if (category === 'friend') friendlyCategory = 'Kết bạn (Friends)';
            else if (category === 'memgroups' || category === 'mem') friendlyCategory = 'Thành viên Group / Kênh';
            else {
              friendlyCategory = category.charAt(0).toUpperCase() + category.slice(1);
            }

            // Đặt tên nhãn nền tảng đẹp mắt
            let friendlyPlatform = platform;
            if (platform === 'facebook') friendlyPlatform = 'Facebook';
            else if (platform === 'tiktok') friendlyPlatform = 'TikTok';
            else if (platform === 'instagram') friendlyPlatform = 'Instagram';
            else if (platform === 'youtube') friendlyPlatform = 'YouTube';
            else if (platform === 'telegram') friendlyPlatform = 'Telegram';
            else if (platform === 'shopee') friendlyPlatform = 'Shopee';
            else if (platform === 'twitter') friendlyPlatform = 'Twitter';
            else if (platform === 'threads') friendlyPlatform = 'Threads';
            else friendlyPlatform = platform.toUpperCase();

            services.push({
              id: serverId,
              platform: friendlyPlatform,
              rawPlatform: platform,
              category: friendlyCategory,
              rawCategory: category,
              type_api: `${platform}.${serviceType}.${category}`,
              name: `Kênh ${serverId} (${friendlyPlatform} - ${friendlyCategory})`,
              rate: customerRate, // Giá bán cho khách
              originalRate: item.rate, // Giá gốc từ SMM
              detail: item.detail,
              min: 10,
              max: 1000000
            });
          });
        });
      });
    });

    res.json(services);
  } catch (error) {
    console.error('Lỗi lấy bảng giá:', error);
    res.status(500).json({ error: 'Không thể tải bảng giá từ đối tác SMM.' });
  }
});

// --- SMM Wallet Balance Proxy ---

app.get('/api/balance', requireAuth, async (req, res) => {
  const config = getAppConfig();
  if (!config.apiKey) {
    return res.json({ balance: 0 });
  }

  try {
    const response = await fetch('https://subgiare.net.vn/api/price.aspx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_token: config.apiKey })
    });
    
    const data = await response.json();
    res.json({ balance: data.coin || 0, currency: 'VND' });
  } catch (e) {
    res.json({ balance: 0, error: 'Lỗi tải ví SMM' });
  }
});

// --- Dynamic VietQR Deposit Generation & Checking ---

app.post('/api/billing/deposit', requireAuth, (req, res) => {
  const { amount } = req.body;
  if (!amount || parseInt(amount) < 10000) {
    return res.status(400).json({ error: 'Số tiền nạp tối thiểu là 10.000 VND.' });
  }

  const config = getAppConfig();
  const transactionCode = `TKBOOST${Date.now().toString().slice(-6)}`;
  
  // Lưu lịch sử giao dịch ở trạng thái "Chờ nạp"
  const transactions = loadJSON(TRANSACTIONS_PATH);
  const newTx = {
    id: `tx_${Date.now()}`,
    userId: req.session.userId,
    username: req.session.username,
    type: 'deposit',
    amount: parseInt(amount),
    code: transactionCode,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  transactions.unshift(newTx);
  saveJSON(TRANSACTIONS_PATH, transactions);

  // Sinh link VietQR động
  // MBBank/Techcombank: https://img.vietqr.io/image/mbbank-03912345678-compact2.jpg?amount=10000&addInfo=TKBOOST12345&accountName=NGUYEN%20VAN%20A
  const cleanName = encodeURIComponent(config.bankName);
  const qrUrl = `https://img.vietqr.io/image/${config.bankId}-${config.bankAccount}-compact2.jpg?amount=${amount}&addInfo=${transactionCode}&accountName=${cleanName}`;

  res.json({
    success: true,
    code: transactionCode,
    qrUrl: qrUrl,
    bankId: config.bankId.toUpperCase(),
    bankAccount: config.bankAccount,
    bankName: config.bankName,
    amount: amount
  });
});

// Kiểm tra giao dịch và tự động cộng tiền (Tích hợp Auto-Approve để Test và sẵn sàng webhook thực tế)
app.post('/api/billing/check/:code', requireAuth, (req, res) => {
  const { code } = req.params;
  const transactions = loadJSON(TRANSACTIONS_PATH);
  const txIndex = transactions.findIndex(t => t.code === code && t.status === 'Pending');

  if (txIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy yêu cầu nạp tiền hợp lệ hoặc đã được duyệt.' });
  }

  const tx = transactions[txIndex];
  
  // --- MOCK AUTO APPROVE FOR TESTING & CONVENIENCE ---
  // Ở bản thương mại thật, chỗ này sẽ gọi API Casso/PayOS để check biến động số dư ngân hàng thật.
  // Ở đây chúng ta cho phép auto-duyệt lập tức để người dùng test thử việc nạp tiền và cộng số dư ví!
  tx.status = 'Completed';
  transactions[txIndex] = tx;
  saveJSON(TRANSACTIONS_PATH, transactions);

  // Cộng số dư cho User
  const users = loadJSON(USERS_PATH);
  const userIndex = users.findIndex(u => u.id === tx.userId);
  if (userIndex !== -1) {
    users[userIndex].balance += tx.amount;
    saveJSON(USERS_PATH, users);
  }

  res.json({
    success: true,
    amount: tx.amount,
    message: `Nạp tiền thành công! Đã cộng ${tx.amount.toLocaleString()}đ vào số dư tài khoản.`
  });
});

app.get('/api/billing/history', requireAuth, (req, res) => {
  const transactions = loadJSON(TRANSACTIONS_PATH);
  const userTxs = transactions.filter(t => t.userId === req.session.userId);
  res.json(userTxs);
});

// --- Place SMM Order (Order Follower/Like/View) ---

app.post('/api/order', requireAuth, async (req, res) => {
  const { link, serviceId, type_api, quantity } = req.body;
  const config = getAppConfig();

  if (!link || !serviceId || !type_api || !quantity) {
    return res.status(400).json({ error: 'Thông tin đặt hàng không hợp lệ.' });
  }

  const qty = parseInt(quantity);
  if (qty < 10) {
    return res.status(400).json({ error: 'Số lượng mua tối thiểu là 10.' });
  }

  // 1. Kiểm tra bảng giá động để tính chi phí bán cho User
  let serviceRate = 0;
  let originalRate = 0;
  try {
    const priceRes = await fetch('https://subgiare.net.vn/api/price.aspx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_token: config.apiKey })
    });
    const priceData = await priceRes.json();
    
    // Tìm đúng Rate dịch vụ động cho mọi nền tảng
    const parts = type_api.split('.'); // e.g. ["facebook", "buff", "like"]
    let serviceInfo = null;
    if (parts.length === 3) {
      const [platform, serviceType, category] = parts;
      if (priceData.data[platform] && priceData.data[platform][serviceType] && priceData.data[platform][serviceType][category]) {
        serviceInfo = priceData.data[platform][serviceType][category][serviceId.toString()];
      }
    }
    
    if (!serviceInfo) {
      return res.status(400).json({ error: 'Gói dịch vụ không khả dụng hoặc đã bị tắt từ máy chủ gốc.' });
    }

    originalRate = serviceInfo.rate;
    const markup = (100 + parseFloat(config.markupPercent)) / 100;
    serviceRate = Math.round(originalRate * markup * 100) / 100;

  } catch (err) {
    return res.status(500).json({ error: 'Không thể tính giá dịch vụ: ' + err.message });
  }

  // Tính hệ số thời gian đối với livestream
  let durationMultiplier = 1;
  if (type_api.endsWith('.live')) {
    const minutes = parseInt(req.body.minutes) || 30;
    durationMultiplier = minutes;
  }

  const customerCharge = Math.ceil(qty * serviceRate * durationMultiplier); // Tiền khách trả
  const originalCost = Math.ceil(qty * originalRate * durationMultiplier); // Tiền mình trả cho SMM Panel

  // 2. Kiểm tra số dư ví của User
  const users = loadJSON(USERS_PATH);
  const userIndex = users.findIndex(u => u.id === req.session.userId);
  if (userIndex === -1) return res.status(401).json({ error: 'Người dùng không hợp lệ.' });

  const user = users[userIndex];
  if (user.balance < customerCharge) {
    return res.status(400).json({ error: `Số dư ví không đủ. Cần ${customerCharge.toLocaleString()}đ để thực hiện giao dịch này.` });
  }

  // 3. Gọi API thật của Subgiare đặt đơn
  try {
    const subgiareUrl = 'https://subgiare.net.vn/api/v2/server.aspx';
    const { uid, resolvedUrl } = await resolveTiktokUidAndUrl(link, type_api);

    const payload = {
      uid: uid,
      url: resolvedUrl,
      channel: parseInt(serviceId),
      type: 1,
      max: qty,
      type_method: 'add',
      type_api: type_api,
      api_token: config.apiKey
    };

    // Thêm các trường phụ của dịch vụ nâng cao
    if (type_api.endsWith('.cmt')) {
      payload.list_cmt = req.body.comments ? req.body.comments.trim().replace(/\n/g, '|') : '';
    }
    if (type_api.endsWith('.live')) {
      payload.time_eye = parseInt(req.body.minutes) || 30;
    }

    console.log(`[ORDER] Gửi API Subgiare: User=${user.username}, Gói=${type_api}, Sl=${qty}`);
    const apiResponse = await fetch(subgiareUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resData = await apiResponse.json();
    console.log('[ORDER] Phản hồi Subgiare:', JSON.stringify(resData));

    if (resData.code !== 200) {
      return res.status(400).json({ error: resData.message || 'Lỗi xử lý đơn hàng từ cổng gốc.' });
    }

    // 4. Trừ tiền và cập nhật số dư của User thành công
    user.balance -= customerCharge;
    users[userIndex] = user;
    saveJSON(USERS_PATH, users);

    // 5. Lưu đơn hàng vào cơ sở dữ liệu cục bộ
    const orderId = resData.id || `SUB_${Date.now()}`;
    const orders = loadJSON(ORDERS_PATH);
    const newOrder = {
      id: `ord_${Date.now()}`,
      orderId: orderId,
      userId: user.id,
      username: user.username,
      link: link,
      serviceId: serviceId,
      type_api: type_api,
      quantity: qty,
      charge: customerCharge,
      cost: originalCost,
      status: 'Pending',
      startCount: '0',
      remains: qty.toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (type_api.endsWith('.live')) {
      newOrder.minutes = durationMultiplier;
    }

    orders.unshift(newOrder);
    saveJSON(ORDERS_PATH, orders);

    // Lưu một giao dịch ghi nợ vào transaction logs
    const transactions = loadJSON(TRANSACTIONS_PATH);
    transactions.unshift({
      id: `tx_${Date.now()}`,
      userId: user.id,
      username: user.username,
      type: 'purchase',
      amount: -customerCharge,
      code: `ORDER${orderId}`,
      status: 'Completed',
      createdAt: new Date().toISOString()
    });
    saveJSON(TRANSACTIONS_PATH, transactions);

    res.json({
      success: true,
      orderId: orderId,
      charge: customerCharge,
      newBalance: user.balance,
      message: 'Đặt đơn tăng dịch vụ thành công!'
    });

  } catch (error) {
    console.error('Lỗi đặt hàng SMM:', error);
    res.status(500).json({ error: 'Không thể kết nối đến máy chủ SMM: ' + error.message });
  }
});

// --- TikTok Video Combo Boosting Endpoint ---
app.post('/api/order/combo', requireAuth, async (req, res) => {
  const { link, comboId, customComments } = req.body;
  const config = getAppConfig();
  const comboViewServer = config.comboViewServer || '60';
  const comboLikeServer = config.comboLikeServer || '29';
  const comboCmtServer = config.comboCmtServer || '62';

  if (!link || !comboId) {
    return res.status(400).json({ error: 'Thông tin đặt hàng combo không hợp lệ.' });
  }

  // 1. Định nghĩa hoặc phân tích các gói combo
  let selectedCombo;
  if (comboId === 'custom') {
    const customViews = parseInt(req.body.customViews) || 0;
    const customLikes = parseInt(req.body.customLikes) || 0;
    const customCommentsCount = parseInt(req.body.customCommentsCount) || 0;

    if (customViews <= 0 && customLikes <= 0 && customCommentsCount <= 0) {
      return res.status(400).json({ error: 'Vui lòng chọn số lượng tăng của ít nhất 1 dịch vụ trong Combo.' });
    }

    selectedCombo = {
      name: 'Combo Tự Chọn (Custom Boost)',
      views: customViews,
      likes: customLikes,
      comments: customCommentsCount,
      viewServer: parseInt(comboViewServer),
      likeServer: parseInt(comboLikeServer),
      cmtServer: parseInt(comboCmtServer)
    };
  } else {
    const combos = {
      bronze: {
        name: 'Combo Đồng (Viral Khởi Nghiệp)',
        views: 1000,
        likes: 100,
        comments: 5,
        viewServer: parseInt(comboViewServer),
        likeServer: parseInt(comboLikeServer),
        cmtServer: parseInt(comboCmtServer)
      },
      silver: {
        name: 'Combo Bạc (Bứt Phá)',
        views: 5000,
        likes: 300,
        comments: 10,
        viewServer: parseInt(comboViewServer),
        likeServer: parseInt(comboLikeServer),
        cmtServer: parseInt(comboCmtServer)
      },
      gold: {
        name: 'Combo Vàng (Lên Xu Hướng)',
        views: 10000,
        likes: 500,
        comments: 20,
        viewServer: parseInt(comboViewServer),
        likeServer: parseInt(comboLikeServer),
        cmtServer: parseInt(comboCmtServer)
      }
    };
    selectedCombo = combos[comboId];
  }

  if (!selectedCombo) {
    return res.status(400).json({ error: 'Gói combo không tồn tại.' });
  }

  // 2. Fetch bảng giá SMM để lấy rate chính xác
  let viewRate = 0.5508;
  let likeRate = 13.77;
  let cmtRate = 151.47;

  try {
    const priceRes = await fetch('https://subgiare.net.vn/api/price.aspx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_token: config.apiKey })
    });
    const priceData = await priceRes.json();
    
    if (priceData.data && priceData.data.tiktok && priceData.data.tiktok.buff) {
      const buff = priceData.data.tiktok.buff;
      if (buff.view && buff.view[selectedCombo.viewServer.toString()]) {
        viewRate = buff.view[selectedCombo.viewServer.toString()].rate;
      }
      if (buff.like && buff.like[selectedCombo.likeServer.toString()]) {
        likeRate = buff.like[selectedCombo.likeServer.toString()].rate;
      }
      if (buff.cmt && buff.cmt[selectedCombo.cmtServer.toString()]) {
        cmtRate = buff.cmt[selectedCombo.cmtServer.toString()].rate;
      }
    }
  } catch (err) {
    console.warn('Lỗi lấy giá động cho combo, sử dụng giá mặc định:', err.message);
  }

  // Tính chi phí gốc và chi phí đã cộng lợi nhuận (markup)
  const markup = (100 + parseFloat(config.markupPercent)) / 100;
  
  const originalCost = Math.ceil(
    (selectedCombo.views * viewRate) + 
    (selectedCombo.likes * likeRate) + 
    (selectedCombo.comments * cmtRate)
  );

  const customerCharge = Math.ceil(originalCost * markup);

  // 3. Kiểm tra số dư người dùng
  const users = loadJSON(USERS_PATH);
  const userIndex = users.findIndex(u => u.id === req.session.userId);
  if (userIndex === -1) return res.status(401).json({ error: 'Người dùng không hợp lệ.' });

  const user = users[userIndex];
  if (user.balance < customerCharge) {
    return res.status(400).json({ error: `Số dư ví không đủ. Cần ${customerCharge.toLocaleString()}đ để mua Combo này.` });
  }

  // 4. Các bình luận mặc định cực kỳ tích cực nếu người dùng không nhập cmt riêng
  const defaultComments = [
    'Video quá tuyệt vời anh ơi',
    'Hay quá, mong anh ra thêm nhiều video như này nữa',
    'Nội dung rất ý nghĩa và chất lượng',
    'Đã tim và follow ủng hộ kênh mình nha',
    'Xem đi xem lại vẫn thấy cuốn quá',
    'Chúc kênh ngày càng phát triển nhé',
    'Video edit xịn xò quá bạn ơi',
    'Tuyệt vời quá, thả tim ủng hộ liền',
    'Rất bổ ích, cảm ơn chủ thớt nhé',
    'Nhạc hay video chất lượng quá'
  ];

  // Trích xuất list bình luận ngẫu nhiên phù hợp số lượng yêu cầu
  let finalCommentsList = '';
  if (selectedCombo.comments > 0) {
    if (customComments && customComments.trim()) {
      finalCommentsList = customComments.trim().replace(/\n/g, '|');
    } else {
      // Trộn ngẫu nhiên cmt mặc định
      const shuffled = [...defaultComments].sort(() => 0.5 - Math.random());
      finalCommentsList = shuffled.slice(0, selectedCombo.comments).join('|');
    }
  }

  // 5. Gọi API gửi các đơn hàng song song lên Subgiare (chỉ gọi dịch vụ có số lượng > 0)
  try {
    const subgiareUrl = 'https://subgiare.net.vn/api/v2/server.aspx';
    const { uid, resolvedUrl } = await resolveTiktokUidAndUrl(link, 'tiktok.buff.view');

    const activeServices = [];
    const payloads = {};

    // Views
    if (selectedCombo.views > 0) {
      payloads.view = {
        uid: uid,
        url: resolvedUrl,
        channel: selectedCombo.viewServer,
        type: 1,
        max: selectedCombo.views,
        type_method: 'add',
        type_api: 'tiktok.buff.view',
        api_token: config.apiKey
      };
      activeServices.push('view');
    }

    // Likes
    if (selectedCombo.likes > 0) {
      payloads.like = {
        uid: uid,
        url: resolvedUrl,
        channel: selectedCombo.likeServer,
        type: 1,
        max: selectedCombo.likes,
        type_method: 'add',
        type_api: 'tiktok.buff.like',
        api_token: config.apiKey
      };
      activeServices.push('like');
    }

    // Comments
    if (selectedCombo.comments > 0) {
      payloads.cmt = {
        uid: uid,
        url: resolvedUrl,
        channel: selectedCombo.cmtServer,
        type: 1,
        max: selectedCombo.comments,
        list_cmt: finalCommentsList,
        type_method: 'add',
        type_api: 'tiktok.buff.cmt',
        api_token: config.apiKey
      };
      activeServices.push('cmt');
    }

    console.log(`[COMBO ORDER] Bắt đầu đẩy các đơn song song cho ${user.username} (Gói: ${selectedCombo.name})...`);
    
    const results = {};
    const executeOrder = async (serviceName, payload) => {
      try {
        const response = await fetch(subgiareUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const resData = await response.json();
        return { success: resData.code === 200, data: resData };
      } catch (err) {
        return { success: false, error: err.message };
      }
    };

    const promises = activeServices.map(service => 
      executeOrder(service, payloads[service]).then(res => {
        results[service] = res;
      })
    );

    await Promise.all(promises);

    let totalCharge = 0;
    let totalCost = 0;
    const errors = [];
    const savedOrders = [];
    const comboGroupId = `COMBO_${Date.now()}`;

    // Tải lại users để đảm bảo số dư mới nhất
    const latestUsers = loadJSON(USERS_PATH);
    const latestUserIndex = latestUsers.findIndex(u => u.id === req.session.userId);
    const latestUser = latestUsers[latestUserIndex];

    if (results.view) {
      const charge = Math.ceil(selectedCombo.views * viewRate * markup);
      const cost = Math.ceil(selectedCombo.views * viewRate);
      if (results.view.success) {
        totalCharge += charge;
        totalCost += cost;
        savedOrders.push({
          id: `ord_${Date.now()}_v`,
          orderId: results.view.data.id || `SUB_V_${Date.now()}`,
          userId: latestUser.id,
          username: latestUser.username,
          link: link,
          serviceId: selectedCombo.viewServer.toString(),
          type_api: 'tiktok.buff.view',
          quantity: selectedCombo.views,
          charge: charge,
          cost: cost,
          status: 'Pending',
          startCount: '0',
          remains: selectedCombo.views.toString(),
          comboGroupId: comboGroupId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        errors.push(`Lỗi View: ${results.view.data?.message || results.view.error || 'Không rõ'}`);
      }
    }

    if (results.like) {
      const charge = Math.ceil(selectedCombo.likes * likeRate * markup);
      const cost = Math.ceil(selectedCombo.likes * likeRate);
      if (results.like.success) {
        totalCharge += charge;
        totalCost += cost;
        savedOrders.push({
          id: `ord_${Date.now()}_l`,
          orderId: results.like.data.id || `SUB_L_${Date.now()}`,
          userId: latestUser.id,
          username: latestUser.username,
          link: link,
          serviceId: selectedCombo.likeServer.toString(),
          type_api: 'tiktok.buff.like',
          quantity: selectedCombo.likes,
          charge: charge,
          cost: cost,
          status: 'Pending',
          startCount: '0',
          remains: selectedCombo.likes.toString(),
          comboGroupId: comboGroupId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        errors.push(`Lỗi Tim: ${results.like.data?.message || results.like.error || 'Không rõ'}`);
      }
    }

    if (results.cmt) {
      const charge = Math.ceil(selectedCombo.comments * cmtRate * markup);
      const cost = Math.ceil(selectedCombo.comments * cmtRate);
      if (results.cmt.success) {
        totalCharge += charge;
        totalCost += cost;
        savedOrders.push({
          id: `ord_${Date.now()}_c`,
          orderId: results.cmt.data.id || `SUB_C_${Date.now()}`,
          userId: latestUser.id,
          username: latestUser.username,
          link: link,
          serviceId: selectedCombo.cmtServer.toString(),
          type_api: 'tiktok.buff.cmt',
          quantity: selectedCombo.comments,
          charge: charge,
          cost: cost,
          status: 'Pending',
          startCount: '0',
          remains: selectedCombo.comments.toString(),
          comboGroupId: comboGroupId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        errors.push(`Lỗi CMT: ${results.cmt.data?.message || results.cmt.error || 'Không rõ'}`);
      }
    }

    if (savedOrders.length === 0) {
      return res.status(400).json({ error: 'Không thể mua Combo. Tất cả các dịch vụ gặp lỗi: ' + errors.join('; ') });
    }

    // Trừ tiền thực tế cho các đơn đã thành công
    latestUser.balance -= totalCharge;
    latestUsers[latestUserIndex] = latestUser;
    saveJSON(USERS_PATH, latestUsers);

    // Ghi nhận các đơn thành công vào database
    const ordersList = loadJSON(ORDERS_PATH);
    ordersList.unshift(...savedOrders);
    saveJSON(ORDERS_PATH, ordersList);

    // Lưu Transaction Log
    const transactionsList = loadJSON(TRANSACTIONS_PATH);
    transactionsList.unshift({
      id: `tx_${Date.now()}`,
      userId: latestUser.id,
      username: latestUser.username,
      type: 'purchase',
      amount: -totalCharge,
      code: `COMBO${comboGroupId.slice(-6)}`,
      status: 'Completed',
      createdAt: new Date().toISOString()
    });
    saveJSON(TRANSACTIONS_PATH, transactionsList);

    if (errors.length > 0) {
      res.json({
        success: true,
        partial: true,
        comboGroupId: comboGroupId,
        charge: totalCharge,
        newBalance: latestUser.balance,
        message: `Kích hoạt Combo bán phần thành công! Một số dịch vụ bị lỗi và bạn đã được HOÀN TIỀN (không tính phí):<br>${errors.join('<br>')}`
      });
    } else {
      res.json({
        success: true,
        comboGroupId: comboGroupId,
        charge: totalCharge,
        newBalance: latestUser.balance,
        message: `Kích hoạt mua thành công gói ${selectedCombo.name}!`
      });
    }

  } catch (error) {
    console.error('Lỗi nộp đơn combo:', error);
    res.status(500).json({ error: 'Không thể kết nối đến máy chủ SMM: ' + error.message });
  }
});

app.get('/api/orders', requireAuth, (req, res) => {
  const orders = loadJSON(ORDERS_PATH);
  
  // Khách hàng thường chỉ xem đơn của họ, Admin được xem toàn bộ
  if (req.session.role === 'admin') {
    res.json(orders);
  } else {
    res.json(orders.filter(o => o.userId === req.session.userId));
  }
});

// Kiểm tra & Đồng bộ trạng thái đơn hàng thời gian thực
app.get('/api/orders/check/:orderId', requireAuth, async (req, res) => {
  const { orderId } = req.params;
  const config = getAppConfig();
  const orders = loadJSON(ORDERS_PATH);
  const orderIndex = orders.findIndex(o => o.orderId.toString() === orderId.toString());

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy đơn hàng.' });
  }

  const order = orders[orderIndex];

  try {
    const subgiareUrl = 'https://subgiare.net.vn/api/v2/server.aspx';
    const payload = {
      id: parseInt(orderId) || orderId,
      type_method: 'view',
      type_api: order.type_api,
      api_token: config.apiKey
    };

    const apiResponse = await fetch(subgiareUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const resData = await apiResponse.json();
    console.log(`[STATUS CHECK] Đồng bộ Đơn #${orderId}:`, JSON.stringify(resData));

    let item = null;
    if (resData.code === 200 && resData.data) {
      if (Array.isArray(resData.data)) {
        item = resData.data[0];
      } else if (typeof resData.data === 'object') {
        item = resData.data;
      }
    }

    if (item) {
      let smmStatus = item.status !== undefined && item.status !== null ? item.status.toString() : '';
      let mappedStatus = order.status;
      
      if (smmStatus) {
        const statusLower = smmStatus.toLowerCase();
        if (statusLower === '0' || statusLower === 'pending' || statusLower === 'waiting') {
          mappedStatus = 'Pending';
        } else if (statusLower === '1' || statusLower === 'active' || statusLower === 'processing' || statusLower === 'in progress' || statusLower === 'running') {
          mappedStatus = 'In progress';
        } else if (statusLower === '2' || statusLower === 'completed' || statusLower === 'success' || statusLower === 'done') {
          mappedStatus = 'Completed';
        } else if (statusLower === '3' || statusLower === 'canceled' || statusLower === 'cancelled' || statusLower === 'refunded' || statusLower === 'refund') {
          mappedStatus = 'Canceled';
        } else {
          mappedStatus = smmStatus.charAt(0).toUpperCase() + smmStatus.slice(1);
        }
      }
      
      order.status = mappedStatus;
      
      // Ánh xạ start count (Subgiare trả về 'start' hoặc 'start_count')
      const startCountVal = item.start !== undefined ? item.start : (item.start_count !== undefined ? item.start_count : null);
      if (startCountVal !== null) {
        order.startCount = startCountVal.toString();
      }
      
      // Ánh xạ remains
      if (item.remains !== undefined && item.remains !== null) {
        order.remains = item.remains.toString();
      }
      
      order.updatedAt = new Date().toISOString();

      orders[orderIndex] = order;
      saveJSON(ORDERS_PATH, orders);
    }

    res.json(order);
  } catch (error) {
    console.error('Lỗi đồng bộ trạng thái đơn:', error);
    res.status(500).json({ error: 'Lỗi đồng bộ trạng thái đơn hàng.' });
  }
});

// --- Admin Controls Endpoints ---

// Lấy thông tin cấu hình hệ thống (Admin)
app.get('/api/admin/settings', requireAdmin, (req, res) => {
  const config = getAppConfig();
  res.json({
    apiUrl: config.apiUrl,
    apiKey: config.apiKey,
    defaultServiceId: config.defaultServiceId,
    markupPercent: config.markupPercent,
    bankId: config.bankId,
    bankAccount: config.bankAccount,
    bankName: config.bankName,
    comboViewServer: config.comboViewServer || '60',
    comboLikeServer: config.comboLikeServer || '29',
    comboCmtServer: config.comboCmtServer || '62'
  });
});

// Lưu thông tin cấu hình hệ thống (Admin)
app.post('/api/admin/settings', requireAdmin, (req, res) => {
  const { apiUrl, apiKey, defaultServiceId, markupPercent, bankId, bankAccount, bankName, comboViewServer, comboLikeServer, comboCmtServer } = req.body;
  
  const current = getAppConfig();
  const updated = {
    apiUrl: apiUrl || current.apiUrl,
    apiKey: apiKey || current.apiKey,
    defaultServiceId: defaultServiceId || current.defaultServiceId,
    markupPercent: markupPercent !== undefined ? parseInt(markupPercent) : current.markupPercent,
    bankId: bankId || current.bankId,
    bankAccount: bankAccount || current.bankAccount,
    bankName: bankName || current.bankName,
    comboViewServer: comboViewServer || current.comboViewServer || '60',
    comboLikeServer: comboLikeServer || current.comboLikeServer || '29',
    comboCmtServer: comboCmtServer || current.comboCmtServer || '62'
  };

  if (saveJSON(CONFIG_PATH, updated)) {
    res.json({ success: true, message: 'Đã cập nhật cấu hình hệ thống Admin thành công!' });
  } else {
    res.status(500).json({ error: 'Không thể lưu cài đặt mới.' });
  }
});

// Lấy toàn bộ người dùng và quản trị nạp ví (Admin)
app.get('/api/admin/users', requireAdmin, (req, res) => {
  const users = loadJSON(USERS_PATH);
  // Loại bỏ mật khẩu băm để bảo mật thông tin
  const sanitized = users.map(u => ({
    id: u.id,
    username: u.username,
    balance: u.balance,
    role: u.role,
    createdAt: u.createdAt
  }));
  res.json(sanitized);
});

// Cộng / trừ tiền thủ công cho người dùng (Admin)
app.post('/api/admin/users/balance', requireAdmin, (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || amount === undefined) {
    return res.status(400).json({ error: 'Thiếu thông tin ID người dùng hoặc số tiền.' });
  }

  const users = loadJSON(USERS_PATH);
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng.' });
  }

  const user = users[userIndex];
  user.balance += parseInt(amount);
  users[userIndex] = user;
  saveJSON(USERS_PATH, users);

  // Thêm transaction log cho việc cộng tiền admin
  const transactions = loadJSON(TRANSACTIONS_PATH);
  transactions.unshift({
    id: `tx_${Date.now()}`,
    userId: user.id,
    username: user.username,
    type: 'admin_adjustment',
    amount: parseInt(amount),
    code: `ADMIN${Date.now().toString().slice(-4)}`,
    status: 'Completed',
    createdAt: new Date().toISOString()
  });
  saveJSON(TRANSACTIONS_PATH, transactions);

  res.json({ success: true, newBalance: user.balance, message: `Thay đổi số dư của user ${user.username} thành công!` });
});

// Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 TikTok SMM SaaS Platform đang hoạt động mượt mà!`);
  console.log(`🔗 Truy cập giao diện: http://localhost:${PORT}`);
  console.log(`📁 Thư mục dự án: E:\\TiktokFollowerPanel`);
  console.log(`=======================================================`);
});
