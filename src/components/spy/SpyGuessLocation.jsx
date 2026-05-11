import { useGame } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';
import { LOCATIONS } from '../../lib/games/spy.js';

export default function SpyGuessLocation() {
  const { state, actions } = useGame();
  const isSpy = state.spyMyAssignment?.isSpy;

  if (!isSpy) {
    return (
      <div className="sa-screen">
        <div className="sa-topbar">
          <button className="sa-back-btn" onClick={actions.leaveRoom}><Icon name="back" /> LEAVE</button>
          <div className="sa-topbar-brand">SECRET AGENT</div>
          <div className="sa-topbar-phase">SPY'S MOVE</div>
        </div>
        <div className="sa-guess-hero">
          <div className="sa-guess-emblem"><Icon name="spy" /></div>
          <div className="sa-guess-title">SPY IDENTIFIED</div>
          <div className="sa-guess-sub">The spy has one chance to name the location and escape...</div>
        </div>
        <div className="sa-standby-msg" style={{ padding: '0 20px 40px' }}>Awaiting the spy's final guess</div>
      </div>
    );
  }

  return (
    <div className="sa-screen">
      <div className="sa-topbar">
        <button className="sa-back-btn" onClick={actions.leaveRoom}><Icon name="back" /> LEAVE</button>
        <div className="sa-topbar-brand">SECRET AGENT</div>
        <div className="sa-topbar-phase">FINAL MOVE</div>
      </div>
      <div className="sa-guess-hero">
        <div className="sa-guess-emblem"><Icon name="spy" /></div>
        <div className="sa-guess-title">YOU'VE BEEN IDENTIFIED</div>
        <div className="sa-guess-sub">Name the location to escape — one chance only</div>
      </div>
      <div className="sa-loc-grid sa-loc-grid--guess">
        {LOCATIONS.map(l => (
          <button key={l.name} className="sa-loc-btn" onClick={() => actions.spyGuessLocation(l.name)}
            style={{ borderColor: l.accent + '44' }}>
            <span className="sa-loc-btn-dot" style={{ background: l.accent }} />
            <span className="sa-loc-btn-name">{l.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
