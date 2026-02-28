// =========================
// REGISTER USER
// - Tạo tài khoản Firebase Auth
// - Lưu thông tin user vào Firestore
// =========================
function registerUser(e) {
    e.preventDefault(); // Ngăn form reload trang

    // =========================
    // LẤY GIÁ TRỊ INPUT
    // =========================
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword =
        document.getElementById('confirmPassword').value;

    // =========================
    // GIÁ TRỊ MẶC ĐỊNH CHO USER
    // =========================
    const role_id = 2;   // 2 = User thường (1 = Admin)
    const balance = 0;   // Số dư ban đầu

    // =========================
    // VALIDATE DỮ LIỆU
    // =========================

    // Kiểm tra mật khẩu nhập lại
    if (password !== confirmPassword) {
        alert("Mật khẩu không khớp!");
        return;
    }

    // Kiểm tra thiếu thông tin
    if (!username || !email || !password) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    // =========================
    // TẠO USER BẰNG FIREBASE AUTH
    // =========================
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {

            // Lấy UID chuẩn từ Firebase Auth
            const uid = userCredential.user.uid;

            // =========================
            // DỮ LIỆU LƯU VÀO FIRESTORE
            // =========================
            const userData = {
                username: username, // Tên hiển thị
                email: email,       // Email đăng nhập
                role_id: role_id,   // Phân quyền
                balance: balance,   // Số dư ví
                createdAt: firebase
                    .firestore
                    .FieldValue
                    .serverTimestamp() // Thời gian tạo
            };

            // =========================
            // LƯU USER THEO UID (CHUẨN)
            // =========================
            db.collection('users')
              .doc(uid) // 🔑 Dùng UID làm document ID
              .set(userData)
              .then(() => {

                    alert('Đăng ký thành công!');

                    // Chuyển về trang đăng nhập
                    window.location.href = 'login.html';
              })
              .catch((error) => {
                    console.error(
                      'Lỗi khi lưu thông tin người dùng:',
                      error
                    );
                    alert('Không thể lưu thông tin người dùng.');
              });
        })
        .catch((error) => {
            console.error('Lỗi đăng ký:', error);
            alert('Đăng ký thất bại: ' + error.message);
        });
}

// =========================
// GẮN SỰ KIỆN SUBMIT FORM
// =========================
const registerForm =
    document.getElementById('registerForm');

registerForm.addEventListener('submit', registerUser);
