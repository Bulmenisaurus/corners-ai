import { Board, Piece } from './board';
import { Move, generateAllValidMoves } from './moves';

export const findMove = (board: Board, aiColor: Piece): Move => {
    const myPieces = board.coordinates().filter(([x, y]) => board.getPiece(x, y) === aiColor);
    const myPiecesMoves = myPieces.map(([x, y]) => generateAllValidMoves(x, y, board)).flat();

    return myPiecesMoves[Math.floor(Math.random() * myPiecesMoves.length)];
};
