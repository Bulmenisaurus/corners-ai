export const PIECE_BLACK = 'black';
export const PIECE_WHITE = 'white';
export const PIECE_NONE = 'none';

export type Piece = typeof PIECE_BLACK | typeof PIECE_WHITE | typeof PIECE_NONE;
export type Player = typeof PIECE_BLACK | typeof PIECE_WHITE;

export const TILE_BLACK = 'black';
export const TILE_WHITE = 'white';

export type Tile = typeof TILE_BLACK | typeof TILE_WHITE;

export type DIFFICULTY = 'easy' | 'medium' | 'hard';
