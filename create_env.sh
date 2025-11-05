#!/bin/bash
echo "🔐 Создание .env файла для локального запуска бота"
echo ""
echo "Введите ваш токен от @BotFather:"
read -r token

if [ -z "$token" ]; then
    echo "❌ Токен не введен!"
    exit 1
fi

echo "TSSLG=$token" > .env
echo ""
echo "✅ Файл .env создан!"
echo "Теперь запустите: python3 bot.py"
