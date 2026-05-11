import { useGame, avClass } from '../context/GameContext.jsx';
import { Icon } from '../lib/icons.jsx';

export default function Lobby() {
  const { state, dispatch, actions, roomRef } = useGame();
  const myId = roomRef.current?.myId;

  const copyCode = () => {
    navigator.clipboard?.writeText(state.roomCode)
      .then(() => actions.toast('Code copied!'))
      .catch(() => actions.toast('Code: ' + state.roomCode));
  };

  const copyLink = () => {
    const url = `${location.origin}${location.pathname}?join=${state.roomCode}`;
    navigator.clipboard?.writeText(url)
      .then(() => actions.toast('Invite link copied!'))
      .catch(() => actions.toast('Code: ' + state.roomCode));
  };

  const pickGame = () => {
    if (!state.isHost) return;
    if (state.players.length < 3) { actions.toast('Need 3+ agents for Secret Agent!'); return; }
    roomRef.current?.send({ type: 'GOTO', screen: 'spy-role' });
    dispatch({ type: 'GO', screen: 'spy-role' });
  };

  return (
    <div className="screen">
      <nav className="nav-bar">
        <button className="nav-back" onClick={actions.leaveRoom}><Icon name="back" /> Leave</button>
        <div className="nav-title--center">Game Line</div>
      </nav>

      <div className="cork-strip cork-strip--lobby">
        <div className="room-code-sticky" onClick={copyCode}>
          <div className="tack tack-red tack--lobby-left" />
          <div className="tack tack-red tack--lobby-right" />
          <div className="room-code-value">{state.roomCode}</div>
          <div className="room-code-hint">Tap to copy room code</div>
        </div>
      </div>

      <div className="cream cream--top">
        <div className="panel">
          <div className="panel-header">
            <span className="section-label section-label--flat">Players ({state.players.length})</span>
            <span className="live-indicator"><span className="live-dot" /> Live</span>
          </div>
          <div className="player-list">
            {state.players.map(p => (
              <div key={p.id} className="player-row">
                <div className={`player-avatar ${avClass(p.name)}`}>{p.name.charAt(0).toUpperCase()}</div>
                <div className="player-name">{p.name}</div>
                {p.isHost && <span className="player-tag tag-host">Host</span>}
                {p.id === myId && !p.isHost && <span className="player-tag tag-you">You</span>}
              </div>
            ))}
          </div>
        </div>

        {state.isHost ? (
          <>
            <button className="btn btn-orange" onClick={pickGame} disabled={state.players.length < 2}>
              <Icon name="controller" /> Pick a Game
            </button>
            {state.players.length < 2 && <div className="hint-text">Need at least 2 players to start</div>}
          </>
        ) : (
          <div className="info-box info-navy">Waiting for the host to start the game...</div>
        )}

        <button className="btn btn-ghost" onClick={copyLink}>
          <Icon name="link" /> Copy Invite Link
        </button>
      </div>
    </div>
  );
}
