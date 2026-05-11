import { useGame } from './context/GameContext.jsx';
import { Icon } from './lib/icons.jsx';
import Home       from './components/Home.jsx';
import Setup      from './components/Setup.jsx';
import Lobby      from './components/Lobby.jsx';
import GameSelect from './components/GameSelect.jsx';
import SpyLobby        from './components/spy/SpyLobby.jsx';
import SpyStandby      from './components/spy/SpyStandby.jsx';
import SpyDiscuss      from './components/spy/SpyDiscuss.jsx';
import SpyGuessLocation from './components/spy/SpyGuessLocation.jsx';
import SpyVote         from './components/spy/SpyVote.jsx';
import SpyResult       from './components/spy/SpyResult.jsx';
import HuDecks  from './components/headsup/HuDecks.jsx';
import HuPlay   from './components/headsup/HuPlay.jsx';
import HuResult from './components/headsup/HuResult.jsx';

const SCREENS = {
  'home':         Home,
  'setup':        Setup,
  'lobby':        Lobby,
  'spy-lobby':    SpyLobby,
  'game-select':  GameSelect,
  'spy-role':     SpyStandby,
  'spy-discuss':  SpyDiscuss,
  'spy-guess-loc': SpyGuessLocation,
  'spy-vote':     SpyVote,
  'spy-result':   SpyResult,
  'hu-decks':     HuDecks,
  'hu-play':      HuPlay,
  'hu-result':    HuResult,
};

export default function App() {
  const { state } = useGame();
  // Route the generic 'lobby' screen to SpyLobby when playing Secret Agent
  const effectiveScreen = (state.screen === 'lobby' && state.selectedGame === 'spy') ? 'spy-lobby' : state.screen;
  const Screen = SCREENS[effectiveScreen] || Home;

  return (
    <>
      {state.screen !== 'hu-play' && (
        <div className="rotate-hint">
          <div><Icon name="person" /></div>
          <div className="rotate-hint-title">Rotate your phone</div>
          <div className="rotate-hint-sub">Game Line works best in portrait mode</div>
        </div>
      )}

      {state.reconnecting && (
        <div className="reconnect-banner">
          <span>Reconnecting...</span>
        </div>
      )}

      <Screen />

      {state.toast && (
        <div className="toasts">
          <div className="toast">{state.toast}</div>
        </div>
      )}
    </>
  );
}
