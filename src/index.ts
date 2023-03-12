import * as Board from './board';

const main = async (mainElement: HTMLElement) => {
    const boardContainer = document.createElement('div');
    boardContainer.id = 'board-container';

    mainElement.appendChild(boardContainer);

    const tileContainer = document.createElement('div');
    tileContainer.id = 'tiles';
    const piecesContainer = document.createElement('div');
    piecesContainer.id = 'pieces';

    const board = new Board.InteractiveBoard(boardContainer, tileContainer, piecesContainer);
    board.loadFen('4pppp/5ppp/6pp/7p/P/PP/PPP/PPPP');
    //test positing:board.loadFen('4PPPP/5PPP/6PP/7P/1p/pp/ppp/pppp');
    Board.renderBoard(board, boardContainer);
};

window.addEventListener('load', () => {
    const mainElement = document.getElementsByTagName('main')[0];
    main(mainElement);
});
