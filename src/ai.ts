import { Board, Piece, PIECE_BLACK, PIECE_WHITE } from './board';
import { Move, generateAllMovesFromTile, generateAllMoves } from './moves';

export const findMove = (board: Board, aiColor: Piece): Move | undefined => {
    const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === aiColor);
    const myPiecesMoves = myPieces.map(([x, y]) => generateAllMovesFromTile(x, y, board)).flat();

    let bestMove: Move = myPiecesMoves[0];
    let bestMoveScore = -Infinity;

    const startTime = Date.now();

    for (const move of myPiecesMoves) {
        board.doMove(move);
        // we just made a move, so now its time to evaluate from the perspective of the opponent

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

    return bestMove;
};

const recursiveBoardSearchAlphaBeta = (
    depth: number,
    board: Board,
    playerToMove: Piece,
    alpha: number,
    beta: number
): number => {
    const playerFinished = countPlayerScore(playerToMove, board) === -20;
    if (depth === 0 || playerFinished) {
        return evaluate(board, playerToMove);
    }

    const moves: Move[] = generateAllMoves(board, playerToMove);

    for (const move of moves) {
        board.doMove(move);
        const evaluation: number = -recursiveBoardSearchAlphaBeta(
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

/**
 * Basic evaluation function.
 * Returns a:
 *  - positive value if the player who's turn it is to move is doing better
 *  - negative if the player who's turn it is to move is doing worse
 *  - 0 if it is a tie.
 */
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
    const score = 1000 - cumulativeDistance;

    return score;
};
