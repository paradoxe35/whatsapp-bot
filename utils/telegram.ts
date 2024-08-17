import TelegramBot from "node-telegram-bot-api";

const chatId = process.env.TELEGRAM_CHAT_ID!;
const token = process.env.TELEGRAM_BOT_TOKEN!;
// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token);

export function sendFailureAlert() {
  return bot.sendMessage(chatId, "Whatsapp bot failed to start");
}

export function sendAlert(message: string) {
  return bot.sendMessage(chatId, message);
}
