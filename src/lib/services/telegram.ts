import TelegramBot from "node-telegram-bot-api";

let bot: TelegramBot | null = null;

function getBot(): TelegramBot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      throw new Error("TELEGRAM_BOT_TOKEN is not set");
    }
    bot = new TelegramBot(token, { polling: false });
  }
  return bot;
}

const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";

export async function notifyTelegram(message: string): Promise<void> {
  try {
    if (!CHAT_ID) {
      console.warn("TELEGRAM_CHAT_ID not set, skipping notification");
      return;
    }
    const telegramBot = getBot();
    await telegramBot.sendMessage(CHAT_ID, message);
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
  }
}
