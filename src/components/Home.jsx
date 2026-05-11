import { useState } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { Icon } from '../lib/icons.jsx';

const VENMO_HANDLE = 'matthews-jordao';

const AV = ['av-0','av-1','av-2','av-3','av-4','av-5'];
function avClass(name) {
  const n = String(name || '').split('').reduce((a,c)=>a+c.charCodeAt(0),0);
  return AV[n % AV.length];
}

function GameCard({ game, bg, imgSrc, title, desc, players, time, soon, device, onLaunch }) {
  return (
    <div className="glcard" data-device={device || 'multi'} onClick={!soon ? () => onLaunch(game) : undefined}>
      <div className="glcard__img" style={{ background: bg }}>
        <img src={imgSrc} className="glcard-img-fill" alt={title} draggable="false" />
        {soon && <div className="glcard__soon">COMING SOON</div>}
      </div>
      <div className="glcard__body">
        <div className="glcard__title">{title}</div>
        <div className="glcard__desc">{desc}</div>
        <div className="glcard__footer">
          <div className="glcard__meta">
            <div className="glcard__meta-item"><Icon name="people" /> {players}</div>
            <div className="glcard__meta-item"><Icon name="clock" /> {time}</div>
          </div>
          {!soon && <button className="play-btn" onClick={() => onLaunch(game)}>Play</button>}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { state, dispatch, actions } = useGame();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const launch = (game) => {
    if (game === 'headsup') { dispatch({ type: 'GO', screen: 'hu-decks' }); return; }
    if (game === 'spy')     { dispatch({ type: 'SELECT_GAME', game: 'spy' }); dispatch({ type: 'GO', screen: 'setup' }); return; }
    actions.toast('Coming soon!');
  };

  const games = [
    { game:'spy',     bg:'#F0E8D8', imgSrc:'/img/card-secret-agent.png', title:'Secret Agent',    desc:'Find the spy before time runs out.',             players:'3-12 players', time:'15-30 min', soon:false, device:'multi'  },
    { game:'gaslight',bg:'#2a3a2a', imgSrc:'/img/gaslight-or-burn.png',  title:'Gaslight or Burn',desc:'Lie through your teeth or get called out.',       players:'3+ players',  time:'15-30 min', soon:false, device:'single' },
    { game:'headsup', bg:'#1A6BE8', imgSrc:'/img/card-flipup.png',       title:'Flip Up',          desc:'Hold your phone to your forehead and guess!',   players:'2+ players',  time:'15 min',    soon:false, device:'single' },
    { game:'tod',     bg:'#D4B8F0', imgSrc:'/img/truth or dare.png',     title:'Truth or Dare',    desc:'Take turns choosing truth or dare. Dare to play?', players:'3+ players', time:'15-30 min', soon:true,  device:'single' },
  ];

  const filtered = games.filter(g => {
    if (filter !== 'all' && g.device !== filter) return false;
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="screen">
      <header className="logo-header">
        <img src="/img/gameline.png" className="logo-img" alt="Game Line" draggable="false" />
        <button className="donate-btn" aria-label="Support GameLine" onClick={() => dispatch({ type: 'SHOW_DONATE', show: true })}>
          <Icon name="dollar" />
        </button>
      </header>

      {state.showDonate && (
        <>
          <div className="donate-backdrop" onClick={() => dispatch({ type: 'SHOW_DONATE', show: false })} />
          <div className="donate-sheet">
            <div className="donate-pill" />
            <div className="donate-header">
              <div className="donate-header-label">SUPPORT THE DEV</div>
              <div className="donate-header-title">Buy Me a Coffee</div>
              <div className="donate-header-sub">Free app. No ads. No logins. Just games.</div>
            </div>
            <div className="donate-tips">
              {[['$1','Quick tip','1.00'],['$5','Buy a coffee','5.00',true],['$20','You rock','20.00']].map(([amt, lbl, val, pop]) => (
                <a key={val} className={`donate-tip${pop ? ' donate-tip--featured' : ''}`}
                  href={`https://venmo.com/u/${VENMO_HANDLE}?txn=pay&amount=${val}&note=GameLine%20tip`}
                  target="_blank" rel="noopener noreferrer">
                  {pop && <span className="donate-tip-badge">POPULAR</span>}
                  <span className="donate-tip-amount">{amt}</span>
                  <span className="donate-tip-label">{lbl}</span>
                </a>
              ))}
            </div>
            <div className="donate-footer">
              <span className="donate-footer-icon"><Icon name="link" /></span>
              Opens Venmo &nbsp;·&nbsp; @{VENMO_HANDLE}
            </div>
            <button className="donate-dismiss" onClick={() => dispatch({ type: 'SHOW_DONATE', show: false })}>Maybe later</button>
          </div>
        </>
      )}

      <div className="cork-board cork-board--hero">
        <img src="/img/cork-hero.png" className="cork-hero-bg" alt="" draggable="false" />
        <div className="hero-grid">
          {[
            { game:'spy',     tack:'red',    img:'/img/card-secret-agent.png', alt:'Secret Agent',    side:'left'  },
            { game:'headsup', tack:'blue',   img:'/img/card-flipup.png',       alt:'Flip Up',         side:'right' },
            { game:'gaslight',tack:'green',  img:'/img/gaslight-or-burn.png',  alt:'Gaslight or Burn',side:'left'  },
            { game:'tod',     tack:'purple', img:'/img/truth or dare.png',     alt:'Truth or Dare',   side:'left'  },
          ].map(({ game, tack, img, alt, side }) => (
            <div key={game} className={`hero-pin hero-pin--${side}`} onClick={() => launch(game)}>
              <div className={`tack tack-${tack} tack--top-center`} />
              <img src={img} className="hero-pin-img" alt={alt} draggable="false" />
            </div>
          ))}
        </div>
      </div>

      <div className="section-heading">
        <div className="section-icon"><Icon name="controller" /></div>
        <div>
          <div className="section-title">Pick Your Game</div>
          <div className="section-sub">Something for every group, every mood, every night.</div>
        </div>
      </div>
      <div style={{ height: 16 }} />

      <div className="search-wrap">
        <div className="search-icon"><Icon name="spy" /></div>
        <input className="search-input" placeholder="Search games..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={{ height: 12 }} />

      <div className="filter-chips">
        {[['all','controller','All'],['multi','people','Multi Device'],['single','person','Single Device']].map(([val, icon, lbl]) => (
          <button key={val} className={`chip${filter === val ? ' chip--active' : ''}`} onClick={() => setFilter(val)}>
            <Icon name={icon} /> {lbl}
          </button>
        ))}
      </div>
      <div style={{ height: 16 }} />

      <div className="game-list">
        {filtered.map(g => <GameCard key={g.game} {...g} onLaunch={launch} />)}
      </div>

      <div className="footer-banner">
        <div className="footer-top">
          <div className="footer-avatar"><Icon name="people" /></div>
          <div className="footer-copy">
            <div className="footer-title">New games coming soon!</div>
            <div className="footer-sub">Follow us for updates and game night inspiration.</div>
          </div>
        </div>
        <div className="footer-actions">
          <button className="footer-follow">Follow Us</button>
          <div className="social-row">
            <div className="social-icon">IG</div>
            <div className="social-icon">TK</div>
            <div className="social-icon">FB</div>
          </div>
        </div>
      </div>
    </div>
  );
}
