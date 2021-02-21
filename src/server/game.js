
import { sendUpdate, delay, either, getInput } from './loop';
import {call} from 'redux-saga/effects';
import {countdown} from './utils';
import {RESET_INPUT, VOTE_REVEAL_PHASE, ROUND_END_PHASE, GAME_END_PHASE, START_VOTE_INPUT, VOTING_PHASE, ADD_PLAYER_INPUT, VOTE_INPUT} from '../common/constants';
const _ = require('lodash');

const GAME_EXPIRY_MS = 30 * 60000;
const GAME_END_EXPIRY_MS = 120000;
const PHASE_DELAY = 5000;

export function* runVoting({ voteType = 'fistOfFive' } = {}) {
    let players = {};
    let playerVotes = {};

    let expired = false;
    let revealed = false;

    while (!expired) {
      yield sendUpdate({
        players: players,
        phase: VOTING_PHASE,
        voteType,
        playerVotes,
        playersWhoVoted: Object.keys(playerVotes),
      });

      yield either(
          call(getPlayer),
          call(getVote),
          call(setVoteType),
          call(getReveal),
          call(function *() {
            yield* countdown(GAME_EXPIRY_MS);
            expired = true;
          })
      );  

      if (!expired && (revealed || areAllVotesIn())) {
        yield sendUpdate({
          playerVotes,
          phase: VOTE_REVEAL_PHASE,
        });
        yield either(
          getInput(RESET_INPUT),
          countdown(GAME_EXPIRY_MS)
        );

        playerVotes = {};
        revealed = false;
      }
    }
    return yield sendUpdate({ expired, players });

    function* getPlayer() {
      const { clientId, data } = yield getInput(ADD_PLAYER_INPUT);
      players = {
          ...players,
          [clientId]: {
              playerId: clientId,
              name: data.name
          }
      };
      yield sendUpdate({players});
    }

    function* getVote() {
      const { clientId, data } = yield getInput(VOTE_INPUT);
      playerVotes = {
          ...playerVotes,
          [clientId]: {
              vote: data.vote,
          }
      };
    }

    function* setVoteType() {
      const { data: { voteType: newVoteType } } = yield getInput(START_VOTE_INPUT);
      voteType = newVoteType;
      playerVotes = {};
    }

    function* getReveal() {
      yield getInput(RESET_INPUT);
      revealed = true;
    }

    function areAllVotesIn() {
      return Object.keys(playerVotes).length == Object.keys(players).length
    }
}


export function* runGame() {
  let expired = false;
  while (!expired) {
    let game = yield* runVoting();
    
    if (game.expired) {
      console.log('GAME EXPIRED');
      return;
    }

    const players = _.values(game.players).map(player => player.playerId);

    for (let round = 0; round < ROUNDS; round++) {
        yield sendUpdate({round});
        yield* runRound(players, round);

        if (round === ROUNDS - 1) {
          continue;
        }

        game = yield sendUpdate({phase: ROUND_END_PHASE});
        yield sendUpdate({scores: getUpdatedScores(game)});
        yield* countdown(PHASE_DELAY);
    }

    yield sendUpdate({ phase: GAME_END_PHASE, scores: getUpdatedScores(game)});

    yield either(
        getInput(RESET_GAME_INPUT),
        call(function *() {
          yield* countdown(GAME_END_EXPIRY_MS);
          expired = true;
        })
    );
  }
}
