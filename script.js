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
        const display = Number.isInteger(this.amount)
            ? this.amount
            : this.amount.toFixed(2);
        this.balanceElement.textContent = `${display} PXP`;
    }

    add(amount) {
        this.amount = Number((this.amount + amount).toFixed(2));
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
        if (!speedBtn || !damageBtn) return;

        const speedPrice = Number(speedBtn.dataset.price || 1);
        const damagePrice = Number(damageBtn.dataset.price || 1);

        const canAffordSpeed = this.amount >= speedPrice;
        const canAffordDamage = this.amount >= damagePrice;

        speedBtn.disabled = !canAffordSpeed;
        damageBtn.disabled = !canAffordDamage;

        speedBtn.classList.toggle('can-afford', canAffordSpeed);
        damageBtn.classList.toggle('can-afford', canAffordDamage);

        speedBtn.style.cursor = canAffordSpeed ? 'pointer' : 'not-allowed';
        damageBtn.style.cursor = canAffordDamage ? 'pointer' : 'not-allowed';
    }
}

// Звук: проигрывание нот дорожек
class AudioManager {
    constructor() {
        this.context = null;
        // Ноты (Do-Re-Mi-Fa-Sol-La-Si) → частоты (октава 4)
        this.noteFrequencies = {
            Do: 261.63, // C4
            Re: 293.66, // D4
            Mi: 329.63, // E4
            Fa: 349.23, // F4
            Sol: 392.0, // G4
            La: 440.0, // A4
            Si: 493.88 // B4
        };
        // Индексы дорожек слева направо → ноты
        this.trackToNote = ['Do','Re','Mi','Fa','Sol','La','Si'];
        this.masterGain = null;
    }

    ensureContext() {
        if (!this.context) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.context = new AudioCtx();
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = 0.6;
            this.masterGain.connect(this.context.destination);
        }
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    unlock() {
        this.ensureContext();
    }

    playFrequency(freq, durationSec = 0.25) {
        this.ensureContext();
        const now = this.context.currentTime;
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        // ADSR: быстрый аттак/декея для приятного щелчка
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.9, now + 0.01);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.08);
        gain.gain.linearRampToValueAtTime(0.0, now + durationSec);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + durationSec + 0.02);
    }

    playNoteByName(name) {
        const freq = this.noteFrequencies[name];
        if (freq) this.playFrequency(freq);
    }

    playNoteForTrack(trackIndex) {
        const name = this.trackToNote[trackIndex];
        if (name) this.playNoteByName(name);
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
            if (this.game) this.game.awardPxp(this.game.getCurrentLoot(), this.element);
            this.game.removeCharacter(this);
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
            this.game.onEnemyReachedLine(this);
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
        const lineRect = line.getBoundingClientRect();
        const trackTop = track.getBoundingClientRect().top;
        const playerHeight = this.element.getBoundingClientRect().height || 90;
        // 3/3 (100%) спрайта над линией: низ спрайта совпадает с верхом пунктира
        const gapAboveLinePx = 0;
        const offsetTop = (lineRect.top - trackTop) - playerHeight - gapAboveLinePx;
        this.element.style.top = `${Math.max(0, Math.round(offsetTop))}px`;
    }

    setTrack(newIndex) {
        const tracks = document.querySelectorAll('.track');
        newIndex = (newIndex + tracks.length) % tracks.length; // обертка по краям
        if (newIndex === this.trackIndex) return;
        const node = this.element;
        tracks[newIndex].appendChild(node);
        this.trackIndex = newIndex;
        this.updateVerticalPosition();
        // Сообщить игре о смене дорожки
        if (this.game && typeof this.game.onPlayerTrackChanged === 'function') {
            this.game.onPlayerTrackChanged(this.trackIndex);
        }
    }
}

