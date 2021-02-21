
import {runVoting} from './game';
import { expectSaga } from 'redux-saga-test-plan';
import { ADD_PLAYER_INPUT, VOTE_INPUT, VOTE_REVEAL_PHASE, VOTING_PHASE } from '../common/constants';

describe('game', () => {
    describe('runVoting', () => {
        it('sets phase to voting, and waits', function () {
            return expectSaga(runVoting)
                .put.like({ action: {
                    phase: VOTING_PHASE,
                    players: {},
                }})
                .take(ADD_PLAYER_INPUT)
                .run();
        });

        it('sends results when all players have voted', function () {
            return expectSaga(runVoting)
                .dispatch({
                    type: ADD_PLAYER_INPUT,
                    clientId: 'a',
                    data: { name: 'A' },
                })
                .dispatch({
                    type: ADD_PLAYER_INPUT,
                    clientId: 'b',
                    data: { name: 'B' },
                })
                .put.like({ action: {
                    phase: VOTING_PHASE,
                    players: {
                        a: { name: 'A' },
                        b: { name: 'B' }
                    },
                }})
                .dispatch({
                    type: VOTE_INPUT,
                    clientId: 'a',
                    data: { vote: 'A' },
                })
                .dispatch({
                    type: VOTE_INPUT,
                    clientId: 'b',
                    data: { vote: 'B' },
                })
                .put.like({ action: {
                    phase: VOTE_REVEAL_PHASE,
                    playerVotes: {
                        a: { vote: 'A' },
                        b: { vote: 'B' }
                    },
                }})
                .run();
        });
    })
});

