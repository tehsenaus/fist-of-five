import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import webpack from 'webpack';
import express from 'express';
import {runGameLoop} from './loop';
import {runGame} from './game';
import webpackConfig from '../../webpack.config.js';
import {ADD_PLAYER_INPUT, VOTE_INPUT, VOTE_TYPES, VOTE_REVEAL_PHASE, RESET_INPUT, START_VOTE_INPUT} from '../common/constants';
import {get} from "lodash";
import {randomPin} from "./utils";

const _ = require('lodash');

const compiler = webpack(webpackConfig);
const app = express();
const isProd = process.env.NODE_ENV === 'production';

console.log('env:', process.env.NODE_ENV);

app.use(webpackDevMiddleware(compiler,{
    noInfo: false,
    publicPath: '/',
}));

if (!isProd) app.use(webpackHotMiddleware(compiler));

const games = {};

function createGame(clientId) {
    let id;
    do {
        id = randomPin(6);
    } while (games[id]);

    const gameProps = runGameLoop(runGame());
    
    gameProps.promise.catch(e => {
        console.error('ERROR IN GAME:', id, e);
    }).then(() => {
        console.log('game done:', id);
        delete games[id];
    });

    const game = games[id] = {
        ...gameProps,
        id,
        hostId: clientId,
    };

    return game;
}

function getGame(gameId) {
    return games[gameId];
}

app.get('/state', async (req, res) => {
    const game = getGame(req.query.gameId);
    if (!game) {
        return res.status(404).end();
    }

    const clientId = req.query.id;
    res.json(await game.getStateUpdate(req.query.id, req.query.seq, latestGameState => {
        return {
            hostId: game.hostId,
            phase : latestGameState.phase,
            ...get(latestGameState, ['players', clientId], {}),
            players: _.values(latestGameState.players),
            countdownTimeSecs: latestGameState.countdownTimeSecs,
            myVote: latestGameState.playerVotes[clientId],
            playerVotes: latestGameState.phase === VOTE_REVEAL_PHASE ? latestGameState.playerVotes : {},
            playersWhoVoted: latestGameState.playersWhoVoted,
            voteType: latestGameState.voteType,
        }
    }));
});

app.post('/player', (req, res) => {
    const game = getGame(req.query.gameId);
    if (!game) return res.status(400).end();

    const name = req.query.name;
    const playerId = req.query.id;
    if (!name || !playerId) {
      res.status(400).end();
      return;
    }

    game.sendInput(playerId, ADD_PLAYER_INPUT, {
        name
    });

    res.end();
});

app.post('/vote', async (req, res) => {
    const game = getGame(req.query.gameId);
    if (!game) return res.status(400).end();

    const clientId = req.query.playerId;
    const vote = parseInt(req.query.vote);
    const {voteType} = game.getLatestState();
    const validVotes = VOTE_TYPES[voteType];

    if (validVotes.indexOf(vote) < 0) return res.status(400).end();

    game.sendInput(clientId, VOTE_INPUT, {
        vote,
    });

    const state = await game.getStateUpdate(clientId, 0);

    res.json(get(state.game, ['round', 'players', clientId, 'guess'], {}));
});

app.post('/game', (req, res) => {
    const {id} = createGame(req.query.id);
    res.json({id});
});

app.delete('/game', (req, res) => {
    const game = getGame(req.query.gameId);
    if (!game) return res.status(400).end();

    game.sendInput(req.query.id, RESET_INPUT, {});
    res.end();
});

app.post('/game/start', (req, res) => {
    const game = getGame(req.query.gameId);
    if (!game) return res.status(400).end();

    if ( req.query.playerId === game.hostId ) {
        game.sendInput(req.query.id, START_VOTE_INPUT, {
            voteType: req.query.voteType,
        });
    }
    res.end();
});

app.listen(process.env.PORT || 8080, () => {
    console.log(`Public path: ${webpackConfig.output.publicPath}`);
    console.log('UI listening on port 8080!')
});
