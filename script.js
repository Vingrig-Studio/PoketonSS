// Секундомер
class Timer {
    constructor() {
        this.startTime = Date.now();
        this.timerElement = document.querySelector('.timer');
        this.interval = null;
        this.start();
    }

    start() {
        this.interval = setInterval(() => {
            this.updateDisplay();
        }, 1000);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    updateDisplay() {
        const elapsed = Date.now() - this.startTime;
        this.timerElement.textContent = this.formatMs(elapsed);
    }

    getElapsedTime() {
        return Date.now() - this.startTime;
    }

    formatMs(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
    }
}

// Баланс игрока
class Balance {
    constructor() {
        this.amount = 0;
        this.balanceElement = document.querySelector('.balance');
        this.updateDisplay();
    }

    updateDisplay() {
        this.balanceElement.textContent = `${this.amount} PXP`;
    }

    add(amount) {
        this.amount += amount;
        this.updateDisplay();
        this.checkUpgradeButtons();
    }

    subtract(amount) {
        if (this.amount >= amount) {
            this.amount -= amount;
            this.updateDisplay();
            this.checkUpgradeButtons();
            return true;
        }
        return false;
    }

    checkUpgradeButtons() {
        const speedBtn = document.querySelector('.speed-btn');
        const damageBtn = document.querySelector('.damage-btn');

        const canAfford = this.amount >= 1;
        speedBtn.disabled = !canAfford;
        damageBtn.disabled = !canAfford;

        if (canAfford) {
            speedBtn.style.cursor = 'pointer';
            damageBtn.style.cursor = 'pointer';
        } else {
            speedBtn.style.cursor = 'not-allowed';
            damageBtn.style.cursor = 'not-allowed';
        }
    }
}

// Класс для персонажа
class Character {
    constructor(game, trackIndex, speed, health) {
        this.game = game;
        this.trackIndex = trackIndex;
        this.speed = speed; // пикселей в секунду
        this.element = document.createElement('div');
        this.element.classList.add('character');
        this.animation = null;
        this.top = -100; // Начать сверху за экраном (предполагаем высоту ~100px)
        this.element.style.top = `${this.top}px`;
        this.isActive = true;
        this.health = typeof health === 'number' ? health : 1;
        this.loadAnimation();
        
        const tracks = document.querySelectorAll('.track');
        tracks[this.trackIndex].appendChild(this.element);
        
        // подпись здоровья
        this.renderHp();

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    loadAnimation() {
        // Загружаем предварительно распакованный JSON (чтобы избежать CORS/дефляции локально)
        fetch('dackss.json')
            .then(r => r.json())
            .then(animationData => {
                this.animation = lottie.loadAnimation({
                    container: this.element,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    animationData
                });
            })
            .catch(error => console.error('Error loading JSON:', error));
    }

    renderHp() {
        if (this.hpEl) this.hpEl.remove();
        const hp = document.createElement('div');
        hp.className = 'hp';
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.textContent = '❤';
        const text = document.createElement('span');
        text.className = 'value';
        text.textContent = this.health.toFixed(1).replace(/\.0$/, '.0');
        hp.appendChild(heart);
        hp.appendChild(text);
        this.element.appendChild(hp);
        this.hpEl = hp;
    }

    applyDamage(amount) {
        if (!this.isActive) return;
        this.health = Number((this.health - amount).toFixed(1));
        if (this.hpEl) this.hpEl.querySelector('.value').textContent = this.health.toFixed(1).replace(/\.0$/, '.0');
        if (this.health <= 0) {
            this.isActive = false;
            // Засчитываем награду только если смерть наступила от урона (пули)
            this.game.removeCharacter(this);
            if (this.game && this.game.balance) {
                this.game.balance.add(1);
            }
            this.destroy();
        }
    }

    move() {
        if (!this.isActive) return;
        this.top += this.speed / 60; // Примерно 60 px за кадр/секунду
        this.element.style.top = `${Math.round(this.top)}px`;
        
        // Проверка достижения пунктира
        const horizontalLine = document.querySelector('.horizontal-line');
        const linePosition = horizontalLine.getBoundingClientRect().top;
        const charBottom = this.element.getBoundingClientRect().bottom;
        
        if (charBottom >= linePosition) {
            this.isActive = false;
            this.game.gameOver();
            return;
        }

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    destroy() {
        this.isActive = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.animation) this.animation.destroy();
        this.element.remove();
    }
}

// Класс игрока (на пунктирной линии, по центрам дорожек)
class Player {
    constructor(game, startTrackIndex, health) {
        this.game = game;
        this.trackIndex = startTrackIndex;
        this.health = typeof health === 'number' ? health : 1;
        this.element = document.createElement('div');
        this.element.classList.add('player');
        this.animation = null;
        this.top = 0; // вычислим относительно дорожки по пунктиру

        // Вставляем в стартовую дорожку
        const tracks = document.querySelectorAll('.track');
        tracks[this.trackIndex].appendChild(this.element);

        this.loadAnimation();
        this.renderHp();
        // Позиционирование по пунктиру после загрузки рендера/изменений размеров
        requestAnimationFrame(() => this.updateVerticalPosition());
        window.addEventListener('resize', () => this.updateVerticalPosition());
    }

