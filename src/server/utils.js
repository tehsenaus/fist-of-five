import { sendUpdate, delay } from './loop';
import { range } from 'lodash';

export function* countdown(timeout) {
  while (timeout > 0) {
    yield sendUpdate({countdownTimeSecs: timeout/1000});
    yield delay(1000);
    timeout = timeout - 1000;
  }
  yield sendUpdate({countdownTimeSecs: 0});
}

export function randomPin(n = 3) {
  return range(n).map(() => Math.floor(Math.random() * 10).toString()[0]).join('');
}
