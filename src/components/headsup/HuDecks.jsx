import { useGame } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';
import { DECKS } from '../../lib/games/headsup.js';

export default function HuDecks() {
  const { state, dispatch, actions, roomRef } = useGame();

  const filtered = DECKS.filter(d => {
    if (state.huAgeFilter  !== 'all' && d.age       !== state.huAgeFilter)  return false;
    if (state.huDiffFilter !== 'all' && d.difficulty !== state.huDiffFilter) return false;
    return true;
  });
  const featured = filtered[0] || null;
  const others   = filtered.slice(1);
  const sel = state.huSelectedDeck ? DECKS.find(d => d.id === state.huSelectedDeck) : null;

  const ageLbl  = state.huAgeFilter  === 'all' ? 'ALL AGES'         : '18+';
  const diffLbl = state.huDiffFilter === 'all' ? 'ALL DIFFICULTIES' : state.huDiffFilter.toUpperCase();

  const playDeck = () => {
    if (!state.huSelectedDeck) return;
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    actions.startHeadsUp(state.huSelectedDeck);
    dispatch({ type: 'HU_CLOSE_DECK' });
  };

  const back = () => dispatch({ type: 'GO', screen: roomRef.current ? 'game-select' : 'home' });

  return (
    <div className="fu-screen">
      <div className="fu-header">
        <img src="/img/Flip Up Header.png" className="fu-header-bg" alt="" draggable="false" />
        <div className="fu-header-content">
          <button className="fu-back-btn" onClick={back}><Icon name="back" /></button>
        </div>
      </div>

      {state.huOpenFilter && <div className="fu-filter-bg" onClick={() => dispatch({ type: 'HU_CLOSE_FILTER' })} />}

      <div className="fu-filters-wrap">
        <div className="fu-filters">
          <div className="fu-pill fu-pill--static"><Icon name="people" /> 3+ PLAYERS</div>
          <div className={`fu-pill ${state.huAgeFilter !== 'all' ? 'fu-pill--on' : ''}`}
            onClick={() => dispatch({ type: 'HU_OPEN_FILTER', filter: state.huOpenFilter === 'age' ? null : 'age' })}>
            {ageLbl} ▾
          </div>
          <div className={`fu-pill ${state.huDiffFilter !== 'all' ? 'fu-pill--on' : ''}`}
            onClick={() => dispatch({ type: 'HU_OPEN_FILTER', filter: state.huOpenFilter === 'diff' ? null : 'diff' })}>
            {diffLbl} ▾
          </div>
        </div>

        {state.huOpenFilter === 'age' && (
          <div className="fu-dropdown">
            {[['all','ALL AGES'],['18+','18+']].map(([val, lbl]) => (
              <div key={val} className={`fu-drop-opt ${state.huAgeFilter === val ? 'fu-drop-opt--sel' : ''}`}
                onClick={() => dispatch({ type: 'HU_SET_FILTER', key: 'huAgeFilter', value: val })}>
                {lbl}
              </div>
            ))}
          </div>
        )}

        {state.huOpenFilter === 'diff' && (
          <div className="fu-dropdown">
            {[['all','ALL DIFFICULTIES'],['easy','EASY'],['medium','MEDIUM'],['hard','HARD']].map(([val, lbl]) => (
              <div key={val} className={`fu-drop-opt ${state.huDiffFilter === val ? 'fu-drop-opt--sel' : ''}`}
                onClick={() => dispatch({ type: 'HU_SET_FILTER', key: 'huDiffFilter', value: val })}>
                {lbl}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fu-body">
        {!featured ? (
          <div className="fu-empty">
            <div className="fu-empty-title">No decks match</div>
            <div className="fu-empty-sub">Try a different filter</div>
          </div>
        ) : (
          <>
            <div className="fu-label">FEATURED</div>
            <div className="fu-featured" onClick={() => dispatch({ type: 'HU_SELECT_DECK', deckId: featured.id })}
              style={{ background: featured.bg, borderColor: featured.border }}>
              <div className="fu-featured-art">{featured.emoji}</div>
              <div className="fu-featured-badge">FEATURED</div>
              <div className="fu-featured-text">
                <div className="fu-featured-name">{featured.name.toUpperCase()}</div>
                <div className="fu-featured-sub">{featured.subtitle}</div>
              </div>
              <div className="fu-count-pill">{featured.cards.length} CARDS</div>
            </div>

            {others.length > 0 && (
              <>
                <div className="fu-label">ALL DECKS</div>
                <div className="fu-grid">
                  {others.map(d => (
                    <div key={d.id} className="fu-card" onClick={() => dispatch({ type: 'HU_SELECT_DECK', deckId: d.id })}
                      style={{ background: d.bg, borderColor: d.border }}>
                      <div className="fu-card-art">{d.emoji}</div>
                      <div className="fu-card-name">{d.name.toUpperCase()}</div>
                      <div className="fu-card-sub">{d.subtitle}</div>
                      <div className="fu-card-count">{d.cards.length} CARDS</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {sel && (
        <>
          <div className="fu-overlay" onClick={() => dispatch({ type: 'HU_CLOSE_DECK' })} />
          <div className="fu-modal" style={{ '--deck-accent': sel.accent }}>
            <div className="fu-modal-header" style={{ background: sel.bg }}>
              <div className="fu-modal-art">{sel.emoji}</div>
              <div className="fu-modal-name">{sel.name.toUpperCase()}</div>
              <div className="fu-modal-sub">{sel.subtitle}</div>
              <div className="fu-modal-count">{sel.cards.length} CARDS</div>
            </div>
            <div className="fu-modal-body">
              <div className="fu-modal-how">
                <div className="fu-modal-how-title">HOW TO PLAY</div>
                <div className="fu-modal-how-row"><Icon name="person" /><span>Hold phone up to your forehead</span></div>
                <div className="fu-modal-how-row"><Icon name="people" /><span>Friends describe the word — don't say it!</span></div>
                <div className="fu-modal-how-row"><Icon name="check" /><span>Tilt down = Got It</span></div>
                <div className="fu-modal-how-row"><Icon name="close" /><span>Tilt up = Skip</span></div>
              </div>
              <button className="fu-play-btn" onClick={playDeck}><Icon name="arrow" /> PLAY DECK</button>
              <button className="fu-cancel-btn" onClick={() => dispatch({ type: 'HU_CLOSE_DECK' })}>Choose a different deck</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
