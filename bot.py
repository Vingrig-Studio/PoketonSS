#!/usr/bin/env python3
"""
Telegram бот для Sticker Shot (@PoketonSS)
"""

import logging
import os
from pathlib import Path
from telegram import Update
from telegram.ext import Application, CommandHandler, ContextTypes

# Настройка логирования
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Безопасное получение токена бота
# Приоритет: 1) TSSLG, 2) TELEGRAM_BOT_TOKEN, 3) .env файл, 4) config.py
def get_bot_token():
    # Способ 1: Переменная окружения TSSLG (ваше название)
    token = os.environ.get('TSSLG')
    if token:
        logger.info("✅ Токен загружен из переменной окружения TSSLG")
        return token
    
    # Способ 2: Переменная окружения TELEGRAM_BOT_TOKEN (стандартное название)
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    if token:
        logger.info("✅ Токен загружен из переменной окружения TELEGRAM_BOT_TOKEN")
        return token
    
    # Способ 3: Файл .env
    env_file = Path('.env')
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                # Поддержка обоих названий в .env
                if line.startswith('TSSLG='):
                    token = line.split('=', 1)[1].strip().strip('"').strip("'")
                    logger.info("✅ Токен загружен из файла .env (TSSLG)")
                    return token
                if line.startswith('TELEGRAM_BOT_TOKEN='):
                    token = line.split('=', 1)[1].strip().strip('"').strip("'")
                    logger.info("✅ Токен загружен из файла .env (TELEGRAM_BOT_TOKEN)")
                    return token
    
    # Способ 4: Файл config.py (если существует)
    try:
        from config import TSSLG
        logger.info("✅ Токен загружен из config.py (TSSLG)")
        return TSSLG
    except ImportError:
        pass
    
    try:
        from config import TELEGRAM_BOT_TOKEN
        logger.info("✅ Токен загружен из config.py (TELEGRAM_BOT_TOKEN)")
        return TELEGRAM_BOT_TOKEN
    except ImportError:
        pass
    
    # Если токен не найден
    logger.error("❌ Токен бота не найден!")
    logger.error("Создайте файл .env со строкой: TSSLG=ваш_токен")
    logger.error("Или установите переменную окружения: export TSSLG=ваш_токен")
    return None

BOT_TOKEN = get_bot_token()

if not BOT_TOKEN:
    print("\n" + "="*60)
    print("⚠️  ТОКЕН БОТА НЕ НАСТРОЕН!")
    print("="*60)
    print("\n📝 Выберите один из способов настройки:\n")
    print("1️⃣  Создайте файл .env в этой папке:")
    print("    TSSLG=ваш_токен_от_BotFather")
    print("\n2️⃣  Или установите переменную окружения:")
    print("    export TSSLG=ваш_токен_от_BotFather")
    print("\n3️⃣  Или создайте файл config.py:")
    print("    TSSLG = 'ваш_токен_от_BotFather'")
    print("\n" + "="*60 + "\n")
    exit(1)

# Путь к изображению
IMAGE_PATH = "TG.png"

# Текст сообщения на английском
MESSAGE_TEXT = (
    "Time to improve the game together, leave your feedback about the game at "
    "https://t.me/vingrigstudio\n\n"
    "Now press play Sticker Shot!!!"
)


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Обработчик команды /start
    Отправляет изображение с текстом
    """
    try:
        # Отправляем изображение с подписью
        with open(IMAGE_PATH, 'rb') as photo:
            await update.message.reply_photo(
                photo=photo,
                caption=MESSAGE_TEXT,
                parse_mode='HTML'
            )
            
        logger.info(f"Пользователь {update.effective_user.id} запустил команду /start")
        
    except FileNotFoundError:
        logger.error(f"Файл {IMAGE_PATH} не найден!")
        await update.message.reply_text(
            "Извините, произошла ошибка. Пожалуйста, попробуйте позже."
        )
    except Exception as e:
        logger.error(f"Ошибка при обработке команды /start: {e}")
        await update.message.reply_text(
            "Извините, произошла ошибка. Пожалуйста, попробуйте позже."
        )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """
    Обработчик команды /help
    """
    help_text = (
        "🎮 *Sticker Shot Bot*\n\n"
        "Доступные команды:\n"
        "/start - Начать работу с ботом\n"
        "/help - Показать это сообщение\n\n"
        "Оставляйте отзывы о игре: https://t.me/vingrigstudio"
    )
    await update.message.reply_text(help_text, parse_mode='Markdown')


def main() -> None:
    """
    Главная функция для запуска бота
    """
    # Создаем приложение
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Регистрируем обработчики команд
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    
    # Запускаем бота
    logger.info("Бот запущен и готов к работе...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == '__main__':
    main()