// Пуля
class Bullet {
    constructor(game, trackIndex, speed, damage) {
        this.game = game;
        this.trackIndex = trackIndex;
        this.speed = speed; // px/sec (движение вверх)
        this.damage = typeof damage === 'number' ? damage : 1.0;
        this.element = document.createElement('div');
        this.element.className = 'bullet';
        // В момент спавна пуля невидима 0.3с, затем проявляется
        this.element.style.opacity = '0';
        this.element.style.transition = 'opacity 0.1s linear';
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

        // Отложенное проявление через 300 мс
        setTimeout(() => {
            this.element.style.opacity = '1';
        }, 100);

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    move() {
        // Движение вверх (уменьшаем top)
        this.top -= this.speed / 60;
        this.element.style.top = `${Math.round(this.top)}px`;

        // Сначала проверка столкновений с бочкой/ящиком на той же дорожке
        const bulletRect = this.element.getBoundingClientRect();
        const hitBarrel = this.game.barrels && this.game.barrels.find(b => b.trackIndex === this.trackIndex && (function(){
            const br = b.element.getBoundingClientRect();
            return bulletRect.bottom >= br.top && bulletRect.top <= br.bottom;
        })());
        if (hitBarrel) {
            this.game.onBarrelHit(hitBarrel);
            this.destroy();
            return;
        }
        const hitCrate = this.game.crates && this.game.crates.find(b => b.trackIndex === this.trackIndex && (function(){
            const br = b.element.getBoundingClientRect();
            return bulletRect.bottom >= br.top && bulletRect.top <= br.bottom;
        })());
        if (hitCrate) {
            this.game.onCrateHit(hitCrate);
            this.destroy();
            return;
        }
        const hitHeart = this.game.hearts && this.game.hearts.find(h => h.trackIndex === this.trackIndex && (function(){
            const hr = h.element.getBoundingClientRect();
            return bulletRect.bottom >= hr.top && bulletRect.top <= hr.bottom;
        })());
        if (hitHeart) {
            this.game.onHeartHit(hitHeart);
            this.destroy();
            return;
        }
        const hitBee = this.game.bees && this.game.bees.find(b => b.trackIndex === this.trackIndex && (function(){
            const br = b.element.getBoundingClientRect();
            return bulletRect.bottom >= br.top && bulletRect.top <= br.bottom;
        })());
        if (hitBee) {
            this.game.onBeeHit(hitBee);
            this.destroy();
            return;
        }

        // Проверка столкновений с персонажами/боссом на той же дорожке
        const hitChar = this.game.characters.find(c => c.isActive && c.trackIndex === this.trackIndex &&
            (function(){
                const cr = c.element.getBoundingClientRect();
                // горизонтально они по центру дорожки; достаточно вертикальной проверки
                return bulletRect.bottom >= cr.top && bulletRect.top <= cr.bottom;
            })()
        );
        if (hitChar) {
            hitChar.applyDamage(this.damage);
            this.destroy();
            return;
        }

        const hitBoss = this.game.bosses && this.game.bosses.find(b => b.trackIndex === this.trackIndex && (function(){
            const br = b.element.getBoundingClientRect();
            return bulletRect.bottom >= br.top && bulletRect.top <= br.bottom;
        })());
        if (hitBoss) {
            hitBoss.applyDamage(this.damage);
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

// Спец-объект: бочка (fair.tgs)
class Barrel {
    constructor(game, trackIndex, speed) {
        this.game = game;
        this.trackIndex = trackIndex;
        this.speed = speed;
        this.element = document.createElement('div');
        this.element.className = 'barrel';
        this.top = -100;
        this.element.style.top = `${this.top}px`;
        this.loadAnimation();

        const tracks = document.querySelectorAll('.track');
        tracks[this.trackIndex].appendChild(this.element);

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    loadAnimation() {
        const tryFetch = (path) => fetch(path).then(r => {
            if (!r.ok) throw new Error('not ok');
            return r.arrayBuffer();
        }).then(buf => {
            const json = pako.inflate(new Uint8Array(buf), { to: 'string' });
            return JSON.parse(json);
        });

        // пробуем fair.tgs затем вариант с пробелом
        tryFetch('fair.tgs').catch(() => tryFetch('fair .tgs')).then(anim => {
            this.animation = lottie.loadAnimation({
                container: this.element,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: anim
            });
        }).catch(() => {});
    }

    move() {
        this.top += this.speed / 60;
        this.element.style.top = `${Math.round(this.top)}px`;

        const horizontalLine = document.querySelector('.horizontal-line');
        const linePosition = horizontalLine.getBoundingClientRect().top;
        const objBottom = this.element.getBoundingClientRect().bottom;
        if (objBottom >= linePosition) {
            // бочка исчезает, не влияя на жизни
            this.game.removeBarrel(this);
            this.destroy();
            return;
        }

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.animation) this.animation.destroy();
        this.element.remove();
    }
}

// Ящик-буст: при попадании даёт +5 PXP и активирует массовую стрельбу
class Crate {
    constructor(game, trackIndex, speed) {
        this.game = game;
        this.trackIndex = trackIndex;
        this.speed = speed;
        this.element = document.createElement('div');
        this.element.className = 'crate';
        this.top = -100;
        this.element.style.top = `${this.top}px`;
        this.loadAnimation();

        const tracks = document.querySelectorAll('.track');
        tracks[this.trackIndex].appendChild(this.element);

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    loadAnimation() {
        const tryFetch = (path) => fetch(path).then(r => {
            if (!r.ok) throw new Error('not ok');
            return r.arrayBuffer();
        }).then(buf => {
            const json = pako.inflate(new Uint8Array(buf), { to: 'string' });
            return JSON.parse(json);
        });

        tryFetch('game.tgs').then(anim => {
            this.animation = lottie.loadAnimation({
                container: this.element,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: anim
            });
        }).catch(() => {});
    }

    move() {
        this.top += this.speed / 60;
        this.element.style.top = `${Math.round(this.top)}px`;

        const horizontalLine = document.querySelector('.horizontal-line');
        const linePosition = horizontalLine.getBoundingClientRect().top;
        const objBottom = this.element.getBoundingClientRect().bottom;
        if (objBottom >= linePosition) {
            // исчезает без последствий
            this.game.removeCrate(this);
            this.destroy();
            return;
        }

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.animation) this.animation.destroy();
        this.element.remove();
    }
}

// Пчела (ускоряет стрельбу игрока)
class Bee {
    constructor(game, trackIndex, speed) {
        this.game = game;
        this.trackIndex = trackIndex;
        this.speed = speed;
        this.element = document.createElement('div');
        this.element.className = 'bee';
        this.top = -100;
        this.element.style.top = `${this.top}px`;
        this.loadAnimation();

        const tracks = document.querySelectorAll('.track');
        tracks[this.trackIndex].appendChild(this.element);

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    loadAnimation() {
        const tryFetch = (path) => fetch(path).then(r => {
            if (!r.ok) throw new Error('not ok');
            return r.arrayBuffer();
        }).then(buf => {
            const json = pako.inflate(new Uint8Array(buf), { to: 'string' });
            return JSON.parse(json);
        });

        tryFetch('bee.tgs').then(anim => {
            this.animation = lottie.loadAnimation({
                container: this.element,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: anim
            });
        }).catch(() => {});
    }

    move() {
        this.top += this.speed / 60;
        this.element.style.top = `${Math.round(this.top)}px`;

        const horizontalLine = document.querySelector('.horizontal-line');
        const linePosition = horizontalLine.getBoundingClientRect().top;
        const objBottom = this.element.getBoundingClientRect().bottom;
        if (objBottom >= linePosition) {
            this.game.removeBee(this);
            this.destroy();
            return;
        }

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.animation) this.animation.destroy();
        this.element.remove();
    }
}

// Сердце (даёт +1 жизнь при попадании)
class HeartItem {
    constructor(game, trackIndex, speed) {
        this.game = game;
        this.trackIndex = trackIndex;
        this.speed = speed;
        this.element = document.createElement('div');
        this.element.className = 'heart-item';
        this.top = -90;
        this.element.style.top = `${this.top}px`;
        this.loadAnimation();

        const tracks = document.querySelectorAll('.track');
        tracks[this.trackIndex].appendChild(this.element);

        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    loadAnimation() {
        const tryFetch = (path) => fetch(path).then(r => r.arrayBuffer()).then(buf => {
            const json = pako.inflate(new Uint8Array(buf), { to: 'string' });
            return JSON.parse(json);
        });
        tryFetch('h.tgs').then(anim => {
            this.animation = lottie.loadAnimation({
                container: this.element,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: anim
            });
        }).catch(() => {});
    }

    move() {
        this.top += this.speed / 60;
        this.element.style.top = `${Math.round(this.top)}px`;
        const horizontalLine = document.querySelector('.horizontal-line');
        const linePosition = horizontalLine.getBoundingClientRect().top;
        const objBottom = this.element.getBoundingClientRect().bottom;
        if (objBottom >= linePosition) {
            this.game.removeHeart(this);
            this.destroy();
            return;
        }
        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.animation) this.animation.destroy();
        this.element.remove();
    }
}

// Босс
class Boss {
    constructor(game, trackIndex, speed, health) {
        this.game = game;
        this.trackIndex = trackIndex;
        this.speed = speed;
        this.element = document.createElement('div');
        this.element.className = 'boss';
        this.top = -120;
        this.element.style.top = `${this.top}px`;
        this.health = health;
        this.isActive = true;
        this.loadAnimation();

        const tracks = document.querySelectorAll('.track');
        tracks[this.trackIndex].appendChild(this.element);

        this.renderHp();
        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    loadAnimation() {
        const tryFetch = (path) => fetch(path).then(r => r.arrayBuffer()).then(buf => {
            const json = pako.inflate(new Uint8Array(buf), { to: 'string' });
            return JSON.parse(json);
        });
        tryFetch('boss1.tgs').then(anim => {
            this.animation = lottie.loadAnimation({
                container: this.element,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                animationData: anim
            });
        }).catch(() => {});
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
            this.game.onBossKilled(this);
            this.destroy();
        }
    }

    move() {
        if (!this.isActive) return;
        this.top += this.speed / 60;
        this.element.style.top = `${Math.round(this.top)}px`;
        const horizontalLine = document.querySelector('.horizontal-line');
        const linePosition = horizontalLine.getBoundingClientRect().top;
        const objBottom = this.element.getBoundingClientRect().bottom;
        if (objBottom >= linePosition) {
            // при достижении пунктира как обычный враг
            this.isActive = false;
            this.game.onEnemyReachedLine(this);
            return;
        }
        this.rafId = requestAnimationFrame(this.move.bind(this));
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.animation) this.animation.destroy();
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
        this.lives = 3;
        
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
        // Спец-объекты: бочки
        this.barrels = [];
        // Спец-объекты: ящики
        this.crates = [];
        this.lastCrateCheckSecond = -1;
        this.powerUpActiveUntilMs = 0;
        this.nextBulletPerTrack = new Array(7).fill(Number.POSITIVE_INFINITY);
        // Пчёлы
        this.bees = [];
        this.lastBeeCheckSecond = -1;
        this.rapidFireUntilMs = 0; // для игрока: частота 0.05с
        // Боссы
        this.bosses = [];
        this.lastBossMinute = -1;
        // Сердца
        this.hearts = [];
        
        // Скорости объектов
        this.enemySpeedPxSec = 100; // px/сек
        this.bulletSpeedPxSec = 400; // px/сек (начальная скорость пули)
        this.bulletDamage = 1.5; // урон пули (в сердцах)
        this.bulletIntervalMs = 1000; // интервал выпуска пуль, мс
        this.speedUpgradeCount = 0; // число апгрейдов скорости

        this.audio = new AudioManager();
        this.loop = this.loop.bind(this);
        this.updateSpeedInfo = this.updateSpeedInfo.bind(this);
        this.scheduleStart(1);
        this.updateLivesDisplay();
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
        // очистка бочек
        this.barrels.forEach(b => b.destroy());
        this.barrels = [];
        // очистка ящиков
        this.crates.forEach(b => b.destroy());
        this.crates = [];
        this.powerUpActiveUntilMs = 0;
        this.nextBulletPerTrack.fill(Number.POSITIVE_INFINITY);
        // очистка пчёл
        this.bees.forEach(b => b.destroy());
        this.bees = [];
        this.rapidFireUntilMs = 0;
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
                // Разблокировать аудио и проиграть нужную ноту (делает Player → Game)
            };
            field.addEventListener('click', this._fieldClickHandler);
        }

        // Обработчик апгрейда скорости
        const speedBtn = document.querySelector('.speed-btn');
        if (!this._speedClickHandler && speedBtn) {
            this._speedClickHandler = () => {
                const price = Number(speedBtn.dataset.price || 1);
                if (this.balance.subtract(price)) {
                    // Повышаем цену: +1 к предыдущей
                    const newPrice = price + 1;
                    speedBtn.dataset.price = String(newPrice);
                    const priceEl = speedBtn.querySelector('.btn-price');
                    if (priceEl) priceEl.textContent = `${newPrice} PXP`;

                    // Увеличиваем скорость пули на +10 px/сек
                    this.bulletSpeedPxSec += 10;
                    // Каждые 5 апгрейдов уменьшаем интервал выпуска на 0.01s (10 мс), минимум 0.1s
                    this.speedUpgradeCount += 1;
                    if (this.speedUpgradeCount % 5 === 0) {
                        this.bulletIntervalMs = Math.max(100, this.bulletIntervalMs - 10);
                    }
                    this.updateSpeedInfo();

                    // Обновить доступность кнопок
                    this.balance.checkUpgradeButtons();
                }
            };
            speedBtn.addEventListener('click', this._speedClickHandler);
        }

        // Обработчик апгрейда урона
        const damageBtn = document.querySelector('.damage-btn');
        if (!this._damageClickHandler && damageBtn) {
            this._damageClickHandler = () => {
                const price = Number(damageBtn.dataset.price || 1);
                if (this.balance.subtract(price)) {
                    const newPrice = price + 1;
                    damageBtn.dataset.price = String(newPrice);
                    const priceEl = damageBtn.querySelector('.btn-price');
                    if (priceEl) priceEl.textContent = `${newPrice} PXP`;

                    // Увеличиваем урон пули на +0.2
                    this.bulletDamage = Number((this.bulletDamage + 0.2).toFixed(1));
                    this.updateDamageInfo();

                    this.balance.checkUpgradeButtons();
                }
            };
            damageBtn.addEventListener('click', this._damageClickHandler);
        }

        // При старте обновить состояние кнопок и индикаторы
        this.balance.checkUpgradeButtons();
        this.updateSpeedInfo();
        this.updateDamageInfo();
        this.updateLivesDisplay();
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
            const baseCount = this.baseCharactersPerWave + (this.waveNumber - 1);
            const spawnsInWave = Math.ceil(baseCount * this.getGenerationMultiplier());
            const spawnIntervalMs = (this.baseSpawnInterval + (this.waveNumber - 1) * 0.1) * 1000;
            this.spawnsLeftInWave = spawnsInWave;
            this.nextSpawnMs = elapsed; // первый спавн мгновенно
            this.spawnIntervalMs = spawnIntervalMs;
            this.nextWaveStartMs += 5000; // следующая волна через 5s
        }

        // Спавн ящика каждые 20 секунд с вероятностью 1/3
        const secondsNow = Math.floor(elapsed / 1000);
        if (secondsNow > 0 && secondsNow % 20 === 0 && this.lastCrateCheckSecond !== secondsNow) {
            this.lastCrateCheckSecond = secondsNow;
            if (Math.random() < 1/3) {
                const trackIndex = Math.floor(Math.random() * 7);
                const crate = new Crate(this, trackIndex, this.enemySpeedPxSec);
                this.crates.push(crate);
            }
        }

        // Спавн пчелы каждые 10 секунд с вероятностью 1/4
        if (secondsNow > 0 && secondsNow % 10 === 0 && this.lastBeeCheckSecond !== secondsNow) {
            this.lastBeeCheckSecond = secondsNow;
            if (Math.random() < 1/4) {
                const trackIndex = Math.floor(Math.random() * 7);
                const bee = new Bee(this, trackIndex, this.enemySpeedPxSec);
                this.bees.push(bee);
            }
        }

        // Спавн босса каждую полную минуту
        const minuteNow = Math.floor(elapsed / 60000);
        if (minuteNow > 0 && this.lastBossMinute !== minuteNow && secondsNow % 60 === 0) {
            this.lastBossMinute = minuteNow;
            const trackIndex = Math.floor(Math.random() * 7);
            // здоровье босса: базовое 10, +30% за каждую прошедшую минуту (мультипликативно)
            const bossHp = Number((10 * Math.pow(1.3, minuteNow)).toFixed(1));
            const boss = new Boss(this, trackIndex, this.enemySpeedPxSec, bossHp);
            this.bosses.push(boss);
        }

        // Спавн в рамках текущей волны
        while (this.isRunning && this.spawnsLeftInWave > 0 && elapsed >= this.nextSpawnMs) {
            const trackIndex = Math.floor(Math.random() * 7);
            const speed = this.enemySpeedPxSec; // px/sec
            // С шансом 1/30 появляется сердце
            if (Math.random() < 1/30) {
                const heart = new HeartItem(this, trackIndex, speed);
                this.hearts.push(heart);
            } else {
            // В окне 5..30с с шансом 1/30 появляется бочка; шанс усиливается при низких жизнях
            const seconds = Math.floor(this.timer.getElapsedTime() / 1000);
            const baseProb = 1 / 30;
            const multiplier = this.lives <= 1 ? 3 : (this.lives === 2 ? 2 : 1);
            const prob = baseProb * multiplier; // 1/30, 1/15, 1/10
            const canSpawnBarrel = seconds >= 5 && seconds <= 30 && Math.random() < prob;
            if (canSpawnBarrel) {
                const barrel = new Barrel(this, trackIndex, speed);
                this.barrels.push(barrel);
            } else {
                // Рандомный штраф к здоровью от 0% до 30% от базового
                const healthPenaltyRatio = Math.random() * 0.3; // [0, 0.3]
                const spawnHealth = Number((this.baseHealth * (1 - healthPenaltyRatio)).toFixed(1));
                const char = new Character(this, trackIndex, speed, spawnHealth);
                this.characters.push(char);
            }
            }
            this.spawnsLeftInWave -= 1;
            this.nextSpawnMs += this.spawnIntervalMs;
        }

        // Генерация пуль
        if (this.isRunning) {
            // Режим массового буста
            if (this.powerUpActiveUntilMs > elapsed) {
                for (let i = 0; i < 7; i++) {
                    if (elapsed >= this.nextBulletPerTrack[i]) {
                        const b = new Bullet(this, i, 600, this.bulletDamage);
                        this.bullets.push(b);
                        this.nextBulletPerTrack[i] = elapsed + this.bulletIntervalMs;
                    }
                }
                // Во время массовой стрельбы игрок тоже стреляет своей пулей
                if (this.player && elapsed >= this.nextBulletMs) {
                    const pb = new Bullet(this, this.player.trackIndex, 600, this.bulletDamage);
                    this.bullets.push(pb);
                    this.nextBulletMs = elapsed + this.bulletIntervalMs;
                }
            } else {
                // выключаем буст, если закончился
                if (this.powerUpActiveUntilMs !== 0) {
                    this.powerUpActiveUntilMs = 0;
                    this.nextBulletPerTrack.fill(Number.POSITIVE_INFINITY);
                }
                // Обычный выстрел из дорожки игрока
                if (elapsed >= this.nextBulletMs && this.player) {
                    const effectiveInterval = (this.rapidFireUntilMs > elapsed) ? 50 : this.bulletIntervalMs; // 0.05с
                    const bullet = new Bullet(this, this.player.trackIndex, this.bulletSpeedPxSec, this.bulletDamage);
                    this.bullets.push(bullet);
                    this.nextBulletMs += effectiveInterval;
                }
            }
        }

        requestAnimationFrame(this.loop);
    }

