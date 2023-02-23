import * as Board from './board';

const main = async (mainElement: HTMLElement) => {
    const boardElement = document.createElement('div');
    boardElement.id = 'board-container';

    mainElement.appendChild(boardElement);
    const board = new Board.InteractiveBoard(boardElement);

    board.setPiece(0, 0, Board.PIECE_WHITE);
    board.setPiece(0, 1, Board.PIECE_WHITE);
    board.setPiece(1, 0, Board.PIECE_WHITE);
    board.setPiece(2, 0, Board.PIECE_WHITE);
    board.setPiece(1, 1, Board.PIECE_WHITE);
    board.setPiece(0, 2, Board.PIECE_WHITE);
    board.setPiece(3, 0, Board.PIECE_WHITE);
    board.setPiece(2, 1, Board.PIECE_WHITE);
    board.setPiece(1, 2, Board.PIECE_WHITE);
    board.setPiece(0, 3, Board.PIECE_WHITE);

    board.setPiece(7, 7, Board.PIECE_BLACK);
    board.setPiece(6, 7, Board.PIECE_BLACK);
    board.setPiece(7, 6, Board.PIECE_BLACK);
    board.setPiece(5, 7, Board.PIECE_BLACK);
    board.setPiece(6, 6, Board.PIECE_BLACK);
    board.setPiece(7, 5, Board.PIECE_BLACK);
    board.setPiece(7, 4, Board.PIECE_BLACK);
    board.setPiece(6, 5, Board.PIECE_BLACK);
    board.setPiece(5, 6, Board.PIECE_BLACK);
    board.setPiece(4, 7, Board.PIECE_BLACK);

    Board.renderBoard(board, boardElement);
};

window.addEventListener('load', () => {
    const mainElement = document.getElementsByTagName('main')[0];
    main(mainElement);
});