    loadAnimation() {
        const tryTgs = () => fetch('shot.tgs')
            .then(r => r.arrayBuffer())
            .then(buf => {
                const json = pako.inflate(new Uint8Array(buf), { to: 'string' });
                return JSON.parse(json);
            });

        tryTgs()
            .then(animationData => {
                this.animation = lottie.loadAnimation({
                    container: this.element,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    animationData
                });
                this.animation.addEventListener('DOMLoaded', () => this.updateVerticalPosition());
            })
            .catch(err => console.error('Player TGS load error:', err));
    }

    renderHp() {
        if (this.hpEl) this.hpEl.remove();
        const hp = document.createElement('div');
        hp.className = 'hp';
        const heart = document.createElement('span');
        heart.className = 'heart';
        heart.textContent = '❤';
        const text = document.createElement('span');
        text.className = 'value';
        text.textContent = Number(this.health).toFixed(1);
        hp.appendChild(heart);
        hp.appendChild(text);
        this.element.appendChild(hp);
        this.hpEl = hp;
    }

    updateVerticalPosition() {
        const line = document.querySelector('.horizontal-line');
        const track = document.querySelectorAll('.track')[this.trackIndex];
        if (!line || !track) return;
        const lineTop = line.getBoundingClientRect().top;
        const trackTop = track.getBoundingClientRect().top;
        const playerHeight = this.element.getBoundingClientRect().height || 90;
        const offsetTop = lineTop - trackTop - playerHeight / 2; // центр по пунктиру
        this.element.style.top = `${Math.max(0, offsetTop)}px`;
    }

