const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('canvasContainer');

let cellSize = 8;
const chunkSize = 32;

// Canvas prend toute la largeur et grande hauteur fixe
canvas.width = window.innerWidth - 30;
canvas.height = 1200;

let chunks = new Map();
let isRunning = false;
let generation = 0;
let animationId = null;
let speed = 10;
let density = 0.3;
let lastUpdate = 0;

let cameraX = 0;
let cameraY = 0;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartCameraX = 0;
let dragStartCameraY = 0;

// Modèles de base classiques
const patterns = {
    // === STRUCTURES STABLES ===
    block: [
        [1, 1],
        [1, 1]
    ],
    beehive: [
        [0, 1, 1, 0],
        [1, 0, 0, 1],
        [0, 1, 1, 0]
    ],
    loaf: [
        [0, 1, 1, 0],
        [1, 0, 0, 1],
        [0, 1, 0, 1],
        [0, 0, 1, 0]
    ],
    boat: [
        [1, 1, 0],
        [1, 0, 1],
        [0, 1, 0]
    ],
    tub: [
        [0, 1, 0],
        [1, 0, 1],
        [0, 1, 0]
    ],

    // === OSCILLATEURS (période 2) ===
    blinker: [
        [1, 1, 1]
    ],
    toad: [
        [0, 1, 1, 1],
        [1, 1, 1, 0]
    ],
    beacon: [
        [1, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 1, 1],
        [0, 0, 1, 1]
    ],

    // === OSCILLATEURS (autres périodes) ===
    pulsar: [ // Période 3
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,0,0,0,1,1,1,0,0],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [1,0,0,0,0,1,0,1,0,0,0,0,1],
        [0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,1,1,1,0,0,0,1,1,1,0,0]
    ],
    pentadecathlon: [ // Période 15
        [0,0,1,0,0,0,0,1,0,0],
        [1,1,0,1,1,1,1,0,1,1],
        [0,0,1,0,0,0,0,1,0,0]
    ],

    // === VAISSEAUX ===
    glider: [
        [0, 1, 0],
        [0, 0, 1],
        [1, 1, 1]
    ],
    lwss: [ // Lightweight spaceship
        [0, 1, 1, 1, 1],
        [1, 0, 0, 0, 1],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0]
    ],
    mwss: [ // Middleweight spaceship
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1],
        [1, 0, 0, 0, 1],
        [0, 1, 1, 1, 1]
    ],
    hwss: [ // Heavyweight spaceship
        [0, 0, 1, 1, 0, 0],
        [0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1],
        [0, 1, 1, 1, 1, 1]
    ],

    // === MATHUSALEMS ===
    rPentomino: [ // Vit 1103 générations
        [0, 1, 1],
        [1, 1, 0],
        [0, 1, 0]
    ],
    acorn: [ // Vit 5206 générations
        [0, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0],
        [1, 1, 0, 0, 1, 1, 1]
    ],
    diehard: [ // Vit 130 générations puis disparaît
        [0, 0, 0, 0, 0, 0, 1, 0],
        [1, 1, 0, 0, 0, 0, 0, 0],
        [0, 1, 0, 0, 0, 1, 1, 1]
    ],

    // === CANONS ===
    gosperGun: [ // Canon à planeurs
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1,1],
        [1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,1,0,0,0,0,0,0,0,0,1,0,0,0,1,0,1,1,0,0,0,0,1,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ],

    // === PUFFEURS ===
    puffer: [ // Puffeur simple qui laisse de la fumée
        [0,0,0,1,1,1,0,0,0],
        [0,0,0,1,0,1,0,0,0],
        [0,0,0,1,0,0,0,0,0],
        [1,0,0,0,0,1,0,0,1],
        [1,1,0,0,0,0,0,1,1],
        [0,1,1,0,0,0,1,1,0],
        [0,0,0,1,0,1,0,0,0]
    ],

    // === JARDIN D'EDEN (exemple simple) ===
    edenGarden: [ // Configuration qui ne peut jamais apparaître naturellement
        [0,1,1,1,0,1,1,1,0],
        [1,0,0,0,0,0,0,0,1],
        [1,0,1,0,0,0,1,0,1],
        [1,0,0,0,0,0,0,0,1],
        [0,1,1,1,0,1,1,1,0]
    ],

    // === SPACEFILLER ===
    spacefiller: [ // Remplit l'espace progressivement
        [1,1,1,0,1],
        [1,0,0,0,0],
        [0,0,0,1,1],
        [0,1,1,0,1],
        [1,0,1,0,1]
    ]
};

function getChunkKey(chunkX, chunkY) {
    return `${chunkX},${chunkY}`;
}

function getChunk(chunkX, chunkY) {
    const key = getChunkKey(chunkX, chunkY);
    if (!chunks.has(key)) {
        const chunk = {};
        chunks.set(key, chunk);
    }
    return chunks.get(key);
}

