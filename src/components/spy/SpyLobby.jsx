import { useGame, avClass } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';

export default function SpyLobby() {
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

  const initiateMission = () => {
    if (!state.isHost) return;
    if (state.players.length < 3) { actions.toast('Minimum 3 agents required'); return; }
    roomRef.current?.send({ type: 'GOTO', screen: 'spy-role' });
    dispatch({ type: 'GO', screen: 'spy-role' });
  };

  return (
    <div className="sa-screen">
      <div className="sa-topbar">
        <button className="sa-back-btn" onClick={actions.leaveRoom}><Icon name="back" /> ABORT</button>
        <div className="sa-topbar-brand">SECRET AGENT</div>
        <div className="sa-topbar-spacer" />
      </div>

      <div className="sa-lobby-hero">
        <div className="sa-agency-label">GAMELINE INTELLIGENCE DIVISION</div>
        <button className="sa-casefile-card" onClick={copyCode}>
          <div className="sa-casefile-tab">CASE FILE</div>
          <div className="sa-casefile-body">
            <div className="sa-casefile-code">{state.roomCode}</div>
            <div className="sa-casefile-hint">Tap to copy access code</div>
          </div>
        </button>
      </div>

      <div className="sa-panel">
        <div className="sa-panel-header">
          <span className="sa-panel-label">AGENT ROSTER &nbsp;<span className="sa-count">{state.players.length}</span></span>
          <span className="sa-live"><span className="sa-live-dot" /> LIVE</span>
        </div>
        <div className="sa-agent-list">
          {state.players.map((p, i) => (
            <div key={p.id} className="sa-agent-row">
              <div className={`sa-agent-av av-${i % 6}`}>{p.name.charAt(0).toUpperCase()}</div>
              <div className="sa-agent-name">{p.name}</div>
              {p.isHost && <span className="sa-agent-tag">HANDLER</span>}
              {p.id === myId && !p.isHost && <span className="sa-agent-tag sa-agent-tag--you">YOU</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="sa-lobby-actions">
        {state.isHost ? (
          <>
            <button className="sa-btn-mission btn" onClick={initiateMission} disabled={state.players.length < 3}>
              <Icon name="arrow" /> INITIATE MISSION
            </button>
            {state.players.length < 3 && <div className="sa-hint-text">Minimum 3 agents required</div>}
          </>
        ) : (
          <div className="sa-standby-msg">Standby — awaiting handler command</div>
        )}
        <button className="sa-btn-ghost btn" onClick={copyLink}>
          <Icon name="link" /> Send Invite Signal
        </button>
      </div>
    </div>
  );
}
