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
        const hours = Math.floor(elapsed / (1000 * 60 * 60));
        const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        this.timerElement.textContent = formattedTime;
    }

    getElapsedTime() {
        return Date.now() - this.startTime;
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

// Инициализация игры
document.addEventListener('DOMContentLoaded', function() {
    // Запуск секундомера
    const timer = new Timer();

    // Инициализация баланса
    const balance = new Balance();

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

    // Для тестирования - добавление PXP по клику на игровое поле
    document.querySelector('.game-field').addEventListener('click', function() {
        balance.add(1);
    });
});
