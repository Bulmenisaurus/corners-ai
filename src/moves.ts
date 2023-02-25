import { Board, Piece, PIECE_NONE } from './board';

export interface Move {
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;

    /**
     * This should include the start & finish
     */
    fullMovePath: [number, number][];
}

const deduplicateMovesByStartEnd = (moves: Move[]) => {
    const getMoveKey = (move: Move): string => {
        // all of these are in the range [0, 7]. Would constructing a base-8 number be faster?
        return `${move.fromX},${move.fromY},${move.toX},${move.toY}`;
    };

    const moveBuckets: { [key: string]: Move[] } = {};

    for (const move of moves) {
        const moveKey = getMoveKey(move);

        if (moveKey in moveBuckets) {
            moveBuckets[moveKey].push(move);
        } else {
            moveBuckets[moveKey] = [move];
        }
    }

    const dedupMoves: Move[] = [];
    // now, we only want one move per bucket
    for (const moveKey in moveBuckets) {
        // we want to keep the simplest move
        const moveKeyMoves = moveBuckets[moveKey].sort(
            (move1, move2) => move1.fullMovePath.length - move2.fullMovePath.length
        );

        dedupMoves.push(moveKeyMoves[0]);
    }

    return dedupMoves;
};

export const generateAllMovesFromTile = (pieceX: number, pieceY: number, board: Board): Move[] => {
    const moves = recursiveSearchMoves(
        pieceX,
        pieceY,
        board,
        {
            fromX: pieceX,
            fromY: pieceY,
            toX: -1,
            toY: -1,
            fullMovePath: [[pieceX, pieceY]],
        },
        false
    );

    return deduplicateMovesByStartEnd(moves);
};

export const generateAllMoves = (board: Board, pieceColor: Piece): Move[] => {
    const moves: Move[] = [];

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

const recursiveSearchMoves = (
    pieceX: number,
    pieceY: number,
    board: Board,
    currentMoveData: Readonly<Move>,
    hasJumped: boolean
): Move[] => {
    const validMoves: Move[] = [];

    const tileOffsets: [number, number][] = [
        [0, 1], //   N
        [1, 1], //   NE
        [1, 0], //   E
        [1, -1], //  SE
        [0, -1], //  S
        [-1, -1], // SW
        [-1, 0], //  W
        [-1, 1], //  NW
    ];

    // can move in any of the 8 directions by one tile

    for (const [offsetX, offsetY] of tileOffsets) {
        // cannot move again after jumping
        if (hasJumped) {
            continue;
        }

        const newX = pieceX + offsetX;
        const newY = pieceY + offsetY;

        // check if the coordinate is valid
        if (newX > 7 || newX < 0 || newY > 7 || newY < 0) {
            continue;
        }

        // check if there is already a piece there
        if (board.getPiece(newX, newY) != PIECE_NONE) {
            continue;
        }

        // if there isn't, that's a valid move!

        const newMove: Move = window.structuredClone(currentMoveData);
        newMove.fullMovePath.push([newX, newY]);
        newMove.toX = newX;
        newMove.toY = newY;

        validMoves.push(newMove);
    }

    // or alternatively, can move diagonally in each of the 8 directions
    for (const [offsetX, offsetY] of tileOffsets) {
        const newX = pieceX + offsetX * 2;
        const newY = pieceY + offsetY * 2;

        if (newX > 7 || newX < 0 || newY > 7 || newY < 0) {
            continue;
        }

        // the coordinates we are jumping over
        const jumpX = pieceX + offsetX;
        const jumpY = pieceY + offsetY;

        // check that the coordinates we are jumping over are actually occupied ...
        const isSomeoneToJumpOver = board.getPiece(jumpX, jumpY) != PIECE_NONE;

        // ... and that the place we are jumping to is unoccupied ...
        const isSomewhereToLand = board.getPiece(newX, newY) == PIECE_NONE;

        // ... and that we haven't already been there, to not jump back and forth
        const hasBeenHereBefore = currentMoveData.fullMovePath.some(([moveX, moveY]) => {
            return moveX == newX && moveY == newY;
        });

        if (!isSomeoneToJumpOver || !isSomewhereToLand || hasBeenHereBefore) {
            continue;
        }

        const newMove: Move = window.structuredClone(currentMoveData);
        newMove.fullMovePath.push([newX, newY]);

        // and now, we can recursively search farther, since you can continue to jump
        const deeperMoves = recursiveSearchMoves(newX, newY, board, newMove, true);

        // and add all the new moves that we discovered to the list of moves
        for (const move of deeperMoves) {
            validMoves.push(move);
        }
    }

    // or, can just stop here and settle down (if already moved)
    if (hasJumped) {
        const newMove: Move = window.structuredClone(currentMoveData);
        newMove.toX = pieceX;
        newMove.toY = pieceY;

        validMoves.push(newMove);
    }

    return validMoves;
};