    removeCharacter(char) {
        const idx = this.characters.indexOf(char);
        if (idx !== -1) {
            this.characters.splice(idx, 1);
        }
    }

    removeBarrel(barrel) {
        const idx = this.barrels.indexOf(barrel);
        if (idx !== -1) this.barrels.splice(idx, 1);
    }

    removeCrate(crate) {
        const idx = this.crates.indexOf(crate);
        if (idx !== -1) this.crates.splice(idx, 1);
    }

    removeBee(bee) {
        const idx = this.bees.indexOf(bee);
        if (idx !== -1) this.bees.splice(idx, 1);
    }

    removeBoss(boss) {
        const idx = this.bosses.indexOf(boss);
        if (idx !== -1) this.bosses.splice(idx, 1);
    }

    removeHeart(heart) {
        const idx = this.hearts.indexOf(heart);
        if (idx !== -1) this.hearts.splice(idx, 1);
    }

    gameOver() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.timer.stop();
        this.characters.forEach(char => char.destroy());
        this.characters = [];
        this.barrels.forEach(b => b.destroy());
        this.barrels = [];
        this.crates.forEach(c => c.destroy());
        this.crates = [];
        this.bees.forEach(b => b.destroy());
        this.bees = [];
        this.bosses.forEach(b => b.destroy());
        this.bosses = [];
        this.bullets.forEach(b => b.destroy());
        this.bullets = [];
        if (this.hearts) { this.hearts.forEach(h => h.destroy()); this.hearts = []; }
        if (this.overlay) this.overlay.style.display = 'flex';
        // гарантируем наличие гиперссылки в поп-апе
        this.ensureDevLink();
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
        this.lives = 3;
        this.updateLivesDisplay();
        // Сброс цен на апгрейды
        const speedBtn = document.getElementById('speed-btn');
        if (speedBtn) {
            speedBtn.dataset.price = '1';
            const priceEl = speedBtn.querySelector('.btn-price');
            if (priceEl) priceEl.textContent = '1 PXP';
            speedBtn.classList.remove('can-afford');
            speedBtn.disabled = true;
        }
        const damageBtn = document.getElementById('damage-btn');
        if (damageBtn) {
            damageBtn.dataset.price = '1';
            const priceEl = damageBtn.querySelector('.btn-price');
            if (priceEl) priceEl.textContent = '1 PXP';
            damageBtn.classList.remove('can-afford');
            damageBtn.disabled = true;
        }

