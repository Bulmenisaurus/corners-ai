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
  var deduplicateMovesByStartEnd, generateAllMovesFromTile, cloneMove, recursiveSearchMoves;
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
      cloneMove = (move) => {
        return {
          fromX: move.fromX,
          fromY: move.fromY,
          fullMovePath: [...move.fullMovePath],
          toX: move.toX,
          toY: move.toY
        };
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
          const newMove = cloneMove(currentMoveData);
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
          const newMove = cloneMove(currentMoveData);
          newMove.fullMovePath.push([newX, newY]);
          const deeperMoves = recursiveSearchMoves(newX, newY, board, newMove, true);
          for (const move of deeperMoves) {
            validMoves.push(move);
          }
        }
        if (hasJumped) {
          const newMove = cloneMove(currentMoveData);
          newMove.toX = pieceX;
          newMove.toY = pieceY;
          validMoves.push(newMove);
        }
        return validMoves;
      };
    }
  });

  // src/ai.ts
  var countPlayerScore;
  var init_ai = __esm({
    "src/ai.ts"() {
      "use strict";
      init_board();
      init_moves();
      countPlayerScore = (player, board) => {
        const oppositeCornerX = player === PIECE_BLACK ? 0 : 7;
        const oppositeCornerY = player === PIECE_BLACK ? 7 : 0;
        const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === player);
        const myPiecesDistances = myPieces.map(
          ([x, y]) => Math.abs(x - oppositeCornerX) + Math.abs(y - oppositeCornerY)
        );
        const cumulativeDistance = myPiecesDistances.reduce((a, b) => a + b, 0);
        const score = 1e3 - cumulativeDistance;
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
        constructor(board) {
          this.pieces = board;
        }
        getPiece(x, y) {
          return this.pieces[x + y * 8];
        }
        setPiece(x, y, piece) {
          this.pieces[x + y * 8] = piece;
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
        constructor(boardElement, tileContainer, piecesContainer) {
          this.board = new Board3(Array(8 * 8).fill(PIECE_NONE));
          this.currentTurn = "white";
          this.aiWorker = new Worker("./dist/worker.js");
          this.boardElement = boardElement;
          this.tilesElement = tileContainer;
          this.piecesElement = piecesContainer;
          this.selectedTileCoordinates = void 0;
          boardElement.addEventListener("click", (ev) => {
            this.onClick(ev);
          });
          this.aiWorker.onmessage = (e) => {
            this.receiveAiMove(e.data);
          };
          this._initializeTileElements();
        }
        _initializeTileElements() {
          const tileContainers = this.board.coordinates().map(([x, y]) => {
            const tileContainer = document.createElement("div");
            tileContainer.classList.add("tile");
            tileContainer.classList.add(this.getTileColor(x, y) === TILE_BLACK ? "black" : "white");
            tileContainer.dataset.selected = "false";
            return tileContainer;
          });
          this.tilesElement.append(...tileContainers);
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
          const tileElements = Array.from(this.tilesElement.children);
          return tileElements[x + y * 8];
        }
        getPieceElement(x, y) {
          const allPieces = Array.from(this.piecesElement.children);
          const pieceElement = allPieces.find(
            (piece) => piece.dataset.x === x.toString() && piece.dataset.y === y.toString()
          );
          return pieceElement;
        }
        setPiece(x, y, piece) {
          if (this.board.getPiece(x, y) === PIECE_NONE) {
            this.board.setPiece(x, y, piece);
            const pieceElement = document.createElement("div");
            pieceElement.classList.add("piece");
            pieceElement.dataset.pieceType = piece;
            pieceElement.dataset.x = x.toString();
            pieceElement.dataset.y = y.toString();
            pieceElement.style.top = `calc(100%/8 * ${y} + (100%/8 - 10px) * 0.10)`;
            pieceElement.style.left = `calc(100%/8 * ${x} + (100%/8 - 10px) * 0.10)`;
            this.piecesElement.appendChild(pieceElement);
          }
          {
            const pieceElement = this.getPieceElement(x, y);
            pieceElement.dataset.pieceType = piece;
          }
        }
        movePiece(fromX, fromY, toX, toY) {
          const pieceElement = this.getPieceElement(fromX, fromY);
          pieceElement.dataset.x = toX.toString();
          pieceElement.dataset.y = toY.toString();
          pieceElement.style.top = `calc(100%/8 * ${toY} + (100%/8 - 10px) * 0.10)`;
          pieceElement.style.left = `calc(100%/8 * ${toX} + (100%/8 - 10px) * 0.10)`;
          this.board.setPiece(toX, toY, this.board.getPiece(fromX, fromY));
          this.board.setPiece(fromX, fromY, PIECE_NONE);
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
        initiateAiMove() {
          this.aiWorker.postMessage([this.board.pieces, this.currentTurn]);
        }
        receiveAiMove(move) {
          this.currentTurn = this.currentTurn === PIECE_BLACK ? PIECE_WHITE : PIECE_BLACK;
          if (move === void 0) {
            console.warn("AI has no response, probably end of game?");
          } else {
            this.doMove(move);
            this.markMove(move);
          }
        }
        doMove(move) {
          this.movePiece(move.fromX, move.fromY, move.toX, move.toY);
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
          this.initiateAiMove();
        }
      };
      renderBoard = (board, boardContainer) => {
        boardContainer.append(board.tilesElement, board.piecesElement);
      };
    }
  });

  // src/index.ts
  var require_src = __commonJS({
    "src/index.ts"(exports) {
      init_board();
      var main = (mainElement) => __async(exports, null, function* () {
        const boardContainer = document.createElement("div");
        boardContainer.id = "board-container";
        mainElement.appendChild(boardContainer);
        const tileContainer = document.createElement("div");
        tileContainer.id = "tiles";
        const piecesContainer = document.createElement("div");
        piecesContainer.id = "pieces";
        const board = new InteractiveBoard(boardContainer, tileContainer, piecesContainer);
        board.loadFen("4pppp/5ppp/6pp/7p/P/PP/PPP/PPPP");
        renderBoard(board, boardContainer);
      });
      window.addEventListener("load", () => {
        const mainElement = document.getElementsByTagName("main")[0];
        main(mainElement);
      });
    }
  });
  require_src();
})();
