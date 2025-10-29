import TelegramBot from "node-telegram-bot-api";
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

// --- Environment Variables ---
const BOT_TOKEN = process.env.BOT_TOKEN || "6065570955:AAHIUsfGhc2MmQ3EiJtOw5ozzyQ7EzmWsmA";
const PORT = process.env.PORT || 10000;

// --- Initialize Telegram Bot ---
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// --- Initialize SQLite Database ---
let db;
(async () => {
  db = await open({
    filename: "./tokens.db",
    driver: sqlite3.Database,
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE
    )
  `);
  console.log("✅ Database ready");
})();

// --- Telegram Command: /tokens ---
bot.onText(/\/tokens/, async (msg) => {
  const chatId = msg.chat.id;
  const rows = await db.all("SELECT token FROM tokens");
  if (rows.length > 0) {
    const tokens = rows.map((r) => r.token).join("\n");
    await bot.sendMessage(chatId, tokens);
  } else {
    await bot.sendMessage(chatId, "No tokens stored yet.");
  }
});

// --- Handle Normal Messages ---
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  // Ignore commands
  if (!text || text.startsWith("/")) return;

  try {
    await db.run("INSERT INTO tokens (token) VALUES (?)", text);
    await bot.sendMessage(chatId, "✅ Token received and saved.");
  } catch (err) {
    if (err.message.includes("UNIQUE constraint")) {
      await bot.sendMessage(chatId, "⚠️ Token already exists.");
    } else {
      console.error("DB Error:", err);
      await bot.sendMessage(chatId, "❌ Error saving token.");
    }
  }
});

// --- Express Web Server (for Render uptime) ---
const app = express();

app.get("/", (req, res) => {
  res.json({ status: "Bot is alive and running!", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🌐 Express server running on port ${PORT}`);
  console.log("🤖 Telegram bot is polling...");
});
