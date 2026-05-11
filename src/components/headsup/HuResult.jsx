import { useGame } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';

export default function HuResult() {
  const { state, dispatch } = useGame();
  const g = state.huSession;
  if (!g) return null;

  return (
    <div className="screen">
      <nav className="nav-bar">
        <div className="nav-title">Game Line</div>
        <span className="nav-label">RESULTS</span>
      </nav>

      <div className="cream cream--top">
        <div className="panel">
          <div className="hu-result-score">{g.got}</div>
          <div className="hu-result-label">GOT IT</div>
          <div className="hu-result-sub">{g.skipped} skipped · {g.deck.name}</div>
        </div>

        <div className="panel panel--scroll">
          <span className="section-label">Card history</span>
          {g.history.map((h, i) => (
            <div key={i} className="history-row">
              <span className={h.result === 'got' ? 'history-got' : 'history-skip'}>
                <Icon name={h.result === 'got' ? 'check' : 'close'} />
              </span>
              <span className={h.result === 'got' ? 'history-word--got' : 'history-word--skip'}>{h.word}</span>
            </div>
          ))}
        </div>

        <div className="btn-row">
          <button className="btn btn-ghost" onClick={() => dispatch({ type: 'GO', screen: 'hu-decks' })}>
            <Icon name="back" /> Decks
          </button>
          <button className="btn btn-green btn--wide" onClick={() => dispatch({ type: 'GO', screen: 'hu-decks' })}>
            <Icon name="arrow" /> Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
