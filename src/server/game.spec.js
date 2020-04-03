
import {lobby} from './game';

describe('game', () => {
    describe('lobby', () => {
        it('sets phase to lobby, and waits', function () {
            
            const g = lobby({});

            const lobbyUpdate = g.next().value
            expect( lobbyUpdate ).toMatchObject({
                type: 'update',
                state: { phase: 'lobby' }
            });

            const either = g.next(lobbyUpdate.state).value;
            expect( either ).toMatchObject({
                type: 'either',
                options: [
                    { type: 'call' },
                    { type: 'delay' }
                ]
            });

            // Inner loop to add players
            const innerG = either.options[0].fn();
            const addPlayerInput = innerG.next().value;
            expect( addPlayerInput ).toMatchObject({
                type: 'getInput',
                inputType: 'addPlayer'
            });

            innerG.next({
                clientId: 'testId',
                data: {
                    name: 'Momo'
                }
            });

            expect( g.next().value ).toMatchObject({
                type: 'update',
                state: {
                    phase: 'lobby',
                    players: {
                        testId: { name: 'Momo' }
                    },
                }
            });
        })
    })
});

