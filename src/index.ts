import * as Board from './board';
import { DIFFICULTY } from './types';

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

    const easyButton = document.getElementById('easy') as HTMLButtonElement;
    const mediumButton = document.getElementById('medium') as HTMLButtonElement;
    const hardButton = document.getElementById('hard') as HTMLButtonElement;

    easyButton.onclick = () => {
        easyButton.dataset.selected = 'true';
        mediumButton.dataset.selected = hardButton.dataset.selected = 'false';

        board.difficulty = 'easy';
        localStorage.setItem('difficulty', 'easy');
    };
    mediumButton.onclick = () => {
        mediumButton.dataset.selected = 'true';
        easyButton.dataset.selected = hardButton.dataset.selected = 'false';

        board.difficulty = 'medium';
        localStorage.setItem('difficulty', 'medium');
    };
    hardButton.onclick = () => {
        hardButton.dataset.selected = 'true';
        easyButton.dataset.selected = mediumButton.dataset.selected = 'false';

        board.difficulty = 'hard';
        localStorage.setItem('difficulty', 'hard');
    };

    const difficultyButtons: Record<DIFFICULTY, HTMLButtonElement> = {
        easy: easyButton,
        medium: mediumButton,
        hard: hardButton,
    };

    const storedDifficulty = localStorage.getItem('difficulty');
    if (
        storedDifficulty === 'easy' ||
        storedDifficulty === 'medium' ||
        storedDifficulty === 'hard'
    ) {
        board.difficulty = storedDifficulty;
        difficultyButtons[storedDifficulty].dataset.selected = 'true';
    }
};

window.addEventListener('load', () => {
    const mainElement = document.getElementsByTagName('main')[0];
    main(mainElement);
});
