// =========================
// ELEMENTS – LẤY CÁC PHẦN TỬ HTML
// =========================
const productForm = document.getElementById("productForm");   // form thêm / sửa sản phẩm
const productsList = document.getElementById("productsList"); // nơi hiển thị danh sách sản phẩm
const ordersList = document.getElementById("ordersList");     // bảng danh sách đơn hàng

// các ô hiển thị số liệu dashboard
const totalRevenueEl = document.getElementById("totalRevenue");   // tổng doanh thu
const totalOrdersEl = document.getElementById("totalOrders");     // tổng đơn hàng
const pendingOrdersEl = document.getElementById("pendingOrders"); // đơn đang xử lý
const doneOrdersEl = document.getElementById("doneOrders");       // đơn hoàn thành


// =========================
// FORM INPUTS
// (fix lỗi undefined khi submit form)
// =========================
const productId = document.getElementById("productId"); // input ẩn dùng để biết đang sửa hay thêm mới
const name = document.getElementById("name");           // tên sản phẩm
const price = document.getElementById("price");         // giá
const stock = document.getElementById("stock");         // tồn kho
const category = document.getElementById("category");   // danh mục
const imageUrl = document.getElementById("imageUrl");   // link ảnh
const description = document.getElementById("description"); // mô tả


// =========================
// AUTH CHECK – KIỂM TRA ADMIN
// =========================
auth.onAuthStateChanged(async (user) => {
  // nếu chưa đăng nhập
  if (!user) {
    alert("Bạn chưa đăng nhập");
    window.location.href = "login.html"; // đá về trang login
    return;
  }

  // lấy dữ liệu user từ Firestore
  const userDoc = await db.collection("users").doc(user.uid).get();

  // nếu không tồn tại user hoặc không phải admin
  if (!userDoc.exists || userDoc.data().role_id !== 1) {
    alert("Bạn không có quyền admin");
    window.location.href = "main.html"; // quay về trang chính
    return;
  }

  // INIT – load dữ liệu khi là admin hợp lệ
  loadDashboard();
  loadProducts();
  loadOrders();
});


// =========================
// DASHBOARD – THỐNG KÊ
// =========================
function loadDashboard() {
  // lắng nghe realtime collection orders
  db.collection("orders").onSnapshot((snapshot) => {
    let revenue = 0; // tổng doanh thu
    let done = 0;    // số đơn hoàn thành
    let pending = 0; // số đơn đang xử lý / đang giao

    snapshot.forEach((doc) => {
      const o = doc.data(); // dữ liệu đơn hàng

      // ✅ chỉ tính doanh thu khi đã thanh toán
      if (o.paymentStatus === "Đã thanh toán") {
        revenue += Number(o.total || 0);
      }

      // đếm trạng thái đơn
      if (o.status === "Hoàn thành") done++;
      if (o.status === "Đang xử lý" || o.status === "Đang giao") pending++;
    });

    // hiển thị lên giao diện
    totalRevenueEl.textContent = revenue.toLocaleString("vi-VN") + " ₫";
    totalOrdersEl.textContent = snapshot.size;
    doneOrdersEl.textContent = done;
    pendingOrdersEl.textContent = pending;
  });
}


// =========================
// PRODUCTS – THÊM / SỬA SẢN PHẨM
// =========================
productForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // chặn reload trang

  // gom dữ liệu từ form
  const data = {
    name: name.value?.trim() || "",           // tên sản phẩm
    price: Number(price.value) || 0,          // giá (ép số)
    stock: Number(stock.value) || 0,          // tồn kho
    category: category.value || "",            // danh mục
    imageUrl: imageUrl.value?.trim() || "",    // link ảnh
    description: description.value?.trim() || "", // mô tả
  };

  // validate dữ liệu cơ bản
  if (!data.name || data.price <= 0) {
    alert("Vui lòng nhập tên và giá hợp lệ");
    return;
  }

  // nếu có productId => đang sửa
  if (productId.value) {
    await db.collection("products").doc(productId.value).update(data);
  } 
  // ngược lại là thêm mới
  else {
    await db.collection("products").add(data);
  }

  // reset form sau khi xong
  productForm.reset();
  productId.value = "";
});


