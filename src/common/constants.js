
export const CODE_NAMES = '😀 😁 😂 🤣 😃 😄 😅 😆 😉 😊 😋 😎 😍 😘 😗 😙 😚 🙂 🤗 🤔 😐 😑 😶 🙄 😏 😣 😥 😮 🤐 😯 😪 😫 😴 😌 😛 😜 😝 🤤 😒 😓 😔 😕 🙃 🤑 😲 ☹️ 🙁 😖 😞 😟 😤 😢 😭 😦 😧 😨 😩 😬 😰 😱 😳 😵 😡 😠 😷 🤒 🤕 🤢 🤧 😇 🤠 🤡 🤥 🤓 😈 👿 👹 👺 💀 👻 👽 🤖 💩 😺 😸 😹 😻 😼 😽 🙀 😿 😾'.split(' ');

export const GAME_TITLE = [5,3,9].map(i => CODE_NAMES[i]).join('') +
    ' CODEFACES ' + [8, 2, 5].map(i => CODE_NAMES[i]).join('')

export const VOTES = [0, 1, 2, 3, 4, 5];

export const HOST_ID = 'HOST';

/**
 * Phase when players are signing up, entering their real names.
 */
export const LOBBY_PHASE = 'lobby';

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
 * Player adds vote.
 */
export const VOTE_INPUT = 'vote';

/**
 * Reset after vote reveal.
 */
export const RESET_INPUT = 'reset';
