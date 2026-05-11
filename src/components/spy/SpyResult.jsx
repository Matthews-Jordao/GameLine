import { useGame, avClass } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';

export default function SpyResult() {
  const { state, dispatch, actions, roomRef } = useGame();
  const r = state.spyResult;
  if (!r) return null;

  const spy   = state.players.find(p => p.id === r.spyId);
  const voted = state.players.find(p => p.id === r.topId);
  const spyGuessedRight = r.spyGuessedLocation;
  const civilianWins = r.caughtSpy && !spyGuessedRight;

  const title  = civilianWins ? 'SPY CAUGHT' : spyGuessedRight ? 'SPY WINS' : 'SPY ESCAPES';
  const heroMod = civilianWins ? 'sa-result-hero--win' : 'sa-result-hero--lose';

  let desc;
  if (civilianWins) {
    desc = <span>The agents voted out <strong>{voted?.name || '?'}</strong> — who really was the spy!</span>;
  } else if (spyGuessedRight) {
    desc = <span><strong>{spy?.name || '?'}</strong> identified the location and wins the round!</span>;
  } else {
    desc = <span>You burned <strong>{voted?.name || '?'}</strong>, but the real spy was <strong>{spy?.name || '?'}</strong>!</span>;
  }

  const playAgain = () => {
    roomRef.current?.send({ type: 'GOTO', screen: 'lobby' });
    dispatch({ type: 'GOTO', screen: 'lobby' });
  };

  return (
    <div className="sa-screen">
      <div className="sa-topbar">
        <button className="sa-back-btn" onClick={actions.leaveRoom}><Icon name="back" /> LEAVE</button>
        <div className="sa-topbar-brand">SECRET AGENT</div>
        <div className="sa-topbar-phase">DEBRIEF</div>
      </div>

      <div className={`sa-result-hero ${heroMod}`}>
        <div className="sa-result-emblem">{civilianWins ? <Icon name="check" /> : <Icon name="spy" />}</div>
        <div className="sa-result-stamp">{title}</div>
        <div className="sa-result-desc">{desc}</div>
      </div>

      <div className="sa-dossier sa-dossier--debrief">
        <div className="sa-dossier-tab">MISSION DEBRIEF</div>
        <div className="sa-dossier-body">
          <div className="sa-dossier-field">
            <div className="sa-dossier-label">OPERATION LOCATION</div>
            <div className="sa-dossier-location">
              <div className="sa-dossier-loc-badge" style={{ background: state.spyLocation?.accent || '#cc2222' }}>
                <Icon name="pin" />
              </div>
              <span className="sa-dossier-loc-name">{state.spyLocation?.name}</span>
            </div>
          </div>
          <div className="sa-dossier-divider" />
          <div className="sa-dossier-field">
            <div className="sa-dossier-label">THE SPY WAS</div>
            <div className="sa-debrief-spy-row">
              <div className={`sa-agent-av ${avClass(spy?.name || '')}`}>{(spy?.name || '?').charAt(0).toUpperCase()}</div>
              <div className="sa-vote-name">{spy?.name || '?'}</div>
              <span className="sa-spy-tag">SPY</span>
            </div>
          </div>
          <div className="sa-dossier-divider" />
          <div className="sa-result-scores">
            {state.players.map(p => {
              const vc = Object.values(state.spyVotes).filter(v => v === p.id).length;
              return (
                <div key={p.id} className="sa-score-row">
                  <div className={`sa-agent-av sa-agent-av--sm ${avClass(p.name)}`}>{p.name.charAt(0).toUpperCase()}</div>
                  <div className="sa-vote-name">{p.name}</div>
                  <div className="sa-score-votes">{vc} vote{vc !== 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {state.isHost ? (
        <div className="sa-result-actions">
          <button className="sa-btn-mission btn" onClick={playAgain}><Icon name="arrow" /> PLAY AGAIN</button>
          <button className="sa-btn-ghost btn" onClick={playAgain}><Icon name="back" /> Mission Select</button>
        </div>
      ) : (
        <div className="sa-standby-msg" style={{ padding: '0 20px 36px' }}>Waiting for handler...</div>
      )}
    </div>
  );
}
