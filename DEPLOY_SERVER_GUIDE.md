# 🚀 Деплой бота на сервер (продакшен)

Это руководство для запуска бота на удаленном сервере 24/7.

---

## 🎯 Варианты деплоя

### 1. 🐧 VPS/VDS (Ubuntu/Debian) - Рекомендуется
**Подходит для:** Полный контроль, высокая производительность  
**Провайдеры:** DigitalOcean, AWS EC2, Hetzner, Vultr, Selectel

### 2. ☁️ Облачные платформы
**Подходит для:** Быстрый старт без настройки сервера  
**Провайдеры:** Heroku, Railway, Render, Fly.io

### 3. 🐳 Docker контейнер
**Подходит для:** Изоляция, легкая миграция между серверами

---

## 📋 Вариант 1: VPS/VDS (Ubuntu)

### Шаг 1: Подготовка сервера

```bash
# Подключитесь к серверу
ssh username@your-server-ip

# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите Python 3.11
sudo apt install python3.11 python3.11-venv python3-pip -y

# Установите Git
sudo apt install git -y
```

### Шаг 2: Клонируйте репозиторий

```bash
# Создайте директорию для бота
mkdir -p ~/bots
cd ~/bots

# Клонируйте репозиторий
git clone https://github.com/Vingrig-Studio/PoketonSS.git
cd PoketonSS
```

### Шаг 3: Создайте виртуальное окружение

```bash
# Создайте venv
python3 -m venv venv

# Активируйте venv
source venv/bin/activate

# Установите зависимости
pip install -r requirements.txt
```

### Шаг 4: Настройте токен

```bash
# Создайте .env файл
nano .env
```

Добавьте:
```
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
```

Сохраните: `Ctrl+X`, `Y`, `Enter`

### Шаг 5: Проверьте работу

```bash
# Запустите бота для теста
python3 bot.py

# Если все работает, остановите: Ctrl+C
```

### Шаг 6: Настройте systemd для автозапуска

Создайте systemd service:

```bash
sudo nano /etc/systemd/system/telegram-bot.service
```

Вставьте:
```ini
[Unit]
Description=Sticker Shot Telegram Bot
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/bots/PoketonSS
Environment="PATH=/home/YOUR_USERNAME/bots/PoketonSS/venv/bin"
ExecStart=/home/YOUR_USERNAME/bots/PoketonSS/venv/bin/python3 bot.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Замените:** `YOUR_USERNAME` на ваше имя пользователя на сервере

Сохраните: `Ctrl+X`, `Y`, `Enter`

### Шаг 7: Запустите сервис

```bash
# Перезагрузите systemd
sudo systemctl daemon-reload

# Включите автозапуск
sudo systemctl enable telegram-bot

# Запустите бота
sudo systemctl start telegram-bot

# Проверьте статус
sudo systemctl status telegram-bot
```

### Шаг 8: Управление ботом

```bash
# Посмотреть логи
sudo journalctl -u telegram-bot -f

# Перезапустить
sudo systemctl restart telegram-bot

# Остановить
sudo systemctl stop telegram-bot

# Статус
sudo systemctl status telegram-bot
```

### Шаг 9: Автоматическое обновление через GitHub

Создайте скрипт обновления:

```bash
nano ~/bots/PoketonSS/update.sh
```

Вставьте:
```bash
#!/bin/bash
cd /home/YOUR_USERNAME/bots/PoketonSS
git pull origin main
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart telegram-bot
echo "✅ Бот обновлен и перезапущен"
```

Сделайте исполняемым:
```bash
chmod +x ~/bots/PoketonSS/update.sh
```

Теперь для обновления просто запускайте:
```bash
~/bots/PoketonSS/update.sh
```

---

## 📋 Вариант 2: Heroku (облако)

### Шаг 1: Создайте аккаунт Heroku
https://signup.heroku.com/

### Шаг 2: Установите Heroku CLI
```bash
# macOS
brew tap heroku/brew && brew install heroku

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### Шаг 3: Создайте Procfile

Я создам файл `Procfile` в вашем проекте:

```
worker: python3 bot.py
```

### Шаг 4: Деплой на Heroku

```bash
# Войдите в Heroku
heroku login

# Создайте приложение
cd /Users/grigoryvinogradov/PSS2/PoketonSS
heroku create poketon-ss-bot

# Добавьте токен
heroku config:set TELEGRAM_BOT_TOKEN=ваш_токен

# Залейте код
git push heroku main

# Запустите worker
heroku ps:scale worker=1

# Посмотрите логи
heroku logs --tail
```

