let allCards = [];
let currentQueue = [];
let unknownCards = [];
let currentCardIndex = 0;
let roundTotal = 0;
let answers = []; 
let viewMode = 'learn';

const SESSION_KEY = 'flashcards_session';
const CARDS_KEY = 'flashcards_data';

async function initCards() {
    const loadedFromJSON = await loadCardsFromJSON();

    if (!loadedFromJSON) {
        const loadedFromLocal = loadCardsFromLocal();
        if (!loadedFromLocal) {
            setDefaultCards();
        }
    }

    startNewRound();
}

async function loadCardsFromJSON() {
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            const data = await response.json();
            if (data.cards && Array.isArray(data.cards)) {
                allCards = data.cards;
                saveCardsToLocal();
                showNotification('Карточки загружены');
                return true;
            }
        }
    } catch {
        console.log('questions.json не найден');
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
        { id: 1, question: "Что такое Python?", answer: "Язык программирования" },
        { id: 2, question: "Что такое SQL?", answer: "Язык запросов" },
        { id: 3, question: "Что такое HTML?", answer: "Разметка" },
        { id: 4, question: "Что такое CSS?", answer: "Стили" },
        { id: 5, question: "Что такое JS?", answer: "Язык для веба" }
    ];
    saveCardsToLocal();
}

function startNewRound() {
    currentQueue = [...allCards];
    shuffleArray(currentQueue);

    currentCardIndex = 0;
    unknownCards = [];
    roundTotal = currentQueue.length;
    answers = new Array(currentQueue.length).fill(null);

    renderCurrentCard();
}

function continueWithUnknown() {
    if (unknownCards.length === 0) {
        renderComplete();
        return;
    }

    currentQueue = [...unknownCards];
    shuffleArray(currentQueue);

    currentCardIndex = 0;
    unknownCards = [];
    roundTotal = currentQueue.length;
    answers = new Array(currentQueue.length).fill(null);

    renderCurrentCard();
}

function markAsKnown() {
    answers[currentCardIndex] = 'known';
    nextCard();
}

function markAsUnknown() {
    answers[currentCardIndex] = 'unknown';
    nextCard();
}

function nextCard() {
    if (currentCardIndex < currentQueue.length - 1) {
        currentCardIndex++;
        renderCurrentCard();
    } else {
        finishRound();
    }
}

function prevCard() {
    if (currentCardIndex > 0) {
        currentCardIndex--;
        renderCurrentCard();
    }
}

function finishRound() {
    unknownCards = currentQueue.filter((card, i) => answers[i] === 'unknown');

    if (unknownCards.length > 0) {
        showNotification('Повторяем сложные карточки');
        continueWithUnknown();
    } else {
        renderComplete();
    }
}

function toggleMode() {
    viewMode = viewMode === 'learn' ? 'list' : 'learn';
    renderCurrentCard();
}

function renderCurrentCard() {
    const container = document.getElementById('cardsContainer');

    if (viewMode === 'list') {
        container.innerHTML = `
            <h3>Все карточки</h3>
            ${allCards.map((c, i) => `
                <div class="card-list-item">
                    <b>${i + 1}.</b> ${escapeHtml(c.question)}<br>
                    <small>${escapeHtml(c.answer)}</small>
                </div>
            `).join('')}
            <button class="btn" onclick="toggleMode()">Назад к обучению</button>
        `;
        return;
    }

    if (currentQueue.length === 0) return;

    const card = currentQueue[currentCardIndex];

    container.innerHTML = `
        <div class="counter">
            ${currentCardIndex + 1} из ${roundTotal}
        </div>

        <div class="card-wrapper">
            <div class="card" onclick="toggleCard(this)">
                <div class="card-inner">
                    <div class="card-front">
                        <h3>Вопрос</h3>
                        <p>${escapeHtml(card.question)}</p>
                    </div>
                    <div class="card-back">
                        <h3>Ответ</h3>
                        <p>${escapeHtml(card.answer)}</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="controls">
            <button onclick="prevCard()">Назад</button>
            <button onclick="markAsKnown()">Знаю</button>
            <button onclick="markAsUnknown()">Не знаю</button>
        </div>

        <div class="controls">
            <button onclick="toggleMode()">Список</button>
            <button onclick="startNewRound()">Сброс</button>
        </div>
    `;
}

function renderComplete() {
    const container = document.getElementById('cardsContainer');

    container.innerHTML = `
        <h2>🎉 Готово!</h2>
        <button onclick="startNewRound()">Начать заново</button>
    `;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

function toggleCard(el) {
    el.classList.toggle('flipped');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(msg) {
    console.log(msg);
}

initCards();
