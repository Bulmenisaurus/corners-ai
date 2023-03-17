import { findMove } from './ai';
import { Board } from './board';

onmessage = (e) => {
    const board = new Board(e.data[0]);
    const move = findMove(board, e.data[1], e.data[2]);
    postMessage(move);
};