---

## 📋 Вариант 3: Docker

Я создам `Dockerfile` для вашего проекта:

### Dockerfile:
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python3", "bot.py"]
```

### docker-compose.yml:
```yaml
version: '3.8'

services:
  telegram-bot:
    build: .
    container_name: poketon-ss-bot
    restart: unless-stopped
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    volumes:
      - ./logs:/app/logs
```

### Запуск:

```bash
# Создайте .env с токеном
echo "TELEGRAM_BOT_TOKEN=ваш_токен" > .env

# Соберите и запустите
docker-compose up -d

# Посмотрите логи
docker-compose logs -f

# Остановите
docker-compose down
```

---

## 🔄 Автоматический деплой через GitHub Actions

Обновите `.github/workflows/deploy.yml`:

```yaml
- name: 🚀 Deploy to server
  env:
    SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
    SERVER_HOST: ${{ secrets.SERVER_HOST }}
    SERVER_USER: ${{ secrets.SERVER_USER }}
    SERVER_PATH: ${{ secrets.SERVER_PATH }}
    TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
  run: |
    # Настройте SSH
    mkdir -p ~/.ssh
    echo "$SSH_PRIVATE_KEY" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    ssh-keyscan -H $SERVER_HOST >> ~/.ssh/known_hosts
    
    # Деплой на сервер
    ssh -i ~/.ssh/deploy_key $SERVER_USER@$SERVER_HOST "
      cd $SERVER_PATH
      git pull origin main
      source venv/bin/activate
      pip install -r requirements.txt
      echo 'TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN' > .env
      sudo systemctl restart telegram-bot
    "
    
    echo "✅ Деплой завершен"
```

### Добавьте секреты в GitHub:
1. `SSH_PRIVATE_KEY` - приватный SSH ключ
2. `SERVER_HOST` - IP сервера
3. `SERVER_USER` - имя пользователя
4. `SERVER_PATH` - путь к боту на сервере

---

## 🔍 Мониторинг

### Простой мониторинг через Telegram

Добавьте в бота:

```python
import logging

# Отправка критических ошибок админу
ADMIN_CHAT_ID = "ваш_telegram_id"

async def notify_admin(message):
    try:
        await application.bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=f"⚠️ {message}"
        )
    except:
        pass
```

### UptimeRobot (бесплатный мониторинг)
https://uptimerobot.com/ - проверяет доступность каждые 5 минут

---

## 📊 Статистика использования

### Простая статистика в логах:

```python
# В bot.py
logger.info(f"Пользователь {update.effective_user.id} использовал /start")
```

### Анализ логов:

```bash
# Количество пользователей за сегодня
sudo journalctl -u telegram-bot --since today | grep "запустил команду /start" | wc -l
```

---

## 🆘 Решение проблем

### Бот не запускается:
```bash
# Проверьте логи
sudo journalctl -u telegram-bot -n 50

# Проверьте статус
sudo systemctl status telegram-bot
```

### Ошибка "Unauthorized":
- Проверьте токен в .env
- Убедитесь, что токен не отозван

### Бот работает, но не отвечает:
- Проверьте интернет на сервере: `ping telegram.org`
- Проверьте firewall: `sudo ufw status`

---

## 💰 Примерные расходы

| Провайдер | Цена/месяц | Характеристики |
|-----------|------------|----------------|
| DigitalOcean | $6 | 1GB RAM, 25GB SSD |
| Hetzner | €4.5 | 2GB RAM, 40GB SSD |
| AWS EC2 (t2.micro) | Бесплатно 12 мес | 1GB RAM |
| Heroku | Бесплатно* | 550 часов/месяц |
| Railway | Бесплатно* | $5 кредитов |

*Бесплатные планы могут иметь ограничения

---

## ✅ Чеклист деплоя

- [ ] Выбрал провайдера
- [ ] Настроил сервер
- [ ] Клонировал репозиторий
- [ ] Установил зависимости
- [ ] Настроил .env с токеном
- [ ] Протестировал бота локально на сервере
- [ ] Настроил systemd (или другой способ автозапуска)
- [ ] Запустил бота
- [ ] Проверил работу через Telegram
- [ ] Настроил автообновление через GitHub
- [ ] Настроил мониторинг

**Готово!** 🎉 Ваш бот работает 24/7!

---

## 📞 Помощь

- 💬 [Чат студии](https://t.me/chatvingrig)
- 📺 [Канал студии](https://t.me/vingrigstudio)

