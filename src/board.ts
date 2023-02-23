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

export class InteractiveBoard {
    board: Board;
    boardElement: HTMLElement;
    boardTileContainers: HTMLDivElement[];
    selectedTileCoordinates: undefined | [number, number];
    constructor(boardElement: HTMLElement) {
        this.board = new Board();

        this.boardElement = boardElement;
        this.boardTileContainers = this._initializeTileElements();

        this.selectedTileCoordinates = undefined;

        boardElement.addEventListener('click', (ev) => {
            this.onClick(ev);
        });
    }

    _initializeTileElements() {
        const tileContainers: HTMLDivElement[] = this.board.coordinates().map(([x, y]) => {
            const tileContainer = document.createElement('div');
            tileContainer.classList.add('tile');
            tileContainer.classList.add(this.getTileColor(x, y) === TILE_BLACK ? 'black' : 'white');
            tileContainer.dataset.selected = 'false';

            const tilePiece = this.board.getPiece(x, y);

            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece');
            pieceElement.dataset.pieceType = tilePiece;
            tileContainer.appendChild(pieceElement);

            return tileContainer;
        });

        return tileContainers;
    }

    getTileElement(x: number, y: number): HTMLDivElement {
        return this.boardTileContainers[x + y * 8];
    }

    setPiece(x: number, y: number, piece: Piece) {
        this.board.setPiece(x, y, piece);

        const tileElement = this.getTileElement(x, y);
        const pieceElement = tileElement.children[0] as HTMLElement;
        pieceElement.dataset.pieceType = piece;
    }

    select(x: number, y: number) {
        const tileElement = this.getTileElement(x, y);
        tileElement.dataset.selected = 'true';
    }

    unselect(x: number, y: number) {
        const tileElement = this.getTileElement(x, y);
        tileElement.dataset.selected = 'false';
    }

    getTileColor(x: number, y: number): Tile {
        return [TILE_WHITE as Tile, TILE_BLACK as Tile][(x + y) % 2];
    }

    onClick(event: MouseEvent) {
        const mouseX = event.offsetX;
        const mouseY = event.offsetY;

        const boardFractionX = mouseX / this.boardElement.getBoundingClientRect().width;
        const boardFractionY = mouseY / this.boardElement.getBoundingClientRect().height;

        const boardTileX = Math.floor(boardFractionX * 8);
        const boardTileY = Math.floor(boardFractionY * 8);

        this.onTileClick(boardTileX, boardTileY);
    }

    onTileClick(tileX: number, tileY: number) {
        const prevSelectedCoords = this.selectedTileCoordinates;

        if (prevSelectedCoords !== undefined) {
            this.unselect(prevSelectedCoords[0], prevSelectedCoords[1]);
            this.selectedTileCoordinates = undefined;

            if (prevSelectedCoords[0] === tileX && prevSelectedCoords[1] == tileY) {
                return;
            }

            this.move(prevSelectedCoords[0], prevSelectedCoords[1], tileX, tileY);
        } else {
            this.selectedTileCoordinates = [tileX, tileY];
            this.select(tileX, tileY);
        }
    }

    move(startX: number, startY: number, endX: number, endY: number) {
        const pieceToMove = this.board.getPiece(startX, startY);
        this.setPiece(startX, startY, PIECE_NONE);
        this.setPiece(endX, endY, pieceToMove);
    }
}

export const renderBoard = (board: InteractiveBoard, boardContainer: HTMLDivElement) => {
    boardContainer.append(...board.boardTileContainers);
};
