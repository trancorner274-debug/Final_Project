// Tìm nút chuyển đổi Dark Mode hiện có trong DOM
let darkModeBtn = document.getElementById('darkModeToggle');

// Nếu chưa tồn tại nút Dark Mode thì tạo mới
if (!darkModeBtn) {
  darkModeBtn = document.createElement('button'); 
  // Tạo thẻ <button>

  darkModeBtn.id = 'darkModeToggle'; 
  // Gán id để lần sau không tạo trùng

  darkModeBtn.className = 'btn-toggle'; 
  // Gán class (nếu muốn style thêm bằng CSS)

  darkModeBtn.textContent = '🌙 Dark Mode'; 
  // Text hiển thị mặc định

  document.body.appendChild(darkModeBtn); 
  // Thêm nút vào cuối trang
}

// Thiết lập CSS inline để nút luôn nổi ở góc dưới bên phải
Object.assign(darkModeBtn.style, {
  position: 'fixed',        // Cố định vị trí khi scroll
  bottom: '20px',           // Cách đáy 20px
  right: '20px',            // Cách phải 20px
  zIndex: '999',            // Luôn nổi trên các thành phần khác
  padding: '10px 15px',     // Khoảng đệm cho nút
  border: 'none',           // Bỏ viền mặc định
  borderRadius: '8px',      // Bo góc mềm
  backgroundColor: '#244cc5cf', // Màu nền nút
  color: '#fff',            // Màu chữ
  cursor: 'pointer',        // Hover thành icon bàn tay
});

// Kiểm tra trạng thái Dark Mode đã lưu trước đó hay chưa
if (localStorage.getItem('darkMode') === 'enabled') {
  document.body.classList.add('dark-mode'); 
  // Nếu đã bật → thêm class dark-mode cho body

  darkModeBtn.textContent = '☀ Light Mode'; 
  // Đổi text nút cho đúng trạng thái hiện tại
}

// Bắt sự kiện click vào nút Dark Mode
darkModeBtn.addEventListener('click', () => {

  // Bật/Tắt class dark-mode cho body
  document.body.classList.toggle('dark-mode');

  // Kiểm tra sau khi toggle xem đang ở chế độ nào
  if (document.body.classList.contains('dark-mode')) {

    // Nếu đang là Dark Mode → lưu trạng thái
    localStorage.setItem('darkMode', 'enabled');

    // Đổi text nút sang Light Mode
    darkModeBtn.textContent = '☀ Light Mode';

  } else {

    // Nếu quay về Light Mode → lưu lại
    localStorage.setItem('darkMode', 'disabled');

    // Đổi text nút sang Dark Mode
    darkModeBtn.textContent = '🌙 Dark Mode';
  }
});
