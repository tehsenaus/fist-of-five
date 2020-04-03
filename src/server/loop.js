
import {runSaga} from "redux-saga";
import {take, put, race, call, select} from "redux-saga/effects";

export function runGameLoop(gameSaga) {
    let latestGameState = {};
    let seqNo = 0;
    let nextStatePromise = Promise.resolve({});
    let _sendUpdate;
    let inputListeners = [];

    (function loop() {
        nextStatePromise = new Promise(resolve => {
            _sendUpdate = update => {
                latestGameState = {...latestGameState, ...update};
                ++seqNo;
                console.log('sendUpdate:', seqNo);
                resolve();
                return latestGameState;
            };
        }).then(loop);
    })();

    const task = runSaga({
        subscribe: callback => {
            inputListeners.push(callback);
            return () => {
                inputListeners = inputListeners.filter(listener => listener !== callback);
            };
        },
        dispatch: update => {
            _sendUpdate(update);
        },
        getState: () => latestGameState,
        logger: (...args) => console.log(...args),
    }, () => gameSaga);

    const promise = task.done;

    return {
        sendInput: (clientId, type, data) => {
            console.log('sendInput', clientId, type, data);
            const input = { type, clientId, data };
            inputListeners.forEach(listener => listener(input));
        },
        getStateUpdate,
        promise,
    }

    /**
     * Gets the next state update to send to a client.
     *
     * If the client is already up to date, waits for a state change before resolving.
     */
    async function getStateUpdate(clientId, lastSeqNoSeen, selector = x => x) {
        if ( lastSeqNoSeen == seqNo ) {
            await Promise.race([ nextStatePromise, delayPromise(15000) ]);
        }

        return {
            seqNo,
            game: selector(latestGameState),
        }
    }
}

export function getInput(inputType) {
    console.log('getInput:', inputType);
    return take(inputType);
}

export function sendUpdate(state) {
    return call(function *() {
        yield put(state);
        return yield select();
    });
}

export { call } from 'redux-saga/effects';

export function delay(ms) {
    return call(() => delayPromise(ms));
}

export function either(...options) {
    return race(options);
}

export function delayPromise(t) {
    return new Promise(resolve => setTimeout(resolve, t));
}
