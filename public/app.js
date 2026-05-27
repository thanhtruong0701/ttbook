// ==========================================================================
// TK Boost SMM SaaS Panel Client - Version 2.0 (SPA Frontend Engine)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // --- Global App State ---
  let currentUser = null;
  let allServices = [];
  let activeTrackingOrderId = null;
  let trackingInterval = null;
  let comboConfig = { comboViewServer: '60', comboLikeServer: '29', comboCmtServer: '62' };

  // --- DOM Elements ---
  const authScreen = document.getElementById('auth-screen');
  const appScreen = document.getElementById('app-screen');
  
  // Auth Form elements
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const loginUsernameInp = document.getElementById('login-username');
  const loginPasswordInp = document.getElementById('login-password');
  const registerUsernameInp = document.getElementById('register-username');
  const registerPasswordInp = document.getElementById('register-password');
  
  const goToRegisterBtn = document.getElementById('go-to-register');
  const goToLoginBtn = document.getElementById('go-to-login');
  const loginContainer = document.getElementById('login-form-container');
  const registerContainer = document.getElementById('register-form-container');
  
  // App Shell Elements
  const headerUsername = document.getElementById('header-username');
  const userProfileName = document.getElementById('user-profile-name');
  const userBalanceText = document.getElementById('user-balance');
  const userRoleBadge = document.getElementById('user-role-badge');
  const btnLogout = document.getElementById('btn-logout');
  const clockElement = document.getElementById('current-time');
  const toastContainer = document.getElementById('toast-container');
  const navAdminTab = document.getElementById('nav-admin');

  // Sidebar & Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const tabContents = document.querySelectorAll('.tab-content');

  // Order Placement Elements
  const orderForm = document.getElementById('order-form');
  const orderLinkInput = document.getElementById('order-link');
  const selectPlatform = document.getElementById('select-platform');
  const selectCategory = document.getElementById('select-category');
  const selectService = document.getElementById('select-service');
  const singleCommentGroup = document.getElementById('single-comment-group');
  const singleCommentsInput = document.getElementById('single-comments');
  const singleLiveGroup = document.getElementById('single-live-group');
  const singleLiveMinutes = document.getElementById('single-live-minutes');
  const serviceDetailBox = document.getElementById('service-detail-box');
  const serviceDescription = document.getElementById('service-description');
  const serviceRateText = document.getElementById('service-rate-text');
  const orderQuantityInput = document.getElementById('order-quantity');
  const orderTotalCostText = document.getElementById('order-total-cost');
  const orderActiveTracker = document.getElementById('order-active-tracker');
  const ordersListBody = document.getElementById('orders-list-body');

  // Deposit Billing Elements
  const depositForm = document.getElementById('deposit-form');
  const depositAmountInput = document.getElementById('deposit-amount');
  const btnPresets = document.querySelectorAll('.btn-preset');
  const depositQrCard = document.getElementById('deposit-qr-card');
  const qrActiveState = document.getElementById('qr-active-state');
  const noQrState = depositQrCard.querySelector('.no-qr-state');
  const depositQrImage = document.getElementById('deposit-qr-image');
  
  const billBankText = document.getElementById('bill-bank');
  const billAccountText = document.getElementById('bill-account');
  const billNameText = document.getElementById('bill-name');
  const billCodeText = document.getElementById('bill-code');
  const btnCopyCode = document.getElementById('btn-copy-code');
  const btnCheckPayment = document.getElementById('btn-check-payment');
  const transactionsListBody = document.getElementById('transactions-list-body');

  // Combo Booster DOM Elements
  const comboOrderForm = document.getElementById('combo-order-form');
  const comboLinkInput = document.getElementById('combo-link');
  const comboCommentsInput = document.getElementById('combo-comments');
  const comboTotalCostText = document.getElementById('combo-total-cost');
  const comboActiveTracker = document.getElementById('combo-active-tracker');
  const btnSubmitCombo = document.getElementById('btn-submit-combo');
  const comboCards = document.querySelectorAll('.combo-card');
  let selectedComboId = 'bronze'; // mặc định gói đồng

  // Admin Panel Elements
  const adminSettingsForm = document.getElementById('admin-settings-form');
  const adminMarkupInput = document.getElementById('admin-markup');
  const adminBankIdInput = document.getElementById('admin-bank-id');
  const adminBankAccountInput = document.getElementById('admin-bank-account');
  const adminBankNameInput = document.getElementById('admin-bank-name');
  const adminApiKeyInput = document.getElementById('admin-api-key');
  const adminComboViewServerInput = document.getElementById('admin-combo-view-server');
  const adminComboLikeServerInput = document.getElementById('admin-combo-like-server');
  const adminComboCmtServerInput = document.getElementById('admin-combo-cmt-server');

  const adminBalanceForm = document.getElementById('admin-balance-form');
  const adminSelectUser = document.getElementById('admin-select-user');
  const adminBalanceAmount = document.getElementById('admin-balance-amount');
  const adminUsersList = document.getElementById('admin-users-list');

  // --- Initialize App ---
  initClock();
  checkSession();
  initAuthToggle();
  initTabNavigation();
  initDepositPresets();
  initComboCards();

  // --- Live Clock ---
  function initClock() {
    setInterval(() => {
      const now = new Date();
      clockElement.textContent = now.toLocaleTimeString('vi-VN', { hour12: false });
    }, 1000);
  }

  // --- Toast Notification System ---
  function showToast(title, message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';
    
    toast.innerHTML = `
      <i class="fa-solid ${iconClass}"></i>
      <div class="toast-content">
        <h5>${title}</h5>
        <p>${message}</p>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse forwards';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // --- Verification Session Status ---
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      
      if (data.loggedIn) {
        setupUserSession(data);
      } else {
        authScreen.classList.remove('hidden');
        appScreen.classList.add('hidden');
      }
    } catch (e) {
      showToast('Lỗi hệ thống', 'Không thể kết nối với Backend.', 'error');
    }
  }

  function setupUserSession(data) {
    const user = data.user;
    currentUser = user;
    if (data.comboConfig) {
      comboConfig = data.comboConfig;
    }
    
    authScreen.classList.add('hidden');
    appScreen.classList.remove('hidden');
    
    // Update Header Profile info
    headerUsername.textContent = user.username;
    userProfileName.textContent = user.username;
    userBalanceText.textContent = `${user.balance.toLocaleString()}đ`;
    userRoleBadge.textContent = user.role.toUpperCase();
    
    if (user.role === 'admin') {
      navAdminTab.classList.remove('hidden');
      userRoleBadge.className = 'badge badge-accent';
      loadAdminPanel();
    } else {
      navAdminTab.classList.add('hidden');
      userRoleBadge.className = 'badge badge-success';
    }

    // Load dynamic data on successful login
    loadServices();
    loadOrders();
    loadTransactions();

    // Khởi chạy trình theo dõi trực quan toàn bộ lịch sử!
    updateVisualTracker();
    if (visualTrackerInterval) clearInterval(visualTrackerInterval);
    visualTrackerInterval = setInterval(updateVisualTracker, 8000); // Tự động quét 8 giây/lần

    // Tự động theo dõi Combo gần nhất nếu có!
    autoTrackLastCombo();
  }

  // --- Toggle Registration & Login Modals ---
  function initAuthToggle() {
    goToRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginContainer.classList.add('hidden');
      registerContainer.classList.remove('hidden');
    });

    goToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      registerContainer.classList.add('hidden');
      loginContainer.classList.remove('hidden');
    });
  }

  // --- SPA Tab Router Navigation ---
  function initTabNavigation() {
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const targetTab = item.getAttribute('data-tab');
        
        // Update nav items
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');
        
        // Show/Hide Tab Contents
        tabContents.forEach(content => {
          content.classList.remove('active');
          if (content.id === `tab-${targetTab}`) {
            content.classList.add('active');
          }
        });

        // Trigger updates depending on tab selected
        if (targetTab === 'services') updateVisualTracker();
        if (targetTab === 'orders') loadOrders();
        if (targetTab === 'transactions') loadTransactions();
        if (targetTab === 'admin') loadAdminPanel();
        if (targetTab === 'combo') {
          updateComboCosts();
          autoTrackLastCombo();
        }
      });
    });
  }

  // --- Load Dynamic Categories & Services Catalog ---
  async function loadServices() {
    try {
      const res = await fetch('/api/services');
      allServices = await res.json();

      // Cập nhật giá bán các Combo dựa trên bảng giá thực tế
      updateComboCosts();

      // Trích xuất các nền tảng duy nhất
      const platforms = [...new Set(allServices.map(s => s.platform))];
      
      selectPlatform.innerHTML = '<option value="">-- Chọn Nền Tảng MXH --</option>' + 
        platforms.map(p => `<option value="${p}">${p}</option>`).join('');
      
      selectCategory.innerHTML = '<option value="">-- Chọn Nền Tảng trước --</option>';
      selectCategory.disabled = true;
      selectService.innerHTML = '<option value="">-- Chọn Loại dịch vụ trước --</option>';
      selectService.disabled = true;
      
      serviceDetailBox.classList.add('hidden');
      singleCommentGroup.classList.add('hidden');
      singleLiveGroup.classList.add('hidden');

    } catch (e) {
      console.error(e);
      showToast('Lỗi tải dữ liệu', 'Không thể kết nối đến SMM để lấy bảng giá.', 'error');
    }
  }

  // Lắng nghe thay đổi Nền Tảng (Platform)
  selectPlatform.addEventListener('change', (e) => {
    const selectedPlatform = e.target.value;
    if (!selectedPlatform) {
      selectCategory.innerHTML = '<option value="">-- Chọn Nền Tảng trước --</option>';
      selectCategory.disabled = true;
      selectService.innerHTML = '<option value="">-- Chọn Loại dịch vụ trước --</option>';
      selectService.disabled = true;
      serviceDetailBox.classList.add('hidden');
      singleCommentGroup.classList.add('hidden');
      singleLiveGroup.classList.add('hidden');
      return;
    }

    // Lấy các phân loại của riêng nền tảng này
    const platformServices = allServices.filter(s => s.platform === selectedPlatform);
    const categories = [...new Set(platformServices.map(s => s.category))];

    selectCategory.innerHTML = '<option value="">-- Chọn Loại Dịch Vụ --</option>' +
      categories.map(c => `<option value="${c}">${c}</option>`).join('');
    
    selectCategory.disabled = false;
    selectService.innerHTML = '<option value="">-- Chọn Loại dịch vụ trước --</option>';
    selectService.disabled = true;
    serviceDetailBox.classList.add('hidden');
    singleCommentGroup.classList.add('hidden');
    singleLiveGroup.classList.add('hidden');
  });

  // Lắng nghe thay đổi Loại Dịch Vụ (Category)
  selectCategory.addEventListener('change', (e) => {
    const selectedCat = e.target.value;
    if (!selectedCat) {
      selectService.innerHTML = '<option value="">-- Chọn Loại dịch vụ trước --</option>';
      selectService.disabled = true;
      serviceDetailBox.classList.add('hidden');
      singleCommentGroup.classList.add('hidden');
      singleLiveGroup.classList.add('hidden');
      return;
    }

    // Lọc danh sách Server của riêng Nền tảng + Dịch vụ này
    const filtered = allServices.filter(s => s.platform === selectPlatform.value && s.category === selectedCat);
    
    selectService.innerHTML = '<option value="">-- Chọn Server (Kênh chạy tương tác) --</option>' +
      filtered.map(s => `<option value="${s.id}">Kênh ${s.id} - Giá: ${s.rate.toLocaleString()}đ / tương tác</option>`).join('');
    
    selectService.disabled = false;
    serviceDetailBox.classList.add('hidden');
    singleCommentGroup.classList.add('hidden');
    singleLiveGroup.classList.add('hidden');
  });

  // Lắng nghe thay đổi Server (Service)
  selectService.addEventListener('change', (e) => {
    const serviceId = e.target.value;
    if (!serviceId) {
      serviceDetailBox.classList.add('hidden');
      singleCommentGroup.classList.add('hidden');
      singleLiveGroup.classList.add('hidden');
      return;
    }

    const service = allServices.find(s => s.id === serviceId && s.platform === selectPlatform.value && s.category === selectCategory.value);
    if (service) {
      serviceDetailBox.classList.remove('hidden');
      serviceDescription.textContent = service.detail || 'Không có mô tả chi tiết cho kênh này.';
      serviceRateText.textContent = `${service.rate.toLocaleString()}đ`;

      // Ẩn/Hiện form nhập bình luận hoặc phút livestream theo dịch vụ
      if (service.type_api.endsWith('.cmt')) {
        singleCommentGroup.classList.remove('hidden');
        singleLiveGroup.classList.add('hidden');
      } else if (service.type_api.endsWith('.live')) {
        singleLiveGroup.classList.remove('hidden');
        singleCommentGroup.classList.add('hidden');
      } else {
        singleCommentGroup.classList.add('hidden');
        singleLiveGroup.classList.add('hidden');
      }

      calculateCost();
    }
  });

  // Lắng nghe thay đổi số lượng hoặc số phút xem live
  orderQuantityInput.addEventListener('input', calculateCost);
  singleLiveMinutes.addEventListener('change', calculateCost);

  function calculateCost() {
    const selectedId = selectService.value;
    if (!selectedId) {
      orderTotalCostText.textContent = `~ 0 VND`;
      return;
    }
    const service = allServices.find(s => s.id === selectedId && s.platform === selectPlatform.value && s.category === selectCategory.value);
    if (service) {
      const qty = parseInt(orderQuantityInput.value) || 0;
      let durationMultiplier = 1;
      
      if (service.type_api.endsWith('.live')) {
        durationMultiplier = parseInt(singleLiveMinutes.value) || 30;
      }
      
      const total = Math.ceil(qty * service.rate * durationMultiplier);
      orderTotalCostText.textContent = `~ ${total.toLocaleString()} VND`;
    }
  }

  // --- Auth Forms Submissions ---

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      username: loginUsernameInp.value.trim(),
      password: loginPasswordInp.value.trim()
    };

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast('Đăng nhập thành công', `Chào mừng quay trở lại, ${data.user.username}!`, 'success');
        loginForm.reset();
        setupUserSession(data);
      } else {
        showToast('Đăng nhập thất bại', data.error, 'error');
      }
    } catch (e) {
      showToast('Lỗi', 'Không thể gửi yêu cầu đăng nhập.', 'error');
    }
  });

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      username: registerUsernameInp.value.trim(),
      password: registerPasswordInp.value.trim()
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        showToast('Đăng ký thành công!', 'Bây giờ bạn có thể đăng nhập tài khoản vừa tạo.', 'success');
        registerForm.reset();
        // Quay lại màn đăng nhập
        registerContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
      } else {
        showToast('Đăng ký thất bại', data.error, 'error');
      }
    } catch (e) {
      showToast('Lỗi', 'Không thể gửi yêu cầu đăng ký.', 'error');
    }
  });

  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      currentUser = null;
      showToast('Đã đăng xuất', 'Phiên làm việc đã kết thúc.', 'info');
      // Clear timers
      if (trackingInterval) clearInterval(trackingInterval);
      if (visualTrackerInterval) clearInterval(visualTrackerInterval);
      if (comboTrackingInterval) clearInterval(comboTrackingInterval);
      checkSession();
    } catch (e) {}
  });

  // --- Place Order ---

  orderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-order');
    
    const selectedId = selectService.value;
    if (!selectedId) {
      showToast('Cảnh báo', 'Vui lòng lựa chọn Kênh (Server) cần mua.', 'warning');
      return;
    }

    const service = allServices.find(s => s.id === selectedId && s.platform === selectPlatform.value && s.category === selectCategory.value);
    if (!service) return;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đặt đơn lên máy chủ...';

    const payload = {
      link: orderLinkInput.value.trim(),
      serviceId: service.id,
      type_api: service.type_api,
      quantity: parseInt(orderQuantityInput.value),
      comments: singleCommentsInput.value.trim(),
      minutes: parseInt(singleLiveMinutes.value) || 30
    };

    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Đặt hàng thành công!', `Đơn hàng #${data.orderId} đã được duyệt.`, 'success');
        
        // Cập nhật ví sidebar hiển thị
        userBalanceText.textContent = `${data.newBalance.toLocaleString()}đ`;
        
        // Đồng bộ các bảng dữ liệu
        loadOrders();
        loadTransactions();

        // Kích hoạt theo dõi trực quan đơn này ngay lập tức!
        startLiveTracking(data.orderId);
      } else {
        showToast('Không thể tạo đơn', data.error, 'error');
      }
    } catch (err) {
      showToast('Lỗi hệ thống', 'Có lỗi kết nối xảy ra.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Kích Hoạt Chạy Đơn Ngay</span> <i class="fa-solid fa-paper-plane"></i>';
    }
  });

  // --- Deposit VietQR Payments Manager ---

  function initDepositPresets() {
    btnPresets.forEach(btn => {
      btn.addEventListener('click', () => {
        btnPresets.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        depositAmountInput.value = btn.getAttribute('data-val');
      });
    });

    depositAmountInput.addEventListener('input', () => {
      // Bỏ kích hoạt các presets khi nhập tay số tiền lẻ
      btnPresets.forEach(b => b.classList.remove('active'));
    });
  }

  depositForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-submit-deposit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tạo hóa đơn...';

    const payload = {
      amount: parseInt(depositAmountInput.value)
    };

    try {
      const res = await fetch('/api/billing/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Đã tạo mã QR', 'Vui lòng quét mã QR thanh toán phía bên phải.', 'success');
        
        // Show VietQR Container UI
        noQrState.classList.add('hidden');
        qrActiveState.classList.remove('hidden');

        // Populate dynamic QR details
        depositQrImage.src = data.qrUrl;
        billBankText.textContent = data.bankId;
        billAccountText.textContent = data.bankAccount;
        billNameText.textContent = data.bankName;
        billCodeText.textContent = data.code;

        // Auto Checking button listener with transaction code
        btnCheckPayment.onclick = () => checkPaymentStatus(data.code);
      } else {
        showToast('Lỗi hóa đơn', data.error, 'error');
      }
    } catch (err) {
      showToast('Lỗi', 'Không thể tạo mã VietQR.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Tạo Mã QR Nạp Tiền</span> <i class="fa-solid fa-qrcode"></i>';
    }
  });

  async function checkPaymentStatus(code) {
    btnCheckPayment.classList.add('checking');
    btnCheckPayment.disabled = true;
    btnCheckPayment.querySelector('span').textContent = 'Đang quét giao dịch ngân hàng ngầm...';

    try {
      const res = await fetch(`/api/billing/check/${code}`, { method: 'POST' });
      const data = await res.json();

      if (res.ok) {
        showToast('Nạp tiền thành công!', data.message, 'success');
        
        // Cộng ví giao diện
        checkSession(); // Để cập nhật ví chính xác
        loadTransactions(); // Tải lại nhật ký

        // Reset QR state
        qrActiveState.classList.add('hidden');
        noQrState.classList.remove('hidden');
      } else {
        showToast('Chưa quét được giao dịch', 'Giao dịch của bạn chưa xuất hiện trong bảng thống kê biến động số dư. Vui lòng thử lại sau 5 - 10 giây.', 'warning');
      }
    } catch (err) {
      showToast('Lỗi kết nối', 'Không thể quét giao dịch tự động.', 'error');
    } finally {
      btnCheckPayment.classList.remove('checking');
      btnCheckPayment.disabled = false;
      btnCheckPayment.querySelector('span').textContent = 'Tôi Đã Chuyển Khoản - Kiểm Tra Ngay';
    }
  }

  btnCopyCode.addEventListener('click', (e) => {
    e.preventDefault();
    const code = billCodeText.textContent;
    navigator.clipboard.writeText(code).then(() => {
      showToast('Đã copy', `Copy mã "${code}" thành công!`, 'success');
    });
  });

  // --- Load User History Lists ---

  async function loadOrders() {
    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();

      if (orders.length === 0) {
        ordersListBody.innerHTML = `
          <tr>
            <td colspan="10" class="text-center py-4 text-muted">Chưa có đơn hàng nào được thực hiện.</td>
          </tr>
        `;
        return;
      }

      ordersListBody.innerHTML = orders.map(o => {
        const formattedDate = new Date(o.createdAt).toLocaleString('vi-VN');
        const statusClass = getStatusClass(o.status);
        const priceFormatted = o.charge.toLocaleString();
        
        return `
          <tr data-order-id="${o.orderId}">
            <td><strong>#${o.orderId}</strong></td>
            <td class="text-accent" style="max-width: 180px; overflow: hidden; text-overflow: ellipsis;" title="${o.link}">${o.link}</td>
            <td>Gói ${o.serviceId}</td>
            <td><strong>${o.quantity}</strong></td>
            <td>${o.startCount || '0'}</td>
            <td>${o.remains || '0'}</td>
            <td><strong>${priceFormatted}đ</strong></td>
            <td><span class="status-label ${statusClass}">${getStatusTextVietnamese(o.status)}</span></td>
            <td class="text-muted" style="font-size: 0.8rem">${formattedDate}</td>
            <td>
              <button class="btn-secondary btn-track-order" data-id="${o.orderId}" data-link="${o.link}" data-qty="${o.quantity}" data-cat="${o.type_api.split('.').pop() === 'sub' ? 'Follower' : 'Tương tác'}">
                <i class="fa-solid fa-crosshairs"></i> Theo dõi
              </button>
            </td>
          </tr>
        `;
      }).join('');

      // Add track order listeners
      document.querySelectorAll('.btn-track-order').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const link = btn.getAttribute('data-link');
          const qty = btn.getAttribute('data-qty');
          const cat = btn.getAttribute('data-cat');
          startLiveTracking(id, link, qty, cat);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

    } catch (e) {}
  }

  async function loadTransactions() {
    try {
      const res = await fetch('/api/billing/history');
      const txs = await res.json();

      if (txs.length === 0) {
        transactionsListBody.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4 text-muted">Chưa có nhật ký giao dịch ví nào.</td>
          </tr>
        `;
        return;
      }

      transactionsListBody.innerHTML = txs.map(t => {
        const formattedDate = new Date(t.createdAt).toLocaleString('vi-VN');
        const isNegative = t.amount < 0;
        const colorClass = isNegative ? 'text-danger' : 'text-success';
        const typeText = t.type === 'deposit' ? 'Nạp tiền QR' : (t.type === 'purchase' ? 'Mua dịch vụ' : 'Admin điều chỉnh');
        const sign = isNegative ? '' : '+';
        
        return `
          <tr>
            <td><strong>#${t.code}</strong></td>
            <td>${typeText}</td>
            <td class="${colorClass}"><strong>${sign}${t.amount.toLocaleString()}đ</strong></td>
            <td>${t.type === 'purchase' ? 'Đặt đơn tự động trên Dashboard' : (t.type === 'deposit' ? 'Ví VietQR tự động' : 'Điều chỉnh hệ thống')}</td>
            <td><span class="status-label ${t.status === 'Completed' ? 'status-completed' : 'status-pending'}">${t.status === 'Completed' ? 'Thành công' : 'Chờ quét QR'}</span></td>
            <td class="text-muted" style="font-size: 0.8rem">${formattedDate}</td>
          </tr>
        `;
      }).join('');
    } catch (e) {}
  }

  // Helper converters
  function getStatusClass(status) {
    status = status.toLowerCase();
    if (status === 'pending') return 'status-pending';
    if (status === 'processing' || status === 'in progress' || status === 'in_progress') return 'status-processing';
    if (status === 'completed' || status === 'success') return 'status-completed';
    return 'status-canceled';
  }

  function getStatusTextVietnamese(status) {
    status = status.toLowerCase();
    if (status === 'pending') return 'Đang chờ';
    if (status === 'processing') return 'Chuẩn bị';
    if (status === 'in progress' || status === 'in_progress') return 'Đang chạy';
    if (status === 'completed' || status === 'success') return 'Hoàn tất';
    if (status === 'partial') return 'Tăng một phần';
    if (status === 'canceled') return 'Đã hủy';
    return status;
  }

  // --- Real-time Order Polling Tracking (Tích hợp Toàn Bộ Lịch Sử Có Cuộn Cuộn) ---
  let visualTrackerInterval = null;

  async function updateVisualTracker() {
    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();
      
      const targetProfilePreviewCard = document.getElementById('target-profile-preview-card') || document.querySelector('.target-profile-preview');
      if (targetProfilePreviewCard) {
        targetProfilePreviewCard.style.display = 'none'; // Ẩn preview đơn lẻ cũ để hiển thị danh sách lịch sử đẹp hơn
      }

      if (!orders || orders.length === 0) {
        orderActiveTracker.innerHTML = `
          <div class="no-active-order" style="padding: 2rem; text-align: center;">
            <i class="fa-solid fa-circle-notch fa-spin text-muted" style="font-size: 1.8rem; margin-bottom: 1rem;"></i>
            <p style="font-weight: 500;">Chưa có đơn hàng nào trong lịch sử</p>
            <span style="font-size: 0.8rem; color: rgba(255, 255, 255, 0.4);">Đặt đơn đầu tiên ở khung bên trái để bắt đầu theo dõi tiến độ thời gian thực của tài khoản!</span>
          </div>
        `;
        return;
      }

      // Lấy 10 đơn hàng gần đây nhất
      const recentOrders = orders.slice(0, 10);

      // Kích hoạt đồng bộ ngầm cho các đơn chưa hoàn thành để giữ database luôn mới nhất!
      recentOrders.forEach(o => {
        const status = o.status.toLowerCase();
        if (status === 'pending' || status === 'in progress' || status === 'processing') {
          fetch(`/api/orders/check/${o.orderId}`).catch(e => {});
        }
      });

      orderActiveTracker.innerHTML = `
        <div class="visual-tracker-list" style="display: flex; flex-direction: column; gap: 1.2rem; max-height: 520px; overflow-y: auto; padding-right: 0.5rem; scroll-behavior: smooth;">
          ${recentOrders.map(o => {
            const formattedDate = new Date(o.createdAt).toLocaleString('vi-VN');
            const statusClass = getStatusClass(o.status);
            const statusText = getStatusTextVietnamese(o.status);
            
            // Tìm tên nền tảng thân thiện
            let friendlyPlatform = 'TikTok';
            if (o.type_api) {
              const platform = o.type_api.split('_')[0].split('.')[0];
              if (platform === 'facebook') friendlyPlatform = 'Facebook';
              else if (platform === 'instagram') friendlyPlatform = 'Instagram';
              else if (platform === 'youtube') friendlyPlatform = 'YouTube';
              else if (platform === 'telegram') friendlyPlatform = 'Telegram';
              else if (platform === 'shopee') friendlyPlatform = 'Shopee';
              else if (platform === 'twitter') friendlyPlatform = 'Twitter';
              else if (platform === 'threads') friendlyPlatform = 'Threads';
              else friendlyPlatform = platform.charAt(0).toUpperCase() + platform.slice(1);
            }

            // Tính % tiến độ
            const start = parseInt(o.startCount) || 0;
            const remains = parseInt(o.remains) || 0;
            const total = parseInt(o.quantity);
            
            let completed = Math.max(0, total - remains);
            let progressPercent = Math.min(100, Math.floor((completed / total) * 100));

            if (o.status.toLowerCase() === 'completed') {
              completed = total;
              progressPercent = 100;
            } else if (progressPercent < 5) {
              progressPercent = 5; // Mới khởi tạo, hiển thị thanh nhỏ cho đẹp
            }

            // Trích xuất icon phù hợp nền tảng
            let platformIcon = 'fa-brands fa-tiktok text-accent';
            if (friendlyPlatform === 'Facebook') platformIcon = 'fa-brands fa-facebook text-primary';
            else if (friendlyPlatform === 'Instagram') platformIcon = 'fa-brands fa-instagram text-pink';
            else if (friendlyPlatform === 'YouTube') platformIcon = 'fa-brands fa-youtube text-danger';
            else if (friendlyPlatform === 'Telegram') platformIcon = 'fa-brands fa-telegram text-info';
            else if (friendlyPlatform === 'Shopee') platformIcon = 'fa-solid fa-bag-shopping text-warning';
            else if (friendlyPlatform === 'Twitter') platformIcon = 'fa-brands fa-twitter text-info';
            
            return `
              <div class="order-tracking-card" id="tracking-card-${o.orderId}" style="background: rgba(255, 255, 255, 0.03); border: 1px dashed rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1rem; transition: all 0.3s ease;">
                <div class="tracking-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <span style="font-size: 0.85rem; font-weight: 600;"><i class="${platformIcon}"></i> Đơn <strong>#${o.orderId}</strong></span>
                  <span class="status-label ${statusClass}" style="font-size: 0.75rem; padding: 0.2rem 0.6rem; border-radius: 20px;">${statusText}</span>
                </div>
                
                <div class="tracking-link" style="color: rgba(255, 255, 255, 0.5); font-size: 0.75rem; word-break: break-all; margin-bottom: 0.6rem; text-decoration: underline;" title="${o.link}">
                  <i class="fa-solid fa-link" style="font-size: 0.7rem;"></i> ${o.link}
                </div>

                <div class="progress-bar-container" style="background: rgba(255, 255, 255, 0.05); height: 6px; border-radius: 10px; overflow: hidden; margin-bottom: 0.6rem;">
                  <div class="progress-bar-fill" style="background: var(--accent-gradient); width: ${progressPercent}%; height: 100%; border-radius: 10px; transition: width 0.5s ease;"></div>
                </div>

                <div class="tracking-metrics" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; text-align: center;">
                  <div class="metric-box" style="display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.02); padding: 0.4rem; border-radius: 8px;">
                    <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.4);">Bắt đầu</span>
                    <strong style="font-size: 0.8rem; color: var(--accent-cyan);">${start}</strong>
                  </div>
                  <div class="metric-box" style="display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.02); padding: 0.4rem; border-radius: 8px;">
                    <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.4);">Còn lại</span>
                    <strong style="font-size: 0.8rem; color: #ff5e62;" class="${o.status.toLowerCase() === 'completed' ? '' : 'pulsing'}">${o.status.toLowerCase() === 'completed' ? '0' : remains}</strong>
                  </div>
                  <div class="metric-box" style="display: flex; flex-direction: column; background: rgba(255, 255, 255, 0.02); padding: 0.4rem; border-radius: 8px;">
                    <span style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.4);">Số lượng</span>
                    <strong style="font-size: 0.8rem;">${completed}/${total}</strong>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } catch (e) {
      console.error('Lỗi nạp trực quan:', e);
    }
  }

  function startLiveTracking(orderId) {
    const tabServices = document.getElementById('tab-services');
    if (tabServices) {
      tabServices.scrollIntoView({ behavior: 'smooth' });
    }

    updateVisualTracker().then(() => {
      const card = document.getElementById(`tracking-card-${orderId}`);
      if (card) {
        card.style.border = '1px solid var(--accent-cyan)';
        card.style.boxShadow = '0 0 15px rgba(0, 242, 254, 0.2)';
        card.style.transform = 'scale(1.02)';
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
          card.style.transform = 'scale(1)';
        }, 500);
      }
    });
  }

  // --- Admin Panel Controls ---

  async function loadAdminPanel() {
    try {
      // 1. Load Admin Settings Config
      const settingsRes = await fetch('/api/admin/settings');
      const settings = await settingsRes.json();
      
      adminMarkupInput.value = settings.markupPercent;
      adminBankIdInput.value = settings.bankId;
      adminBankAccountInput.value = settings.bankAccount;
      adminBankNameInput.value = settings.bankName;
      adminApiKeyInput.placeholder = 'Nhập API key mới để thay đổi hoặc để trống';
      adminComboViewServerInput.value = settings.comboViewServer || '60';
      adminComboLikeServerInput.value = settings.comboLikeServer || '29';
      adminComboCmtServerInput.value = settings.comboCmtServer || '62';

      // 2. Load Users dynamic dropdown & table
      const usersRes = await fetch('/api/admin/users');
      const users = await usersRes.json();

      // Populate select user dropdown
      adminSelectUser.innerHTML = '<option value="">-- Chọn thành viên nhận tiền --</option>' +
        users.map(u => `<option value="${u.id}">${u.username} (Số dư: ${u.balance.toLocaleString()}đ)</option>`).join('');

      // Populate Users management table
      adminUsersList.innerHTML = users.map(u => {
        const formattedDate = new Date(u.createdAt).toLocaleDateString('vi-VN');
        const roleClass = u.role === 'admin' ? 'badge badge-accent' : 'badge badge-success';
        return `
          <tr>
            <td><strong>${u.username}</strong></td>
            <td class="text-accent"><strong>${u.balance.toLocaleString()}đ</strong></td>
            <td><span class="${roleClass}">${u.role.toUpperCase()}</span></td>
            <td class="text-muted" style="font-size: 0.8rem">${formattedDate}</td>
          </tr>
        `;
      }).join('');

    } catch (e) {}
  }

  // Admin Configuration Settings Form Submit
  adminSettingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      markupPercent: parseInt(adminMarkupInput.value),
      bankId: adminBankIdInput.value.trim().toLowerCase(),
      bankAccount: adminBankAccountInput.value.trim(),
      bankName: adminBankNameInput.value.trim().toUpperCase(),
      comboViewServer: adminComboViewServerInput.value.trim(),
      comboLikeServer: adminComboLikeServerInput.value.trim(),
      comboCmtServer: adminComboCmtServerInput.value.trim()
    };

    if (adminApiKeyInput.value.trim()) {
      payload.apiKey = adminApiKeyInput.value.trim();
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast('Thành công', 'Đã lưu cấu hình hệ thống & Cổng VietQR Admin!', 'success');
        adminApiKeyInput.value = '';
        
        // Cập nhật comboConfig cục bộ lập tức
        comboConfig.comboViewServer = adminComboViewServerInput.value.trim();
        comboConfig.comboLikeServer = adminComboLikeServerInput.value.trim();
        comboConfig.comboCmtServer = adminComboCmtServerInput.value.trim();

        loadAdminPanel();
        loadServices(); // reload services to get new prices
      } else {
        showToast('Lỗi', 'Không thể lưu cài đặt.', 'error');
      }
    } catch (e) {
      showToast('Lỗi hệ thống', 'Có lỗi kết nối xảy ra.', 'error');
    }
  });

  // Admin Manual balance adjustments Submit
  adminBalanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      userId: adminSelectUser.value,
      amount: parseInt(adminBalanceAmount.value)
    };

    if (!payload.userId) {
      showToast('Cảnh báo', 'Vui lòng chọn tài khoản User.', 'warning');
      return;
    }

    try {
      const res = await fetch('/api/admin/users/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        showToast('Thành công', 'Đã nạp/trừ tiền ví thành viên thành công!', 'success');
        adminBalanceAmount.value = '';
        loadAdminPanel();
        checkSession(); // Update if editing self
      } else {
        showToast('Thất bại', 'Không thể thay đổi ví.', 'error');
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'Không thể thay đổi ví.', 'error');
    }
  });

  // ==========================================================================
  // TikTok Combo Boosting Logic (Views + Likes/Tims + CMT)
  // ==========================================================================

  function initComboCards() {
    // Lấy DOM các ô nhập tự chọn
    const customComboInputs = document.getElementById('custom-combo-inputs');
    const customViewsInp = document.getElementById('custom-views');
    const customLikesInp = document.getElementById('custom-likes');
    const customCommentsCountInp = document.getElementById('custom-comments-count');

    // Sự kiện click chuyển card
    comboCards.forEach(card => {
      card.addEventListener('click', () => {
        comboCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedComboId = card.getAttribute('data-combo');

        if (selectedComboId === 'custom') {
          customComboInputs.classList.remove('hidden');
        } else {
          customComboInputs.classList.add('hidden');
        }

        updateComboCosts();
      });
    });

    // Sự kiện thay đổi số lượng tự chọn
    if (customViewsInp) customViewsInp.addEventListener('input', updateComboCosts);
    if (customLikesInp) customLikesInp.addEventListener('input', updateComboCosts);
    if (customCommentsCountInp) customCommentsCountInp.addEventListener('input', updateComboCosts);
  }

  function updateComboCosts() {
    if (!allServices || allServices.length === 0) return;

    const viewServerId = comboConfig.comboViewServer || '60';
    const likeServerId = comboConfig.comboLikeServer || '29';
    const cmtServerId = comboConfig.comboCmtServer || '62';

    const viewService = allServices.find(s => s.id === viewServerId && s.type_api === 'tiktok.buff.view');
    const likeService = allServices.find(s => s.id === likeServerId && s.type_api === 'tiktok.buff.like');
    const cmtService = allServices.find(s => s.id === cmtServerId && s.type_api === 'tiktok.buff.cmt');

    // Mặc định nếu chưa load xong bảng giá từ API
    const viewRate = viewService ? viewService.rate : 0.72;
    const likeRate = likeService ? likeService.rate : 17.9;
    const cmtRate = cmtService ? cmtService.rate : 196.9;

    const bronzeCost = Math.ceil((1000 * viewRate) + (100 * likeRate) + (5 * cmtRate));
    const silverCost = Math.ceil((5000 * viewRate) + (300 * likeRate) + (10 * cmtRate));
    const goldCost = Math.ceil((10000 * viewRate) + (500 * likeRate) + (20 * cmtRate));

    // Tính giá gói Custom tự chọn
    const customViews = parseInt(document.getElementById('custom-views')?.value) || 0;
    const customLikes = parseInt(document.getElementById('custom-likes')?.value) || 0;
    const customCommentsCount = parseInt(document.getElementById('custom-comments-count')?.value) || 0;
    const customCost = Math.ceil((customViews * viewRate) + (customLikes * likeRate) + (customCommentsCount * cmtRate));

    const priceBronzeEl = document.getElementById('price-bronze');
    const priceSilverEl = document.getElementById('price-silver');
    const priceGoldEl = document.getElementById('price-gold');
    const priceCustomEl = document.getElementById('price-custom');

    if (priceBronzeEl) priceBronzeEl.textContent = `${bronzeCost.toLocaleString()} đ`;
    if (priceSilverEl) priceSilverEl.textContent = `${silverCost.toLocaleString()} đ`;
    if (priceGoldEl) priceGoldEl.textContent = `${goldCost.toLocaleString()} đ`;
    if (priceCustomEl) priceCustomEl.textContent = `${customCost.toLocaleString()} đ`;

    const costs = {
      bronze: bronzeCost,
      silver: silverCost,
      gold: goldCost,
      custom: customCost
    };

    const activeCost = costs[selectedComboId] !== undefined ? costs[selectedComboId] : 0;
    comboTotalCostText.textContent = `~ ${activeCost.toLocaleString()} VND`;
  }

  comboOrderForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!selectedComboId) {
      showToast('Cảnh báo', 'Vui lòng chọn một gói Combo.', 'warning');
      return;
    }

    const link = comboLinkInput.value.trim();
    if (!link) {
      showToast('Cảnh báo', 'Vui lòng nhập link video TikTok.', 'warning');
      return;
    }

    btnSubmitCombo.disabled = true;
    btnSubmitCombo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang kích hoạt các đơn song song...';

    const payload = {
      link: link,
      comboId: selectedComboId,
      customComments: comboCommentsInput.value.trim()
    };

    if (selectedComboId === 'custom') {
      payload.customViews = parseInt(document.getElementById('custom-views')?.value) || 0;
      payload.customLikes = parseInt(document.getElementById('custom-likes')?.value) || 0;
      payload.customCommentsCount = parseInt(document.getElementById('custom-comments-count')?.value) || 0;
    }

    try {
      const res = await fetch('/api/order/combo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok) {
        showToast('Kích hoạt Combo thành công!', data.message, 'success');
        
        // Reset form comments
        comboCommentsInput.value = '';

        // Cập nhật ví sidebar
        userBalanceText.textContent = `${data.newBalance.toLocaleString()}đ`;

        // Đồng bộ dữ liệu
        loadOrders();
        loadTransactions();

        // Kích hoạt theo dõi Combo song song!
        startComboLiveTracking(data.comboGroupId, link, selectedComboId);
      } else {
        showToast('Không thể mua Combo', data.error, 'error');
      }
    } catch (err) {
      showToast('Lỗi hệ thống', 'Có lỗi kết nối xảy ra.', 'error');
    } finally {
      btnSubmitCombo.disabled = false;
      btnSubmitCombo.innerHTML = '<span>Kích Hoạt Combo Đã Chọn</span> <i class="fa-solid fa-wand-magic-sparkles"></i>';
    }
  });

  async function autoTrackLastCombo() {
    try {
      const res = await fetch('/api/orders');
      const orders = await res.json();
      if (!orders || orders.length === 0) return;
      
      // Lọc lấy đơn có comboGroupId gần nhất
      const comboOrder = orders.find(o => o.comboGroupId);
      if (!comboOrder) return;
      
      const comboGroupId = comboOrder.comboGroupId;
      const link = comboOrder.link;
      
      // Xác định tên gói từ quantity hoặc các sub-order
      const comboSubOrders = orders.filter(o => o.comboGroupId === comboGroupId);
      let comboId = 'custom'; // mặc định
      
      // Thử đoán comboId dựa trên quantity của view/like nếu có
      const viewOrder = comboSubOrders.find(o => o.type_api === 'tiktok.buff.view');
      const likeOrder = comboSubOrders.find(o => o.type_api === 'tiktok.buff.like');
      if (viewOrder) {
        const qty = parseInt(viewOrder.quantity);
        if (qty === 1000) comboId = 'bronze';
        else if (qty === 5000) comboId = 'silver';
        else if (qty === 10000) comboId = 'gold';
      } else if (likeOrder) {
        const qty = parseInt(likeOrder.quantity);
        if (qty === 100) comboId = 'bronze';
        else if (qty === 300) comboId = 'silver';
        else if (qty === 500) comboId = 'gold';
      }
      
      startComboLiveTracking(comboGroupId, link, comboId);
    } catch (e) {
      console.error('Lỗi tự động theo dõi combo gần nhất:', e);
    }
  }

  let comboTrackingInterval = null;

  function startComboLiveTracking(comboGroupId, link, comboId) {
    if (comboTrackingInterval) clearInterval(comboTrackingInterval);

    // Set preview header
    const match = link.match(/@([a-zA-Z0-9_\.]+)/);
    document.getElementById('preview-combo-link').textContent = match ? `@${match[1]}` : 'Link Video TikTok';
    
    const comboNames = {
      bronze: 'Gói Đồng (Khởi Nghiệp)',
      silver: 'Gói Bạc (Bứt Phá)',
      gold: 'Gói Vàng (Lên Xu Hướng)',
      custom: 'Combo Tự Định Nghĩa'
    };
    document.getElementById('preview-combo-name').textContent = comboNames[comboId] || comboId.toUpperCase();

    // Khởi tạo khung hiển thị rỗng cho 3 đơn
    comboActiveTracker.innerHTML = `
      <div class="combo-tracker-group">
        <div class="combo-tracker-subcard" id="combo-sub-view">
          <h6><span><i class="fa-solid fa-eye text-accent"></i> Tăng Views</span> <span class="sub-type status-label status-pending">Đang cập nhật...</span></h6>
          <div class="progress-bar-container"><div class="progress-bar-fill" style="width: 5%"></div></div>
          <div class="tracking-metrics" style="padding: 0.6rem; font-size: 0.8rem;">
            <div class="metric-box"><span>Bắt đầu</span><strong>---</strong></div>
            <div class="metric-box"><span>Còn lại</span><strong>---</strong></div>
            <div class="metric-box"><span>Đã tăng</span><strong>---</strong></div>
          </div>
        </div>
        <div class="combo-tracker-subcard" id="combo-sub-like">
          <h6><span><i class="fa-solid fa-heart text-pink"></i> Tăng Tim</span> <span class="sub-type status-label status-pending">Đang cập nhật...</span></h6>
          <div class="progress-bar-container"><div class="progress-bar-fill" style="width: 5%"></div></div>
          <div class="tracking-metrics" style="padding: 0.6rem; font-size: 0.8rem;">
            <div class="metric-box"><span>Bắt đầu</span><strong>---</strong></div>
            <div class="metric-box"><span>Còn lại</span><strong>---</strong></div>
            <div class="metric-box"><span>Đã tăng</span><strong>---</strong></div>
          </div>
        </div>
        <div class="combo-tracker-subcard" id="combo-sub-cmt">
          <h6><span><i class="fa-solid fa-comment text-success"></i> Tăng Bình luận</span> <span class="sub-type status-label status-pending">Đang cập nhật...</span></h6>
          <div class="progress-bar-container"><div class="progress-bar-fill" style="width: 5%"></div></div>
          <div class="tracking-metrics" style="padding: 0.6rem; font-size: 0.8rem;">
            <div class="metric-box"><span>Bắt đầu</span><strong>---</strong></div>
            <div class="metric-box"><span>Còn lại</span><strong>---</strong></div>
            <div class="metric-box"><span>Đã tăng</span><strong>---</strong></div>
          </div>
        </div>
      </div>
    `;

    const pollComboStatus = async () => {
      try {
        // Tải toàn bộ đơn của user để lọc các đơn của Combo này
        const res = await fetch('/api/orders');
        const orders = await res.json();
        
        const comboSubOrders = orders.filter(o => o.comboGroupId === comboGroupId);
        if (comboSubOrders.length === 0) return; // Chưa kịp lưu hoặc không tìm thấy

        // Ẩn các subcard không được yêu cầu trong custom combo (quantity = 0)
        const hasView = comboSubOrders.some(o => o.type_api === 'tiktok.buff.view');
        const hasLike = comboSubOrders.some(o => o.type_api === 'tiktok.buff.like');
        const hasCmt = comboSubOrders.some(o => o.type_api === 'tiktok.buff.cmt');

        const viewSubCard = document.getElementById('combo-sub-view');
        const likeSubCard = document.getElementById('combo-sub-like');
        const cmtSubCard = document.getElementById('combo-sub-cmt');

        if (viewSubCard && !hasView) viewSubCard.classList.add('hidden');
        if (likeSubCard && !hasLike) likeSubCard.classList.add('hidden');
        if (cmtSubCard && !hasCmt) cmtSubCard.classList.add('hidden');

        // Cập nhật từng đơn thành phần
        for (const subOrder of comboSubOrders) {
          // Gọi API đồng bộ trạng thái thực tế từ SMM
          const checkRes = await fetch(`/api/orders/check/${subOrder.orderId}`);
          const order = await checkRes.json();
          
          if (order.error) continue;

          // Xác định loại dịch vụ
          let subCardId = '';
          if (order.type_api === 'tiktok.buff.view') {
            subCardId = 'combo-sub-view';
          } else if (order.type_api === 'tiktok.buff.like') {
            subCardId = 'combo-sub-like';
          } else if (order.type_api === 'tiktok.buff.cmt') {
            subCardId = 'combo-sub-cmt';
          }

          if (!subCardId) continue;

          const cardEl = document.getElementById(subCardId);
          if (cardEl) {
            // Cập nhật trạng thái
            const subTypeEl = cardEl.querySelector('.sub-type');
            if (subTypeEl) {
              const statusClass = getStatusClass(order.status);
              subTypeEl.className = `sub-type status-label ${statusClass}`;
              subTypeEl.textContent = getStatusTextVietnamese(order.status);
            }

            const start = parseInt(order.startCount) || 0;
            const remains = parseInt(order.remains) || 0;
            const total = parseInt(order.quantity);

            let completed = Math.max(0, total - remains);
            let progressPercent = Math.min(100, Math.floor((completed / total) * 100));

            if (order.status.toLowerCase() === 'completed') {
              completed = total;
              progressPercent = 100;
            } else if (progressPercent < 5) {
              progressPercent = 5;
            }

            const progressFill = cardEl.querySelector('.progress-bar-fill');
            if (progressFill) progressFill.style.width = `${progressPercent}%`;

            const metricBoxes = cardEl.querySelectorAll('.metric-box strong');
            if (metricBoxes.length >= 3) {
              metricBoxes[0].textContent = start || '0';
              metricBoxes[1].textContent = order.status.toLowerCase() === 'completed' ? '0' : remains;
              metricBoxes[2].textContent = `${completed}/${total}`;
              
              if (order.status.toLowerCase() === 'completed') {
                metricBoxes[1].classList.remove('pulsing');
              } else {
                metricBoxes[1].classList.add('pulsing');
              }
            }
          }
        }

        // Dừng quét khi tất cả đã xong
        const allCompleted = comboSubOrders.every(o => o.status.toLowerCase() === 'completed' || o.status.toLowerCase() === 'canceled');
        if (allCompleted) {
          clearInterval(comboTrackingInterval);
          showToast('Hoàn tất Combo!', 'Tất cả các tương tác trong Combo đã hoàn thành thành công!', 'success');
        }

      } catch (e) {
        console.error('Lỗi cập nhật tiến trình Combo:', e);
      }
    };

    pollComboStatus();
    comboTrackingInterval = setInterval(pollComboStatus, 8000); // 8 giây quét một lần
  }
});
