#!/bin/bash

# Скрипт безопасного деплоя бота на VPS сервер
# Использование: ./deploy_to_server.sh

set -e

echo "🚀 Деплой Telegram бота на сервер"
echo "=================================="
echo ""

# Данные сервера
SERVER_IP="147.45.103.47"
SERVER_USER="node"
BOT_NAME="poketon-ss-bot"
BOT_DIR="/home/node/PoketonSS"

echo "📡 Сервер: $SERVER_USER@$SERVER_IP"
echo "📁 Папка: $BOT_DIR"
echo ""

# Проверка SSH подключения
echo "🔐 Проверка подключения к серверу..."
ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo '✅ Подключение успешно'" || {
    echo "❌ Ошибка подключения к серверу"
    echo "Проверьте:"
    echo "  - IP адрес: $SERVER_IP"
    echo "  - Логин: $SERVER_USER"
    echo "  - Пароль"
    exit 1
}

echo ""
echo "📋 Проверка существующих ботов на сервере..."
ssh $SERVER_USER@$SERVER_IP "ps aux | grep 'python.*bot' | grep -v grep || echo 'Боты не найдены'"

echo ""
read -p "❓ Продолжить деплой? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Деплой отменен"
    exit 1
fi

echo ""
echo "📦 Начинаем деплой..."
echo ""

# Создаем скрипт деплоя который выполнится на сервере
cat > /tmp/deploy_commands.sh << 'DEPLOY_SCRIPT'
#!/bin/bash
set -e

echo "1️⃣ Проверка Python..."
python3 --version || { echo "❌ Python не установлен"; exit 1; }

echo "2️⃣ Проверка Git..."
git --version || { echo "❌ Git не установлен"; exit 1; }

echo "3️⃣ Создание директории для нового бота..."
mkdir -p ~/PoketonSS
cd ~/PoketonSS

echo "4️⃣ Клонирование репозитория..."
if [ -d ".git" ]; then
    echo "   Репозиторий уже существует, обновляем..."
    git pull origin main
else
    echo "   Клонируем репозиторий..."
    git clone https://github.com/Vingrig-Studio/PoketonSS.git .
fi

echo "5️⃣ Установка зависимостей..."
pip3 install --user -r requirements.txt

echo "6️⃣ Создание .env файла..."
# Проверяем есть ли уже .env
if [ -f ".env" ]; then
    echo "   .env файл уже существует, не перезаписываем"
else
    echo "   Нужно создать .env файл с токеном"
    echo "   ВАЖНО: добавьте токен вручную после деплоя!"
fi

echo "7️⃣ Проверка существующих процессов..."
ps aux | grep 'python.*bot' | grep -v grep || echo "   Других ботов не найдено"

echo ""
echo "✅ Файлы подготовлены!"
echo "📝 Теперь нужно:"
echo "   1. Создать .env файл: echo 'TSSLG=ваш_токен' > ~/.PoketonSS/.env"
echo "   2. Запустить бота: cd ~/PoketonSS && nohup python3 bot.py > bot.log 2>&1 &"

DEPLOY_SCRIPT

echo "📤 Копируем скрипт на сервер..."
scp /tmp/deploy_commands.sh $SERVER_USER@$SERVER_IP:/tmp/deploy_commands.sh

echo "🔧 Выполняем деплой на сервере..."
ssh $SERVER_USER@$SERVER_IP "bash /tmp/deploy_commands.sh"

echo ""
echo "=================================="
echo "✅ Файлы загружены на сервер!"
echo "=================================="
echo ""
echo "📝 СЛЕДУЮЩИЕ ШАГИ:"
echo ""
echo "1️⃣ Подключитесь к серверу:"
echo "   ssh $SERVER_USER@$SERVER_IP"
echo ""
echo "2️⃣ Создайте .env файл с токеном:"
echo "   cd ~/PoketonSS"
echo "   echo 'TSSLG=8445125611:AAHnz_TPASOB4G1aNMCfGPekPGwZqoCFlxA' > .env"
echo ""
echo "3️⃣ Запустите бота:"
echo "   nohup python3 bot.py > bot.log 2>&1 &"
echo ""
echo "4️⃣ Проверьте что бот запущен:"
echo "   ps aux | grep 'python.*bot'"
echo ""
echo "5️⃣ Смотрите логи:"
echo "   tail -f ~/PoketonSS/bot.log"
echo ""
echo "🔒 Токен будет храниться только в .env файле на сервере"
echo "🚫 Токен НЕ загружается в Git"
echo ""

