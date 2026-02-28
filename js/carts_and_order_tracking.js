// carts_and_order_tracking.js
// =========================
// LẤY CÁC PHẦN TỬ HTML
// =========================
const cartItemsEl = document.getElementById("cartItems");       // khu vực hiển thị giỏ hàng
const orderTrackingEl = document.getElementById("orderTracking"); // khu vực theo dõi đơn hàng
const logoutBtn = document.getElementById("logoutBtn");         // nút đăng xuất
const welcomeText = document.getElementById("welcomeText");     // text chào người dùng

let currentUid = null;      // UID user hiện tại
let selectedTotal = 0;      // tổng tiền đang chuẩn bị thanh toán

// =========================
// QR STATE – TRẠNG THÁI QR
// =========================
let qrTimer = null;         // biến lưu interval đếm ngược
let qrExpired = false;      // QR đã hết hạn hay chưa
let qrTimeLeft = 120;       // thời gian QR (2 phút)


// =========================
// AUTH CHECK – KIỂM TRA ĐĂNG NHẬP
// =========================
auth.onAuthStateChanged(async (user) => {
  // chưa đăng nhập → đá về login
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUid = user.uid; // lưu UID user

  // lấy thông tin user để hiển thị lời chào
  try {
    const userDoc = await db.collection("users").doc(user.uid).get();
    if (userDoc.exists) {
      welcomeText.textContent =
        `Xin chào, ${userDoc.data().username} 👋`;
    }
  } catch (err) {
    console.error("Lỗi lấy user:", err);
  }

  // bật realtime giỏ hàng + load đơn hàng
  listenCartRealtime(currentUid);
  loadOrders(currentUid);
});


// =========================
// REALTIME CART – GIỎ HÀNG REALTIME
// =========================
function listenCartRealtime(uid) {
  db.collection("carts")
    .doc(uid)
    .collection("items")
    .onSnapshot((snapshot) => {

      // nếu giỏ trống
      if (snapshot.empty) {
        cartItemsEl.innerHTML =
          "<p class='text-muted'>Giỏ hàng của bạn đang trống.</p>";
        return;
      }

      let total = 0; // tổng tiền
      let html = `
        <table class="table table-bordered bg-white align-middle">
          <thead class="table-light">
            <tr>
              <th>Ảnh</th>
              <th>Sản phẩm</th>
              <th>Số lượng</th>
              <th>Giá</th>
              <th>Tổng</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
      `;

      snapshot.forEach((doc) => {
        const item = doc.data();                // dữ liệu item
        const itemTotal = item.price * item.quantity;
        total += itemTotal;                     // cộng vào tổng

        html += `
          <tr>
            <td style="width:90px">
              <img src="${item.imageUrl || "https://via.placeholder.com/80"}"
                style="width:80px;height:80px;object-fit:contain">
            </td>

            <td>${item.name}</td>

            <!-- tăng / giảm số lượng -->
            <td style="width:130px">
              <button class="btn btn-sm btn-outline-secondary"
                onclick="updateQuantity('${doc.id}', -1)">➖</button>
              <span class="mx-2 fw-bold">${item.quantity}</span>
              <button class="btn btn-sm btn-outline-secondary"
                onclick="updateQuantity('${doc.id}', 1)">➕</button>
            </td>

            <td>${item.price.toLocaleString("vi-VN")} ₫</td>

            <td class="fw-bold text-danger">
              ${itemTotal.toLocaleString("vi-VN")} ₫
            </td>

            <!-- xoá sản phẩm -->
            <td>
              <button class="btn btn-sm btn-danger"
                onclick="removeItem('${doc.id}')">🗑️</button>
            </td>
          </tr>
        `;
      });

      // footer tổng tiền + nút thanh toán
      html += `
          </tbody>
        </table>
        <div class="text-end mt-3">
          <h5>
            Tổng tiền:
            <span class="text-danger fw-bold">
              ${total.toLocaleString("vi-VN")} ₫
            </span>
          </h5>
          <button class="btn btn-success mt-2"
            onclick="openPayment(${total})">
            💳 Thanh toán
          </button>
        </div>
      `;

      cartItemsEl.innerHTML = html;
    });
}


// =========================
// UPDATE QUANTITY – TĂNG / GIẢM SỐ LƯỢNG
// =========================
async function updateQuantity(productId, change) {
  const ref = db
    .collection("carts")
    .doc(currentUid)
    .collection("items")
    .doc(productId);

  const snap = await ref.get();
  if (!snap.exists) return;

  const newQty = snap.data().quantity + change;

  // nếu số lượng <= 0 → xoá item
  if (newQty <= 0) await ref.delete();
  else await ref.update({ quantity: newQty });
}


// =========================
// REMOVE ITEM – XOÁ SẢN PHẨM
// =========================
async function removeItem(productId) {
  if (!confirm("Xoá sản phẩm khỏi giỏ hàng?")) return;

  await db
    .collection("carts")
    .doc(currentUid)
    .collection("items")
    .doc(productId)
    .delete();
}


