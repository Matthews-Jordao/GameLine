import { useGame } from '../context/GameContext.jsx';
import { Icon } from '../lib/icons.jsx';

function GameCard({ game, name, accent, icon, label, tack, soon, desc, players, side, onClick }) {
  return (
    <div className={`game-card game-card--${side}${soon ? ' game-card--soon' : ''}`} onClick={!soon ? onClick : undefined}>
      <div className={`tack tack-${tack} tack--top-center`} />
      <div className="game-card-strip" style={{ background: accent }} />
      {soon && <div className="game-card-ribbon">COMING SOON</div>}
      <div className="game-card-name">{name}</div>
      <div className="game-card-icon" style={{ color: accent }}><Icon name={icon} /></div>
      <div className="game-card-desc">{desc}</div>
      <div className="game-card-players">{players}</div>
      <div className="game-card-mode" style={{ color: accent }}>{label}</div>
    </div>
  );
}

export default function GameSelect() {
  const { state, dispatch, actions } = useGame();
  const n = state.players.length;

  const launch = (game) => {
    if (game === 'spy') {
      dispatch({ type: 'SELECT_GAME', game: 'spy' });
      dispatch({ type: 'GO', screen: 'spy-role' });
    } else if (game === 'headsup') {
      dispatch({ type: 'GO', screen: 'hu-decks' });
    } else {
      actions.toast('Coming soon!');
    }
  };

  return (
    <div className="screen screen--cork">
      <nav className="nav-bar">
        <button className="nav-back" onClick={() => dispatch({ type: 'GO', screen: 'lobby' })}>
          <Icon name="back" /> Back
        </button>
        <div className="nav-title--center">Pick a Game</div>
      </nav>

      {n < 3 && (
        <div className="info-box info-alert">Secret Agent needs 3+ players (you have {n})</div>
      )}

      <div className="game-grid">
        {[
          { game:'spy',     name:'Secret Agent',      accent:'#E8481A', icon:'spy',        label:'MULTI-DEVICE', tack:'red',    soon:false, desc:'Find the spy before time runs out.',          players:'3+ players', side:'left'  },
          { game:'headsup', name:'Heads Up!',         accent:'#1A6BE8', icon:'headphones', label:'PASS AROUND',  tack:'blue',   soon:false, desc:'Hold your phone to your forehead and guess!', players:'2+ players', side:'right' },
          { game:'trivia',  name:'Trivia Blitz',      accent:'#1DAA5C', icon:'star',       label:'MULTI-DEVICE', tack:'green',  soon:true,  desc:'Race to answer before everyone else.',        players:'2+ players', side:'left'  },
          { game:'dare',    name:'Truth or Dare',     accent:'#E8481A', icon:'flame',      label:'PASS AROUND',  tack:'red',    soon:true,  desc:'How honest are you really?',                  players:'3+ players', side:'right' },
          { game:'wyr',     name:'Would You Rather',  accent:'#8B3FCF', icon:'question',   label:'PASS AROUND',  tack:'purple', soon:true,  desc:'Pick a side, start a conversation.',           players:'2+ players', side:'left'  },
          { game:'doodle',  name:'Doodle & Guess',    accent:'#F5A623', icon:'pencil',     label:'MULTI-DEVICE', tack:'yellow', soon:true,  desc:'Draw it, guess it, laugh at it.',             players:'3+ players', side:'right' },
          { game:'nhie',    name:'Never Have I Ever', accent:'#1DAA5C', icon:'hand',       label:'PASS AROUND',  tack:'green',  soon:true,  desc:"See who has (and hasn't) done what!",         players:'3+ players', side:'left'  },
          { game:'hottake', name:'Hot Take',          accent:'#E8481A', icon:'chat',       label:'PASS AROUND',  tack:'red',    soon:true,  desc:'Share your most controversial opinions.',      players:'2+ players', side:'right' },
        ].map(c => <GameCard key={c.game} {...c} onClick={() => launch(c.game)} />)}
      </div>
    </div>
  );
}
