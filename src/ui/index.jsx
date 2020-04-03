import { h, render } from 'preact';

let root;
function init() {
    let PlayerUi = require('./player/PlayerUi').default;
    root = render(<PlayerUi />, document.body, root);
}

// in development, set up HMR:
if (module.hot) {
    //require('preact/devtools');   // turn this on if you want to enable React DevTools!
    module.hot.accept('./player/PlayerUi', () => requestAnimationFrame(init) );
}

init();