    setTrack(newIndex) {
        const tracks = document.querySelectorAll('.track');
        newIndex = (newIndex + tracks.length) % tracks.length; // обертка по краям
        if (newIndex === this.trackIndex) return;
        const node = this.element;
        tracks[newIndex].appendChild(node);
        this.trackIndex = newIndex;
        this.updateVerticalPosition();
    }
}

// Пуля
class Bullet {
    constructor(game, trackIndex, speed) {
        this.game = game;
        this.trackIndex = trackIndex;
        this.speed = speed; // px/sec (движение вверх)
        this.element = document.createElement('div');
        this.element.className = 'bullet';
        this.top = 0; // зададим ниже

        // Поместим пулю в нужную дорожку
        const tracks = document.querySelectorAll('.track');
        tracks[this.trackIndex].appendChild(this.element);

        // Начальная вертикальная позиция: по пунктиру
        const line = document.querySelector('.horizontal-line');
        const track = tracks[this.trackIndex];
        const lineTop = line.getBoundingClientRect().top;
        const trackTop = track.getBoundingClientRect().top;
        const bulletH = this.element.getBoundingClientRect().height || 34;
        this.top = Math.max(0, lineTop - trackTop - bulletH / 2);
        this.element.style.top = `${this.top}px`;

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    move() {
        // Движение вверх (уменьшаем top)
        this.top -= this.speed / 60;
        this.element.style.top = `${Math.round(this.top)}px`;

        // Проверка столкновений с персонажами на той же дорожке
        const bulletRect = this.element.getBoundingClientRect();
        const hitChar = this.game.characters.find(c => c.isActive && c.trackIndex === this.trackIndex &&
            (function(){
                const cr = c.element.getBoundingClientRect();
                // горизонтально они по центру дорожки; достаточно вертикальной проверки
                return bulletRect.bottom >= cr.top && bulletRect.top <= cr.bottom;
            })()
        );
        if (hitChar) {
            hitChar.applyDamage(1);
            this.destroy();
            return;
        }

        // Удаление при достижении верха экрана
        const bulletTop = this.element.getBoundingClientRect().top;
        const fieldTop = document.querySelector('.game-field').getBoundingClientRect().top;
        if (bulletTop <= fieldTop) {
            this.destroy();
            return;
        }

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.element.remove();
    }
}

// Класс игры
class Game {
    constructor(timer, balance) {
        this.timer = timer;
        this.balance = balance;
        this.characters = [];
        this.isRunning = false;
        this.overlay = document.getElementById('overlay');
        this.restartBtn = document.getElementById('restart-btn');
        this.restartBtn.addEventListener('click', this.restart.bind(this));
        this.finalTimeEl = document.getElementById('final-time');
        
        this.waveNumber = 0;
        this.baseSpawnInterval = 3; // секунды
        this.baseCharactersPerWave = 1;

        // Планирование: волна каждые 5s, первая в 1s
        this.nextWaveStartMs = 1000; // первая волна на 1-й секунде
        this.nextSpawnMs = Number.POSITIVE_INFINITY;
        this.spawnsLeftInWave = 0;

        // Базовое здоровье новых персонажей
        this.baseHealth = 1.0;
        this.lastHealthSecond = 0; // последняя учтенная секунда

        // Игрок
        this.player = null;

        // Объекты пуль
        this.bullets = [];
        this.nextBulletMs = Number.POSITIVE_INFINITY;
        
        // Общая скорость объектов (враги и пули)
        this.entitySpeedPxSec = 100; // px/сек

        this.loop = this.loop.bind(this);
        this.scheduleStart(1);
    }

    scheduleStart(startAtSecond) {
        const elapsed = this.timer.getElapsedTime();
        const targetMs = startAtSecond * 1000;
        const delay = Math.max(0, targetMs - elapsed);
        setTimeout(() => {
            this.start();
        }, delay);
    }

    start() {
        this.isRunning = true;
        this.waveNumber = 0;
        this.nextWaveStartMs = 1000; // первая волна в 1s
        this.nextSpawnMs = Number.POSITIVE_INFINITY;
        this.spawnsLeftInWave = 0;
        this.bullets.forEach(b => b.destroy());
        this.bullets = [];
        this.nextBulletMs = this.timer.getElapsedTime(); // сразу с началом — первая пуля
        this.loop();

        // создать/сбросить игрока по центру дорожек (индекс 3 из 0..6)
        const startTrack = 3;
        if (this.player) {
            this.player.setTrack(startTrack);
            this.player.health = 1;
            this.player.renderHp();
            this.player.updateVerticalPosition();
        } else {
            this.player = new Player(this, startTrack, 1);
        }

        // Навешиваем обработчик кликов по полю для перемещения игрока
        const field = document.querySelector('.game-field');
        if (!this._fieldClickHandler) {
            this._fieldClickHandler = (e) => {
                if (!this.isRunning) return;
                const rect = field.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;
                const isLeft = e.clientX < midX;
                if (isLeft) {
                    this.player.setTrack(this.player.trackIndex - 1);
                } else {
                    this.player.setTrack(this.player.trackIndex + 1);
                }
            };
            field.addEventListener('click', this._fieldClickHandler);
        }
    }

