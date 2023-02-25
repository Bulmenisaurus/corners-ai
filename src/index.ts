import * as Board from './board';

const main = async (mainElement: HTMLElement) => {
    const boardElement = document.createElement('div');
    boardElement.id = 'board-container';

    mainElement.appendChild(boardElement);

    const board = new Board.InteractiveBoard(boardElement);
    board.loadFen('4pppp/5ppp/6pp/7p/P/PP/PPP/PPPP');

    Board.renderBoard(board, boardElement);
};

window.addEventListener('load', () => {
    const mainElement = document.getElementsByTagName('main')[0];
    main(mainElement);
});
