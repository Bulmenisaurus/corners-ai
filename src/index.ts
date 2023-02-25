import * as Board from './board';

const main = async (mainElement: HTMLElement) => {
    const boardElement = document.createElement('div');
    boardElement.id = 'board-container';

    mainElement.appendChild(boardElement);
    const board = new Board.InteractiveBoard(boardElement);

    board.setPiece(0, 7, Board.PIECE_WHITE);
    board.setPiece(0, 6, Board.PIECE_WHITE);
    board.setPiece(1, 7, Board.PIECE_WHITE);
    board.setPiece(2, 7, Board.PIECE_WHITE);
    board.setPiece(1, 6, Board.PIECE_WHITE);
    board.setPiece(0, 5, Board.PIECE_WHITE);
    board.setPiece(3, 7, Board.PIECE_WHITE);
    board.setPiece(2, 6, Board.PIECE_WHITE);
    board.setPiece(1, 5, Board.PIECE_WHITE);
    board.setPiece(0, 4, Board.PIECE_WHITE);

    board.setPiece(7, 0, Board.PIECE_BLACK);
    board.setPiece(6, 0, Board.PIECE_BLACK);
    board.setPiece(7, 1, Board.PIECE_BLACK);
    board.setPiece(5, 0, Board.PIECE_BLACK);
    board.setPiece(6, 1, Board.PIECE_BLACK);
    board.setPiece(7, 2, Board.PIECE_BLACK);
    board.setPiece(7, 3, Board.PIECE_BLACK);
    board.setPiece(6, 2, Board.PIECE_BLACK);
    board.setPiece(5, 1, Board.PIECE_BLACK);
    board.setPiece(4, 0, Board.PIECE_BLACK);

    Board.renderBoard(board, boardElement);
};

window.addEventListener('load', () => {
    const mainElement = document.getElementsByTagName('main')[0];
    main(mainElement);
});
