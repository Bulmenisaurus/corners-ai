"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // src/moves.ts
  var deduplicateMovesByStartEnd, generateAllMovesFromTile, generateAllMoves, recursiveSearchMoves;
  var init_moves = __esm({
    "src/moves.ts"() {
      "use strict";
      init_board();
      deduplicateMovesByStartEnd = (moves) => {
        const getMoveKey = (move) => {
          return `${move.fromX},${move.fromY},${move.toX},${move.toY}`;
        };
        const moveBuckets = {};
        for (const move of moves) {
          const moveKey = getMoveKey(move);
          if (moveKey in moveBuckets) {
            moveBuckets[moveKey].push(move);
          } else {
            moveBuckets[moveKey] = [move];
          }
        }
        const dedupMoves = [];
        for (const moveKey in moveBuckets) {
          const moveKeyMoves = moveBuckets[moveKey].sort(
            (move1, move2) => move1.fullMovePath.length - move2.fullMovePath.length
          );
          dedupMoves.push(moveKeyMoves[0]);
        }
        return dedupMoves;
      };
      generateAllMovesFromTile = (pieceX, pieceY, board) => {
        const moves = recursiveSearchMoves(
          pieceX,
          pieceY,
          board,
          {
            fromX: pieceX,
            fromY: pieceY,
            toX: -1,
            toY: -1,
            fullMovePath: [[pieceX, pieceY]]
          },
          false
        );
        return deduplicateMovesByStartEnd(moves);
      };
      generateAllMoves = (board, pieceColor) => {
        const moves = [];
        for (const coordinate of board.coordinates()) {
          const tileOurColor = board.getPiece(coordinate[0], coordinate[1]) === pieceColor;
          if (!tileOurColor) {
            continue;
          }
          const tileMoves = generateAllMovesFromTile(coordinate[0], coordinate[1], board);
          tileMoves.forEach((m) => moves.push(m));
        }
        return moves;
      };
      recursiveSearchMoves = (pieceX, pieceY, board, currentMoveData, hasJumped) => {
        const validMoves = [];
        const tileOffsets = [
          [0, 1],
          //   N
          [1, 1],
          //   NE
          [1, 0],
          //   E
          [1, -1],
          //  SE
          [0, -1],
          //  S
          [-1, -1],
          // SW
          [-1, 0],
          //  W
          [-1, 1]
          //  NW
        ];
        for (const [offsetX, offsetY] of tileOffsets) {
          if (hasJumped) {
            continue;
          }
          const newX = pieceX + offsetX;
          const newY = pieceY + offsetY;
          if (newX > 7 || newX < 0 || newY > 7 || newY < 0) {
            continue;
          }
          if (board.getPiece(newX, newY) != PIECE_NONE) {
            continue;
          }
          const newMove = window.structuredClone(currentMoveData);
          newMove.fullMovePath.push([newX, newY]);
          newMove.toX = newX;
          newMove.toY = newY;
          validMoves.push(newMove);
        }
        for (const [offsetX, offsetY] of tileOffsets) {
          const newX = pieceX + offsetX * 2;
          const newY = pieceY + offsetY * 2;
          if (newX > 7 || newX < 0 || newY > 7 || newY < 0) {
            continue;
          }
          const jumpX = pieceX + offsetX;
          const jumpY = pieceY + offsetY;
          const isSomeoneToJumpOver = board.getPiece(jumpX, jumpY) != PIECE_NONE;
          const isSomewhereToLand = board.getPiece(newX, newY) == PIECE_NONE;
          const hasBeenHereBefore = currentMoveData.fullMovePath.some(([moveX, moveY]) => {
            return moveX == newX && moveY == newY;
          });
          if (!isSomeoneToJumpOver || !isSomewhereToLand || hasBeenHereBefore) {
            continue;
          }
          const newMove = window.structuredClone(currentMoveData);
          newMove.fullMovePath.push([newX, newY]);
          const deeperMoves = recursiveSearchMoves(newX, newY, board, newMove, true);
          for (const move of deeperMoves) {
            validMoves.push(move);
          }
        }
        if (hasJumped) {
          const newMove = window.structuredClone(currentMoveData);
          newMove.toX = pieceX;
          newMove.toY = pieceY;
          validMoves.push(newMove);
        }
        return validMoves;
      };
    }
  });

  // src/ai.ts
  var findMove, search, evaluate, countPlayerScore;
  var init_ai = __esm({
    "src/ai.ts"() {
      "use strict";
      init_board();
      init_moves();
      findMove = (board, aiColor) => {
        const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === aiColor);
        const myPiecesMoves = myPieces.map(([x, y]) => generateAllMovesFromTile(x, y, board)).flat();
        const startTime = Date.now();
        const bestMove = search(3, board, aiColor)[1];
        const endTime = Date.now();
        console.log(`Took ${endTime - startTime}ms to evaluate positions`);
        if (bestMove === void 0) {
          throw new Error("Could not find a move for some reason");
        }
        return bestMove;
      };
      search = (depth, board, playerToMove) => {
        if (depth === 0) {
          return [evaluate(board, playerToMove), void 0];
        }
        const moves = generateAllMoves(board, playerToMove);
        let bestEvaluation = -Infinity;
        let bestEvaluationMove = moves[0];
        for (const move of moves) {
          board.doMove(move);
          const evaluation = -search(
            depth - 1,
            board,
            playerToMove === PIECE_BLACK ? PIECE_WHITE : PIECE_BLACK
          )[0];
          if (evaluation > bestEvaluation) {
            bestEvaluation = evaluation;
            bestEvaluationMove = move;
          }
          board.undoMove(move);
        }
        return [bestEvaluation, bestEvaluationMove];
      };
      evaluate = (board, playerToMove) => {
        const whiteScore = countPlayerScore(PIECE_WHITE, board);
        const blackScore = countPlayerScore(PIECE_BLACK, board);
        const evaluation = whiteScore - blackScore;
        const perspective = playerToMove === PIECE_WHITE ? 1 : -1;
        return evaluation * perspective;
      };
      countPlayerScore = (player, board) => {
        const oppositeCornerX = player === PIECE_BLACK ? 0 : 7;
        const oppositeCornerY = player === PIECE_BLACK ? 7 : 0;
        const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === player);
        const myPiecesDistances = myPieces.map(
          ([x, y]) => Math.abs(x - oppositeCornerX) + Math.abs(y - oppositeCornerY)
        );
        const cumulativeDistance = myPiecesDistances.reduce((a, b) => a + b, 0);
        const score = -cumulativeDistance;
        return score;
      };
    }
  });

  // src/board.ts
  var PIECE_BLACK, PIECE_WHITE, PIECE_NONE, TILE_BLACK, TILE_WHITE, Board3, InteractiveBoard, renderBoard;
  var init_board = __esm({
    "src/board.ts"() {
      "use strict";
      init_ai();
      init_moves();
      PIECE_BLACK = "black";
      PIECE_WHITE = "white";
      PIECE_NONE = "none";
      TILE_BLACK = "black";
      TILE_WHITE = "white";
      Board3 = class {
        constructor() {
          this.board = Array(8 * 8).fill(PIECE_NONE);
        }
        getPiece(x, y) {
          return this.board[x + y * 8];
        }
        setPiece(x, y, piece) {
          this.board[x + y * 8] = piece;
        }
        getTileColor(x, y) {
          return [TILE_WHITE, TILE_BLACK][(x + y) % 2];
        }
        coordinates() {
          const coordinates = [];
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              coordinates.push([x, y]);
            }
          }
          return coordinates;
        }
        doMove(move) {
          const pieceToMove = this.getPiece(move.fromX, move.fromY);
          this.setPiece(move.fromX, move.fromY, PIECE_NONE);
          this.setPiece(move.toX, move.toY, pieceToMove);
        }
        undoMove(move) {
          const pieceToMove = this.getPiece(move.toX, move.toY);
          this.setPiece(move.fromX, move.fromY, pieceToMove);
          this.setPiece(move.toX, move.toY, PIECE_NONE);
        }
      };
      InteractiveBoard = class {
        constructor(boardElement) {
          this.board = new Board3();
          this.currentTurn = "white";
          this.boardElement = boardElement;
          this.boardTileContainers = this._initializeTileElements();
          this.selectedTileCoordinates = void 0;
          boardElement.addEventListener("click", (ev) => {
            this.onClick(ev);
          });
        }
        _initializeTileElements() {
          const tileContainers = this.board.coordinates().map(([x, y]) => {
            const tileContainer = document.createElement("div");
            tileContainer.classList.add("tile");
            tileContainer.classList.add(this.getTileColor(x, y) === TILE_BLACK ? "black" : "white");
            tileContainer.dataset.selected = "false";
            const tilePiece = this.board.getPiece(x, y);
            const pieceElement = document.createElement("div");
            pieceElement.classList.add("piece");
            pieceElement.dataset.pieceType = tilePiece;
            tileContainer.appendChild(pieceElement);
            return tileContainer;
          });
          return tileContainers;
        }
        loadFen(fen) {
          const rows = fen.split("/");
          let currentX = 0;
          let currentY = 0;
          for (const row of rows) {
            for (const char of row) {
              if (char === "P") {
                this.setPiece(currentX, currentY, PIECE_WHITE);
                currentX++;
              } else if (char === "p") {
                this.setPiece(currentX, currentY, PIECE_BLACK);
                currentX++;
              } else {
                currentX += parseInt(char);
              }
            }
            currentX = 0;
            currentY += 1;
          }
        }
        getTileElement(x, y) {
          return this.boardTileContainers[x + y * 8];
        }
        setPiece(x, y, piece) {
          this.board.setPiece(x, y, piece);
          const tileElement = this.getTileElement(x, y);
          const pieceElement = tileElement.children[0];
          pieceElement.dataset.pieceType = piece;
        }
        select(x, y) {
          const tileElement = this.getTileElement(x, y);
          tileElement.dataset.selected = "true";
        }
        unselect(x, y) {
          const tileElement = this.getTileElement(x, y);
          tileElement.dataset.selected = "false";
        }
        getTileColor(x, y) {
          return [TILE_WHITE, TILE_BLACK][(x + y) % 2];
        }
        addSuggestions(x, y) {
          const allValidMoves = generateAllMovesFromTile(x, y, this.board);
          for (const validMove of allValidMoves) {
            const tileElement = this.getTileElement(validMove.toX, validMove.toY);
            tileElement.classList.add("valid");
          }
        }
        clearSuggestions() {
          Array.from(document.querySelectorAll(".valid")).map((v) => v.classList.remove("valid"));
        }
        onClick(event) {
          const mouseX = event.offsetX;
          const mouseY = event.offsetY;
          const boardFractionX = mouseX / this.boardElement.getBoundingClientRect().width;
          const boardFractionY = mouseY / this.boardElement.getBoundingClientRect().height;
          const boardTileX = Math.floor(boardFractionX * 8);
          const boardTileY = Math.floor(boardFractionY * 8);
          this.onTileClick(boardTileX, boardTileY);
        }
        onTileClick(tileX, tileY) {
          const prevSelectedCoords = this.selectedTileCoordinates;
          if (prevSelectedCoords !== void 0) {
            this.unselect(prevSelectedCoords[0], prevSelectedCoords[1]);
            this.selectedTileCoordinates = void 0;
            this.tryMove(prevSelectedCoords[0], prevSelectedCoords[1], tileX, tileY);
          } else {
            if (this.board.getPiece(tileX, tileY) === PIECE_NONE) {
              return;
            }
            this.selectedTileCoordinates = [tileX, tileY];
            this.select(tileX, tileY);
          }
        }
        markMove(move) {
          Array.from(document.querySelectorAll(".mark")).map((v) => v.classList.remove("mark"));
          move.fullMovePath.forEach(([x, y]) => {
            const tile = this.getTileElement(x, y);
            tile.classList.add("mark");
          });
        }
        aiMove() {
          const move = findMove(this.board, this.currentTurn);
          this.currentTurn = this.currentTurn === PIECE_BLACK ? PIECE_WHITE : PIECE_BLACK;
          if (move === void 0) {
            console.warn("AI has no response, probably end of game?");
          } else {
            this.doMove(move);
            this.markMove(move);
          }
        }
        // note: there are `doMove` and `undoMove` in `this.board` (non-ui) with the same exact code, what is the different?
        // well, in InteractiveBoard this.setPiece updates the UI in addition to the board state
        doMove(move) {
          const pieceToMove = this.board.getPiece(move.fromX, move.fromY);
          this.setPiece(move.fromX, move.fromY, PIECE_NONE);
          this.setPiece(move.toX, move.toY, pieceToMove);
        }
        undoMove(move) {
          const pieceToMove = this.board.getPiece(move.toX, move.toY);
          this.setPiece(move.fromX, move.fromY, pieceToMove);
          this.setPiece(move.toX, move.toY, PIECE_NONE);
        }
        tryMove(startX, startY, endX, endY) {
          if (this.board.getPiece(startX, startY) !== this.currentTurn) {
            return;
          }
          if (startX === endX && startY == endY) {
            return;
          }
          const allValidMoves = generateAllMovesFromTile(startX, startY, this.board);
          const thisMove = allValidMoves.find((move) => {
            return move.toX === endX && move.toY === endY;
          });
          if (thisMove === void 0) {
            const errorAudio = new Audio("./audio/wood-sound-error.mp3");
            errorAudio.play();
            return;
          }
          this.doMove(thisMove);
          console.log(`My score: ${countPlayerScore(PIECE_WHITE, this.board)}`);
          this.currentTurn = this.currentTurn === PIECE_BLACK ? PIECE_WHITE : PIECE_BLACK;
          this.aiMove();
        }
      };
      renderBoard = (board, boardContainer) => {
        boardContainer.append(...board.boardTileContainers);
      };
    }
  });

  // src/index.ts
  var require_src = __commonJS({
    "src/index.ts"(exports) {
      init_board();
      var main = (mainElement) => __async(exports, null, function* () {
        const boardElement = document.createElement("div");
        boardElement.id = "board-container";
        mainElement.appendChild(boardElement);
        const board = new InteractiveBoard(boardElement);
        board.loadFen("4pppp/5ppp/6pp/7p/P/PP/PPP/PPPP");
        renderBoard(board, boardElement);
      });
      window.addEventListener("load", () => {
        const mainElement = document.getElementsByTagName("main")[0];
        main(mainElement);
      });
    }
  });
  require_src();
})();
//! The scoring: higher is better
