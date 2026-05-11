import { useGame, avClass, getRoleIcon } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';
import { LOCATIONS } from '../../lib/games/spy.js';

export default function SpyDiscuss() {
  const { state, dispatch, actions, roomRef } = useGame();
  const a = state.spyMyAssignment;
  const myId = roomRef.current?.myId;
  const locAccent = a?.location?.accent || '#1a6be8';
  const roleIconKey = getRoleIcon(a?.role);

  const totalPlayers = state.players.length;
  const commenceCount = state.spyCommenceVotes.length;
  const iHaveVotedToCommence = myId && state.spyCommenceVotes.includes(myId);

  // Timer display
  const mins = Math.floor(state.spyTimer / 60);
  const secs = String(state.spyTimer % 60).padStart(2, '0');
  const pct  = state.spyTimer / 480;
  const R = 52, C = 2 * Math.PI * R;
  const strokeColor = state.spyTimer > 120 ? '#cc2222' : state.spyTimer > 30 ? 'var(--accent-yellow)' : '#ff4444';

  const firstPlayer = state.spyFirstPlayer;

  return (
    <div className="sa-screen">
      <div className="sa-topbar">
        <button className="sa-back-btn" onClick={actions.leaveRoom}><Icon name="back" /> LEAVE</button>
        <div className="sa-topbar-brand">SECRET AGENT</div>
        <div className="sa-topbar-phase">OPERATION ACTIVE</div>
      </div>

      {/* Timer */}
      <div className="sa-timer-section">
        <div className="sa-timer-label">TIME REMAINING</div>
        <div className="sa-timer-ring-wrap">
          <svg width="124" height="124" viewBox="0 0 124 124">
            <circle cx="62" cy="62" r={R} fill="none" stroke="rgba(200,20,20,0.15)" strokeWidth="8"/>
            <circle cx="62" cy="62" r={R} fill="none" stroke={strokeColor} strokeWidth="8"
              strokeDasharray={`${C * pct} ${C}`} strokeDashoffset={C / 4} strokeLinecap="round"/>
          </svg>
          <div className="sa-timer-num">{mins}:{secs}</div>
        </div>
      </div>

      {/* First player banner */}
      {firstPlayer && (
        <div className="sa-first-player-banner">
          <Icon name="arrow" />
          <span><strong>{firstPlayer.name}</strong> goes first!</span>
        </div>
      )}

      {/* Assignment card — location is the big headline */}
      <div className={`sa-mission-card ${a?.isSpy ? 'sa-mission-card--spy' : ''}`}
        style={a?.isSpy ? undefined : { '--loc-accent': locAccent }}>
        <div className="sa-mission-card-header">
          <span className="sa-mission-card-label">YOUR ASSIGNMENT</span>
          <span className="sa-mission-card-badge">{a?.isSpy ? 'TOP SECRET' : 'CLASSIFIED'}</span>
        </div>
        <div className="sa-mission-card-body">
          {/* Location — main large text */}
          <div className="sa-mission-location-name">
            {a?.isSpy ? 'UNKNOWN LOCATION' : a?.location?.name}
          </div>
          {/* Role icon + role below */}
          <div className="sa-mission-role-icon">
            {a?.isSpy ? <Icon name="spy" /> : <Icon name={roleIconKey} />}
          </div>
          <div className="sa-mission-role-name">
            {a?.isSpy ? 'THE SPY' : a?.role}
          </div>
        </div>
        <div className="sa-mission-card-footer">
          <span className="sa-mission-card-hint">
            {a?.isSpy ? 'Identify the location — blend in' : 'Keep your role secret from the spy'}
          </span>
        </div>
      </div>

      {/* Active agents */}
      <div className="sa-agents-section">
        <div className="sa-section-label">ACTIVE AGENTS</div>
        <div className="sa-agents-grid">
          {state.players.map((p, i) => (
            <div key={p.id} className="sa-agent-chip">
              <div className={`sa-agent-av av-${i % 6}`}>{p.name.charAt(0).toUpperCase()}</div>
              <div className="sa-agent-name">{p.name}</div>
              {p.isHost && <div className="sa-agent-tag">HANDLER</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Spy: location elimination tool */}
      {a?.isSpy && (
        <div className="sa-loc-section">
          <div className="sa-loc-section-label">LOCATIONS — TAP TO ELIMINATE</div>
          <div className="sa-loc-grid">
            {LOCATIONS.map(l => (
              <div key={l.name}
                className={`sa-loc-pill sa-loc-crossable ${state.spyCrossed.includes(l.name) ? 'sa-loc-crossed' : ''}`}
                onClick={() => dispatch({ type: 'SPY_TOGGLE_CROSS', name: l.name })}>
                {l.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Non-spy: reminder rules */}
      {!a?.isSpy && (
        <div className="sa-rules-box">
          <div className="sa-rules-row"><span className="sa-rules-icon"><Icon name="chat" /></span><span>Take turns — one question each</span></div>
          <div className="sa-rules-row"><span className="sa-rules-icon"><Icon name="spy" /></span><span>Don't reveal the location — expose the spy</span></div>
          <div className="sa-rules-row"><span className="sa-rules-icon"><Icon name="vote" /></span><span>All players click Commence Voting to start the vote early</span></div>
        </div>
      )}

      {/* Commence Voting — visible to ALL players */}
      <div className="sa-discuss-actions">
        <div className="sa-commence-wrap">
          <button
            className={`sa-btn-mission btn${iHaveVotedToCommence ? ' sa-btn-mission--dim' : ''}`}
            onClick={iHaveVotedToCommence ? undefined : actions.commenceVote}
            disabled={iHaveVotedToCommence}>
            <Icon name="vote" />
            {iHaveVotedToCommence ? 'VOTE REQUESTED' : 'COMMENCE VOTING'}
          </button>
          <div className="sa-commence-progress">
            {commenceCount}/{totalPlayers} ready to vote
          </div>
        </div>

        {state.isHost && (
          <button className="sa-btn-ghost btn sa-btn-end" onClick={() => {
            roomRef.current?.send({ type: 'GOTO', screen: 'lobby' });
            dispatch({ type: 'GOTO', screen: 'lobby' });
          }}>
            <Icon name="close" /> END MISSION
          </button>
        )}
      </div>
    </div>
  );
}