        // Сброс скорости пуль к начальному значению
        this.bulletSpeedPxSec = 400;
        this.updateSpeedInfo();
        // Сброс урона пули к начальному значению
        this.bulletDamage = 1.5;
        this.updateDamageInfo();
        // Сброс частоты выпуска и счётчика апгрейдов скорости
        this.bulletIntervalMs = 1000;
        this.speedUpgradeCount = 0;
        // Очистка бочек
        this.barrels.forEach(b => b.destroy());
        this.barrels = [];
        
        // Перезапуск игры
        this.start();
    }

    updateSpeedInfo() {
        const el = document.getElementById('speed-info');
        if (el) {
            el.textContent = `${this.bulletSpeedPxSec} px/сек`;
        }
    }

    updateDamageInfo() {
        const el = document.getElementById('damage-info');
        if (el) {
            el.textContent = `${this.bulletDamage.toFixed(1)} ❤`;
        }
    }

    showPxpGainAtElement(element, amount) {
        const field = document.querySelector('.game-field');
        if (!field || !element) return;
        const fieldRect = field.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        let x = elRect.left + elRect.width / 2 - fieldRect.left;
        let y = elRect.top - fieldRect.top;
        x = Math.max(0, Math.min(x, fieldRect.width));
        y = Math.max(0, Math.min(y, fieldRect.height - 20));
        const tag = document.createElement('div');
        tag.className = 'pxp-float';
        tag.style.left = `${x}px`;
        tag.style.top = `${y}px`;
        const amountText = Number.isInteger(amount) ? amount : Number(amount).toFixed(2);
        tag.textContent = `+${amountText} PXP`;
        field.appendChild(tag);
        setTimeout(() => tag.remove(), 1000);
    }

    showMultiplierAtElement(element, text) {
        const field = document.querySelector('.game-field');
        if (!field || !element) return;
        const fieldRect = field.getBoundingClientRect();
        const elRect = element.getBoundingClientRect();
        let x = elRect.left + elRect.width / 2 - fieldRect.left;
        let y = elRect.top - fieldRect.top;
        x = Math.max(0, Math.min(x, fieldRect.width));
        y = Math.max(0, Math.min(y, fieldRect.height - 20));
        const tag = document.createElement('div');
        tag.className = 'pxp-mult';
        tag.style.left = `${x}px`;
        tag.style.top = `${y}px`;
        tag.textContent = text;
        field.appendChild(tag);
        setTimeout(() => tag.remove(), 1100);
    }

    ensureDevLink() {
        const popup = document.querySelector('.popup');
        if (!popup) return;
        let link = popup.querySelector('.popup-dev');
        if (!link) {
            link = document.createElement('a');
            link.className = 'popup-dev';
            link.href = 'https://t.me/vingrigstudio';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Dev Vingrig Studio';
            popup.appendChild(link);
        }
    }

    awardPxp(amount, atElement) {
        if (this.balance) this.balance.add(amount);
        this.showPxpGainAtElement(atElement, amount);
    }

    getCurrentLoot() {
        const elapsedMs = this.timer.getElapsedTime();
        const seconds = Math.floor(elapsedMs / 1000); // прошедшие полные секунды
        const loot = 0.5 + seconds * 0.05; // старт 0.5 и +0.05 за каждую секунду
        return Number(loot.toFixed(2));
    }

    // Увеличение генерации врагов: +20% каждую полную минуту
    getGenerationMultiplier() {
        const minutes = Math.floor(this.timer.getElapsedTime() / 60000);
        if (minutes <= 0) return 1;
        return Math.pow(1.2, minutes);
    }

    onEnemyReachedLine(character) {
        if (!this.isRunning) return;
        this.removeCharacter(character);
        character.destroy();
        this.lives = Math.max(0, this.lives - 1);
        this.updateLivesDisplay();
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    updateLivesDisplay() {
        const topLives = document.getElementById('lives-top');
        if (topLives) topLives.textContent = `❤ ${this.lives}`;
    }

    onPlayerTrackChanged(trackIndex) {
        if (this.audio) {
            this.audio.unlock();
            this.audio.playNoteForTrack(trackIndex);
        }
    }

    onBarrelHit(barrel) {
        // награда за бочку
        this.awardPxp(10, barrel.element);
        // уничтожаем бочку
        this.removeBarrel(barrel);
        barrel.destroy();
        // Все текущие персонажи исчезают с выпадением лута
        const loot = this.getCurrentLoot();
        const toRemove = [...this.characters];
        for (const c of toRemove) {
            this.awardPxp(loot, c.element);
            this.removeCharacter(c);
            c.destroy();
        }
    }

    onCrateHit(crate) {
        // +5 PXP за ящик
        this.awardPxp(5, crate.element);
        // Активируем массовую стрельбу на 5 секунд
        const now = this.timer.getElapsedTime();
        this.powerUpActiveUntilMs = Math.max(this.powerUpActiveUntilMs, now + 5000);
        // начать стрелять всеми дорожками немедленно
        this.nextBulletPerTrack = this.nextBulletPerTrack.map(() => now);
        // удалить ящик
        this.removeCrate(crate);
        crate.destroy();
    }

    onBossKilled(boss) {
        // Удаляем босса
        this.removeBoss(boss);
        // Удваиваем баланс
        const before = this.balance.amount;
        this.balance.amount = Number((this.balance.amount * 2).toFixed(2));
        this.balance.updateDisplay();
        // Показать множитель x2
        this.showMultiplierAtElement(boss.element, '×2');
    }

    onHeartHit(heart) {
        this.removeHeart(heart);
        heart.destroy();
        this.lives += 1;
        this.updateLivesDisplay();
        // небольшой визуальный эффект
        this.showMultiplierAtElement(heart.element, '+1❤');
    }

    onBeeHit(bee) {
        // активация быстрого огня для игрока на 8 секунд (0.05с интервал)
        const now = this.timer.getElapsedTime();
        this.rapidFireUntilMs = Math.max(this.rapidFireUntilMs, now + 8000);
        this.nextBulletMs = now; // начать сразу
        this.removeBee(bee);
        bee.destroy();
    }
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    const timer = new Timer();
    const balance = new Balance();
    const game = new Game(timer, balance);
    window._game = game;

    // Блокируем копирование текста и контекстное меню
    document.addEventListener('copy', function(e) { e.preventDefault(); });
    document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
    // Блокируем zoom жестами и сочетаниями клавиш
    window.addEventListener('wheel', function(e) { if (e.ctrlKey) { e.preventDefault(); } }, { passive: false });
    window.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === '+' || e.key === '=' || e.key === '-' || e.key === '0') {
                e.preventDefault();
            }
        }
    });
    document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
    // Разблокировать аудиоконтекст при первом взаимодействии
    const unlockOnce = () => { if (game && game.audio) game.audio.unlock(); window.removeEventListener('pointerdown', unlockOnce); };
    window.addEventListener('pointerdown', unlockOnce);

    // Слушатели на апгрейды обрабатываются внутри Game; здесь ничего не делаем

    // Динамическая компоновка: вся сцена формируется строго выше надписей над кнопками + 2px
    function layoutScene() {
        const lineEl = document.querySelector('.horizontal-line');
        if (lineEl) {
            // Вернуть пунктир к стилям из CSS
            lineEl.style.bottom = '';
        }
        // Пересчитать позицию игрока относительно пунктира
        if (window._game && window._game.player) {
            window._game.player.updateVerticalPosition();
        }
    }
    window.addEventListener('resize', layoutScene);
    const panel = document.querySelector('.button-panel');
    if (panel) {
        const mo = new MutationObserver(layoutScene);
        mo.observe(panel, { subtree: true, childList: true, characterData: true });
    }
    setTimeout(layoutScene, 0);
});