    loop() {
        if (!this.isRunning) return;
        const elapsed = this.timer.getElapsedTime();

        // Увеличение базового здоровья каждые полные секунды
        const wholeSeconds = Math.floor(elapsed / 1000);
        while (wholeSeconds > this.lastHealthSecond) {
            this.baseHealth = Number((this.baseHealth + 0.1).toFixed(1));
            this.lastHealthSecond += 1;
        }

        // Старт новой волны по таймеру
        if (elapsed >= this.nextWaveStartMs) {
            this.waveNumber += 1;
            const spawnsInWave = this.baseCharactersPerWave + (this.waveNumber - 1);
            const spawnIntervalMs = (this.baseSpawnInterval + (this.waveNumber - 1) * 0.1) * 1000;
            this.spawnsLeftInWave = spawnsInWave;
            this.nextSpawnMs = elapsed; // первый спавн мгновенно
            this.spawnIntervalMs = spawnIntervalMs;
            this.nextWaveStartMs += 5000; // следующая волна через 5s
        }

        // Спавн в рамках текущей волны
        while (this.isRunning && this.spawnsLeftInWave > 0 && elapsed >= this.nextSpawnMs) {
            const trackIndex = Math.floor(Math.random() * 7);
            const speed = this.entitySpeedPxSec; // px/sec
            const char = new Character(this, trackIndex, speed, this.baseHealth);
            this.characters.push(char);
            this.spawnsLeftInWave -= 1;
            this.nextSpawnMs += this.spawnIntervalMs;
        }

        // Генерация пули каждую секунду, из текущей дорожки игрока
        if (this.isRunning && elapsed >= this.nextBulletMs && this.player) {
            const bullet = new Bullet(this, this.player.trackIndex, this.entitySpeedPxSec);
            this.bullets.push(bullet);
            this.nextBulletMs += 1000;
        }

        requestAnimationFrame(this.loop);
    }

    removeCharacter(char) {
        const idx = this.characters.indexOf(char);
        if (idx !== -1) {
            this.characters.splice(idx, 1);
        }
    }

    gameOver() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.timer.stop();
        this.characters.forEach(char => char.destroy());
        this.characters = [];
        this.bullets.forEach(b => b.destroy());
        this.bullets = [];
        if (this.overlay) this.overlay.style.display = 'flex';
        if (this.finalTimeEl) this.finalTimeEl.textContent = `Время: ${this.timer.formatMs(this.timer.getElapsedTime())}`;
    }

    restart() {
        if (this.overlay) this.overlay.style.display = 'none';
        this.waveNumber = 0;
        this.timer.startTime = Date.now(); // Сброс таймера
        this.balance.amount = 0;
        this.balance.updateDisplay();
        this.timer.start(); // перезапуск секундомера
        this.baseHealth = 1.0;
        this.lastHealthSecond = 0;
        this.start();
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    const timer = new Timer();
    const balance = new Balance();
    const game = new Game(timer, balance);

    // Обработчики кнопок обновлений
    document.querySelector('.speed-btn').addEventListener('click', function() {
        if (balance.subtract(1)) {
            console.log('Speed upgraded!');
            // Здесь будет логика обновления скорости
        }
    });

    document.querySelector('.damage-btn').addEventListener('click', function() {
        if (balance.subtract(1)) {
            console.log('Damage upgraded!');
            // Здесь будет логика обновления урона
        }
    });

    // Клики по полю теперь используются только для перемещения игрока, без начисления PXP
});
