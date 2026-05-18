
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gridSize = 20;
let tileCount = 22;
function resizeCanvas() {
    const maxSize = Math.min(window.innerWidth - 50, window.innerHeight - 200, 550);
    tileCount = Math.floor(maxSize / gridSize);
    tileCount = Math.max(tileCount, 16);
    canvas.width = tileCount * gridSize;
    canvas.height = tileCount * gridSize;
}
resizeCanvas();
window.addEventListener('resize', () => {
    if (!isGameRunning) resizeCanvas();
});

const difficulties = {
    easy: 150,
    normal: 100,
    hard: 60
};
let currentDifficulty = 'easy';

let snake = [];
let food = {};
let dx = 0;
let dy = 0;
let score = 0;
let highScore = 0;
let gameLoop = null;
let isGameRunning = false;
let gameInitialized = false;

let currentUser = null;

function initAuth() {
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    
    if (token && username && userId) {
        currentUser = { token, username, userId };
        showMenuSection();
        loadHighScore();
    } else {
        showAuthSection();
    }
}

function clearInputs() {
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('register-username').value = '';
    document.getElementById('register-password').value = '';
}

function showAuthSection() {
    clearInputs();
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('menu-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'none';
    document.getElementById('leaderboard-section').style.display = 'none';
}

function showMenuSection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('menu-section').style.display = 'block';
    document.getElementById('game-section').style.display = 'none';
    document.getElementById('leaderboard-section').style.display = 'none';
    document.getElementById('username-display-menu').textContent = currentUser.username;
}

function showGameSection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('menu-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'flex';
    document.getElementById('leaderboard-section').style.display = 'none';
    resizeCanvas();
    gameInitialized = false;
    document.querySelector('.start-hint').style.display = 'block';
    loadHighScore();
    initGame();
    drawGame();
}

function showLeaderboardSection() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('menu-section').style.display = 'none';
    document.getElementById('game-section').style.display = 'none';
    document.getElementById('leaderboard-section').style.display = 'block';
    loadLeaderboard();
}

document.getElementById('show-register').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

document.getElementById('register').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', data.userId);
            currentUser = data;
            showMenuSection();
            loadHighScore();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
    }
});

document.getElementById('login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', data.userId);
            currentUser = data;
            showMenuSection();
            loadHighScore();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    currentUser = null;
    if (gameLoop) clearInterval(gameLoop);
    isGameRunning = false;
    showAuthSection();
});

document.getElementById('play-btn').addEventListener('click', () => {
    showGameSection();
});

document.getElementById('leaderboard-btn').addEventListener('click', () => {
    showLeaderboardSection();
});

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    if (gameLoop) clearInterval(gameLoop);
    isGameRunning = false;
    showMenuSection();
});

document.getElementById('back-to-menu-from-leaderboard-btn').addEventListener('click', () => {
    showMenuSection();
});

async function loadHighScore() {
    try {
        const res = await fetch('/api/user-scores', {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        });
        const scores = await res.json();
        if (scores.length > 0) {
            highScore = Math.max(...scores.map(s => s.score));
            document.getElementById('high-score').textContent = highScore;
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const leaderboard = await res.json();
        const leaderboardList = document.getElementById('leaderboard-list');
        leaderboardList.innerHTML = '';
        leaderboard.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'leaderboard-item';
            div.innerHTML = `<span>${index + 1}. ${item.username}</span><span>${item.high_score}</span>`;
            leaderboardList.appendChild(div);
        });
    } catch (err) {
        console.error(err);
    }
}

async function saveScore(score) {
    try {
        await fetch('/api/score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ score })
        });
        if (score > highScore) {
            highScore = score;
            document.getElementById('high-score').textContent = highScore;
        }
        loadLeaderboard();
    } catch (err) {
        console.error(err);
    }
}

function initGame() {
    snake = [{ x: 5, y: 5 }];
    score = 0;
    dx = 1;
    dy = 0;
    document.getElementById('score').textContent = score;
    generateFood();
}

function generateFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);
}

function drawGame() {
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#13d620ff';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2);
    });

    ctx.fillStyle = '#ff0101ff';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 2, gridSize - 2);
}

function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameOver();
        return;
    }

    for (let segment of snake) {
        if (head.x === segment.x && head.y === segment.y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score++;
        document.getElementById('score').textContent = score;
        generateFood();
    } else {
        snake.pop();
    }
}

function gameOver() {
    isGameRunning = false;
    gameInitialized = false;
    clearInterval(gameLoop);
    saveScore(score);
    document.getElementById('final-score').textContent = score;
    document.getElementById('game-over-modal').style.display = 'flex';
    document.querySelector('.start-hint').style.display = 'block';
}

function hideModal() {
    document.getElementById('game-over-modal').style.display = 'none';
}

document.querySelectorAll('.game-header .diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (!isGameRunning) {
            document.querySelectorAll('.game-header .diff-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.difficulty;
        }
    });
});

function startGame() {
    if (!isGameRunning) {
        gameInitialized = true;
        initGame();
        isGameRunning = true;
        document.querySelector('.start-hint').style.display = 'none';
        gameLoop = setInterval(() => {
            moveSnake();
            drawGame();
        }, difficulties[currentDifficulty]);
    }
}

document.getElementById('restart-btn').addEventListener('click', () => {
    hideModal();
    gameInitialized = false;
    document.querySelector('.start-hint').style.display = 'block';
    initGame();
    drawGame();
});

document.getElementById('main-menu-btn').addEventListener('click', () => {
    hideModal();
    gameInitialized = false;
    document.querySelector('.start-hint').style.display = 'block';
    showMenuSection();
});

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    if (gameLoop) clearInterval(gameLoop);
    isGameRunning = false;
    gameInitialized = false;
    document.querySelector('.start-hint').style.display = 'block';
    showMenuSection();
});

document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        if (!gameInitialized) {
            startGame();
        }
        
        if (isGameRunning) {
            if (e.key === 'ArrowUp' && dy === 0) {
                dx = 0;
                dy = -1;
            } else if (e.key === 'ArrowDown' && dy === 0) {
                dx = 0;
                dy = 1;
            } else if (e.key === 'ArrowLeft' && dx === 0) {
                dx = -1;
                dy = 0;
            } else if (e.key === 'ArrowRight' && dx === 0) {
                dx = 1;
                dy = 0;
            }
        }
    }
});

initAuth();
