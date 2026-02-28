// 🔐 KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
// Hàm này luôn chạy khi load trang hoặc khi trạng thái đăng nhập thay đổi
auth.onAuthStateChanged(async (user) => {

    // Nếu chưa đăng nhập → đá về trang login
    if (!user) {
        window.location.href = "login.html";
        return; // Dừng không chạy code phía dưới
    }

    // 🔥 LẤY THÔNG TIN USER TỪ FIRESTORE (username, role, ...)
    try {
        const userDoc = await db
            .collection("users")
            .doc(user.uid)
            .get();

        // Nếu tồn tại document user
        if (userDoc.exists) {
            const userData = userDoc.data();

            // Hiển thị lời chào người dùng
            document.getElementById("welcomeText").textContent =
                `Xin chào, ${userData.username} 👋`;
        }
    } catch (error) {
        // Bắt lỗi nếu Firestore bị lỗi hoặc mất kết nối
        console.error("Lỗi lấy thông tin user:", error);
    }
});

// 🔓 ĐĂNG XUẤT
// Khi bấm nút Logout
document.getElementById("logoutBtn").addEventListener("click", () => {

    // Gọi Firebase Auth để đăng xuất
    auth.signOut().then(() => {

        // Sau khi đăng xuất → quay về trang login
        window.location.href = "login.html";
    });
});


// =========================
// HIỂN THỊ SẢN PHẨM NGẪU NHIÊN TRONG TABLE
// =========================
db.collection("products").get().then((querySnapshot) => {

    // Lấy bảng sản phẩm nổi bật
    const table = document.getElementById("featuredProductsTable");

    // Lấy <tbody> bên trong table
    const tableBody = table?.querySelector("tbody");

    // Nếu không tìm thấy bảng → dừng
    if (!tableBody) return;

    // Xoá dữ liệu cũ trong bảng
    tableBody.innerHTML = "";

    // Mảng chứa toàn bộ sản phẩm
    const products = [];

    // Duyệt từng document trong Firestore
    querySnapshot.forEach((doc) => {
        // Gộp id + data của sản phẩm
        products.push({ id: doc.id, ...doc.data() });
    });

    // Random danh sách sản phẩm
    const randomProducts = products
        .sort(() => 0.5 - Math.random()) // Trộn mảng
        .slice(0, 5);                    // Lấy 5 sản phẩm

    // Render từng sản phẩm ra table
    randomProducts.forEach((p) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <img 
                  src="${p.imageUrl || 'https://res.cloudinary.com/dvhiojpvf/image/upload/v1772250752/final_project/i8fwblobkthmbo7vkicb.png'}"
                  width="60"
                  height="60"
                  style="object-fit: cover; border-radius: 6px;"
                >
            </td>
            <td>${p.name}</td>
            <td>${p.category}</td>
            <td>${Number(p.price).toLocaleString("vi-VN")} ₫</td>
            <td>⭐ ${p.rating ?? "4.5"}</td>
        `;

        // Thêm dòng vào bảng
        tableBody.appendChild(row);
    });

}).catch(err => 
    // Bắt lỗi nếu không lấy được dữ liệu từ Firestore
    console.error("Lỗi lấy sản phẩm:", err)
);
