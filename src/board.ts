import { countPlayerScore, findMove } from './ai';
import { generateAllMovesFromTile, Move } from './moves';

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

    doMove(move: Move) {
        const pieceToMove = this.getPiece(move.fromX, move.fromY);
        this.setPiece(move.fromX, move.fromY, PIECE_NONE);
        this.setPiece(move.toX, move.toY, pieceToMove);
    }

    undoMove(move: Move) {
        const pieceToMove = this.getPiece(move.toX, move.toY);
        this.setPiece(move.fromX, move.fromY, pieceToMove);
        this.setPiece(move.toX, move.toY, PIECE_NONE);
    }
}

export class InteractiveBoard {
    board: Board;
    boardElement: HTMLElement;
    boardTileContainers: HTMLDivElement[];
    selectedTileCoordinates: undefined | [number, number];
    currentTurn: Piece;
    constructor(boardElement: HTMLElement) {
        this.board = new Board();
        this.currentTurn = 'white';

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

    loadFen(fen: string) {
        const rows = fen.split('/');
        let currentX = 0;
        let currentY = 0;
        for (const row of rows) {
            for (const char of row) {
                if (char === 'P') {
                    this.setPiece(currentX, currentY, PIECE_WHITE);
                    currentX++;
                } else if (char === 'p') {
                    this.setPiece(currentX, currentY, PIECE_BLACK);
                    currentX++;
                } else {
                    currentX += parseInt(char);
                }
            }
            currentX = 0;
            currentY += 1;
        }
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

    addSuggestions(x: number, y: number) {
        const allValidMoves = generateAllMovesFromTile(x, y, this.board);
        for (const validMove of allValidMoves) {
            const tileElement = this.getTileElement(validMove.toX, validMove.toY);
            tileElement.classList.add('valid');
        }
    }

    clearSuggestions() {
        Array.from(document.querySelectorAll('.valid')).map((v) => v.classList.remove('valid'));
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
        // this.clearSuggestions();

        if (prevSelectedCoords !== undefined) {
            this.unselect(prevSelectedCoords[0], prevSelectedCoords[1]);
            this.selectedTileCoordinates = undefined;

            this.tryMove(prevSelectedCoords[0], prevSelectedCoords[1], tileX, tileY);
        } else {
            // if user had nothing selected and clicked on an empty tile, just do nothing
            if (this.board.getPiece(tileX, tileY) === PIECE_NONE) {
                return;
            }

            this.selectedTileCoordinates = [tileX, tileY];
            this.select(tileX, tileY);
            // this.addSuggestions(tileX, tileY);
        }
    }

    markMove(move: Move) {
        Array.from(document.querySelectorAll('.mark')).map((v) => v.classList.remove('mark'));

        move.fullMovePath.forEach(([x, y]) => {
            const tile = this.getTileElement(x, y);
            tile.classList.add('mark');
        });
    }

    aiMove() {
        const move = findMove(this.board, this.currentTurn);
        this.currentTurn = this.currentTurn === PIECE_BLACK ? PIECE_WHITE : PIECE_BLACK;

        if (move === undefined) {
            console.warn('AI has no response, probably end of game?');
        } else {
            this.doMove(move);
            this.markMove(move);
        }
    }

    // note: there are `doMove` and `undoMove` in `this.board` (non-ui) with the same exact code, what is the different?
    // well, in InteractiveBoard this.setPiece updates the UI in addition to the board state
    doMove(move: Move) {
        const pieceToMove = this.board.getPiece(move.fromX, move.fromY);
        this.setPiece(move.fromX, move.fromY, PIECE_NONE);
        this.setPiece(move.toX, move.toY, pieceToMove);
    }

    undoMove(move: Move) {
        const pieceToMove = this.board.getPiece(move.toX, move.toY);
        this.setPiece(move.fromX, move.fromY, pieceToMove);
        this.setPiece(move.toX, move.toY, PIECE_NONE);
    }

    tryMove(startX: number, startY: number, endX: number, endY: number) {
        // only allow the player who has their turn right now to move
        if (this.board.getPiece(startX, startY) !== this.currentTurn) {
            return;
        }

        // if user clicks on a selected square, just de-select it
        if (startX === endX && startY == endY) {
            return;
        }

        // validate that this move actually exists
        const allValidMoves = generateAllMovesFromTile(startX, startY, this.board);
        const thisMove = allValidMoves.find((move) => {
            return move.toX === endX && move.toY === endY;
        });

        if (thisMove === undefined) {
            const errorAudio = new Audio('./audio/wood-sound-error.mp3');
            errorAudio.play();
            return;
        }

        this.doMove(thisMove);
        console.log(`My score: ${countPlayerScore(PIECE_WHITE, this.board)}`);

        // mark it as the other players turn now

        this.currentTurn = this.currentTurn === PIECE_BLACK ? PIECE_WHITE : PIECE_BLACK;
        // const moveAudio = new Audio('./audio/wood-sound.mp3');
        // moveAudio.play();

        this.aiMove();
    }
}

export const renderBoard = (board: InteractiveBoard, boardContainer: HTMLDivElement) => {
    boardContainer.append(...board.boardTileContainers);
};
