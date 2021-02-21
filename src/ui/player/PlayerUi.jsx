import { h, Component } from 'preact';
import guid from '../../common/guid'
import { VOTING_PHASE, VOTE_REVEAL_PHASE, VOTE_TYPES } from "../../common/constants";

function sortBy(arr, f) {
    return arr.slice(0).sort(function (a, b) {
        if (f(a) < f(b))
            return -1;
        if (f(a) > f(b))
            return 1;
        return 0;
    });
}

const USER_HASH_KEY = 'user_hash';

export default class PlayerUi extends Component {
    onCreateGame = async () => {
        const res = await fetch('/game?id=' + localStorage.getItem(USER_HASH_KEY), { method: "POST" });
        const { id } = await res.json();

        console.log('CREATED GAME:', id);

        this.setGameId(id);
    }

    resetGame = async () => {
        await fetch('/game?id=' + localStorage.getItem(USER_HASH_KEY) + '&gameId=' + this.state.gameId, { method: "DELETE" });
    }

    onJoinGame = () => {
        this.setState({
            ...this.state,
            joinGame: true
        })
    }

    constructor() {
        super();
        this.input = null;
    }

    componentDidMount() {
        let userHash = localStorage.getItem(USER_HASH_KEY);
        if (!userHash) {
            userHash = guid();
            localStorage.setItem(USER_HASH_KEY, userHash);
        }

        const gameId = (window.location.hash.match(/#\/(\d+)/) || [])[1];
        if (gameId) this.pollState(gameId, userHash);
        else this.setState({ userHash });
    }

    setGameId(gameId) {
        if (gameId) {
            window.location.replace('#/' + gameId);
            this.pollState(gameId, localStorage.getItem(USER_HASH_KEY));
        } else {
            window.location.replace('');
            this.setState({
                ...this.state,
                gameId: undefined,
                game: undefined,
                joinGame: false,
            });
        }
    }

    pollState(gameId, userHash) {
        console.log('pollState', gameId, userHash);

        this.setState({ seqNo: -1, gameId, userHash, joinGame: false });

        const loop = async () => {
            try {
                const res = await fetch('/state?id=' + userHash + '&gameId=' + gameId + '&seq=' + this.state.seqNo);
                if (res.status === 404) {
                    console.log('GAME NOT FOUND', gameId);
                    return this.setGameId(undefined);
                }
                const json = await res.json();

                if (gameId !== this.state.gameId) {
                    console.log('stop polling:', gameId);
                    return;
                };

                console.log('stateUpdate', json);

                this.setState({
                    ...this.state,
                    ...json,
                    gameId
                });

                setTimeout(loop, 5);
            } catch (e) {
                console.error('poll loop error', e);
                setTimeout(loop, 1);
            }
        };

        loop();
    }

    onInputKeyDown(e) {
        if (e.key === 'Enter') {
            this.onInputAccepted();
        }
    };

    onInputAccepted(e) {
        const gameId = this.state.gameId;
        if (this.state.game.phase === VOTING_PHASE) {
            const username = this.input.value;
            fetch("/player?id=" + this.state.userHash + '&gameId=' + gameId + "&name=" + encodeURIComponent(username), { method: "POST" })
        }
    };

    vote(voteValue) {
        fetch(this.buildUrl("/vote", { vote: voteValue }), { method: "POST" });
    }

    setVoteType(voteType) {
        fetch(this.buildUrl("/game/start", { voteType }), { method: "POST" });
    }

    reveal() {
        this.resetGame();
    }

    render() {
        const phase = this.state.game && this.state.game.phase || (this.state.joinGame && 'joinGame');
        return <div className={"ui__player o-flex phase-" + phase}>
            {this.renderMain()}

            {/* <pre style={{ color: 'green' }}>
                {JSON.stringify(this.state, null, 2)}
            </pre> */}
        </div>
    }

    renderMain() {
        if (!this.state.game) {
            return this.renderCreateOrJoinGame();
        }
        if (this.state.game.phase === VOTING_PHASE) {
            return this.renderLobby(this.state.game);
        }
        if (this.state.game.phase === VOTE_REVEAL_PHASE) {
            return this.renderRevealedVotes(this.state.game);
        }
    }

    renderCreateOrJoinGame() {
        return <div className="text-center">
            <h1 className={"text--screen-title text-uppercase"}>FIST OF FIVE VOTING</h1>

            <p>
                <button className="btn btn-primary" onClick={(e) => this.onCreateGame()}>
                    Start Session
                </button>
            </p>
        </div>
    }

    renderLobby(game) {
        if (!game.name) {
            return this.renderNameEntry(game);
        }

        const validVotes = VOTE_TYPES[game.voteType];
        const {vote} = game.myVote || {};

        return (
            <div className="ui__lobby ui__lobby--has-entered">
                <h1 className={"text--screen-title text-uppercase"}>VOTING TIME</h1>

                <p>
                    Your Vote:<br />
                    {validVotes.map(voteValue => (
                        <button
                            className={"btn btn-lg " + (vote === voteValue ? "btn-primary" : "btn-secondary")}
                            onClick={() => this.vote(voteValue)}
                        >
                            {voteValue}
                        </button>
                    ))}
                </p>

                {this.renderHostControls(game)}

                <p>{game.players.length} voter(s) joined:</p>

                {this.renderPlayers(game)}
                
                <br /><br />
                <p>Shareable URL (expires in {this.state.game.countdownTimeSecs}): <pre>{window.location.href}</pre></p>
            </div>
        );
    }

    renderHostControls(game) {
        if (this.isHost(game)) {
            return [
                <p>
                    Vote type:
                    {Object.keys(VOTE_TYPES).map(voteType => (
                        <button
                            className={"btn " + (voteType === game.voteType ? "btn-primary" : "btn-secondary")}
                            onClick={() => this.setVoteType(voteType)}
                        >
                            {voteType}
                        </button>
                    ))}
                </p>,
                <p>
                    <button
                        className={"btn btn-danger"}
                        onClick={() => this.reveal()}
                    >
                        Reveal Now
                    </button>
                </p>
            ];
        }
    }

    renderNameEntry(game) {
        return <div className="ui__lobby">
            <h2 className={"m-b--lg"}>Please enter your name to join</h2>

            <div className="input__screen">
                <div>
                    <input type={"text"}
                        className={"m-b--md"}
                        placeholder={"Your name"}
                        maxLength={16}
                        ref={(input) => { this.input = input; }}
                        onKeyPress={(e) => this.onInputKeyDown(e)}>
                    </input>
                </div>

                <p>
                    <button className="btn btn-primary" onClick={(e) => this.onInputAccepted()}>
                        Send
                        </button>
                </p>

                <p>
                    <a href='#' onClick={() => {
                        this.setGameId(undefined);
                    }}>HOME</a>
                </p>
            </div>
        </div>
    }

    renderRevealedVotes({ hostId, playerId, players, playerVotes, countdownTimeSecs }) {
        let total = 0;
        const votes = [];
        const playersByPlayerId = {};
        for (const player of players) {
            playersByPlayerId[player.playerId] = player;
        }

        for (const playerId of Object.keys(playerVotes)) {
            const vote = playerVotes[playerId].vote;
            total += vote;
            votes.push({ player: playersByPlayerId[playerId].name, vote });
        }
        const avg = total / Object.keys(playerVotes).length;
        const sortedVotes = sortBy(votes, vote => vote.vote);

        return <div className="ui__lobby">
            <h1 className={"text--screen-title text-uppercase"}>VOTE RESULT</h1>

            <p>
                {sortedVotes.map(({vote}) => vote).join(", ")}<br />
                Mean: {avg.toFixed(1)}
            </p>

            <p>
                {sortedVotes.map(({ player, vote }) => (
                    <div>{player}: {vote}</div>
                ))}
            </p>
            
            { hostId === playerId ? this.renderReset() : null }

            <p>
                Resets in: {countdownTimeSecs}
            </p>
        </div>;
    }

    renderReset() {
        return <p>
            <button className="btn btn-primary btn-large" onClick={() => this.resetGame()}>Reset</button>   
        </p>;
    }

    renderPlayers({ playerId, players, playersWhoVoted = [] }) {
        const playersWhoVotedSet = new Set(playersWhoVoted);

        return players.map(player => {
            const hasVoted = playersWhoVotedSet.has(player.playerId);
            return <span className="badge badge-pill badge-secondary m-b--xs"
                style={{
                    fontSize: '1.5em',
                    marginRight: '0.5em',
                    ...(hasVoted ? {
                        backgroundColor: 'var(--primary)'
                    } : {
                            backgroundColor: 'var(--secondary)'
                        })
                }}>
                {player.playerId === playerId ? `YOU (${player.name})` : player.name}
            </span>
        })
    }

    renderCountdown(countdownTimeSecs) {
        if (!countdownTimeSecs) {
            return <span></span>
        }

        return (
            <div className="text-center">
                <h1 style={{ fontSize: '5em' }}>{countdownTimeSecs} </h1>
            </div>
        )
    }

    isHost(game) {
        return game.playerId === game.hostId;
    }

    buildUrl = (base, params) => {
        params = {
            ...params,
            playerId: this.state.userHash,
            gameId: this.state.gameId,
        };
        const paramsStr = Object.keys(params).map(key => key + '=' + params[key]).join('&');
        return base + "?" + paramsStr;
    }
}
