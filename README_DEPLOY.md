# 🚀 Правильный деплой проекта

## ⚠️ ВАЖНО: Два отдельных деплоя!

Ваш проект состоит из **двух частей**:

```
1. 🎮 ИГРА (HTML/JS) → Netlify
2. 🤖 БОТ (Python) → Heroku/Railway
```

**НЕ ПЫТАЙТЕСЬ** деплоить бота на Netlify - это не сработает!

---

## ✅ Часть 1: Игра на Netlify (статика)

Netlify отлично подходит для игры (HTML/JS/CSS).

### Что деплоим:
- `index.html`
- `script.js`
- `styles.css`
- Все `.tgs` анимации
- `muz.mp3`

### Как задеплоить:
1. Зайдите на https://netlify.com
2. **New site from Git** → выберите репозиторий
3. Build settings:
   - Build command: `echo "Static site"`
   - Publish directory: `.`
4. **Deploy site**

**Результат:** Игра работает на `https://ваш-сайт.netlify.app`

---

## ✅ Часть 2: Бот на Heroku/Railway (Python)

Для бота используйте **Heroku** или **Railway**.

### Вариант A: Heroku

```bash
# 1. Установите Heroku CLI
brew install heroku

# 2. Войдите
heroku login

# 3. Создайте приложение для БОТА
cd /Users/grigoryvinogradov/PSS2/PoketonSS
heroku create poketon-bot

# 4. Добавьте токен
heroku config:set TSSLG=ваш_токен

# 5. Задеплойте ТОЛЬКО бота
git push heroku main

# 6. Запустите worker
heroku ps:scale worker=1

# 7. Проверьте логи
heroku logs --tail
```

**Результат:** Бот работает 24/7 на Heroku

### Вариант B: Railway (проще)

1. Зайдите на https://railway.app
2. **New Project** → **Deploy from GitHub**
3. Выберите репозиторий
4. **Add variables**:
   - `TSSLG` = ваш_токен
5. Railway автоматически запустит бота

**Результат:** Бот работает 24/7 на Railway

---

## 📊 Схема правильного деплоя

```
┌─────────────────────────────────────────┐
│  GitHub Repository                       │
│  github.com/Vingrig-Studio/PoketonSS     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│   NETLIFY    │    │ HEROKU/      │
│              │    │ RAILWAY      │
│ 🎮 ИГРА      │    │ 🤖 БОТ       │
│ (HTML/JS)    │    │ (Python)     │
│              │    │              │
│ Файлы:       │    │ Файлы:       │
│ - index.html │    │ - bot.py     │
│ - script.js  │    │ - Procfile   │
│ - styles.css │    │ - runtime.txt│
│ - *.tgs      │    │ - TG.png     │
│ - muz.mp3    │    │              │
└──────────────┘    └──────────────┘
       │                   │
       │                   │
       ▼                   ▼
   https://             Telegram
   game.netlify.app     @YourBot
```

---

## 🎯 Что делать СЕЙЧАС:

### Шаг 1: Отключите бота на Netlify
В настройках Netlify деплоя:
- Остановите деплой или
- Удалите проект

### Шаг 2: Задеплойте игру на Netlify
- Netlify автоматически найдет `index.html`
- Игра заработает

### Шаг 3: Задеплойте бота на Heroku/Railway
Выберите один из вариантов выше.

---

## ❓ Какой вариант выбрать для бота?

| Платформа | Сложность | Стоимость | Рекомендация |
|-----------|-----------|-----------|--------------|
| **Railway** | ⭐ Легко | Бесплатно* | ✅ Лучший выбор |
| **Heroku** | ⭐⭐ Средне | Бесплатно* | ✅ Классика |
| **Netlify** | ❌ НЕ ПОДХОДИТ | - | ❌ Только для статики |

*Может потребоваться карта для верификации

---

## 🆘 Нужна помощь?

Напишите:
1. "Railway" - помогу настроить Railway
2. "Heroku" - помогу настроить Heroku
3. "Локально" - дам команды для теста

---

## 📝 Итог

- ✅ **Игра → Netlify** (уже настроено)
- ✅ **Бот → Heroku/Railway** (нужно настроить)
- ❌ **НЕ деплойте бота на Netlify!**

