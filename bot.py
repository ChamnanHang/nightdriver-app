"""
Simple Telegram bot that responds to /start and /book
with an inline button to open the NightDriver Mini App.

Run:  python bot.py
Requires:  pip install pyTelegramBotAPI
"""
import os
import telebot
from telebot.types import InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8818349451:AAHxbyRfCTYTr9zS3_Vvv2H8BiOjsKVeaGM")
MINI_APP_URL = os.getenv("MINI_APP_URL", "https://winners-rare-plc-plays.trycloudflare.com/tg")

bot = telebot.TeleBot(BOT_TOKEN)


def open_app_button(label: str = "🚗 Open NightDriver") -> InlineKeyboardMarkup:
    kb = InlineKeyboardMarkup()
    kb.add(InlineKeyboardButton(label, web_app=WebAppInfo(url=MINI_APP_URL)))
    return kb


@bot.message_handler(commands=["start"])
def cmd_start(msg):
    name = msg.from_user.first_name or "there"
    bot.send_message(
        msg.chat.id,
        f"👋 Hi {name}!\n\n"
        "🌙 *NightDriver* — Book a sober designated driver to take you home safely at night.\n\n"
        "Tap the button below to open the app:",
        parse_mode="Markdown",
        reply_markup=open_app_button(),
    )


@bot.message_handler(commands=["book"])
def cmd_book(msg):
    bot.send_message(
        msg.chat.id,
        "🚗 Ready to book a ride home?",
        reply_markup=open_app_button("🚗 Book a Driver Now"),
    )


@bot.message_handler(commands=["rides"])
def cmd_rides(msg):
    bot.send_message(
        msg.chat.id,
        "📋 View your ride history inside the app:",
        reply_markup=open_app_button("📋 My Rides"),
    )


@bot.message_handler(func=lambda m: True)
def fallback(msg):
    bot.send_message(
        msg.chat.id,
        "Tap the 🚗 button in the menu, or use /start to open NightDriver.",
        reply_markup=open_app_button(),
    )


if __name__ == "__main__":
    print(f"Bot @{bot.get_me().username} is running…")
    print(f"Mini App URL: {MINI_APP_URL}")
    bot.infinity_polling()