// =========================
// OPEN PAYMENT MODAL – MỞ MODAL THANH TOÁN
// =========================
function openPayment(total) {
  selectedTotal = total; // lưu tổng tiền

  // reset trạng thái QR
  clearInterval(qrTimer);
  qrExpired = false;

  document.getElementById("paymentSelect").style.display = "block";
  document.getElementById("qrPayment").style.display = "none";

  const modal = new bootstrap.Modal(
    document.getElementById("paymentModal")
  );
  modal.show();
}


// =========================
// SHOW QR PAYMENT – HIỂN THỊ QR (GIẢ LẬP)
// =========================
function showQRPayment() {
  document.getElementById("paymentSelect").style.display = "none";
  document.getElementById("qrPayment").style.display = "block";

  qrExpired = false;
  qrTimeLeft = 120;

  // dữ liệu encode vào QR
  const paymentInfo =
    `PAYMENT|CHO_CONG_NGHE|AMOUNT:${selectedTotal}`;

  // dùng API tạo QR
  const qrUrl =
    `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentInfo)}`;

  document.getElementById("qrImage").src = qrUrl;
  document.getElementById("qrImage").style.opacity = "1";
  document.getElementById("qrAmount").innerText =
    `Số tiền: ${selectedTotal.toLocaleString("vi-VN")} ₫`;

  startQRTimer();
}


// =========================
// QR TIMER – ĐẾM NGƯỢC QR
// =========================
function startQRTimer() {
  const timerEl = document.getElementById("qrTimer");
  const confirmBtn = document.getElementById("qrConfirmBtn");

  clearInterval(qrTimer);
  confirmBtn.disabled = false;
  timerEl.innerText = "⏳ Thời gian còn lại: 02:00";

  qrTimer = setInterval(() => {
    qrTimeLeft--;

    const min = String(Math.floor(qrTimeLeft / 60)).padStart(2, "0");
    const sec = String(qrTimeLeft % 60).padStart(2, "0");
    timerEl.innerText = `⏳ Thời gian còn lại: ${min}:${sec}`;

    // hết thời gian → QR hết hạn
    if (qrTimeLeft <= 0) {
      clearInterval(qrTimer);
      qrExpired = true;
      timerEl.innerText = "❌ QR đã hết hạn";
      document.getElementById("qrImage").style.opacity = "0.4";
      confirmBtn.disabled = true;
    }
  }, 1000);
}


// =========================
// CONFIRM QR PAYMENT – XÁC NHẬN QR
// =========================
async function confirmQRPayment() {
  if (qrExpired) {
    alert("❌ QR đã hết hạn. Vui lòng tạo lại.");
    return;
  }

  clearInterval(qrTimer);
  await confirmPayment("QR Code (giả lập)", "Đã thanh toán");
}


// =========================
// CONFIRM PAYMENT – LƯU ĐƠN HÀNG
// =========================
async function confirmPayment(method, paymentStatus) {
  const cartRef = db
    .collection("carts")
    .doc(currentUid)
    .collection("items");

  const snapshot = await cartRef.get();
  if (snapshot.empty) return;

  const items = [];              // danh sách sản phẩm
  const batch = db.batch();      // batch để update nhiều thứ cùng lúc

  snapshot.forEach((doc) => {
    const item = doc.data();
    items.push(item);

    // trừ tồn kho sản phẩm
    const productRef = db
      .collection("products")
      .doc(item.productId);

    batch.update(productRef, {
      stock: firebase.firestore.FieldValue.increment(-item.quantity),
    });

    // xoá item khỏi giỏ
    batch.delete(doc.ref);
  });

  // tạo đơn hàng mới
  const orderRef = db.collection("orders").doc();
  batch.set(orderRef, {
    userId: currentUid,
    items,
    total: selectedTotal,
    paymentMethod: method,
    paymentStatus: paymentStatus,
    status: "Đang xử lý",
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  // đóng modal
  bootstrap.Modal
    .getInstance(document.getElementById("paymentModal"))
    .hide();

  alert("🎉 Thanh toán thành công!");
}


// =========================
// LOAD ORDERS – THEO DÕI ĐƠN HÀNG
// =========================
async function loadOrders(uid) {
  const snapshot = await db
    .collection("orders")
    .where("userId", "==", uid)
    .orderBy("createdAt", "desc")
    .get();

  if (snapshot.empty) {
    orderTrackingEl.innerHTML =
      "<p class='text-muted'>Chưa có đơn hàng nào.</p>";
    return;
  }

  let html = "";
  snapshot.forEach((doc) => {
    const o = doc.data();
    html += `
      <div class="card mb-3">
        <div class="card-body">
          <span class="badge bg-info">${o.status}</span>
          <p class="mb-1">
            Thanh toán:
            <span class="badge bg-warning text-dark">
              ${o.paymentStatus}
            </span>
          </p>
          <strong class="text-danger">
            ${o.total.toLocaleString("vi-VN")} ₫
          </strong>
          <div class="text-muted">${o.paymentMethod}</div>
        </div>
      </div>
    `;
  });

  orderTrackingEl.innerHTML = html;
}


// =========================
// LOGOUT – ĐĂNG XUẤT
// =========================
logoutBtn.addEventListener("click", async () => {
  await auth.signOut();                 // đăng xuất Firebase
  window.location.href = "login.html"; // về trang login
});
