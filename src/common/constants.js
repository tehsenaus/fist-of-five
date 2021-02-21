
export const VOTE_TYPES = {
    fistOfFive: [0, 1, 2, 3, 4, 5],
    fibonacci: [0, 1, 2, 3, 5, 8, 13],
    upDown: [-1, 0, 1],
};

/**
 * Phase when players are signing up, entering their real names.
 */
export const LOBBY_PHASE = 'lobby';

export const VOTING_PHASE = 'voting';

/**
 * Once all players have voted, votes are revealed.
 */
export const VOTE_REVEAL_PHASE = 'voteReveal';

/**
 * End of the game. All rounds done.
 */
export const GAME_END_PHASE = 'gameEnd';

/**
 * New player joins.
 */
export const ADD_PLAYER_INPUT = 'addPlayer';

/**
 * Start voting
 */
 export const START_VOTE_INPUT = 'startVote';

/**
 * Player adds vote.
 */
export const VOTE_INPUT = 'vote';

/**
 * Reset after vote reveal.
 */
export const RESET_INPUT = 'reset';
