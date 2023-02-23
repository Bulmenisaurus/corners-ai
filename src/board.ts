export const PIECE_BLACK = 'black';
export const PIECE_WHITE = 'white';
export const PIECE_NONE = 'none';

export type Piece = typeof PIECE_BLACK | typeof PIECE_WHITE | typeof PIECE_NONE;

export const TILE_BLACK = 'black';
export const TILE_WHITE = 'white';

export type Tile = typeof TILE_BLACK | typeof TILE_WHITE;

export class Board {
    board: Piece[];
    constructor() {
        this.board = Array<Piece>(8 * 8).fill(PIECE_NONE);

        console.log(this.board);
    }

    getPiece(x: number, y: number): Piece {
        return this.board[x + y * 8];
    }

    setPiece(x: number, y: number, piece: Piece) {
        this.board[x + y * 8] = piece;
    }

    getTileColor(x: number, y: number): Tile {
        return [TILE_WHITE as Tile, TILE_BLACK as Tile][(x + y) % 2];
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
}

export const renderBoard = (board: Board): HTMLDivElement => {
    const boardContainer = document.createElement('div');
    boardContainer.id = 'board-container';

    const tileContainers: HTMLDivElement[] = board.coordinates().map(([x, y]) => {
        const tileContainer = document.createElement('div');
        tileContainer.classList.add('tile');
        tileContainer.classList.add(board.getTileColor(x, y) === TILE_BLACK ? 'black' : 'white');

        const tilePiece = board.getPiece(x, y);

        switch (tilePiece) {
            case PIECE_NONE: {
                break;
            }

            default: {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece');
                pieceElement.classList.add(tilePiece === PIECE_BLACK ? 'black' : 'white');
                tileContainer.appendChild(pieceElement);
            }
        }

        return tileContainer;
    });
    boardContainer.append(...tileContainers);

    return boardContainer;
};
