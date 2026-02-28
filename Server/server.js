require("dotenv").config();
const express = require("express");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// ======================
// CLOUDINARY CONFIG
// ======================
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ======================
// STATIC FILES
// ======================
// Phục vụ toàn bộ project (html, css, js, img)
app.use(express.static(path.join(__dirname, "../")));

// Route mặc định mở index
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../html/index.html"));
});

// ======================
// UPLOAD LOCAL IMG FOLDER
// ======================
const imageFolder = path.join(__dirname, "../img");

app.get("/upload-images", async (req, res) => {
  try {
    const files = fs.readdirSync(imageFolder);
    const links = [];

    for (const file of files) {
      if (!file.match(/\.(jpg|jpeg|png|webp|gif|ico)$/i)) continue;

      const filePath = path.join(imageFolder, file);

      const result = await cloudinary.uploader.upload(filePath, {
        folder: "final_project",
      });

      links.push({
        fileName: file,
        url: result.secure_url,
      });
    }

    res.json({
      message: "Upload hoàn tất",
      total: links.length,
      images: links,
    });

  } catch (err) {
    console.error("Lỗi upload:", err);
    res.status(500).json({ error: "Upload thất bại" });
  }
});

// ======================
// START SERVER
// ======================
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});