const ROWS = 10;
const COLS = 9;
const boardEl = document.getElementById('board');
const statusEl = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

const SIDES = {
  CHESS: 'chess',
  XIANGQI: 'xiangqi'
};

let board = [];
let currentTurn = SIDES.CHESS;
let selected = null;
let validMoves = [];
let gameOver = false;

resetBtn.addEventListener('click', () => initGame());

function createPiece(side, type, label) {
  return { side, type, label };
}

function initBoard() {
  board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // Chess side (top, blue)
  const chessBackRank = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook', 'rook'];
  chessBackRank.forEach((type, col) => {
    board[0][col] = createPiece(SIDES.CHESS, type, chessLabel(type));
  });
  for (let col = 0; col < COLS; col++) {
    board[1][col] = createPiece(SIDES.CHESS, 'pawn', chessLabel('pawn'));
  }

  // Xiangqi side (bottom, red)
  const xiangqiBackRank = ['chariot', 'horse', 'elephant', 'advisor', 'general', 'advisor', 'elephant', 'horse', 'chariot'];
  xiangqiBackRank.forEach((type, col) => {
    board[ROWS - 1][col] = createPiece(SIDES.XIANGQI, type, xiangqiLabel(type));
  });

  board[ROWS - 3][1] = createPiece(SIDES.XIANGQI, 'cannon', xiangqiLabel('cannon'));
  board[ROWS - 3][7] = createPiece(SIDES.XIANGQI, 'cannon', xiangqiLabel('cannon'));

  [0, 2, 4, 6, 8].forEach((col) => {
    board[ROWS - 4][col] = createPiece(SIDES.XIANGQI, 'soldier', xiangqiLabel('soldier'));
  });
}

function chessLabel(type) {
  switch (type) {
    case 'king':
      return 'K';
    case 'queen':
      return 'Q';
    case 'rook':
      return 'R';
    case 'bishop':
      return 'B';
    case 'knight':
      return 'N';
    case 'pawn':
      return 'P';
    default:
      return '?';
  }
}

function xiangqiLabel(type) {
  switch (type) {
    case 'general':
      return '帥';
    case 'advisor':
      return '仕';
    case 'elephant':
      return '相';
    case 'horse':
      return '傌';
    case 'chariot':
      return '俥';
    case 'cannon':
      return '炮';
    case 'soldier':
      return '兵';
    default:
      return '?';
  }
}

function initGame() {
  initBoard();
  currentTurn = SIDES.CHESS;
  selected = null;
  validMoves = [];
  gameOver = false;
  updateStatus();
  renderBoard();
}

function renderBoard() {
  boardEl.innerHTML = '';
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const square = document.createElement('div');
      square.classList.add('square', (row + col) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;

      const piece = board[row][col];
      if (piece) {
        const span = document.createElement('span');
        span.textContent = piece.label;
        span.classList.add('piece', piece.side === SIDES.CHESS ? 'blue' : 'red');
        square.appendChild(span);
      }

      if (selected && selected.row === row && selected.col === col) {
        square.classList.add('selected');
      }

      if (validMoves.some((m) => m.row === row && m.col === col)) {
        square.classList.add('highlight');
      }

      square.addEventListener('click', () => handleSquareClick(row, col));
      boardEl.appendChild(square);
    }
  }
}

function handleSquareClick(row, col) {
  if (gameOver) return;

  const piece = board[row][col];
  if (selected && isInMoves(row, col)) {
    performMove(selected, { row, col });
    return;
  }

  if (piece && piece.side === currentTurn) {
    selected = { row, col };
    validMoves = getLegalMoves(piece, row, col);
  } else {
    selected = null;
    validMoves = [];
  }
  renderBoard();
}

function isInMoves(row, col) {
  return validMoves.some((m) => m.row === row && m.col === col);
}