function getCell(x, y) {
    const chunkX = Math.floor(x / chunkSize);
    const chunkY = Math.floor(y / chunkSize);
    const localX = ((x % chunkSize) + chunkSize) % chunkSize;
    const localY = ((y % chunkSize) + chunkSize) % chunkSize;

    const chunk = getChunk(chunkX, chunkY);
    const key = `${localX},${localY}`;
    return chunk[key] || 0;
}

function setCell(x, y, value) {
    const chunkX = Math.floor(x / chunkSize);
    const chunkY = Math.floor(y / chunkSize);
    const localX = ((x % chunkSize) + chunkSize) % chunkSize;
    const localY = ((y % chunkSize) + chunkSize) % chunkSize;

    const chunk = getChunk(chunkX, chunkY);
    const key = `${localX},${localY}`;

    if (value === 0) {
        delete chunk[key];
    } else {
        chunk[key] = value;
    }
}

function generateSoup() {
    chunks.clear();
    generation = 0;

    const viewWidth = canvas.width / cellSize;
    const viewHeight = canvas.height / cellSize;
    const startX = Math.floor(cameraX - viewWidth / 2) - 10;
    const startY = Math.floor(cameraY - viewHeight / 2) - 10;
    const endX = Math.ceil(cameraX + viewWidth / 2) + 10;
    const endY = Math.ceil(cameraY + viewHeight / 2) + 10;

    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            if (Math.random() < density) {
                setCell(x, y, 1);
            }
        }
    }

    draw();
    updateStats();
}

function insertPattern(pattern) {
    const centerX = Math.floor(cameraX);
    const centerY = Math.floor(cameraY);
    const offsetX = Math.floor(pattern[0].length / 2);
    const offsetY = Math.floor(pattern.length / 2);

    for (let i = 0; i < pattern.length; i++) {
        for (let j = 0; j < pattern[i].length; j++) {
            if (pattern[i][j] === 1) {
                setCell(centerX + j - offsetX, centerY + i - offsetY, 1);
            }
        }
    }

    draw();
    updateStats();
}

function countNeighbors(x, y) {
    let count = 0;
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            if (dx === 0 && dy === 0) continue;
            count += getCell(x + dx, y + dy);
        }
    }
    return count;
}

function getActiveCells() {
    const activeCells = new Set();

    chunks.forEach((chunk, chunkKey) => {
        const [chunkX, chunkY] = chunkKey.split(',').map(Number);

        Object.keys(chunk).forEach(cellKey => {
            const [localX, localY] = cellKey.split(',').map(Number);
            const x = chunkX * chunkSize + localX;
            const y = chunkY * chunkSize + localY;

            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    activeCells.add(`${x + dx},${y + dy}`);
                }
            }
        });
    });

    return activeCells;
}

function updateGrid() {
    const activeCells = getActiveCells();
    const nextState = new Map();

    activeCells.forEach(cellKey => {
        const [x, y] = cellKey.split(',').map(Number);
        const neighbors = countNeighbors(x, y);
        const cell = getCell(x, y);

        let newState = 0;
        if (cell === 1) {
            newState = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
            newState = neighbors === 3 ? 1 : 0;
        }

        if (newState === 1) {
            nextState.set(cellKey, 1);
        }
    });

    chunks.clear();
    nextState.forEach((value, cellKey) => {
        const [x, y] = cellKey.split(',').map(Number);
        setCell(x, y, value);
    });

    chunks.forEach((chunk, key) => {
        if (Object.keys(chunk).length === 0) {
            chunks.delete(key);
        }
    });

    generation++;
}

