import { InteractiveBoard } from './interactiveBoard';
import { Move } from './moves';
import { Piece, Player, Tile } from './types';

export class Board {
    pieces: Piece[];
    constructor(board: Array<Piece>) {
        this.pieces = board;
    }

    getPiece(x: number, y: number): Piece {
        return this.pieces[x + y * 8];
    }

    setPiece(x: number, y: number, piece: Piece) {
        this.pieces[x + y * 8] = piece;
    }

    getTileColor(x: number, y: number): Tile {
        return (<Tile[]>['white', 'black'])[(x + y) % 2];
    }

    coordinates(): [number, number][] {
        const coordinates: [number, number][] = [];

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                coordinates.push([x, y]);
            }
        }

        return coordinates;
    }

    doMove(move: Move) {
        const pieceToMove = this.getPiece(move.fromX, move.fromY);

        this.setPiece(move.fromX, move.fromY, 'none');
        this.setPiece(move.toX, move.toY, pieceToMove);
    }

    undoMove(move: Move) {
        const pieceToMove = this.getPiece(move.toX, move.toY);
        this.setPiece(move.fromX, move.fromY, pieceToMove);
        this.setPiece(move.toX, move.toY, 'none');
    }
}

export const renderBoard = (board: InteractiveBoard, boardContainer: HTMLDivElement) => {
    boardContainer.append(board.tilesElement, board.piecesElement);
};