function performMove(from, to) {
  const piece = board[from.row][from.col];
  const target = board[to.row][to.col];

  if (!piece) return;

  let win = false;
  if (target && (target.type === 'king' || target.type === 'general')) {
    win = true;
  }

  board[to.row][to.col] = piece;
  board[from.row][from.col] = null;

  if (piece.type === 'pawn' && piece.side === SIDES.CHESS && to.row === ROWS - 1) {
    piece.type = 'queen';
    piece.label = chessLabel('queen');
  }

  selected = null;
  validMoves = [];

  if (win) {
    gameOver = true;
    statusEl.textContent = `${piece.side === SIDES.CHESS ? '国际象棋方' : '中国象棋方'} 获胜！`;
    renderBoard();
    return;
  }

  currentTurn = currentTurn === SIDES.CHESS ? SIDES.XIANGQI : SIDES.CHESS;
  updateStatus();
  renderBoard();
}

function updateStatus() {
  statusEl.textContent = gameOver
    ? statusEl.textContent
    : `${currentTurn === SIDES.CHESS ? '国际象棋方（蓝色）' : '中国象棋方（红色）'} 行棋`;
}

function getLegalMoves(piece, row, col) {
  switch (piece.side) {
    case SIDES.CHESS:
      return chessMoves(piece, row, col);
    case SIDES.XIANGQI:
      return xiangqiMoves(piece, row, col);
    default:
      return [];
  }
}

function chessMoves(piece, row, col) {
  switch (piece.type) {
    case 'king':
      return stepMoves(row, col, [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ], piece.side);
    case 'queen':
      return linearMoves(row, col, queenDirections(), piece.side);
    case 'rook':
      return linearMoves(row, col, orthogonalDirections(), piece.side);
    case 'bishop':
      return linearMoves(row, col, diagonalDirections(), piece.side);
    case 'knight':
      return knightMoves(row, col, piece.side, false);
    case 'pawn':
      return chessPawnMoves(row, col);
    default:
      return [];
  }
}

function xiangqiMoves(piece, row, col) {
  switch (piece.type) {
    case 'general':
      return xiangqiGeneralMoves(row, col);
    case 'advisor':
      return xiangqiAdvisorMoves(row, col);
    case 'elephant':
      return xiangqiElephantMoves(row, col);
    case 'horse':
      return knightMoves(row, col, piece.side, true);
    case 'chariot':
      return linearMoves(row, col, orthogonalDirections(), piece.side);
    case 'cannon':
      return xiangqiCannonMoves(row, col);
    case 'soldier':
      return xiangqiSoldierMoves(row, col);
    default:
      return [];
  }
}

function stepMoves(row, col, deltas, side) {
  const moves = [];
  deltas.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    if (!inBounds(r, c)) return;
    if (!board[r][c] || isEnemy(board[r][c], side)) {
      moves.push({ row: r, col: c });
    }
  });
  return moves;
}

function linearMoves(row, col, directions, side) {
  const moves = [];
  directions.forEach(([dr, dc]) => {
    let r = row + dr;
    let c = col + dc;
    while (inBounds(r, c)) {
      if (!board[r][c]) {
        moves.push({ row: r, col: c });
      } else {
        if (isEnemy(board[r][c], side)) {
          moves.push({ row: r, col: c });
        }
        break;
      }
      r += dr;
      c += dc;
    }
  });
  return moves;
}

function knightMoves(row, col, side, blockLeg) {
  const moves = [];
  const steps = [
    [2, 1],
    [2, -1],
    [-2, 1],
    [-2, -1],
    [1, 2],
    [1, -2],
    [-1, 2],
    [-1, -2],
  ];

  steps.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    if (!inBounds(r, c)) return;

    if (blockLeg) {
      const legRow = row + (Math.abs(dr) === 2 ? dr / 2 : 0);
      const legCol = col + (Math.abs(dc) === 2 ? dc / 2 : 0);
      if (board[legRow][legCol]) return;
    }

    if (!board[r][c] || isEnemy(board[r][c], side)) {
      moves.push({ row: r, col: c });
    }
  });
  return moves;
}

