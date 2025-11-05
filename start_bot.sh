#!/bin/bash

# Скрипт для запуска Telegram бота

echo "🤖 Запуск Telegram бота для Sticker Shot..."
echo ""

# Проверяем наличие .env файла
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден!"
    echo ""
    echo "Для запуска бота вам нужен токен от @BotFather в Telegram."
    echo ""
    echo "📝 Как получить токен:"
    echo "1. Откройте Telegram и найдите @BotFather"
    echo "2. Отправьте команду /newbot"
    echo "3. Следуйте инструкциям и создайте бота"
    echo "4. Скопируйте полученный токен"
    echo ""
    read -p "Введите ваш BOT TOKEN: " bot_token
    
    if [ -z "$bot_token" ]; then
        echo "❌ Токен не введен. Выход."
        exit 1
    fi
    
    echo "BOT_TOKEN=$bot_token" > .env
    echo "✅ Токен сохранен в .env файл"
    echo ""
fi

# Читаем токен из .env
source .env

if [ -z "$BOT_TOKEN" ] || [ "$BOT_TOKEN" = "YOUR_BOT_TOKEN_HERE" ]; then
    echo "❌ Токен бота не настроен!"
    echo "Отредактируйте файл .env и добавьте ваш токен от @BotFather"
    exit 1
fi

# Обновляем bot.py с токеном из .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/BOT_TOKEN = \"YOUR_BOT_TOKEN_HERE\"/BOT_TOKEN = \"$BOT_TOKEN\"/" bot.py
else
    # Linux
    sed -i "s/BOT_TOKEN = \"YOUR_BOT_TOKEN_HERE\"/BOT_TOKEN = \"$BOT_TOKEN\"/" bot.py
fi

echo "🚀 Запускаем бота..."
python3 bot.py

