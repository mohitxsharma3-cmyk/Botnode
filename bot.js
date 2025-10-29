import TelegramBot from "node-telegram-bot-api";
import express from "express";
import sqlite3 from "sqlite3";

// --- Environment Variables ---
const BOT_TOKEN = process.env.BOT_TOKEN || "6065570955:AAHIUsfGhc2MmQ3EiJtOw5ozzyQ7EzmWsmA";
const PORT = process.env.PORT || 10000;

// --- Initialize Telegram Bot ---
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// --- Initialize SQLite Database ---
const db = new sqlite3.Database("./tokens.db", (err) => {
  if (err) console.error("❌ Database error:", err);
  else {
    db.run(`
      CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        token TEXT UNIQUE
      )
    `);
    console.log("✅ Database initialized.");
  }
});

// --- Telegram Command: /tokens ---
bot.onText(/\/tokens/, (msg) => {
  const chatId = msg.chat.id;
  db.all("SELECT token FROM tokens", [], (err, rows) => {
    if (err) {
      bot.sendMessage(chatId, "❌ Error fetching tokens.");
      console.error(err);
      return;
    }
    if (rows.length) {
      const tokens = rows.map((r) => r.token).join("\n");
      bot.sendMessage(chatId, tokens);
    } else {
      bot.sendMessage(chatId, "No tokens stored yet.");
    }
  });
});

// --- Handle Normal Messages ---
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text || text.startsWith("/")) return; // ignore commands

  db.run("INSERT OR IGNORE INTO tokens (token) VALUES (?)", [text], (err) => {
    if (err) {
      console.error(err);
      bot.sendMessage(chatId, "❌ Error saving token.");
    } else {
      bot.sendMessage(chatId, "✅ Token received and saved.");
    }
  });
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
