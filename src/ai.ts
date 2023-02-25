import { Board, Piece, PIECE_BLACK } from './board';
import { Move, generateAllValidMoves } from './moves';

export const findMove = (board: Board, aiColor: Piece): Move => {
    const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === aiColor);
    const myPiecesMoves = myPieces.map(([x, y]) => generateAllValidMoves(x, y, board)).flat();
    console.log(`There are ${myPiecesMoves.length} possible responses`);

    let bestPlayerScore = -Infinity;
    let bestMove: Move = myPiecesMoves[0];

    for (const move of myPiecesMoves) {
        board.doMove(move);
        const score = countPlayerScore(aiColor, board);

        if (score > bestPlayerScore) {
            bestPlayerScore = score;
            bestMove = move;
        }
        board.undoMove(move);
    }

    return bestMove;
};

//! The scoring: higher is better

export const countPlayerScore = (player: Piece, board: Board) => {
    // count cumulative distances from the opposite corner

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
