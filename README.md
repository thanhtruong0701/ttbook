# 🚀 TikTok Follower Booster - SMM Client Dashboard

Dự án này là một giao diện Dashboard chuyên nghiệp kết nối tới các nhà cung cấp SMM (Social Media Marketing) API để tự động tăng follow thực cho TikTok. Hệ thống được phát triển bằng **Node.js (Express)** và **HTML/CSS/JS thuần** với phong cách thiết kế **Glassmorphism** tối tân (Dark Mode, hiệu ứng phát sáng Neon, cập nhật thời gian thực).

---

## 🌟 Tính Năng Nổi Bật

1. **Giao Diện Siêu Đẹp (Premium Glassmorphism):** Giao diện Dark Mode lấy cảm hứng từ vũ trụ kết hợp với hai tông màu Neon đặc trưng của TikTok (Teal & Pink).
2. **Theo Dõi Đơn Hàng Thời Gian Thực (Live Polling):** Sau khi bấm kích hoạt tăng follow, hệ thống sẽ mở bảng theo dõi trực tiếp số lượng follower hiện tại, số lượng còn lại cần tăng và thanh tiến trình chạy động cực mượt.
3. **Cấu Hình API Linh Hoạt từ Web:** Bạn có thể điền thông tin cổng API URL và API Key của bất kỳ nhà cung cấp nào ngay trên giao diện web mà không cần sửa file code.
4. **Hỗ Trợ Chế Độ Giả Lập (Mock Mode) Để Test Giao Diện:** Khi chưa có API Key thật, hệ thống sẽ tự động chuyển sang chế độ giả lập để bạn trải nghiệm trọn vẹn luồng hoạt động mà không tốn phí!

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

Dự án đã được lưu trữ sẵn tại ổ đĩa: `E:\TiktokFollowerPanel`. Hãy thực hiện các bước sau để khởi chạy:

### Bước 1: Mở Terminal tại thư mục dự án
Bạn mở PowerShell hoặc Command Prompt trên Windows và chuyển đến thư mục dự án:
```powershell
cd E:\TiktokFollowerPanel
```

### Bước 2: Cài đặt các thư viện (Dependencies)
Chạy lệnh sau để cài đặt Express, Dotenv và Node-Fetch:
```powershell
npm install
```

### Bước 3: Khởi chạy dự án
Chạy lệnh sau để bắt đầu chạy máy chủ ở chế độ phát triển (Tự động tải lại khi đổi code):
```powershell
npm run dev
```

Sau khi chạy thành công, mở trình duyệt và truy cập: **`http://localhost:3000`**

---

## 📝 Hướng Dẫn Cấu Hình API Để Chạy Thực Tế (Tăng 100 Follower Thật)

Hệ thống hỗ trợ chuẩn **SMM Reseller API v2** phổ biến toàn cầu. Dưới đây là các bước để chạy đơn thật:

### Bước 1: Đăng ký một tài khoản SMM Panel
Bạn có thể đăng ký một tài khoản miễn phí trên các trang dịch vụ trung gian uy tín tại Việt Nam như:
* `https://subgiare.vn`
* `https://topsubviet.com`
* `https://tudong88.com`

### Bước 2: Lấy mã API Key
Sau khi đăng nhập:
1. Vào mục **Cấu hình tài khoản** hoặc **Tích hợp API**.
2. Tìm và copy chuỗi mã **API Key** (Token) cá nhân của bạn.

### Bước 3: Chọn mã Dịch Vụ (Service ID)
1. Vào trang **Bảng Giá** dịch vụ trên web SMM đó.
2. Tìm phần **TikTok Follower** (Gói phụ sub-sale hoặc sub-speed).
3. Ghi lại số **ID** của gói đó (Ví dụ: `37`, `100` hoặc `142`). Chi phí tăng 100 followers thường dao động từ 3,000đ - 10,000đ rất rẻ.

### Bước 4: Nạp số dư nhỏ để test thử
Bạn tiến hành nạp khoảng 10,000 VND (qua ngân hàng tự động trên web đó) để tài khoản có số dư chạy thử.

### Bước 5: Điền thông tin vào Dashboard
1. Truy cập giao diện `http://localhost:3000` trên máy tính của bạn.
2. Vào tab **Cấu Hình API**.
3. Điền đường dẫn API URL (Ví dụ: `https://topsubviet.com/api/v2`).
4. Điền **SMM API Key** của bạn.
5. Nhập **Mã Dịch Vụ Mặc Định** và ấn **Lưu Cấu Hình**.

### Bước 6: Kích Hoạt Tăng Follow
1. Quay lại tab **Tăng Follower**.
2. Nhập link TikTok của bạn: `https://www.tiktok.com/@goccuake0712`.
3. Số lượng nhập `100` và điền ID gói dịch vụ tương ứng.
4. Bấm **Kích Hoạt Tăng 100 Follower**. Hệ thống sẽ tự động đặt đơn, trả về mã đơn hàng thật và bắt đầu quá trình đồng bộ tăng follow cho tới khi hoàn tất!

---

## 💡 Lưu Ý Quan Trọng Về Bảo Mật
* Mọi cấu hình API Key của bạn được lưu cục bộ trong tệp `E:\TiktokFollowerPanel\config.json` và xử lý trực tiếp ở Backend (`server.js`). 
* Hệ thống **KHÔNG BAO GIỜ** gửi lộ API Key của bạn lên Frontend hay qua bất kỳ bên thứ ba nào ngoài API Panel bạn đã cấu hình. Đảm bảo an toàn tuyệt đối 100% số dư của bạn.
