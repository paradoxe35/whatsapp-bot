import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";

const token = process.env.TELEGRAM_BOT_TOKEN!;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token);

await bot.sendMessage(
  process.env.TELEGRAM_CHAT_ID!,
  "Whatsapp bot failed to start"
);
