/* ==========================================================
   Chatbot Widget – Chợ Công Nghệ AI
========================================================== */

// IIFE: hàm tự chạy ngay khi file được load, tránh làm bẩn global scope
(async () => {

  /* ========== CONFIG ========== */
  const API_KEY = "fw_9thsuzMBaJW5jieGa8ZPWy"; 
  // API key dùng để gọi Fireworks AI (nên giấu ở backend khi làm thật)

  const MODEL = "accounts/fireworks/models/minimax-m2p1";
  // Model AI được sử dụng để chat


  /* ========== CONTEXT MEMORY ========== */
  const chatHistory = [];
  // Lưu lịch sử hội thoại (user + assistant)

  const MAX_CONTEXT = 6; 
  // Giữ tối đa 6 message gần nhất (≈ 3 lượt hỏi – đáp)

  function trimContext() {
    // Nếu lịch sử quá dài thì xoá bớt tin nhắn cũ
    if (chatHistory.length > MAX_CONTEXT) {
      chatHistory.splice(0, chatHistory.length - MAX_CONTEXT);
    }
  }


  /* ========== SYSTEM PROMPT ========== */
  const SYSTEM_PROMPT = `
  Bạn là trợ lý AI của Chợ Công Nghệ...
  `;
  // Prompt hệ thống: định hướng tính cách + kiến thức cho AI
  // AI sẽ luôn trả lời dựa trên nội dung này


  /* ========== CSS ========== */
  const style = document.createElement("style");
  // Tạo thẻ <style> bằng JS

  style.textContent = `
    /* Widget chính */
    .chatbot-widget{
      position:fixed;
      right:18px;
      bottom:84px;
      z-index:99999;
      font-family:Segoe UI,Arial
    }

    /* Nút nổi 💬 */
    .chatbot-floating-btn{
      width:56px;height:56px;
      border-radius:28px;
      background:#111;color:#fff;
      display:flex;align-items:center;justify-content:center;
      cursor:pointer;
      box-shadow:0 6px 20px rgba(0,0,0,.25);
      font-size:22px
    }

    /* Khung chat */
    .chatbot-panel{
      width:380px;
      max-height:560px;
      background:#fff;
      border-radius:12px;
      box-shadow:0 14px 40px rgba(0,0,0,.18);
      display:none;
      flex-direction:column;
      overflow:hidden;
      animation:fadeIn .25s ease
    }

    /* Header */
    .chatbot-header{
      padding:10px 14px;
      background:#f7f7f7;
      border-bottom:1px solid #eee;
      display:flex;
      justify-content:space-between;
      font-weight:600
    }

    /* Body chat */
    .chatbot-body{
      padding:12px;
      flex:1;
      overflow:auto;
      background:#fafafa
    }

    /* Input + button */
    .chatbot-input{
      display:flex;
      gap:8px;
      padding:10px;
      border-top:1px solid #eee
    }

    .chatbot-input input{
      flex:1;
      padding:8px 10px;
      border-radius:8px;
      border:1px solid #ddd
    }

    .chatbot-input button{
      background:#111;
      color:#fff;
      border:none;
      border-radius:8px;
      padding:8px 14px
    }

    /* Tin nhắn */
    .chatbot-message{
      margin-bottom:10px;
      display:flex
    }

    .chatbot-message.user{
      justify-content:flex-end
    }

    .chatbot-message .bubble{
      padding:8px 12px;
      border-radius:12px;
      max-width:78%;
      white-space:pre-wrap
    }

    .chatbot-message.user .bubble{
      background:#111;color:#fff
    }

    .chatbot-message.bot .bubble{
      background:#eaeaea;color:#111
    }

    /* Animation mở panel */
    @keyframes fadeIn{
      from{opacity:0;transform:translateY(12px)}
      to{opacity:1}
    }
  `;
  document.head.appendChild(style);
  // Gắn CSS vào <head>


  /* ========== HTML ========== */
  const container = document.createElement("div");
  container.className = "chatbot-widget";

  container.innerHTML = `
    <!-- Nút mở chat -->
    <div class="chatbot-floating-btn">💬</div>

    <!-- Panel chat -->
    <div class="chatbot-panel">
      <div class="chatbot-header">
        <span>Chợ Công Nghệ AI</span>
        <span class="chatbot-close" style="cursor:pointer">&times;</span>
      </div>

      <!-- Nội dung chat -->
      <div class="chatbot-body" id="chatbotBody">
        <div class="chatbot-message bot">
          <div class="bubble">
            Xin chào 👋 Mình có thể giúp bạn chọn sản phẩm công nghệ phù hợp.
          </div>
        </div>
      </div>

      <!-- Ô nhập -->
      <div class="chatbot-input">
        <input id="chatbotInput" placeholder="Nhập câu hỏi..." />
        <button id="chatbotSend">Gửi</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);


  /* ========== DOM ========== */
  const openBtn = container.querySelector(".chatbot-floating-btn"); // nút 💬
  const panel = container.querySelector(".chatbot-panel");          // khung chat
  const closeBtn = container.querySelector(".chatbot-close");       // nút X
  const bodyEl = container.querySelector("#chatbotBody");           // body chat
  const inputEl = container.querySelector("#chatbotInput");         // input
  const sendBtn = container.querySelector("#chatbotSend");          // nút gửi

  // Mở chat
  openBtn.onclick = () => panel.style.display = "flex";

  // Đóng chat
  closeBtn.onclick = () => panel.style.display = "none";

  // Gửi khi click
  sendBtn.onclick = sendMessage;

  // Gửi khi nhấn Enter
  inputEl.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
  });


  /* ========== RENDER MESSAGE ========== */
  function appendMessage(role, text) {
    const div = document.createElement("div");
    div.className = `chatbot-message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "bubble";
    bubble.textContent = text;

    div.appendChild(bubble);
    bodyEl.appendChild(div);

    // Auto scroll xuống cuối
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }


  /* ========== SEND MESSAGE ========== */
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    // Hiển thị message user
    appendMessage("user", text);
    inputEl.value = "";

    // Lưu vào context
    chatHistory.push({ role: "user", content: text });
    trimContext();

    // Hiển thị loading
    appendMessage("bot", "⏳ Đang xử lý...");

    try {
      const reply = await callAI(text);

      // Thay nội dung loading bằng câu trả lời
      bodyEl.lastChild.querySelector(".bubble").textContent = reply;

      // Lưu phản hồi AI
      chatHistory.push({ role: "assistant", content: reply });
      trimContext();
    } catch (e) {
      bodyEl.lastChild.querySelector(".bubble").textContent =
        "❌ Không thể kết nối AI.";
      console.error(e);
    }
  }


  /* ========== CALL AI API ========== */
  async function callAI(userText) {
    const resp = await fetch(
      "https://api.fireworks.ai/inference/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...chatHistory,
            { role: "user", content: userText }
          ],
          temperature: 0.6,   // độ sáng tạo
          max_tokens: 600     // độ dài câu trả lời
        })
      }
    );

    if (!resp.ok) {
      throw new Error(await resp.text());
    }

    const data = await resp.json();

    // Lấy nội dung trả lời từ AI
    return (
      data.choices?.[0]?.message?.content ||
      "Mình chưa hiểu lắm, bạn hỏi lại nhé."
    );
  }

})();