function draw() {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const viewWidth = canvas.width / cellSize;
    const viewHeight = canvas.height / cellSize;
    const startX = Math.floor(cameraX - viewWidth / 2);
    const startY = Math.floor(cameraY - viewHeight / 2);

    chunks.forEach((chunk, chunkKey) => {
        const [chunkX, chunkY] = chunkKey.split(',').map(Number);

        Object.keys(chunk).forEach(cellKey => {
            const [localX, localY] = cellKey.split(',').map(Number);
            const x = chunkX * chunkSize + localX;
            const y = chunkY * chunkSize + localY;

            const screenX = (x - startX) * cellSize;
            const screenY = (y - startY) * cellSize;

            if (screenX >= -cellSize && screenX < canvas.width &&
                screenY >= -cellSize && screenY < canvas.height) {
                const gradient = ctx.createLinearGradient(
                    screenX, screenY,
                    screenX + cellSize, screenY + cellSize
                );
                gradient.addColorStop(0, '#00f5ff');
                gradient.addColorStop(1, '#00a8ff');
                ctx.fillStyle = gradient;
                ctx.fillRect(screenX + 1, screenY + 1, cellSize - 2, cellSize - 2);
            }
        });
    });

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 0.5;

    const gridStartX = -((startX * cellSize) % cellSize);
    const gridStartY = -((startY * cellSize) % cellSize);

    for (let x = gridStartX; x < canvas.width; x += cellSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }

    for (let y = gridStartY; y < canvas.height; y += cellSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function updateStats() {
    let alive = 0;
    chunks.forEach(chunk => {
        alive += Object.keys(chunk).length;
    });

    document.getElementById('generation').textContent = generation;
    document.getElementById('alive').textContent = alive;
    document.getElementById('chunks').textContent = chunks.size;
    document.getElementById('position').textContent =
        `${Math.floor(cameraX)}, ${Math.floor(cameraY)}`;
}

function exportToJSON() {
    const data = {
        generation: generation,
        cameraX: cameraX,
        cameraY: cameraY,
        cells: []
    };

    chunks.forEach((chunk, chunkKey) => {
        const [chunkX, chunkY] = chunkKey.split(',').map(Number);
        Object.keys(chunk).forEach(cellKey => {
            const [localX, localY] = cellKey.split(',').map(Number);
            const x = chunkX * chunkSize + localX;
            const y = chunkY * chunkSize + localY;
            data.cells.push([x, y]);
        });
    });

    return JSON.stringify(data, null, 2);
}

function importFromJSON(jsonStr) {
    try {
        const data = JSON.parse(jsonStr);
        chunks.clear();
        generation = data.generation || 0;
        cameraX = data.cameraX || 0;
        cameraY = data.cameraY || 0;

        data.cells.forEach(([x, y]) => {
            setCell(x, y, 1);
        });

        draw();
        updateStats();
        return true;
    } catch (e) {
        alert('Erreur lors de l\'import du fichier JSON');
        return false;
    }
}

function animate(timestamp) {
    if (!isRunning) return;

    if (timestamp - lastUpdate >= 1000 / speed) {
        updateGrid();
        draw();
        updateStats();
        lastUpdate = timestamp;
    }

    animationId = requestAnimationFrame(animate);
}

canvas.addEventListener('mousedown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartCameraX = cameraX;
    dragStartCameraY = cameraY;
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const dx = (e.clientX - dragStartX) / cellSize;
        const dy = (e.clientY - dragStartY) / cellSize;
        cameraX = dragStartCameraX - dx;
        cameraY = dragStartCameraY - dy;
        draw();
        updateStats();
    }
});

canvas.addEventListener('mouseup', () => {
    isDragging = false;
});

canvas.addEventListener('click', (e) => {
    if (Math.abs(e.clientX - dragStartX) < 5 && Math.abs(e.clientY - dragStartY) < 5) {
        const rect = canvas.getBoundingClientRect();
        const viewWidth = canvas.width / cellSize;
        const viewHeight = canvas.height / cellSize;
        const startX = Math.floor(cameraX - viewWidth / 2);
        const startY = Math.floor(cameraY - viewHeight / 2);

        const x = Math.floor((e.clientX - rect.left) / cellSize) + startX;
        const y = Math.floor((e.clientY - rect.top) / cellSize) + startY;

        const current = getCell(x, y);
        setCell(x, y, current === 1 ? 0 : 1);
        draw();
        updateStats();
    }
});

document.getElementById('startBtn').addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        lastUpdate = performance.now();
        animate(lastUpdate);
        document.getElementById('startBtn').classList.add('active');
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    document.getElementById('startBtn').classList.remove('active');
});

document.getElementById('centerBtn').addEventListener('click', () => {
    cameraX = 0;
    cameraY = 0;
    draw();
    updateStats();
});

document.getElementById('clearBtn').addEventListener('click', () => {
    isRunning = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    chunks.clear();
    generation = 0;
    draw();
    updateStats();
    document.getElementById('startBtn').classList.remove('active');
});

document.getElementById('insertBtn').addEventListener('click', () => {
    const selected = document.getElementById('patternSelect').value;
    if (selected === 'soup') {
        generateSoup();
    } else if (selected && patterns[selected]) {
        insertPattern(patterns[selected]);
    }
});

document.getElementById('downloadBtn').addEventListener('click', () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conway-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            importFromJSON(event.target.result);
        };
        reader.readAsText(file);
    }
});

document.getElementById('speedSlider').addEventListener('input', (e) => {
    speed = parseInt(e.target.value);
});

document.getElementById('densitySlider').addEventListener('input', (e) => {
    density = parseInt(e.target.value) / 100;
    document.getElementById('densityValue').textContent = e.target.value + '%';
});

document.getElementById('zoomSlider').addEventListener('input', (e) => {
    const zoom = parseInt(e.target.value);
    cellSize = Math.floor(8 * zoom / 100);
    document.getElementById('zoomValue').textContent = zoom + '%';
    draw();
});

// Redimensionnement de la fenêtre
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth - 30;
    draw();
});

generateSoup();