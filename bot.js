// bot.js
import TelegramBot from "node-telegram-bot-api";
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const BOT_TOKEN = process.env.BOT_TOKEN || "6065570955:AAHIUsfGhc2MmQ3EiJtOw5ozzyQ7EzmWsmA";
const PORT = process.env.PORT || 10000;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// --- SQLite setup ---
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
})();

// --- Telegram handlers ---
bot.onText(/\/tokens/, async (msg) => {
  const chatId = msg.chat.id;
  const rows = await db.all("SELECT token FROM tokens");
  if (rows.length) {
    const tokens = rows.map((r) => r.token).join("\n");
    bot.sendMessage(chatId, tokens);
  } else {
    bot.sendMessage(chatId, "No tokens stored yet.");
  }
});

bot.on("message", async (msg) => {
  if (!msg.text.startsWith("/")) {
    const token = msg.text.trim();
    try {
      await db.run("INSERT INTO tokens (token) VALUES (?)", token);
      bot.sendMessage(msg.chat.id, "✅ Token received and saved.");
    } catch {
      bot.sendMessage(msg.chat.id, "⚠️ Token already exists or error occurred.");
    }
  }
});

// --- Express for uptime check ---
const app = express();
app.get("/", (req, res) => {
  res.json({ status: "Bot running!" });
});

app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
