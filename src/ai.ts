import { Board } from './board';
import { Move, generateAllMovesFromTile, generateAllMoves } from './moves';
import { DIFFICULTY, Piece, Player } from './types';

export const findMove = (
    board: Board,
    aiColor: Player,
    difficulty: DIFFICULTY
): Move | undefined => {
    if (countPlayerScore(aiColor, board) === 980) {
        return undefined;
    }

    const moveDepthSearch: number = {
        easy: 0,
        medium: 1,
        hard: 2,
    }[difficulty];

    const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === aiColor);
    let myPiecesMoves = myPieces.map(([x, y]) => generateAllMovesFromTile(x, y, board)).flat();
    myPiecesMoves = orderMoves(myPiecesMoves, aiColor);

    let bestMoves: Move[] = [];
    let bestMoveScore = -Infinity;

    const startTime = Date.now();

    for (const move of myPiecesMoves) {
        board.doMove(move);

        let ourScore = 0;

        // if our moves resulted in a finish, interrupt search immediately
        const playerFinished = countPlayerScore(aiColor, board) === 980;
        if (playerFinished) {
            ourScore = evaluate(board, aiColor);
        } else {
            // we just made a move, so now its time to evaluate from the perspective of the opponent

            const opponentScore = recursiveBoardSearchAlphaBeta(
                moveDepthSearch,
                board,
                aiColor === 'white' ? 'black' : 'white',
                -Infinity,
                Infinity
            );

            ourScore = -opponentScore;
        }

        board.undoMove(move);

        if (ourScore > bestMoveScore) {
            bestMoveScore = ourScore;
            bestMoves = [move];
        } else if (ourScore === bestMoveScore) {
            bestMoves.push(move);
        }
    }

    const endTime = Date.now();
    console.log(`Took ${endTime - startTime}ms to evaluate positions (difficulty=${difficulty})`);
    console.log(`Evaluated ${TIMES_TO_EVAL} position`);
    TIMES_TO_EVAL = 0;

    console.log(`Choosing one of ${bestMoves.length} options`);
    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
};

/**
 * Alpha beta pruning works by using really good moves to eliminate other possibilities, so if we evaluate (what we think)
 * are good moves first, it may allow alpha-beta to prune more effectively
 */
const orderMoves = (moves: Move[], playerToMove: Player) => {
    return (
        moves
            .sort((moveA, moveB) => {
                return evaluateMove(moveA, playerToMove) - evaluateMove(moveB, playerToMove);
            })
            // .sort sorts in ascending order, while we want the best moves first
            .reverse()
    );
};

let TIMES_TO_EVAL = 0;
const evaluateMove = (move: Move, playerToMove: Player) => {
    TIMES_TO_EVAL++;
    const oppositeCornerX = playerToMove === 'black' ? 0 : 7;
    const oppositeCornerY = playerToMove === 'white' ? 7 : 0;

    const initialDistance =
        Math.abs(move.fromX - oppositeCornerX) + Math.abs(move.fromY - oppositeCornerY);
    const endingDistance =
        Math.abs(move.toX - oppositeCornerX) + Math.abs(move.toY - oppositeCornerY);

    // if a move is really good, the ending distance should probably be lower than the starting distance

    const moveScore = initialDistance - endingDistance;

    // if initialDistance-endingDistance > 0 (a good score) => initialDistance > endingDistance
    // this is exactly what we want

    return moveScore;
};

const recursiveBoardSearchAlphaBeta = (
    depth: number,
    board: Board,
    playerToMove: Player,
    alpha: number,
    beta: number
): number => {
    const playerFinished = countPlayerScore(playerToMove, board) === 980;
    if (depth === 0 || playerFinished) {
        return evaluate(board, playerToMove);
    }

    const moves: Move[] = generateAllMoves(board, playerToMove);

    for (const move of moves) {
        board.doMove(move);
        const evaluation: number = -recursiveBoardSearchAlphaBeta(
            depth - 1,
            board,
            playerToMove === 'black' ? 'white' : 'black',
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
const evaluate = (board: Board, playerToMove: Player) => {
    const whiteScore = countPlayerScore('white', board);
    const blackScore = countPlayerScore('black', board);

    const evaluation = whiteScore - blackScore;
    const perspective = playerToMove === 'white' ? 1 : -1;

    return evaluation * perspective;
};

export const countPlayerScore = (player: Piece, board: Board) => {
    // count cumulative distances from the opposite corner

    const oppositeCornerX = player === 'black' ? 0 : 7;
    const oppositeCornerY = player === 'black' ? 7 : 0;

    const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === player);
    const myPiecesDistances = myPieces.map(
        ([x, y]) => Math.abs(x - oppositeCornerX) + Math.abs(y - oppositeCornerY)
    );

    const cumulativeDistance = myPiecesDistances.reduce((a, b) => a + b, 0);
    const score = 1000 - cumulativeDistance;

    return score;
};
