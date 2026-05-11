import { useEffect, useRef } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';

export default function HuPlay() {
  const { state, dispatch, actions } = useGame();
  const g = state.huSession;
  const cardRef = useRef(null);

  // Landscape detection for wait → countdown transition
  useEffect(() => {
    if (state.huPhase !== 'wait') return;
    const check = () => {
      const isLandscape = screen.orientation
        ? screen.orientation.type.startsWith('landscape')
        : window.innerWidth > window.innerHeight;
      if (isLandscape) actions.huStartCountdown();
    };
    window.addEventListener('orientationchange', check);
    window.addEventListener('resize', check);
    setTimeout(check, 150);
    return () => {
      window.removeEventListener('orientationchange', check);
      window.removeEventListener('resize', check);
    };
  }, [state.huPhase, actions.huStartCountdown]);

  // Flash helper
  const flash = (cls) => {
    if (!cardRef.current) return;
    cardRef.current.classList.add(cls);
    setTimeout(() => cardRef.current?.classList.remove(cls), 280);
  };

  const handleGot = () => { flash('hu-flash-got'); actions.huGot(); };
  const handleSkip = () => { flash('hu-flash-skip'); actions.huSkip(); };

  // Wait screen
  if (!g || state.huPhase === 'wait') {
    return (
      <div className="hu-orient-screen">
        <button className="hu-orient-back" onClick={() => { actions.huEnd(); dispatch({ type: 'GO', screen: 'hu-decks' }); }}>
          <Icon name="back" />
        </button>
        <div className="hu-orient-visual">
          <svg viewBox="0 0 110 80" fill="none" className="hu-orient-svg">
            <rect x="36" y="8" width="38" height="64" rx="7" stroke="rgba(255,255,255,0.75)" strokeWidth="2.5" fill="rgba(255,255,255,0.06)"/>
            <circle cx="55" cy="64" r="3.5" fill="rgba(255,255,255,0.45)"/>
            <rect x="43" y="15" width="24" height="14" rx="2" fill="rgba(255,255,255,0.1)"/>
            <path d="M 8 52 A 38 38 0 0 1 102 52" stroke="rgba(255,255,255,0.55)" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="6 5"/>
            <polygon points="96,43 103,52 94,56" fill="rgba(255,255,255,0.6)"/>
          </svg>
        </div>
        <div className="hu-orient-title">Rotate Your Phone</div>
        <div className="hu-orient-sub">Turn sideways to start the countdown</div>
      </div>
    );
  }

  // Countdown screen
  if (state.huPhase === 'countdown') {
    return (
      <div className="hu-countdown-screen">
        <div className="hu-cd-label">GET READY</div>
        <div className="hu-cd-num">{state.huCountdown > 0 ? state.huCountdown : 'GO!'}</div>
      </div>
    );
  }

  // Time's up
  if (!g || g.isDone() || state.huTimer <= 0) {
    return (
      <div className="screen screen--centered">
        <div className="result-icon result-icon--win"><Icon name="star" /></div>
        <div className="timesup-title">Time's Up!</div>
        <button className="btn btn-green btn--narrow" onClick={() => dispatch({ type: 'GO', screen: 'hu-result' })}>
          <Icon name="arrow" /> See Results
        </button>
      </div>
    );
  }

  // Playing
  const word   = g.current();
  const accent = g.deck.accent;
  const pct    = state.huTimer / g.timeLimit;
  const R = 28, C = 2 * Math.PI * R;
  const col = state.huTimer > 20 ? 'var(--accent-green)' : state.huTimer > 10 ? 'var(--accent-yellow)' : 'var(--accent)';

  return (
    <div className="screen hu-play-screen">
      <div className="cream">
        <div className="play-header">
          <div className="score-row">
            <div className="score-box">
              <div className="score-num score-num--green">{g.got}</div>
              <div className="score-lbl">Got</div>
            </div>
            <div className="score-box">
              <div className="score-num score-num--muted">{g.skipped}</div>
              <div className="score-lbl">Skipped</div>
            </div>
            <div className="score-box">
              <div className="score-num score-num--dark">{g.cards.length - g.index}</div>
              <div className="score-lbl">Left</div>
            </div>
          </div>
          <div className="timer-ring">
            <svg width="68" height="68" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r={R} fill="none" stroke="var(--paper-dk)" strokeWidth="5"/>
              <circle cx="34" cy="34" r={R} fill="none" stroke={col} strokeWidth="5"
                strokeDasharray={`${C * pct} ${C}`} strokeDashoffset={C / 4} strokeLinecap="round"/>
            </svg>
            <div className="timer-num timer-num--sm">{state.huTimer}</div>
          </div>
        </div>

        <div className="hu-card" id="hu-card" ref={cardRef}>
          <div className="tack tack-red tack--lobby-left" />
          <div className="tack tack-blue tack--lobby-right" />
          <div className="tape tape-left" />
          <div className="tape tape-right" />
          <div className="hu-card-category" style={{ color: accent }}>{g.deck.name}</div>
          <div className="hu-card-word">{word}</div>
          <div className="hu-card-hint">Hold to forehead — friends describe!</div>
        </div>

        <div className="tilt-row">
          <div className="tilt-hint tilt-skip">↑ Tilt Up = Skip</div>
          <div className="tilt-hint tilt-got">↓ Tilt Down = Got It</div>
        </div>

        <button className="end-link" onClick={actions.huEnd}>End Round</button>
      </div>
    </div>
  );
}
