import { Board, Piece, PIECE_BLACK, PIECE_WHITE } from './board';
import { Move, generateAllMovesFromTile, generateAllMoves } from './moves';

export const findMove = (board: Board, aiColor: Piece): Move | undefined => {
    const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === aiColor);
    const myPiecesMoves = myPieces.map(([x, y]) => generateAllMovesFromTile(x, y, board)).flat();
    // console.log(`There are ${myPiecesMoves.length} possible responses`);

    const startTime = Date.now();
    const bestMove = search(3, board, aiColor)[1];
    const endTime = Date.now();
    console.log(`Took ${endTime - startTime}ms to evaluate positions`);

    if (bestMove === undefined) {
        throw new Error('Could not find a move for some reason');
    }

    return bestMove;
};

//! The scoring: higher is better

const search = (depth: number, board: Board, playerToMove: Piece): [number, Move | undefined] => {
    if (depth === 0) {
        return [evaluate(board, playerToMove), undefined];
    }

    const moves: Move[] = generateAllMoves(board, playerToMove);

    let bestEvaluation: number = -Infinity;
    let bestEvaluationMove: Move = moves[0];

    for (const move of moves) {
        board.doMove(move);
        const evaluation: number = -search(
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

const evaluate = (board: Board, playerToMove: Piece) => {
    const whiteScore = countPlayerScore(PIECE_WHITE, board);
    const blackScore = countPlayerScore(PIECE_BLACK, board);

    const evaluation = whiteScore - blackScore;

    const perspective = playerToMove === PIECE_WHITE ? 1 : -1;

    return evaluation * perspective;
};

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
