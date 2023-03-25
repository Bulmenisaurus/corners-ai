import { Board } from './board';
import { Move, generateAllMovesFromTile } from './moves';
import { Player, Piece, Tile, DIFFICULTY } from './types';

export class InteractiveBoard {
    board: Board;
    boardElement: HTMLElement;
    selectedTileCoordinates: undefined | [number, number];
    currentTurn: Player;
    aiWorker: Worker;
    tilesElement: HTMLDivElement;
    piecesElement: HTMLDivElement;
    difficulty: DIFFICULTY;
    constructor(
        boardElement: HTMLElement,
        tileContainer: HTMLDivElement,
        piecesContainer: HTMLDivElement
    ) {
        this.board = new Board(Array<Piece>(8 * 8).fill('none'));
        this.currentTurn = 'white';
        this.aiWorker = new Worker('./dist/worker.js');

        this.boardElement = boardElement;
        this.tilesElement = tileContainer;
        this.piecesElement = piecesContainer;

        this.difficulty = 'easy';

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
            tileContainer.classList.add(this.getTileColor(x, y));
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
                    this.setPiece(currentX, currentY, 'white');
                    currentX++;
                } else if (char === 'p') {
                    this.setPiece(currentX, currentY, 'black');
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
        if (this.board.getPiece(x, y) === 'none') {
            // if the tile at (x, y) is empty, create a new piece element
            this.board.setPiece(x, y, piece);

            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece');
            pieceElement.dataset.pieceType = piece;
            pieceElement.dataset.x = x.toString();
            pieceElement.dataset.y = y.toString();
            pieceElement.style.top = `calc(100%/8 * ${y} + (100%/8) * 0.10)`;
            pieceElement.style.left = `calc(100%/8 * ${x} + (100%/8) * 0.10)`;
            this.piecesElement.appendChild(pieceElement);
        }
        {
            // otherwise, set an existing pieces coords
            const pieceElement = this.getPieceElement(x, y);
            pieceElement.dataset.pieceType = piece;
        }
    }

    uiAnimateMove(move: Move) {
        const { fromX, fromY, toX, toY } = move;
        const pieceElement = this.getPieceElement(fromX, fromY);
        pieceElement.dataset.x = toX.toString();
        pieceElement.dataset.y = toY.toString();

        const pieceAnimationTimeMS = Math.min(1000 / (move.fullMovePath.length - 1), 500);
        pieceElement.style.transitionDuration = `${pieceAnimationTimeMS}ms`;

        for (let i = 1; i < move.fullMovePath.length; i++) {
            const [x, y] = move.fullMovePath[i];
            window.setTimeout(() => {
                pieceElement.style.top = `calc(100%/8 * ${y} + (100%/8) * 0.10)`;
                pieceElement.style.left = `calc(100%/8 * ${x} + (100%/8) * 0.10)`;
            }, pieceAnimationTimeMS * (i - 1));
        }

        pieceElement.style.zIndex = '1';
        window.setTimeout(() => {
            pieceElement.style.zIndex = '';
        }, pieceAnimationTimeMS * move.fullMovePath.length);
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
        return this.board.getTileColor(x, y);
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

        if (prevSelectedCoords !== undefined) {
            this.unselect(prevSelectedCoords[0], prevSelectedCoords[1]);
            this.selectedTileCoordinates = undefined;

            this.tryMove(prevSelectedCoords[0], prevSelectedCoords[1], tileX, tileY);
        } else {
            // if user had nothing selected and clicked on an empty tile, just do nothing
            if (this.board.getPiece(tileX, tileY) === 'none') {
                return;
            }

            this.selectedTileCoordinates = [tileX, tileY];
            this.select(tileX, tileY);
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
        this.aiWorker.postMessage([this.board.pieces, this.currentTurn, this.difficulty]);
    }

    receiveAiMove(move: Move | undefined) {
        this.currentTurn = this.currentTurn === 'black' ? 'white' : 'black';

        if (move === undefined) {
            console.warn('AI has no response, probably end of game?');
        } else {
            this.doMove(move);
            this.markMove(move);
        }
    }

    doMove(move: Move) {
        this.board.setPiece(move.toX, move.toY, this.board.getPiece(move.fromX, move.fromY));
        this.board.setPiece(move.fromX, move.fromY, 'none');

        this.uiAnimateMove(move);
        this.removeMarks();
    }

    undoMove(move: Move) {
        const pieceToMove = this.board.getPiece(move.toX, move.toY);
        this.setPiece(move.fromX, move.fromY, pieceToMove);
        this.setPiece(move.toX, move.toY, 'none');
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

        // mark it as the other players turn now

        this.currentTurn = this.currentTurn === 'black' ? 'white' : 'black';
        // const moveAudio = new Audio('./audio/wood-sound.mp3');
        // moveAudio.play();

        window.setTimeout(() => {
            this.initiateAiMove();
        }, 1000);
    }
}
