let allCards = [];
let currentQueue = [];
let unknownCards = [];
let currentCardIndex = 0;
let currentMode = 'learn';

const SESSION_KEY = 'flashcards_session';
const CARDS_KEY = 'flashcards_data';

function saveSession() {
    const sessionData = {
        unknownCardsIds: unknownCards.map(c => c.id),
        currentQueueIds: currentQueue.map(c => c.id),
        currentCardIndex: currentCardIndex,
        currentMode: currentMode
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
}

function loadSession() {
    const savedSession = localStorage.getItem(SESSION_KEY);
    if (savedSession) {
        try {
            const sessionData = JSON.parse(savedSession);
            if (sessionData.unknownCardsIds && sessionData.unknownCardsIds.length > 0) {
                unknownCards = allCards.filter(card => sessionData.unknownCardsIds.includes(card.id));
            } else {
                unknownCards = [];
            }
            if (sessionData.currentQueueIds && sessionData.currentQueueIds.length > 0) {
                currentQueue = allCards.filter(card => sessionData.currentQueueIds.includes(card.id));
                currentCardIndex = sessionData.currentCardIndex || 0;
                if (currentCardIndex >= currentQueue.length) {
                    currentCardIndex = 0;
                }
            } else {
                currentQueue = [...allCards];
                shuffleArray(currentQueue);
                currentCardIndex = 0;
            }
            if (sessionData.currentMode) {
                currentMode = sessionData.currentMode;
            }
            return true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

async function loadCardsFromJSON() {
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            const data = await response.json();
            if (data.cards && Array.isArray(data.cards)) {
                allCards = data.cards;
                saveCardsToLocal();
                showNotification('Карточки загружены из questions.json');
                return true;
            }
        }
    } catch (error) {
        console.log('Файл questions.json не найден');
    }
    return false;
}

function saveCardsToLocal() {
    localStorage.setItem(CARDS_KEY, JSON.stringify(allCards));
}

function loadCardsFromLocal() {
    const saved = localStorage.getItem(CARDS_KEY);
    if (saved) {
        allCards = JSON.parse(saved);
        return true;
    }
    return false;
}

function setDefaultCards() {
    allCards = [
        { id: 1, question: "Что такое Python?", answer: "Python - это высокоуровневый язык программирования" },
        { id: 2, question: "Что такое SQL?", answer: "SQL - язык структурированных запросов" },
        { id: 3, question: "Что такое HTML?", answer: "HTML - язык гипертекстовой разметки" },
        { id: 4, question: "Что такое CSS?", answer: "CSS - каскадные таблицы стилей" },
        { id: 5, question: "Что такое JavaScript?", answer: "JavaScript - язык программирования для веб-страниц" },
        { id: 6, question: "Что такое React?", answer: "React - библиотека для создания интерфейсов" },
        { id: 7, question: "Что такое Node.js?", answer: "Node.js - среда выполнения JavaScript на сервере" },
        { id: 8, question: "Что такое Git?", answer: "Git - система контроля версий" },
        { id: 9, question: "Что такое Docker?", answer: "Docker - платформа для контейнеризации" },
        { id: 10, question: "Что такое Flask?", answer: "Flask - микрофреймворк для Python" }
    ];
    saveCardsToLocal();
}

async function initCards() {
    const loadedFromJSON = await loadCardsFromJSON();
    
    if (!loadedFromJSON) {
        const loadedFromLocal = loadCardsFromLocal();
        if (!loadedFromLocal) {
            setDefaultCards();
        }
    }
    
    const sessionLoaded = loadSession();
    
    if (!sessionLoaded || currentQueue.length === 0) {
        startNewRound();
    } else {
        renderCurrentView();
    }
    
    updateModeButtons();
}

function startNewRound() {
    currentQueue = [...allCards];
    shuffleArray(currentQueue);
    currentCardIndex = 0;
    unknownCards = [];
    saveSession();
    renderCurrentView();
}

function continueWithUnknown() {
    if (unknownCards.length === 0) {
        showNotification('Поздравляем! Вы выучили все карточки!');
        renderComplete();
        return;
    }
    
    currentQueue = [...unknownCards];
    shuffleArray(currentQueue);
    currentCardIndex = 0;
    unknownCards = [];
    saveSession();
    renderCurrentView();
    showNotification(`Повторяем ${currentQueue.length} карточек, которые вы не знали`);
}

function markAsKnown() {
    if (currentQueue.length === 0) return;
    if (currentMode !== 'learn') return;
    
    currentQueue.splice(currentCardIndex, 1);
    saveSession();
    
    if (currentQueue.length > 0) {
        if (currentCardIndex >= currentQueue.length) {
            currentCardIndex = currentQueue.length - 1;
        }
        renderCurrentView();
        showNotification('Знаю! Карточка удалена из очереди');
    } else {
        if (unknownCards.length > 0) {
            showNotification('Круг завершен! Переходим к повторению невыученных карточек');
            continueWithUnknown();
        } else {
            showNotification('Поздравляем! Вы выучили все карточки!');
            renderComplete();
        }
    }
}

function markAsUnknown() {
    if (currentQueue.length === 0) return;
    if (currentMode !== 'learn') return;
    
    const currentCard = currentQueue[currentCardIndex];
    
    const isAlreadyInUnknown = unknownCards.some(card => card.id === currentCard.id);
    if (!isAlreadyInUnknown) {
        unknownCards.push(currentCard);
    }
    
    currentQueue.splice(currentCardIndex, 1);
    saveSession();
    
    if (currentQueue.length > 0) {
        if (currentCardIndex >= currentQueue.length) {
            currentCardIndex = currentQueue.length - 1;
        }
        renderCurrentView();
        showNotification('Не знаю! Карточка отложена для повторения');
    } else {
        if (unknownCards.length > 0) {
            showNotification('Круг завершен! Переходим к повторению невыученных карточек');
            continueWithUnknown();
        } else {
            showNotification('Поздравляем! Вы выучили все карточки!');
            renderComplete();
        }
    }
}

function goToPrevious() {
    if (currentMode !== 'learn') return;
    if (currentQueue.length === 0) return;
    
    if (currentCardIndex > 0) {
        currentCardIndex--;
        saveSession();
        renderCurrentView();
    } else {
        showNotification('Это первая карточка в круге');
    }
}

function goToNext() {
    if (currentMode !== 'learn') return;
    if (currentQueue.length === 0) return;
    
    if (currentCardIndex < currentQueue.length - 1) {
        currentCardIndex++;
        saveSession();
        renderCurrentView();
    } else {
        showNotification('Это последняя карточка в круге');
    }
}

function renderCurrentView() {
    if (currentMode === 'learn') {
        renderLearnMode();
    } else {
        renderListMode();
    }
}

function renderLearnMode() {
    const container = document.getElementById('cardsContainer');
    
    if (allCards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Нет карточек</p>
            </div>
        `;
        return;
    }
    
    if (currentQueue.length === 0) {
        if (unknownCards.length === 0) {
            renderComplete();
        } else {
            continueWithUnknown();
        }
        return;
    }
    
    const card = currentQueue[currentCardIndex];
    const totalLearned = allCards.length - unknownCards.length - (currentQueue.length - 1);
    
    container.innerHTML = `
        <div class="stats">
            <div class="stat-item">
                <span class="stat-label">Всего:</span>
                <span class="stat-value">${allCards.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">Выучено:</span>
                <span class="stat-value">${totalLearned}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">В круге:</span>
                <span class="stat-value">${currentQueue.length}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">На повторении:</span>
                <span class="stat-value">${unknownCards.length}</span>
            </div>
        </div>
        <div class="counter">
            Карточка ${currentCardIndex + 1} из ${currentQueue.length}
        </div>
        <div class="card-wrapper">
            <div class="card" onclick="toggleCard(this)">
                <div class="card-inner">
                    <div class="card-front">
                        <h3>Вопрос</h3>
                        <p>${escapeHtml(card.question)}</p>
                        <div class="flip-hint">нажмите для ответа</div>
                    </div>
                    <div class="card-back">
                        <h3>Ответ</h3>
                        <p>${escapeHtml(card.answer)}</p>
                        <div class="flip-hint">нажмите для вопроса</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="controls">
            <button class="btn" onclick="goToPrevious()">Назад</button>
            <button class="btn btn-success" onclick="markAsKnown()">Знаю</button>
            <button class="btn btn-danger" onclick="markAsUnknown()">Не знаю</button>
            <button class="btn" onclick="goToNext()">Вперёд</button>
        </div>
        <div class="controls">
            <button class="btn" onclick="shuffleCurrentQueue()">Перемешать</button>
            <button class="btn btn-primary" onclick="startNewRound()">Начать заново</button>
        </div>
        <div class="progress">
            Кликните по карточке, чтобы перевернуть<br>
            Знаю - карточка уходит из текущего круга<br>
            Не знаю - карточка откладывается для повторения
        </div>
    `;
}

function renderListMode() {
    const container = document.getElementById('cardsContainer');
    
    if (allCards.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>Нет карточек</p>
            </div>
        `;
        return;
    }
    
    let cardsHtml = '';
    for (let i = 0; i < allCards.length; i++) {
        const card = allCards[i];
        cardsHtml += `
            <div class="list-card" onclick="toggleListCard(this)">
                <div class="list-card-question">
                    <h4>Вопрос ${i + 1}</h4>
                    <p>${escapeHtml(card.question)}</p>
                </div>
                <div class="list-card-answer">
                    <h4>Ответ ${i + 1}</h4>
                    <p>${escapeHtml(card.answer)}</p>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = `
        <div class="list-header">
            <p>Всего карточек: ${allCards.length} (нажмите на карточку, чтобы увидеть ответ)</p>
        </div>
        <div class="list-view">
            ${cardsHtml}
        </div>
    `;
}

function renderComplete() {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <p>Поздравляю!</p>
            <p style="font-size: 1.2em; margin-top: 10px;">Вы выучили все ${allCards.length} карточек!</p>
            <div class="controls" style="margin-top: 30px;">
                <button class="btn btn-primary" onclick="startNewRound()">Начать заново</button>
            </div>
        </div>
    `;
}

function shuffleCurrentQueue() {
    if (currentMode !== 'learn') return;
    for (let i = currentQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [currentQueue[i], currentQueue[j]] = [currentQueue[j], currentQueue[i]];
    }
    currentCardIndex = 0;
    saveSession();
    renderCurrentView();
    showNotification('Карточки перемешаны');
}

function toggleCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

function toggleListCard(cardElement) {
    cardElement.classList.toggle('flipped');
}

function setMode(mode) {
    currentMode = mode;
    saveSession();
    renderCurrentView();
    updateModeButtons();
}

function updateModeButtons() {
    const btns = document.querySelectorAll('.mode-btn');
    btns.forEach(btn => {
        if (btn.dataset.mode === currentMode) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 2000);
}

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setMode(btn.dataset.mode);
    });
});

initCards();
