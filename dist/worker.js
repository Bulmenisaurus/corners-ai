"use strict";
(() => {
  // src/moves.ts
  var deduplicateMovesByStartEnd = (moves) => {
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
  var generateAllMovesFromTile = (pieceX, pieceY, board) => {
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
  var generateAllMoves = (board, pieceColor) => {
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
  var cloneMove = (move) => {
    return {
      fromX: move.fromX,
      fromY: move.fromY,
      fullMovePath: [...move.fullMovePath],
      toX: move.toX,
      toY: move.toY
    };
  };
  var recursiveSearchMoves = (pieceX, pieceY, board, currentMoveData, hasJumped) => {
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

  // src/board.ts
  var PIECE_BLACK = "black";
  var PIECE_WHITE = "white";
  var PIECE_NONE = "none";
  var TILE_BLACK = "black";
  var TILE_WHITE = "white";
  var Board2 = class {
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

  // src/ai.ts
  var findMove2 = (board, aiColor) => {
    if (countPlayerScore(aiColor, board) === 980) {
      return void 0;
    }
    const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === aiColor);
    let myPiecesMoves = myPieces.map(([x, y]) => generateAllMovesFromTile(x, y, board)).flat();
    myPiecesMoves = orderMoves(myPiecesMoves, aiColor);
    let bestMove = myPiecesMoves[0];
    let bestMoveScore = -Infinity;
    const startTime = Date.now();
    for (const move of myPiecesMoves) {
      board.doMove(move);
      const opponentScore = recursiveBoardSearchAlphaBeta(
        2,
        board,
        aiColor === PIECE_WHITE ? PIECE_BLACK : PIECE_WHITE,
        -Infinity,
        Infinity
      );
      board.undoMove(move);
      const ourScore = -opponentScore;
      if (ourScore > bestMoveScore) {
        bestMoveScore = ourScore;
        bestMove = move;
      }
    }
    const endTime = Date.now();
    console.log(`Took ${endTime - startTime}ms to evaluate positions`);
    console.log(`Evaluated ${TIMES_TO_EVAL} position`);
    TIMES_TO_EVAL = 0;
    return bestMove;
  };
  var orderMoves = (moves, playerToMove) => {
    return moves.sort((moveA, moveB) => {
      return evaluateMove(moveA, playerToMove) - evaluateMove(moveB, playerToMove);
    }).reverse();
  };
  var TIMES_TO_EVAL = 0;
  var evaluateMove = (move, playerToMove) => {
    TIMES_TO_EVAL++;
    const oppositeCornerX = playerToMove === PIECE_BLACK ? 0 : 7;
    const oppositeCornerY = playerToMove === PIECE_BLACK ? 7 : 0;
    const initialDistance = Math.abs(move.fromX - oppositeCornerX) + Math.abs(move.fromY - oppositeCornerY);
    const endingDistance = Math.abs(move.toX - oppositeCornerX) + Math.abs(move.toY - oppositeCornerY);
    const moveScore = initialDistance - endingDistance;
    return moveScore;
  };
  var recursiveBoardSearchAlphaBeta = (depth, board, playerToMove, alpha, beta) => {
    const playerFinished = countPlayerScore(playerToMove, board) === 980;
    if (depth === 0 || playerFinished) {
      return evaluate(board, playerToMove);
    }
    const moves = generateAllMoves(board, playerToMove);
    for (const move of moves) {
      board.doMove(move);
      const evaluation = -recursiveBoardSearchAlphaBeta(
        depth - 1,
        board,
        playerToMove === PIECE_BLACK ? PIECE_WHITE : PIECE_BLACK,
        -beta,
        -alpha
      );
      board.undoMove(move);
      if (evaluation >= beta) {
        return beta;
      }
      alpha = Math.max(alpha, evaluation);
    }
    return alpha;
  };
  var evaluate = (board, playerToMove) => {
    const whiteScore = countPlayerScore(PIECE_WHITE, board);
    const blackScore = countPlayerScore(PIECE_BLACK, board);
    const evaluation = whiteScore - blackScore;
    const perspective = playerToMove === PIECE_WHITE ? 1 : -1;
    return evaluation * perspective;
  };
  var countPlayerScore = (player, board) => {
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

  // src/worker.ts
  onmessage = (e) => {
    const board = new Board2(e.data[0]);
    const move = findMove2(board, e.data[1]);
    postMessage(move);
  };
})();
