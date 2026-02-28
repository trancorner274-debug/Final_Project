// =========================
// ELEMENT
// =========================
// Lấy container hiển thị danh sách sản phẩm
const productList = document.getElementById("productList");

// =========================
// LOAD PRODUCTS
// - Chỉ lấy sản phẩm còn hàng (stock > 0)
// - Hiển thị cảnh báo nếu sắp hết hàng
// - Realtime với Firestore
// =========================
db.collection("products")
  .where("stock", ">", 0) // ❌ Ẩn sản phẩm đã hết hàng
  .onSnapshot(
    (snapshot) => {

      // Reset danh sách sản phẩm trước khi render lại
      productList.innerHTML = "";

      // Nếu không có sản phẩm nào
      if (snapshot.empty) {
        productList.innerHTML = `
          <p class="text-center text-muted">Không có sản phẩm.</p>
        `;
        return;
      }

      // Duyệt từng sản phẩm trong Firestore
      snapshot.forEach((doc) => {
        const p = doc.data();

        // Nếu tồn kho < 5 → hiển thị cảnh báo
        const warning =
          p.stock < 5
            ? `<span class="badge bg-warning text-dark mb-2">
                ⚠️ Sắp hết hàng
               </span>`
            : "";

        // Render card sản phẩm
        productList.innerHTML += `
          <div class="col-md-4 mb-4">
            <div class="card h-100 shadow-sm">
              
              <!-- Ảnh sản phẩm -->
              <img
                src="${p.imageUrl || "https://res.cloudinary.com/dvhiojpvf/image/upload/v1772250752/final_project/i8fwblobkthmbo7vkicb.png"}"
                class="card-img-top"
                style="object-fit:contain;height:200px;"
                onerror="this.src='https://res.cloudinary.com/dvhiojpvf/image/upload/v1772250752/final_project/i8fwblobkthmbo7vkicb.png'"
              />

              <div class="card-body d-flex flex-column">

                <!-- Tên sản phẩm -->
                <h5 class="card-title">${p.name}</h5>

                <!-- Giá -->
                <p class="text-danger fw-bold mb-1">
                  ${Number(p.price).toLocaleString("vi-VN")} ₫
                </p>

                <!-- Tồn kho -->
                <p class="text-muted mb-1">
                  Tồn kho: ${p.stock}
                </p>

                <!-- Badge cảnh báo sắp hết -->
                ${warning}

                <!-- Nút mua -->
                <button
                  class="btn btn-danger mt-auto"
                  onclick="buyProduct('${doc.id}')"
                >
                  🛒 Mua ngay
                </button>
              </div>
            </div>
          </div>
        `;
      });
    },

    // Bắt lỗi khi Firestore bị lỗi
    (error) => {
      console.error("Lỗi load sản phẩm:", error);
      productList.innerHTML =
        "<p class='text-danger'>Lỗi tải sản phẩm</p>";
    }
  );

// =========================
// BUY PRODUCT
// - Kiểm tra đăng nhập
// - Dùng Transaction (an toàn khi nhiều người mua)
// - Thêm / tăng số lượng trong giỏ hàng
// =========================
async function buyProduct(productId) {

  // Lấy user hiện tại
  const user = auth.currentUser;

  // Nếu chưa đăng nhập → không cho mua
  if (!user) {
    alert("⚠️ Vui lòng đăng nhập để mua hàng");
    return;
  }

  try {
    // Reference tới sản phẩm
    const productRef = db
      .collection("products")
      .doc(productId);

    // Reference tới item trong giỏ hàng của user
    const cartItemRef = db
      .collection("carts")
      .doc(user.uid)
      .collection("items")
      .doc(productId);

    // 🔒 TRANSACTION để tránh mua quá tồn kho
    await db.runTransaction(async (transaction) => {

      // =========================
      // READ FIRST (đọc dữ liệu trước)
      // =========================
      const productSnap = await transaction.get(productRef);
      const cartSnap = await transaction.get(cartItemRef);

      // Nếu sản phẩm không tồn tại
      if (!productSnap.exists) {
        throw "Sản phẩm không tồn tại";
      }

      const p = productSnap.data();

      // Nếu hết hàng
      if (p.stock <= 0) {
        throw "⛔ Sản phẩm đã hết hàng";
      }

      // =========================
      // WRITE AFTER (ghi dữ liệu sau)
      // =========================

      // Nếu sản phẩm đã có trong giỏ → tăng số lượng
      if (cartSnap.exists) {
        transaction.update(cartItemRef, {
          quantity: cartSnap.data().quantity + 1,
        });
      } 
      // Nếu chưa có → thêm mới
      else {
        transaction.set(cartItemRef, {
          productId: productId,
          name: p.name,
          price: p.price,
          imageUrl: p.imageUrl || "",
          quantity: 1,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    // Thông báo thành công
    alert("🛒 Đã thêm sản phẩm vào giỏ hàng!");

  } catch (err) {
    console.error("Lỗi mua hàng:", err);
    alert("❌ " + err);
  }
}

// =========================
// 🔐 KIỂM TRA ĐĂNG NHẬP (BẢO VỆ TRANG)
// =========================
auth.onAuthStateChanged(async (user) => {

    // Nếu chưa đăng nhập → về login
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    // 🔥 Lấy thông tin user để hiển thị lời chào
    try {
        const userDoc = await db
          .collection("users")
          .doc(user.uid)
          .get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            document.getElementById("welcomeText").textContent =
                `Xin chào, ${userData.username} 👋`;
        }
    } catch (error) {
        console.error("Lỗi lấy thông tin user:", error);
    }
});

// =========================
// 🔓 ĐĂNG XUẤT
// =========================
document.getElementById("logoutBtn").addEventListener("click", () => {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
});