// =========================
// LOAD DANH SÁCH SẢN PHẨM
// =========================
function loadProducts() {
  db.collection("products").onSnapshot((snapshot) => {
    productsList.innerHTML = ""; // clear list

    snapshot.forEach((doc) => {
      const p = doc.data(); // dữ liệu sản phẩm

      // render từng card sản phẩm
      productsList.innerHTML += `
        <div class="card mb-2">
          <div class="card-body d-flex justify-content-between align-items-center">
            
            <!-- ảnh sản phẩm -->
            <img src="${p.imageUrl}" alt="${p.name}" width="50" height="50" class="me-2">
            
            <!-- thông tin sản phẩm -->
            <div class="product-info text-center flex-grow-1">
              <strong>${p.name}</strong>
              <div>${p.price.toLocaleString("vi-VN")} ₫</div>
              <small>Tồn kho: ${p.stock}</small>
            </div>

            <!-- nút sửa / xoá -->
            <div>
              <button class="btn btn-sm btn-warning"
                onclick="editProduct('${doc.id}')">✏️</button>
              <button class="btn btn-sm btn-danger"
                onclick="deleteProduct('${doc.id}')">🗑️</button>
            </div>
          </div>
        </div>
      `;
    });
  });
}


// =========================
// EDIT PRODUCT – ĐỔ DỮ LIỆU LÊN FORM
// =========================
async function editProduct(id) {
  const snap = await db.collection("products").doc(id).get();
  const p = snap.data();

  // gán dữ liệu vào form
  productId.value = id;
  name.value = p.name || "";
  price.value = p.price || 0;
  stock.value = p.stock || 0;
  category.value = p.category || "";
  imageUrl.value = p.imageUrl || "";
  description.value = p.description || "";
}


// =========================
// DELETE PRODUCT
// =========================
async function deleteProduct(id) {
  if (!confirm("Xoá sản phẩm này?")) return; // xác nhận xoá
  await db.collection("products").doc(id).delete();
}


// =========================
// ORDERS – QUẢN LÝ ĐƠN HÀNG
// =========================
function loadOrders() {
  db.collection("orders").onSnapshot((snapshot) => {
    ordersList.innerHTML = ""; // clear bảng

    snapshot.forEach((doc) => {
      const o = doc.data(); // dữ liệu đơn hàng

      ordersList.innerHTML += `
        <tr>
          <!-- tổng tiền -->
          <td class="fw-bold">
            ${o.total.toLocaleString("vi-VN")} ₫
          </td>

          <!-- phương thức thanh toán -->
          <td>
            ${o.paymentMethod || "—"}
          </td>

          <!-- trạng thái thanh toán -->
          <td>
            <select class="form-select form-select-sm"
              onchange="updatePaymentStatus('${doc.id}', this.value)">
              
              <option value="Chờ thanh toán"
                ${o.paymentStatus === "Chờ thanh toán" ? "selected" : ""}>
                🟡 Chờ thanh toán
              </option>

              <option value="Đã thanh toán"
                ${o.paymentStatus === "Đã thanh toán" ? "selected" : ""}>
                ✅ Đã thanh toán
              </option>

              <option value="Hết hạn"
                ${o.paymentStatus === "Hết hạn" ? "selected" : ""}>
                ❌ Hết hạn
              </option>
            </select>
          </td>

          <!-- trạng thái đơn hàng -->
          <td>
            <select class="form-select form-select-sm"
              onchange="updateOrderStatus('${doc.id}', this.value)">
              
              <option ${o.status === "Đang xử lý" ? "selected" : ""}>
                Đang xử lý
              </option>

              <option ${o.status === "Đang giao" ? "selected" : ""}>
                Đang giao
              </option>

              <option ${o.status === "Hoàn thành" ? "selected" : ""}>
                Hoàn thành
              </option>
            </select>
          </td>
        </tr>
      `;
    });
  });
}


// =========================
// UPDATE PAYMENT STATUS
// =========================
function updatePaymentStatus(orderId, value) {
  db.collection("orders").doc(orderId).update({
    paymentStatus: value, // cập nhật trạng thái thanh toán
  });
}


// =========================
// UPDATE ORDER STATUS
// =========================
function updateOrderStatus(orderId, value) {
  db.collection("orders").doc(orderId).update({
    status: value, // cập nhật trạng thái đơn hàng
  });
}
