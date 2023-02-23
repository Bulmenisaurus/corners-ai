import * as Board from './board';

const main = async (mainElement: HTMLElement) => {
    const board = new Board.Board();

    board.setPiece(1, 0, Board.PIECE_WHITE);

    mainElement.appendChild(Board.renderBoard(board));
};

window.addEventListener('load', () => {
    const mainElement = document.getElementsByTagName('main')[0];
    main(mainElement);
});