function chessPawnMoves(row, col) {
  const side = SIDES.CHESS;
  const direction = 1; // moves downward from top to bottom
  const moves = [];
  const forwardRow = row + direction;
  if (inBounds(forwardRow, col) && !board[forwardRow][col]) {
    moves.push({ row: forwardRow, col });
  }

  [col - 1, col + 1].forEach((c) => {
    const r = row + direction;
    if (inBounds(r, c) && board[r][c] && isEnemy(board[r][c], side)) {
      moves.push({ row: r, col: c });
    }
  });

  return moves;
}

function xiangqiSoldierMoves(row, col) {
  const side = SIDES.XIANGQI;
  const direction = -1; // red moves upward
  const moves = [];
  const forwardRow = row + direction;
  if (inBounds(forwardRow, col)) {
    if (!board[forwardRow][col] || isEnemy(board[forwardRow][col], side)) {
      moves.push({ row: forwardRow, col });
    }
  }

  if (row <= 4) {
    [col - 1, col + 1].forEach((c) => {
      if (inBounds(row, c) && (!board[row][c] || isEnemy(board[row][c], side))) {
        moves.push({ row, col: c });
      }
    });
  }
  return moves;
}

function xiangqiGeneralMoves(row, col) {
  const moves = [];
  const deltas = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];

  deltas.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    if (!inBounds(r, c)) return;
    if (!inPalace(r, c)) return;
    const target = board[r][c];
    if (!target || isEnemy(target, SIDES.XIANGQI)) {
      moves.push({ row: r, col: c });
    }
  });
  return moves;
}

function xiangqiAdvisorMoves(row, col) {
  const moves = [];
  const deltas = [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];

  deltas.forEach(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    if (!inBounds(r, c)) return;
    if (!inPalace(r, c)) return;
    const target = board[r][c];
    if (!target || isEnemy(target, SIDES.XIANGQI)) {
      moves.push({ row: r, col: c });
    }
  });
  return moves;
}

function xiangqiElephantMoves(row, col) {
  const moves = [];
  const deltas = [
    [2, 2],
    [2, -2],
    [-2, 2],
    [-2, -2],
  ];

  deltas.forEach(([dr, dc]) => {
    const midRow = row + dr / 2;
    const midCol = col + dc / 2;
    const r = row + dr;
    const c = col + dc;
    if (!inBounds(r, c)) return;
    if (r < 5) return; // cannot cross the river for red side
    if (board[midRow][midCol]) return;
    if (!board[r][c] || isEnemy(board[r][c], SIDES.XIANGQI)) {
      moves.push({ row: r, col: c });
    }
  });
  return moves;
}

function xiangqiCannonMoves(row, col) {
  const moves = [];
  const directions = orthogonalDirections();

  directions.forEach(([dr, dc]) => {
    let r = row + dr;
    let c = col + dc;
    let jumped = false;

    while (inBounds(r, c)) {
      const target = board[r][c];
      if (!jumped) {
        if (!target) {
          moves.push({ row: r, col: c });
        } else {
          jumped = true;
        }
      } else {
        if (target) {
          if (isEnemy(target, SIDES.XIANGQI)) {
            moves.push({ row: r, col: c });
          }
          break;
        }
      }
      r += dr;
      c += dc;
    }
  });

  return moves;
}

function orthogonalDirections() {
  return [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
}

function diagonalDirections() {
  return [
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
}

function queenDirections() {
  return [...orthogonalDirections(), ...diagonalDirections()];
}

function inBounds(row, col) {
  return row >= 0 && row < ROWS && col >= 0 && col < COLS;
}

function inPalace(row, col) {
  return row >= 7 && row <= 9 && col >= 3 && col <= 5;
}

function isEnemy(piece, side) {
  return piece && piece.side !== side;
}

// Initialize
initGame();
