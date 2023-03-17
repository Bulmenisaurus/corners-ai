import { countPlayerScore, findMove } from './ai';
import { generateAllMovesFromTile, Move } from './moves';

export const PIECE_BLACK = 'black';
export const PIECE_WHITE = 'white';
export const PIECE_NONE = 'none';

export type Piece = typeof PIECE_BLACK | typeof PIECE_WHITE | typeof PIECE_NONE;
export type Player = typeof PIECE_BLACK | typeof PIECE_WHITE;

export const TILE_BLACK = 'black';
export const TILE_WHITE = 'white';

export type Tile = typeof TILE_BLACK | typeof TILE_WHITE;

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
    selectedTileCoordinates: undefined | [number, number];
    currentTurn: Player;
    aiWorker: Worker;
    tilesElement: HTMLDivElement;
    piecesElement: HTMLDivElement;
    EZ_ENABLED: boolean;
    EZ_TIMES: number;
    constructor(
        boardElement: HTMLElement,
        tileContainer: HTMLDivElement,
        piecesContainer: HTMLDivElement
    ) {
        this.board = new Board(Array<Piece>(8 * 8).fill(PIECE_NONE));
        this.currentTurn = 'white';
        this.aiWorker = new Worker('./dist/worker.js');

        this.boardElement = boardElement;
        this.tilesElement = tileContainer;
        this.piecesElement = piecesContainer;

        this.EZ_ENABLED = false;
        this.EZ_TIMES = 0;

        this.selectedTileCoordinates = undefined;

        boardElement.addEventListener('click', (ev) => {
            this.onClick(ev);
        });

        this.aiWorker.onmessage = (e) => {
            this.receiveAiMove(e.data);
        };

        this._initializeTileElements();
    }

    _initializeTileElements() {
        const tileContainers: HTMLDivElement[] = this.board.coordinates().map(([x, y]) => {
            const tileContainer = document.createElement('div');
            tileContainer.classList.add('tile');
            tileContainer.classList.add(this.getTileColor(x, y) === TILE_BLACK ? 'black' : 'white');
            tileContainer.dataset.selected = 'false';

            return tileContainer;
        });

        this.tilesElement.append(...tileContainers);
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
        const tileElements = Array.from(this.tilesElement.children) as HTMLDivElement[];

        return tileElements[x + y * 8];
    }

    getPieceElement(x: number, y: number): HTMLDivElement {
        const allPieces = Array.from(this.piecesElement.children) as HTMLDivElement[];

        const pieceElement = allPieces.find(
            (piece) => piece.dataset.x === x.toString() && piece.dataset.y === y.toString()
        );

        return pieceElement!;
    }

    setPiece(x: number, y: number, piece: Piece) {
        if (this.board.getPiece(x, y) === PIECE_NONE) {
            // if the tile at (x, y) is empty, create a new piece element
            this.board.setPiece(x, y, piece);

            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece');
            pieceElement.dataset.pieceType = piece;
            pieceElement.dataset.x = x.toString();
            pieceElement.dataset.y = y.toString();
            pieceElement.style.top = `calc(100%/8 * ${y} + (100%/8 - 10px) * 0.10)`;
            pieceElement.style.left = `calc(100%/8 * ${x} + (100%/8 - 10px) * 0.10)`;
            this.piecesElement.appendChild(pieceElement);
        }
        {
            // otherwise, set an existing pieces coords
            const pieceElement = this.getPieceElement(x, y);
            pieceElement.dataset.pieceType = piece;
        }
    }

    movePiece(fromX: number, fromY: number, toX: number, toY: number) {
        const pieceElement = this.getPieceElement(fromX, fromY);
        pieceElement.dataset.x = toX.toString();
        pieceElement.dataset.y = toY.toString();
        pieceElement.style.zIndex = '1';
        window.setTimeout(() => {
            pieceElement.style.zIndex = '';
        }, 1000);
        pieceElement.style.top = `calc(100%/8 * ${toY} + (100%/8 - 10px) * 0.10)`;
        pieceElement.style.left = `calc(100%/8 * ${toX} + (100%/8 - 10px) * 0.10)`;

        this.board.setPiece(toX, toY, this.board.getPiece(fromX, fromY));

        this.board.setPiece(fromX, fromY, PIECE_NONE);
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
        this.EZ_onTileClick(tileX, tileY);

        // if (this.EZ_ENABLED) this.clearSuggestions();

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
            // if (this.EZ_ENABLED) this.addSuggestions(tileX, tileY);
        }
    }

    removeMarks() {
        Array.from(document.querySelectorAll('.mark')).map((v) => v.classList.remove('mark'));
    }

    markMove(move: Move) {
        move.fullMovePath.forEach(([x, y]) => {
            const tile = this.getTileElement(x, y);
            tile.classList.add('mark');
        });
    }

    initiateAiMove() {
        this.aiWorker.postMessage([this.board.pieces, this.currentTurn, this.EZ_ENABLED]);
    }

    receiveAiMove(move: Move | undefined) {
        this.currentTurn = this.currentTurn === PIECE_BLACK ? PIECE_WHITE : PIECE_BLACK;

        if (move === undefined) {
            console.warn('AI has no response, probably end of game?');
        } else {
            this.doMove(move);
            this.markMove(move);
        }
    }

    doMove(move: Move) {
        this.movePiece(move.fromX, move.fromY, move.toX, move.toY);
        this.removeMarks();
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

        this.initiateAiMove();
    }

    EZ_onTileClick(x: number, y: number) {
        this.EZ_TIMES += x + y ? -this.EZ_TIMES : 1;
        this.EZ_ENABLED ||= this.EZ_TIMES > 2;
        if (this.EZ_ENABLED) {
            this.EZ_playAnimation();
        }
    }

    EZ_playAnimation() {
        this.getTileElement(0, 0).style.transform = 'rotate(360deg)';
    }
}

export const renderBoard = (board: InteractiveBoard, boardContainer: HTMLDivElement) => {
    boardContainer.append(board.tilesElement, board.piecesElement);
};
