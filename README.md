# corners-ai

A **robot** (not an ai) that plays [`Ugolki`](https://en.wikipedia.org/wiki/Ugolki)

## Current scoring

The problem is, currently the bot counts it's score as `sumPiecesSelf - sumPiecesOpponent` (where the sum is the sum of distances). However, we may want to change this: for example, as the end of the game we might want to look less at our pieces and more at the opponents pieces.

The reason we look at the opponents pieces at all is so that we can block some of their really good moves. At the end of the game this is less important and may actually hurt the bot.

## New algorithm

So a revised algorithm may look like $\text{sumPiecesSelf} - \text{sumPiecesOpponent}\cdot x$, where $x$ is some factor of the "end gameness" of the game.

Side note: we may want x to a binary 1 or 0, since if we don't look at the opponents pieces at all we can skip the minmax step and only consider our own moves.

Closer to the beginning of the game, this $x$ may be $1$, and closer to the end it should be $0$. How might be calculate this $x$?

One proposal: $\frac{\text{oppositePieces}}{\text{totalPieces}}$, where $\text{totalPieces}$ is the total number of pieces in the game (currently $20$), and $\text{oppositePieces}$ is the total number of pieces that are on the other side of the board from where they started. This satisfies our endgame metric pretty well: at the start, it is $0$ (as all the pieces are on their respective sides of the board) and at the end it is $0$.

## An extension

One way that we might want to improve this algorithm is through the addition of a function $f(x)$ like so:

$$
\text{sumPiecesSelf} - \text{sumPiecesOpponent}\cdot f(x)
$$

$f(x)$ should be a function $[0,1] \to [0,1]$, where $x$ is the end game score mention above. The reason for this is that we may want to customize the curve of this function. This could potentially be done through evolutionary algorithms? (maybe, who knows)

## How to test

A page should be made to test potential implementations of bots against each other, like [this table](https://youtu.be/DpXy041BIlA).
