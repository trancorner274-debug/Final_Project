// Hàm xử lý đăng nhập
function loginUser(e) {
    e.preventDefault(); 
    // Ngăn form reload trang khi submit

    // Lấy giá trị email người dùng nhập
    const email = document.getElementById('email').value;

    // Lấy giá trị mật khẩu người dùng nhập
    const password = document.getElementById('password').value;

    // Kiểm tra nếu thiếu email hoặc password
    if (!email || !password) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return; 
        // Dừng hàm nếu dữ liệu không hợp lệ
    }

    // Gọi Firebase Auth để đăng nhập bằng email & password
    auth.signInWithEmailAndPassword(email, password)
        .then(async (userCredential) => {

            // Lấy UID của user sau khi đăng nhập thành công
            const uid = userCredential.user.uid; // ✅ UID CHUẨN

            // 🔥 LẤY THÔNG TIN USER TỪ FIRESTORE
            // Mục đích: kiểm tra role (admin / user)
            const userDoc = await db.collection('users').doc(uid).get();

            // Nếu không tồn tại document user trong Firestore
            if (!userDoc.exists) {
                alert("Không tìm thấy dữ liệu người dùng!");
                return;
            }

            // Lấy toàn bộ data của user
            const userData = userDoc.data();

            // Debug: in thông tin user ra console
            console.log("User data:", userData);

            // Thông báo đăng nhập thành công
            alert('Đăng nhập thành công!');

            // 👉 PHÂN QUYỀN DỰA TRÊN ROLE
            // role_id === 1 → Admin
            if (userData.role_id === 1) {
                window.location.href = 'admin.html'; 
                // Chuyển sang trang quản trị
            } else {
                window.location.href = 'main.html'; 
                // User thường → trang chính
            }
        })
        .catch((error) => {
            // Bắt lỗi nếu đăng nhập thất bại
            console.error('Lỗi đăng nhập:', error);

            // Thông báo lỗi cho người dùng
            alert('Đăng nhập thất bại: ' + error.message);
        });
}

// Lấy form đăng nhập
const loginForm = document.getElementById('loginForm');

// Gắn sự kiện submit cho form
loginForm.addEventListener('submit', loginUser);
