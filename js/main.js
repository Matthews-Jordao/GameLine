import { RoomManager } from './room.js';
import { LOCATIONS, generateAssignments, getVoteResult } from './games/spy.js';
import { DECKS, HeadsUpSession } from './games/headsup.js';
import { ICONS } from './icons.js';

const VENMO_HANDLE = 'matthews-jordao';

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const S = {
  screen: 'home',
  showDonate: false,
  room: null,
  players: [],
  myName: '',
  isHost: false,
  roomCode: '',
  selectedGame: null,
  spyAssignments: null,
  spyLocation: null,
  spyMyAssignment: null,
  spyVotes: {},
  spySelectedVote: null,
  spyResult: null,
  spyTimer: 480,
  spyTimerInt: null,
  spyCrossed: new Set(),
  huSession: null,
  huSelectedDeck: null,
  huOpenFilter: null,
  huAgeFilter: 'all',
  huDiffFilter: 'all',
  huPhase: 'wait',
  huCountdown: 3,
  huTimer: 60,
  huTimerInt: null,
};

const $app = document.getElementById('app');

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function render() {
  $app.innerHTML = `
    ${S.screen !== 'hu-play' ? `<div class="rotate-hint">
      <div>${ICONS.person}</div>
      <div class="rotate-hint-title">Rotate your phone</div>
      <div class="rotate-hint-sub">Game Line works best in portrait mode</div>
    </div>` : ''}
    ${view()}
    <div class="toasts" id="toasts"></div>
  `;
  bind();
}

function view() {
  switch (S.screen) {
    case 'home':        return vHome();
    case 'setup':       return vSetup();
    case 'lobby':       return vLobby();
    case 'game-select': return vGameSelect();
    case 'spy-role':         return vSpyRole();
    case 'spy-discuss':      return vSpyDiscuss();
    case 'spy-guess-loc':    return vSpyGuessLocation();
    case 'spy-vote':         return vSpyVote();
    case 'spy-result':       return vSpyResult();
    case 'hu-decks':    return vHuDecks();
    case 'hu-play':     return vHuPlay();
    case 'hu-result':   return vHuResult();
    default:            return vHome();
  }
}

// ─────────────────────────────────────────────
// SCREENS
// ─────────────────────────────────────────────

function vHome() {
  const glcard = ({ game, bg, imgContent, title, desc, players, time, soon, device }) => `
    <div class="glcard" data-device="${device || 'multi'}" ${!soon ? `data-launch="${game}"` : ''}>
      <div class="glcard__img" style="background:${bg};">
        ${imgContent}
        ${soon ? `<div class="glcard__soon">COMING SOON</div>` : ''}
      </div>
      <div class="glcard__body">
        <div class="glcard__title">${title}</div>
        <div class="glcard__desc">${desc}</div>
        <div class="glcard__footer">
          <div class="glcard__meta">
            <div class="glcard__meta-item">${ICONS.people} ${players}</div>
            <div class="glcard__meta-item">${ICONS.clock} ${time}</div>
          </div>
          ${!soon ? `<button class="play-btn" data-launch="${game}">Play</button>` : ''}
        </div>
      </div>
    </div>`;

  return `
  <div class="screen">

    <header class="logo-header">
      <img src="img/gameline.png" class="logo-img" alt="Game Line" draggable="false"/>
      <button class="donate-btn" id="btn-donate" aria-label="Support GameLine">
        ${ICONS.dollar}
      </button>
    </header>

    ${S.showDonate ? `
    <div class="donate-backdrop" id="btn-donate-close"></div>
    <div class="donate-sheet">
      <div class="donate-pill"></div>
      <div class="donate-header">
        <div class="donate-header-label">SUPPORT THE DEV</div>
        <div class="donate-header-title">Buy Me a Coffee</div>
        <div class="donate-header-sub">Free app. No ads. No logins. Just games.</div>
      </div>
      <div class="donate-tips">
        <a class="donate-tip" href="https://venmo.com/u/${VENMO_HANDLE}?txn=pay&amount=1.00&note=GameLine%20tip" target="_blank" rel="noopener">
          <span class="donate-tip-amount">$1</span>
          <span class="donate-tip-label">Quick tip</span>
        </a>
        <a class="donate-tip donate-tip--featured" href="https://venmo.com/u/${VENMO_HANDLE}?txn=pay&amount=5.00&note=GameLine%20tip" target="_blank" rel="noopener">
          <span class="donate-tip-badge">POPULAR</span>
          <span class="donate-tip-amount">$5</span>
          <span class="donate-tip-label">Buy a coffee</span>
        </a>
        <a class="donate-tip" href="https://venmo.com/u/${VENMO_HANDLE}?txn=pay&amount=20.00&note=GameLine%20tip" target="_blank" rel="noopener">
          <span class="donate-tip-amount">$20</span>
          <span class="donate-tip-label">You rock</span>
        </a>
      </div>
      <div class="donate-footer">
        <span class="donate-footer-icon">${ICONS.link}</span>
        Opens Venmo &nbsp;·&nbsp; @${VENMO_HANDLE}
      </div>
      <button class="donate-dismiss" id="btn-donate-close2">Maybe later</button>
    </div>
    ` : ''}

    <div class="cork-board cork-board--hero">
      <img src="img/cork-hero.png" class="cork-hero-bg" alt="" draggable="false"/>
      <div class="hero-grid">

        <div class="hero-pin hero-pin--left" data-launch="spy">
          <div class="tack tack-red tack--top-center"></div>
          <img src="img/card-secret-agent.png" class="hero-pin-img" alt="Secret Agent" draggable="false"/>
        </div>

        <div class="hero-pin hero-pin--right" data-launch="headsup">
          <div class="tack tack-blue tack--top-center"></div>
          <img src="img/card-flipup.png" class="hero-pin-img" alt="Flip Up" draggable="false"/>
        </div>

        <div class="hero-pin hero-pin--left" data-launch="gaslight">
          <div class="tack tack-green tack--top-center"></div>
          <img src="img/gaslight-or-burn.png" class="hero-pin-img" alt="Gaslight or Burn" draggable="false"/>
        </div>

        <div class="hero-pin hero-pin--left" data-launch="tod">
          <div class="tack tack-purple tack--top-center"></div>
          <img src="img/truth or dare.png" class="hero-pin-img" alt="Truth or Dare" draggable="false">
        </div>

      </div>
    </div>

    <div class="section-heading">
      <div class="section-icon">${ICONS.controller}</div>
      <div>
        <div class="section-title">Pick Your Game</div>
        <div class="section-sub">Something for every group, every mood, every night.</div>
      </div>
    </div>

    <div style="height:16px;"></div>

    <div class="search-wrap">
      <div class="search-icon">${ICONS.spy}</div>
      <input class="search-input" placeholder="Search games..." />
    </div>

    <div style="height:12px;"></div>

    <div class="filter-chips">
      <button class="chip chip--active" data-filter="all">${ICONS.controller} All</button>
      <button class="chip" data-filter="multi">${ICONS.people} Multi Device</button>
      <button class="chip" data-filter="single">${ICONS.person} Single Device</button>
    </div>

    <div style="height:16px;"></div>

    <div class="game-list">
      ${glcard({ game:'spy',     bg:'#F0E8D8', title:'Secret Agent',    desc:'Find the spy before time runs out.',              players:'3-12 players', time:'15-30 min', soon:false, device:'multi',
        imgContent:`<img src="img/card-secret-agent.png" class="glcard-img-fill" draggable="false"/>` })}
      ${glcard({ game:'gaslight', bg:'#2a3a2a', title:'Gaslight or Burn', desc:'Lie through your teeth or get called out.',         players:'3+ players',  time:'15-30 min', soon:false, device:'single',
        imgContent:`<img src="img/gaslight-or-burn.png" class="glcard-img-fill" draggable="false"/>` })}
      ${glcard({ game:'headsup', bg:'#1A6BE8', title:'Flip Up',           desc:'Hold your phone to your forehead and guess!',       players:'2+ players',  time:'15 min',    soon:false, device:'single',
        imgContent:`<img src="img/card-flipup.png" class="glcard-img-fill" draggable="false"/>` })}
      ${glcard({ game:'tod',     bg:'#D4B8F0', title:'Truth or Dare',     desc:'Take turns choosing truth or dare. Dare to play?',  players:'3+ players',  time:'15-30 min', soon:true,  device:'single',
        imgContent:`<div style="position:absolute;inset:0;width:100%;height:100%;"><img src="img/truth or dare.png" class="glcard-img-fill" alt="Truth or Dare" draggable="false" style="object-fit:cover;width:100%;height:100%;"/></div>` })}
    </div>

    <div class="footer-banner">
      <div class="footer-top">
        <div class="footer-avatar">${ICONS.people}</div>
        <div class="footer-copy">
          <div class="footer-title">New games coming soon!</div>
          <div class="footer-sub">Follow us for updates and game night inspiration.</div>
        </div>
      </div>
      <div class="footer-actions">
        <button class="footer-follow">Follow Us</button>
        <div class="social-row">
          <div class="social-icon">IG</div>
          <div class="social-icon">TK</div>
          <div class="social-icon">FB</div>
        </div>
      </div>
    </div>

  </div>`;
}

function vSetup() {
  if (S.selectedGame === 'spy') {
    return `
    <div class="ss-wrap">
      <button class="ss-back" id="btn-back-home">${ICONS.back} Back</button>

      <div class="ss-hero">
        <div class="ss-agency-label">GAMELINE INTELLIGENCE DIVISION</div>
        <div class="ss-emblem">
          <div class="ss-emblem-ring">${ICONS.spy}</div>
          <div class="ss-emblem-ping"></div>
        </div>
        <div class="ss-op-label">// OPERATION //</div>
        <div class="ss-title">Secret Agent</div>
        <div class="ss-classified-stamp">CLASSIFIED</div>
        <div class="ss-badge-row">
          <span class="ss-badge">👥 3–10 AGENTS</span>
          <span class="ss-badge">🌐 MULTI-DEVICE</span>
        </div>
      </div>

      <div class="ss-folder">
        <div class="ss-folder-tab">AGENT DOSSIER</div>
        <div class="ss-folder-body">
          <div class="ss-folder-stamp">TOP SECRET</div>
          <div class="ss-field-label">AGENT DESIGNATION</div>
          <div class="ss-input-wrap">
            <span class="ss-input-icon">${ICONS.person}</span>
            <input class="ss-input" id="inp-name" placeholder="Enter your name…" maxlength="16"
              value="${esc(S.myName)}" autocomplete="off" autocorrect="off" spellcheck="false"/>
          </div>

          <button class="ss-btn-create btn" id="btn-create">
            ${ICONS.home} INITIATE MISSION
          </button>

          <div class="ss-or"><span>or enter access code</span></div>

          <div class="ss-join-row">
            <input class="ss-code-input" id="inp-code" placeholder="ABCD" maxlength="4"
              autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"/>
            <button class="ss-join-btn btn" id="btn-join">${ICONS.arrow}</button>
          </div>
        </div>
      </div>

      <div class="ss-footer">${ICONS.lock} CLASSIFIED &middot; EYES ONLY &middot; DO NOT DISTRIBUTE</div>
    </div>`;
  }

  const cfg = {
    headsup: { name:'Heads Up!', color:'var(--accent-blue)', desc:'Pass-around party game' },
  }[S.selectedGame] || { name:'Game', color:'var(--navy)', desc:'' };

  return `
  <div class="screen">
    <nav class="nav-bar">
      <button class="nav-back" id="btn-back-home">${ICONS.back} Back</button>
      <div class="nav-title--center">Game Line</div>
    </nav>
    <div class="setup-form">
      <div class="setup-game-badge" style="background:${cfg.color};">
        <div>
          <div class="setup-game-name">${cfg.name}</div>
          <div class="setup-game-desc">${cfg.desc}</div>
        </div>
      </div>
      <div class="input-wrap">
        <span class="input-icon">${ICONS.person}</span>
        <input class="input" id="inp-name" placeholder="Your name..." maxlength="16"
          value="${esc(S.myName)}" autocomplete="off" autocorrect="off" spellcheck="false"/>
      </div>
      <button class="btn btn-primary" id="btn-create">${ICONS.home} Create a Room</button>
      <div class="divider">or join a room</div>
      <div class="join-row">
        <input class="input-code" id="inp-code" placeholder="ABCD" maxlength="4"
          autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"/>
        <button class="btn btn-green btn-join" id="btn-join">${ICONS.arrow}</button>
      </div>
      <div class="hint-text">${ICONS.lock} Free forever &middot; Works in any browser</div>
    </div>
  </div>`;
}

function vLobby() {
  if (S.selectedGame === 'spy') return vSpyLobby();
  const myId = S.room?.myId;
  return `
  <div class="screen">
    <nav class="nav-bar">
      <button class="nav-back" id="btn-back">${ICONS.back} Leave</button>
      <div class="nav-title--center">Game Line</div>
    </nav>

    <div class="cork-strip cork-strip--lobby">
      <div class="room-code-sticky" id="btn-copy-code">
        <div class="tack tack-red tack--lobby-left"></div>
        <div class="tack tack-red tack--lobby-right"></div>
        <div class="room-code-value">${S.roomCode}</div>
        <div class="room-code-hint">Tap to copy room code</div>
      </div>
    </div>

    <div class="cream cream--top">
      <div class="panel">
        <div class="panel-header">
          <span class="section-label section-label--flat">Players (${S.players.length})</span>
          <span class="live-indicator"><span class="live-dot"></span> Live</span>
        </div>
        <div class="player-list">
          ${S.players.map(p => `
            <div class="player-row">
              <div class="player-avatar ${avClass(p.name)}">${esc(p.name.charAt(0).toUpperCase())}</div>
              <div class="player-name">${esc(p.name)}</div>
              ${p.isHost ? '<span class="player-tag tag-host">Host</span>' : ''}
              ${p.id === myId && !p.isHost ? '<span class="player-tag tag-you">You</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>

      ${S.isHost ? `
        <button class="btn btn-orange" id="btn-pick-game" ${S.players.length < 2 ? 'disabled' : ''}>
          ${ICONS.controller} Pick a Game
        </button>
        ${S.players.length < 2 ? `<div class="hint-text">Need at least 2 players to start</div>` : ''}
      ` : `
        <div class="info-box info-navy">Waiting for the host to start the game...</div>
      `}

      <button class="btn btn-ghost" id="btn-copy-link">
        ${ICONS.link} Copy Invite Link
      </button>
    </div>
  </div>`;
}

function vSpyLobby() {
  const myId = S.room?.myId;
  return `
  <div class="sa-screen">
    <div class="sa-topbar">
      <button class="sa-back-btn" id="btn-back">${ICONS.back} ABORT</button>
      <div class="sa-topbar-brand">SECRET AGENT</div>
      <div class="sa-topbar-spacer"></div>
    </div>

    <div class="sa-lobby-hero">
      <div class="sa-agency-label">GAMELINE INTELLIGENCE DIVISION</div>
      <button class="sa-casefile-card" id="btn-copy-code">
        <div class="sa-casefile-tab">CASE FILE</div>
        <div class="sa-casefile-body">
          <div class="sa-casefile-code">${S.roomCode}</div>
          <div class="sa-casefile-hint">Tap to copy access code</div>
        </div>
      </button>
    </div>

    <div class="sa-panel">
      <div class="sa-panel-header">
        <span class="sa-panel-label">AGENT ROSTER &nbsp;<span class="sa-count">${S.players.length}</span></span>
        <span class="sa-live"><span class="sa-live-dot"></span> LIVE</span>
      </div>
      <div class="sa-agent-list">
        ${S.players.map((p, i) => `
          <div class="sa-agent-row">
            <div class="sa-agent-av av-${i % 6}">${esc(p.name.charAt(0).toUpperCase())}</div>
            <div class="sa-agent-name">${esc(p.name)}</div>
            ${p.isHost ? `<span class="sa-agent-tag">HANDLER</span>` : ''}
            ${p.id === myId && !p.isHost ? `<span class="sa-agent-tag sa-agent-tag--you">YOU</span>` : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="sa-lobby-actions">
      ${S.isHost ? `
        <button class="sa-btn-mission btn" id="btn-pick-game" ${S.players.length < 3 ? 'disabled' : ''}>
          ${ICONS.arrow} INITIATE MISSION
        </button>
        ${S.players.length < 3 ? `<div class="sa-hint-text">Minimum 3 agents required</div>` : ''}
      ` : `
        <div class="sa-standby-msg">Standby — awaiting handler command</div>
      `}
      <button class="sa-btn-ghost btn" id="btn-copy-link">
        ${ICONS.link} Send Invite Signal
      </button>
    </div>
  </div>`;
}

function vGameSelect() {
  const n = S.players.length;
  const card = ({ game, name, accent, icon, label, tack, soon, desc, players, side }) => `
    <div class="game-card game-card--${side}${soon ? ' game-card--soon' : ''}" ${!soon ? `data-game="${game}"` : ''}>
      <div class="tack tack-${tack} tack--top-center"></div>
      <div class="game-card-strip" style="background:${accent};"></div>
      ${soon ? '<div class="game-card-ribbon">COMING SOON</div>' : ''}
      <div class="game-card-name">${name}</div>
      <div class="game-card-icon" style="color:${accent};">${ICONS[icon]}</div>
      <div class="game-card-desc">${desc}</div>
      <div class="game-card-players">${players}</div>
      <div class="game-card-mode" style="color:${accent};">${label}</div>
    </div>`;

  return `
  <div class="screen screen--cork">
    <nav class="nav-bar">
      <button class="nav-back" id="btn-to-lobby">${ICONS.back} Back</button>
      <div class="nav-title--center">Pick a Game</div>
    </nav>

    ${n < 3 ? `<div class="info-box info-alert">Secret Agent needs 3+ players (you have ${n})</div>` : ''}

    <div class="game-grid">
      ${card({ game:'spy',     name:'Secret Agent',      accent:'#E8481A', icon:'spy',        label:'MULTI-DEVICE', tack:'red',    soon:false, desc:'Find the spy before time runs out.',          players:'3+ players', side:'left'  })}
      ${card({ game:'headsup', name:'Heads Up!',         accent:'#1A6BE8', icon:'headphones', label:'PASS AROUND',  tack:'blue',   soon:false, desc:'Hold your phone to your forehead and guess!', players:'2+ players', side:'right' })}
      ${card({ game:'trivia',  name:'Trivia Blitz',      accent:'#1DAA5C', icon:'star',       label:'MULTI-DEVICE', tack:'green',  soon:true,  desc:'Race to answer before everyone else.',        players:'2+ players', side:'left'  })}
      ${card({ game:'dare',    name:'Truth or Dare',     accent:'#E8481A', icon:'flame',      label:'PASS AROUND',  tack:'red',    soon:true,  desc:'How honest are you really?',                  players:'3+ players', side:'right' })}
      ${card({ game:'wyr',     name:'Would You Rather',  accent:'#8B3FCF', icon:'question',   label:'PASS AROUND',  tack:'purple', soon:true,  desc:'Pick a side, start a conversation.',           players:'2+ players', side:'left'  })}
      ${card({ game:'doodle',  name:'Doodle & Guess',    accent:'#F5A623', icon:'pencil',     label:'MULTI-DEVICE', tack:'yellow', soon:true,  desc:'Draw it, guess it, laugh at it.',             players:'3+ players', side:'right' })}
      ${card({ game:'nhie',    name:'Never Have I Ever', accent:'#1DAA5C', icon:'hand',       label:'PASS AROUND',  tack:'green',  soon:true,  desc:"See who has (and hasn't) done what!",         players:'3+ players', side:'left'  })}
      ${card({ game:'hottake', name:'Hot Take',          accent:'#E8481A', icon:'chat',       label:'PASS AROUND',  tack:'red',    soon:true,  desc:'Share your most controversial opinions.',      players:'2+ players', side:'right' })}
    </div>
  </div>`;
}

// ─── SPY ───

function vSpyRole() {
  return `
  <div class="sa-screen">
    <div class="sa-topbar">
      <button class="sa-back-btn" id="btn-sa-leave">${ICONS.back} LEAVE</button>
      <div class="sa-topbar-brand">SECRET AGENT</div>
      <div class="sa-topbar-phase">BRIEFING</div>
    </div>

    <div class="sa-role-hero">
      <div class="sa-role-emblem">
        <div class="sa-role-emblem-ring">${ICONS.spy}</div>
        <div class="sa-emblem-ping"></div>
        <div class="sa-emblem-ping sa-emblem-ping--delay"></div>
      </div>
      <div class="sa-role-you-are">OPERATION</div>
      <div class="sa-role-name">STANDING BY</div>
      <div class="sa-role-desc">All agents are in position.<br>Assignments will be distributed on launch.</div>
    </div>

    <div class="sa-role-footer">
      ${S.isHost
        ? `<button class="sa-btn-mission btn" id="btn-spy-start">${ICONS.arrow} START OPERATION</button>`
        : `<div class="sa-standby-msg">Awaiting handler command...</div>`
      }
    </div>
  </div>`;
}

function getRoleIcon(role) {
  if (!role) return 'spy';
  const r = role.toLowerCase();
  if (/guard|security|police|sniper|sergeant|drill|intel|soldier|general/.test(r)) return 'shield';
  if (/doctor|nurse|medic|surgeon|anest|radiolog|health inspector/.test(r)) return 'medical';
  if (/chef|cook|waiter|bartend|somm|dishwash|sous|hostess|deli|butcher|cashier/.test(r)) return 'chef';
  if (/pilot|air traffic|flight attend|gate agent|mechanic/.test(r)) return 'plane';
  if (/engineer|techni|life support|stock clerk|cart collect|janitor|cleaner/.test(r)) return 'wrench';
  if (/captain|sailor|deck|boatswain|mate|purser|lookout|sonar|torpedo|cannoneer/.test(r)) return 'anchor';
  if (/director|actor|producer|camera|screen|grip|stunt|makeup/.test(r)) return 'film';
  if (/librarian|professor|student|researcher|archivist|teacher|scholar|counselor/.test(r)) return 'book';
  if (/manager|principal|commander|ringmaster|curator|cruise director|pit boss|branch manager|station commander|announcer/.test(r)) return 'star';
  if (/ghost|psychic|exorcist|paranormal|caretaker/.test(r)) return 'ghost';
  if (/lifeguard|surfer|diver|fisherman|jet ski|expedition|sled|glaciolog|meteorolog/.test(r)) return 'waves';
  if (/entertain|clown|acrobat|trapeze|fire breath|tightrope|cheer|superfan|fan/.test(r)) return 'mic';
  if (/dealer|croupier|card counter|high roller|loan shark|bank robber|teller|loan officer|vault|auditor/.test(r)) return 'cards';
  if (/tourist|passenger|customer|sunbather|visitor|terrified/.test(r)) return 'person';
  if (/referee|quarterback|athlete|coach|team doctor|hot dog vendor/.test(r)) return 'people';
  if (/astronaut|comms|mission specialist|flight engineer|geologist|navigator/.test(r)) return 'star';
  return 'badge';
}

function vSpyDiscuss() {
  const mins = Math.floor(S.spyTimer / 60);
  const secs = String(S.spyTimer % 60).padStart(2, '0');
  const pct  = S.spyTimer / 480;
  const R = 52, C = 2 * Math.PI * R;
  const a = S.spyMyAssignment;
  const locAccent = a?.location?.accent || '#1a6be8';
  const roleIconKey = getRoleIcon(a?.role);

  return `
  <div class="sa-screen">
    <div class="sa-topbar">
      <button class="sa-back-btn" id="btn-sa-leave">${ICONS.back} LEAVE</button>
      <div class="sa-topbar-brand">SECRET AGENT</div>
      <div class="sa-topbar-phase">OPERATION ACTIVE</div>
    </div>

    <div class="sa-timer-section">
      <div class="sa-timer-label">TIME REMAINING</div>
      <div class="sa-timer-ring-wrap">
        <svg width="124" height="124" viewBox="0 0 124 124">
          <circle cx="62" cy="62" r="${R}" fill="none" stroke="rgba(200,20,20,0.15)" stroke-width="8"/>
          <circle id="timer-arc" cx="62" cy="62" r="${R}" fill="none" stroke="#cc2222" stroke-width="8"
            stroke-dasharray="${C * pct} ${C}" stroke-dashoffset="${C / 4}" stroke-linecap="round"/>
        </svg>
        <div class="sa-timer-num" id="timer-num">${mins}:${secs}</div>
      </div>
    </div>

    <div class="sa-mission-card ${a?.isSpy ? 'sa-mission-card--spy' : ''}" ${a?.isSpy ? '' : `style="--loc-accent:${locAccent}"`}>
      <div class="sa-mission-card-header">
        <span class="sa-mission-card-label">YOUR ASSIGNMENT</span>
        <span class="sa-mission-card-badge">${a?.isSpy ? 'TOP SECRET' : esc(a?.location?.name || '')}</span>
      </div>
      <div class="sa-mission-card-body">
        <div class="sa-mission-role-icon">
          ${a?.isSpy ? ICONS.spy : (ICONS[roleIconKey] || ICONS.badge)}
        </div>
        <div class="sa-mission-role-name">${a?.isSpy ? 'THE SPY' : esc(a?.role || '')}</div>
      </div>
      <div class="sa-mission-card-footer">
        <span class="sa-mission-card-hint">${a?.isSpy ? 'Identify the location &mdash; blend in' : 'Keep your role secret from the spy'}</span>
      </div>
    </div>

    <div class="sa-agents-section">
      <div class="sa-section-label">ACTIVE AGENTS</div>
      <div class="sa-agents-grid">
        ${S.players.map((p, i) => `
          <div class="sa-agent-chip">
            <div class="sa-agent-av av-${i % 6}">${esc(p.name.charAt(0).toUpperCase())}</div>
            <div class="sa-agent-name">${esc(p.name)}</div>
            ${p.isHost ? '<div class="sa-agent-tag">HANDLER</div>' : ''}
          </div>
        `).join('')}
      </div>
    </div>

    ${a?.isSpy ? `
    <div class="sa-loc-section">
      <div class="sa-loc-section-label">LOCATIONS — TAP TO ELIMINATE</div>
      <div class="sa-loc-grid">
        ${LOCATIONS.map(l => `
          <div class="sa-loc-pill sa-loc-crossable ${S.spyCrossed.has(l.name) ? 'sa-loc-crossed' : ''}"
               data-cross="${l.name}">
            ${l.name}
          </div>
        `).join('')}
      </div>
    </div>
    ` : `
    <div class="sa-rules-box">
      <div class="sa-rules-row">
        <span class="sa-rules-icon">${ICONS.chat}</span>
        <span>Take turns — one question each</span>
      </div>
      <div class="sa-rules-row">
        <span class="sa-rules-icon">${ICONS.spy}</span>
        <span>Don't reveal the location — expose the spy</span>
      </div>
      <div class="sa-rules-row">
        <span class="sa-rules-icon">${ICONS.vote}</span>
        <span>Vote together — all must confirm to end</span>
      </div>
    </div>
    `}

    <div class="sa-discuss-actions">
      ${S.isHost ? `<button class="sa-btn-mission btn" id="btn-spy-vote">${ICONS.vote} COMMENCE VOTING</button>` : ''}
      ${S.isHost ? `<button class="sa-btn-ghost btn sa-btn-end" id="btn-end-mission">${ICONS.close} END MISSION</button>` : ''}
    </div>
  </div>`;
}

function vSpyGuessLocation() {
  const isSpy = S.spyMyAssignment?.isSpy;

  if (!isSpy) {
    return `
    <div class="sa-screen">
      <div class="sa-topbar">
        <button class="sa-back-btn" id="btn-sa-leave">${ICONS.back} LEAVE</button>
        <div class="sa-topbar-brand">SECRET AGENT</div>
        <div class="sa-topbar-phase">SPY'S MOVE</div>
      </div>
      <div class="sa-guess-hero">
        <div class="sa-guess-emblem">${ICONS.spy}</div>
        <div class="sa-guess-title">SPY IDENTIFIED</div>
        <div class="sa-guess-sub">The spy has one chance to name the location and escape...</div>
      </div>
      <div class="sa-standby-msg" style="padding:0 20px 40px;">Awaiting the spy's final guess</div>
    </div>`;
  }

  return `
  <div class="sa-screen">
    <div class="sa-topbar">
      <button class="sa-back-btn" id="btn-sa-leave">${ICONS.back} LEAVE</button>
      <div class="sa-topbar-brand">SECRET AGENT</div>
      <div class="sa-topbar-phase">FINAL MOVE</div>
    </div>

    <div class="sa-guess-hero">
      <div class="sa-guess-emblem">${ICONS.spy}</div>
      <div class="sa-guess-title">YOU'VE BEEN IDENTIFIED</div>
      <div class="sa-guess-sub">Name the location to escape — one chance only</div>
    </div>

    <div class="sa-loc-grid sa-loc-grid--guess">
      ${LOCATIONS.map(l => `
        <button class="sa-loc-btn" data-guess="${l.name}" style="border-color:${l.accent}44">
          <span class="sa-loc-btn-dot" style="background:${l.accent}"></span>
          <span class="sa-loc-btn-name">${l.name}</span>
        </button>
      `).join('')}
    </div>
  </div>`;
}

function vSpyVote() {
  const myId      = S.room?.myId;
  const myVote    = S.spyVotes[myId];
  const selected  = S.spySelectedVote;
  const others    = S.players.filter(p => p.id !== myId);
  const voteCount = Object.keys(S.spyVotes).length;

  return `
  <div class="sa-screen">
    <div class="sa-topbar">
      <button class="sa-back-btn" id="btn-sa-leave">${ICONS.back} LEAVE</button>
      <div class="sa-topbar-brand">SECRET AGENT</div>
      <div class="sa-topbar-phase">VOTE</div>
    </div>

    <div class="sa-vote-hero">
      <div class="sa-vote-emblem">${ICONS.spy}</div>
      <div class="sa-vote-title">IDENTIFY THE SPY</div>
      <div class="sa-vote-sub">${voteCount} of ${S.players.length} agents confirmed</div>
    </div>

    <div class="sa-vote-list">
      ${others.map(p => {
        const isSelected = !myVote && selected === p.id;
        const isVoted    = myVote === p.id;
        return `
        <button class="sa-vote-option ${isSelected || isVoted ? 'sa-vote-option--selected' : ''} ${myVote ? 'sa-vote-option--locked' : ''}"
                data-vote="${p.id}" ${myVote ? 'disabled' : ''}>
          <div class="sa-agent-av ${avClass(p.name)}">${esc(p.name.charAt(0).toUpperCase())}</div>
          <div class="sa-vote-name">${esc(p.name)}</div>
          <div class="sa-vote-meta">
            ${isVoted ? `<span class="sa-vote-check">${ICONS.check}</span>` : ''}
          </div>
        </button>`;
      }).join('')}
    </div>

    <div class="sa-vote-footer">
      ${myVote
        ? `<div class="sa-standby-msg">Vote confirmed — awaiting all agents...</div>`
        : `<button class="sa-btn-mission btn" id="btn-confirm-vote" ${!selected ? 'disabled' : ''}>
             ${ICONS.vote} CONFIRM VOTE
           </button>
           ${!selected ? `<div class="sa-hint-text">Select a suspect first</div>` : ''}`
      }
    </div>
  </div>`;
}

function vSpyResult() {
  const r = S.spyResult;
  if (!r) return '';
  const spy   = S.players.find(p => p.id === r.spyId);
  const voted = S.players.find(p => p.id === r.topId);

  const spyGuessedRight = r.spyGuessedLocation;
  const civilianWins = r.caughtSpy && !spyGuessedRight;

  const title  = civilianWins ? 'SPY CAUGHT' : spyGuessedRight ? 'SPY WINS' : 'SPY ESCAPES';
  const iconEl = civilianWins ? ICONS.check : ICONS.spy;
  const heroMod = civilianWins ? 'sa-result-hero--win' : 'sa-result-hero--lose';

  let desc = '';
  if (civilianWins) {
    desc = `The agents voted out <strong>${esc(voted?.name || '?')}</strong> — who really was the spy!`;
  } else if (spyGuessedRight) {
    desc = `<strong>${esc(spy?.name || '?')}</strong> identified the location and wins the round!`;
  } else {
    desc = `You burned <strong>${esc(voted?.name || '?')}</strong>, but the real spy was <strong>${esc(spy?.name || '?')}</strong>!`;
  }

  return `
  <div class="sa-screen">
    <div class="sa-topbar">
      <button class="sa-back-btn" id="btn-sa-leave">${ICONS.back} LEAVE</button>
      <div class="sa-topbar-brand">SECRET AGENT</div>
      <div class="sa-topbar-phase">DEBRIEF</div>
    </div>

    <div class="sa-result-hero ${heroMod}">
      <div class="sa-result-emblem">${iconEl}</div>
      <div class="sa-result-stamp">${title}</div>
      <div class="sa-result-desc">${desc}</div>
    </div>

    <div class="sa-dossier sa-dossier--debrief">
      <div class="sa-dossier-tab">MISSION DEBRIEF</div>
      <div class="sa-dossier-body">
        <div class="sa-dossier-field">
          <div class="sa-dossier-label">OPERATION LOCATION</div>
          <div class="sa-dossier-location">
            <div class="sa-dossier-loc-badge" style="background:${S.spyLocation?.accent || '#cc2222'}">
              ${ICONS.pin}
            </div>
            <span class="sa-dossier-loc-name">${S.spyLocation?.name}</span>
          </div>
        </div>
        <div class="sa-dossier-divider"></div>
        <div class="sa-dossier-field">
          <div class="sa-dossier-label">THE SPY WAS</div>
          <div class="sa-debrief-spy-row">
            <div class="sa-agent-av ${avClass(spy?.name || '')}">${(spy?.name || '?').charAt(0).toUpperCase()}</div>
            <div class="sa-vote-name">${esc(spy?.name || '?')}</div>
            <span class="sa-spy-tag">SPY</span>
          </div>
        </div>
        <div class="sa-dossier-divider"></div>
        <div class="sa-result-scores">
          ${S.players.map(p => {
            const vc = Object.values(S.spyVotes).filter(v => v === p.id).length;
            return `
            <div class="sa-score-row">
              <div class="sa-agent-av sa-agent-av--sm ${avClass(p.name)}">${p.name.charAt(0).toUpperCase()}</div>
              <div class="sa-vote-name">${esc(p.name)}</div>
              <div class="sa-score-votes">${vc} vote${vc !== 1 ? 's' : ''}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </div>

    ${S.isHost ? `
      <div class="sa-result-actions">
        <button class="sa-btn-mission btn" id="btn-spy-again">${ICONS.arrow} PLAY AGAIN</button>
        <button class="sa-btn-ghost btn" id="btn-to-game-select">${ICONS.back} Mission Select</button>
      </div>
    ` : `<div class="sa-standby-msg" style="padding:0 20px 36px;">Waiting for handler...</div>`}
  </div>`;
}

// ─── FLIP UP ───

function vHuDecks() {
  const filtered = DECKS.filter(d => {
    if (S.huAgeFilter  !== 'all' && d.age       !== S.huAgeFilter)  return false;
    if (S.huDiffFilter !== 'all' && d.difficulty !== S.huDiffFilter) return false;
    return true;
  });
  const featured = filtered[0] || null;
  const others   = filtered.slice(1);
  const sel      = S.huSelectedDeck ? DECKS.find(d => d.id === S.huSelectedDeck) : null;

  const ageLbl  = S.huAgeFilter  === 'all' ? 'ALL AGES'         : '18+';
  const diffLbl = S.huDiffFilter === 'all' ? 'ALL DIFFICULTIES' : S.huDiffFilter.toUpperCase();

  return `
  <div class="fu-screen">

    <div class="fu-header">
      <img src="img/Flip Up Header.png" class="fu-header-bg" alt="" draggable="false"/>
      <div class="fu-header-content">
        <button class="fu-back-btn" id="btn-back">${ICONS.back}</button>
      </div>
    </div>

    ${S.huOpenFilter ? `<div class="fu-filter-bg" id="btn-fu-filter-close"></div>` : ''}
    <div class="fu-filters-wrap">
      <div class="fu-filters">
        <div class="fu-pill fu-pill--static">${ICONS.people} 3+ PLAYERS</div>
        <div class="fu-pill ${S.huAgeFilter  !== 'all' ? 'fu-pill--on' : ''}" id="btn-fu-filter-age" >${ageLbl}  ▾</div>
        <div class="fu-pill ${S.huDiffFilter !== 'all' ? 'fu-pill--on' : ''}" id="btn-fu-filter-diff">${diffLbl} ▾</div>
      </div>

      ${S.huOpenFilter === 'age' ? `
      <div class="fu-dropdown">
        <div class="fu-drop-opt ${S.huAgeFilter === 'all' ? 'fu-drop-opt--sel' : ''}" data-ftype="age" data-fval="all">ALL AGES</div>
        <div class="fu-drop-opt ${S.huAgeFilter === '18+' ? 'fu-drop-opt--sel' : ''}" data-ftype="age" data-fval="18+">18+</div>
      </div>` : ''}

      ${S.huOpenFilter === 'diff' ? `
      <div class="fu-dropdown">
        <div class="fu-drop-opt ${S.huDiffFilter === 'all'    ? 'fu-drop-opt--sel' : ''}" data-ftype="diff" data-fval="all">ALL DIFFICULTIES</div>
        <div class="fu-drop-opt ${S.huDiffFilter === 'easy'   ? 'fu-drop-opt--sel' : ''}" data-ftype="diff" data-fval="easy">EASY</div>
        <div class="fu-drop-opt ${S.huDiffFilter === 'medium' ? 'fu-drop-opt--sel' : ''}" data-ftype="diff" data-fval="medium">MEDIUM</div>
        <div class="fu-drop-opt ${S.huDiffFilter === 'hard'   ? 'fu-drop-opt--sel' : ''}" data-ftype="diff" data-fval="hard">HARD</div>
      </div>` : ''}
    </div>

    <div class="fu-body">

      ${!featured ? `
      <div class="fu-empty">
        <div class="fu-empty-title">No decks match</div>
        <div class="fu-empty-sub">Try a different filter</div>
      </div>` : `

      <div class="fu-label">FEATURED</div>
      <div class="fu-featured" data-deck="${featured.id}" style="background:${featured.bg};border-color:${featured.border}">
        <div class="fu-featured-art">${featured.emoji}</div>
        <div class="fu-featured-badge">FEATURED</div>
        <div class="fu-featured-text">
          <div class="fu-featured-name">${esc(featured.name).toUpperCase()}</div>
          <div class="fu-featured-sub">${esc(featured.subtitle)}</div>
        </div>
        <div class="fu-count-pill">${featured.cards.length} CARDS</div>
      </div>

      ${others.length ? `<div class="fu-label">ALL DECKS</div>
      <div class="fu-grid">
        ${others.map(d => `
          <div class="fu-card" data-deck="${d.id}" style="background:${d.bg};border-color:${d.border}">
            <div class="fu-card-art">${d.emoji}</div>
            <div class="fu-card-name">${esc(d.name).toUpperCase()}</div>
            <div class="fu-card-sub">${esc(d.subtitle)}</div>
            <div class="fu-card-count">${d.cards.length} CARDS</div>
          </div>
        `).join('')}
      </div>` : ''}
      `}

    </div>

    ${sel ? `
    <div class="fu-overlay" id="btn-fu-close"></div>
    <div class="fu-modal" style="--deck-accent:${sel.accent}">
      <div class="fu-modal-header" style="background:${sel.bg}">
        <div class="fu-modal-art">${sel.emoji}</div>
        <div class="fu-modal-name">${esc(sel.name).toUpperCase()}</div>
        <div class="fu-modal-sub">${esc(sel.subtitle)}</div>
        <div class="fu-modal-count">${sel.cards.length} CARDS</div>
      </div>
      <div class="fu-modal-body">
        <div class="fu-modal-how">
          <div class="fu-modal-how-title">HOW TO PLAY</div>
          <div class="fu-modal-how-row">${ICONS.person}<span>Hold phone up to your forehead</span></div>
          <div class="fu-modal-how-row">${ICONS.people}<span>Friends describe the word — don't say it!</span></div>
          <div class="fu-modal-how-row">${ICONS.check}<span>Tilt down = Got It</span></div>
          <div class="fu-modal-how-row">${ICONS.close}<span>Tilt up = Skip</span></div>
        </div>
        <button class="fu-play-btn" id="btn-fu-play">${ICONS.arrow} PLAY DECK</button>
        <button class="fu-cancel-btn" id="btn-fu-close2">Choose a different deck</button>
      </div>
    </div>` : ''}

  </div>`;
}

function vHuPlay() {
  const g = S.huSession;

  // ── Phase 1: wait for landscape ───────────────
  if (!g || S.huPhase === 'wait') {
    return `
    <div class="hu-orient-screen">
      <button class="hu-orient-back" id="btn-back">${ICONS.back}</button>
      <div class="hu-orient-visual">
        <svg viewBox="0 0 110 80" fill="none" class="hu-orient-svg">
          <rect x="36" y="8" width="38" height="64" rx="7" stroke="rgba(255,255,255,0.75)" stroke-width="2.5" fill="rgba(255,255,255,0.06)"/>
          <circle cx="55" cy="64" r="3.5" fill="rgba(255,255,255,0.45)"/>
          <rect x="43" y="15" width="24" height="14" rx="2" fill="rgba(255,255,255,0.1)"/>
          <path d="M 8 52 A 38 38 0 0 1 102 52" stroke="rgba(255,255,255,0.55)" stroke-width="2.5" stroke-linecap="round" fill="none" stroke-dasharray="6 5"/>
          <polygon points="96,43 103,52 94,56" fill="rgba(255,255,255,0.6)"/>
        </svg>
      </div>
      <div class="hu-orient-title">Rotate Your Phone</div>
      <div class="hu-orient-sub">Turn sideways to start the countdown</div>
    </div>`;
  }

  // ── Phase 2: countdown ────────────────────────
  if (S.huPhase === 'countdown') {
    return `
    <div class="hu-countdown-screen">
      <div class="hu-cd-label">GET READY</div>
      <div id="hu-cd-num" class="hu-cd-num">${S.huCountdown}</div>
    </div>`;
  }

  // ── Time's up ─────────────────────────────────
  if (g.isDone() || S.huTimer <= 0) {
    return `
    <div class="screen screen--centered">
      <div class="result-icon result-icon--win">${ICONS.star}</div>
      <div class="timesup-title">Time's Up!</div>
      <button class="btn btn-green btn--narrow" id="btn-hu-results">
        ${ICONS.arrow} See Results
      </button>
    </div>`;
  }

  // ── Phase 3: playing ──────────────────────────
  const word   = g.current();
  const accent = g.deck.accent;
  const pct    = S.huTimer / g.timeLimit;
  const R = 28, C = 2 * Math.PI * R;
  const col = S.huTimer > 20 ? 'var(--accent-green)' : S.huTimer > 10 ? 'var(--accent-yellow)' : 'var(--accent)';

  return `
  <div class="screen hu-play-screen">
    <div class="cream">
      <div class="play-header">
        <div class="score-row">
          <div class="score-box">
            <div class="score-num score-num--green" id="hu-score-got">${g.got}</div>
            <div class="score-lbl">Got</div>
          </div>
          <div class="score-box">
            <div class="score-num score-num--muted" id="hu-score-skip">${g.skipped}</div>
            <div class="score-lbl">Skipped</div>
          </div>
          <div class="score-box">
            <div class="score-num score-num--dark">${g.cards.length - g.index}</div>
            <div class="score-lbl">Left</div>
          </div>
        </div>
        <div class="timer-ring">
          <svg width="68" height="68" viewBox="0 0 68 68">
            <circle cx="34" cy="34" r="${R}" fill="none" stroke="var(--paper-dk)" stroke-width="5"/>
            <circle id="hu-arc" cx="34" cy="34" r="${R}" fill="none" stroke="${col}" stroke-width="5"
              stroke-dasharray="${C * pct} ${C}" stroke-dashoffset="${C / 4}" stroke-linecap="round"
              class="timer-arc"/>
          </svg>
          <div id="hu-timer-num" class="timer-num timer-num--sm">${S.huTimer}</div>
        </div>
      </div>

      <div class="hu-card" id="hu-card">
        <div class="tack tack-red tack--lobby-left"></div>
        <div class="tack tack-blue tack--lobby-right"></div>
        <div class="tape tape-left"></div>
        <div class="tape tape-right"></div>
        <div class="hu-card-category" style="color:${accent};">${g.deck.name}</div>
        <div class="hu-card-word">${esc(word)}</div>
        <div class="hu-card-hint">Hold to forehead — friends describe!</div>
      </div>

      <div class="tilt-row">
        <div class="tilt-hint tilt-skip">↑ Tilt Up = Skip</div>
        <div class="tilt-hint tilt-got">↓ Tilt Down = Got It</div>
      </div>

      <button class="end-link" id="btn-hu-end">End Round</button>
    </div>
  </div>`;
}

function vHuResult() {
  const g = S.huSession;
  if (!g) return '';

  return `
  <div class="screen">
    <nav class="nav-bar">
      <div class="nav-title">Game Line</div>
      <span class="nav-label">RESULTS</span>
    </nav>

    <div class="cream cream--top">
      <div class="panel">
        <div class="hu-result-score">${g.got}</div>
        <div class="hu-result-label">GOT IT</div>
        <div class="hu-result-sub">${g.skipped} skipped &middot; ${g.deck.name}</div>
      </div>

      <div class="panel panel--scroll">
        <span class="section-label">Card history</span>
        ${g.history.map(h => `
          <div class="history-row">
            <span class="${h.result === 'got' ? 'history-got' : 'history-skip'}">${ICONS[h.result === 'got' ? 'check' : 'close']}</span>
            <span class="${h.result === 'got' ? 'history-word--got' : 'history-word--skip'}">${esc(h.word)}</span>
          </div>
        `).join('')}
      </div>

      <div class="btn-row">
        <button class="btn btn-ghost" id="btn-back">${ICONS.back} Decks</button>
        <button class="btn btn-green btn--wide" id="btn-hu-replay">${ICONS.arrow} Play Again</button>
      </div>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// EVENT BINDING
// ─────────────────────────────────────────────
function bind() {
  on('btn-create', () => doCreate());
  on('btn-join',   () => doJoin());
  onKey('inp-name', 'Enter', () => doCreate());
  onKey('inp-code', 'Enter', () => doJoin());

  on('btn-donate',       () => { S.showDonate = true;  render(); });
  on('btn-donate-close', () => { S.showDonate = false; render(); });
  on('btn-donate-close2',() => { S.showDonate = false; render(); });

  on('btn-back-home', () => go('home'));
  on('btn-back', () => leaveRoom());

  const applyFilter = (filter) => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('chip--active'));
    document.querySelector(`[data-filter="${filter}"]`)?.classList.add('chip--active');
    document.querySelectorAll('.glcard').forEach(card => {
      card.style.display = (filter === 'all' || card.dataset.device === filter) ? '' : 'none';
    });
  };

  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  // apply the default active filter on load
  const activeChip = document.querySelector('.chip--active[data-filter]');
  if (activeChip) applyFilter(activeChip.dataset.filter);

  document.querySelectorAll('[data-launch]').forEach(el => {
    el.addEventListener('click', e => {
      e.stopPropagation();
      const game = el.dataset.launch;
      if (game === 'headsup') { go('hu-decks'); return; }
      if (game === 'spy') { S.selectedGame = 'spy'; go('setup'); return; }
      toast('Coming soon!');
    });
  });
  on('btn-pick-game', () => {
    if (!S.isHost) return;
    if (S.players.length < 3) { toast('Need 3+ agents for Secret Agent!'); return; }
    S.room?.send({ type: 'GOTO', screen: 'spy-role' });
    go('spy-role');
  });
  on('btn-copy-code', () => {
    navigator.clipboard?.writeText(S.roomCode)
      .then(() => toast('Code copied!'))
      .catch(() => toast('Code: ' + S.roomCode));
  });
  on('btn-copy-link', () => {
    const url = `${location.origin}${location.pathname}?join=${S.roomCode}`;
    navigator.clipboard?.writeText(url)
      .then(() => toast('Invite link copied!'))
      .catch(() => toast('Code: ' + S.roomCode));
  });

  on('btn-to-lobby', () => go('lobby'));
  document.querySelectorAll('.game-card:not(.game-card--soon)[data-game]').forEach(t => {
    t.addEventListener('click', () => launchGame(t.dataset.game));
  });

  on('btn-spy-start', () => { startSpy(); spyDiscuss(); });
  on('btn-spy-vote',  () => { S.spySelectedVote = null; S.room?.send({ type: 'SPY_PHASE', phase: 'vote' }); go('spy-vote'); });
  on('btn-spy-again',      () => { S.room?.send({ type: 'GOTO', screen: 'lobby' }); go('lobby'); });
  on('btn-to-game-select', () => { S.room?.send({ type: 'GOTO', screen: 'lobby' }); go('lobby'); });
  on('btn-sa-leave', () => leaveRoom());
  on('btn-end-mission', () => {
    clearInterval(S.spyTimerInt);
    S.room?.send({ type: 'GOTO', screen: 'lobby' });
    go('lobby');
  });

  document.querySelectorAll('.sa-vote-option[data-vote]').forEach(b => {
    b.addEventListener('click', () => {
      if (S.spyVotes[S.room?.myId]) return;
      S.spySelectedVote = b.dataset.vote;
      render();
    });
  });
  on('btn-confirm-vote', () => {
    if (S.spySelectedVote) castVote(S.spySelectedVote);
  });
  document.querySelectorAll('.sa-loc-btn[data-guess]').forEach(b => {
    b.addEventListener('click', () => spyGuessLocation(b.dataset.guess));
  });
  document.querySelectorAll('[data-cross]').forEach(el => {
    el.addEventListener('click', () => {
      const name = el.dataset.cross;
      if (S.spyCrossed.has(name)) S.spyCrossed.delete(name);
      else S.spyCrossed.add(name);
      el.classList.toggle('sa-loc-crossed');
    });
  });

  document.querySelectorAll('[data-deck]').forEach(d => {
    d.addEventListener('click', () => { S.huSelectedDeck = d.dataset.deck; render(); });
  });
  on('btn-fu-play',  () => { if (S.huSelectedDeck) { startHeadsUp(S.huSelectedDeck); S.huSelectedDeck = null; } });
  on('btn-fu-close', () => { S.huSelectedDeck = null; render(); });
  on('btn-fu-close2',() => { S.huSelectedDeck = null; render(); });

  on('btn-fu-filter-age',  () => { S.huOpenFilter = S.huOpenFilter === 'age'  ? null : 'age';  render(); });
  on('btn-fu-filter-diff', () => { S.huOpenFilter = S.huOpenFilter === 'diff' ? null : 'diff'; render(); });
  on('btn-fu-filter-close',() => { S.huOpenFilter = null; render(); });
  document.querySelectorAll('[data-ftype]').forEach(el => {
    el.addEventListener('click', () => {
      if (el.dataset.ftype === 'age')  S.huAgeFilter  = el.dataset.fval;
      if (el.dataset.ftype === 'diff') S.huDiffFilter = el.dataset.fval;
      S.huOpenFilter = null;
      render();
    });
  });
  on('btn-hu-got',     () => huGot());
  on('btn-hu-skip',    () => huSkip());
  on('btn-hu-end',     () => huEnd());
  on('btn-hu-results', () => go('hu-result'));
  on('btn-hu-replay',  () => go('hu-decks'));
  if (S.screen === 'hu-decks' || S.screen === 'hu-result') {
    on('btn-back', () => go(S.room ? 'game-select' : 'home'));
  }
  if (S.screen === 'hu-play') {
    on('btn-back', () => { huEnd(); go('hu-decks'); });
  }
}

function on(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', fn);
}
function onKey(id, key, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('keydown', e => { if (e.key === key) fn(); });
}

// ─────────────────────────────────────────────
// ROOM ACTIONS
// ─────────────────────────────────────────────
async function doCreate() {
  const name = document.getElementById('inp-name')?.value?.trim();
  if (!name) { toast('Enter your name first!'); return; }
  S.myName = name;
  const btn = document.getElementById('btn-create');
  if (btn) { btn.disabled = true; btn.textContent = 'Creating...'; }
  try {
    const room = new RoomManager(onMsg, onPlayers, onDisconn);
    S.room = room; S.isHost = true;
    const code = await room.createRoom(name);
    S.roomCode = code;
    go('lobby');
  } catch(e) {
    toast(e.message || 'Could not create room');
    if (btn) { btn.disabled = false; btn.innerHTML = `${ICONS.home} Create a Room`; }
  }
}

async function doJoin() {
  const name = document.getElementById('inp-name')?.value?.trim();
  const code = document.getElementById('inp-code')?.value?.trim().toUpperCase();
  if (!name) { toast('Enter your name first!'); return; }
  if (!code || code.length < 4) { toast('Enter the 4-letter room code!'); return; }
  S.myName = name;
  const btn = document.getElementById('btn-join');
  if (btn) btn.disabled = true;
  try {
    const room = new RoomManager(onMsg, onPlayers, onDisconn);
    S.room = room; S.isHost = false; S.roomCode = code;
    await room.joinRoom(code, name);
    go('lobby');
  } catch(e) {
    toast(e.message || 'Could not join room');
    if (btn) btn.disabled = false;
    S.room?.destroy(); S.room = null;
  }
}

function leaveRoom() {
  S.room?.destroy(); S.room = null;
  S.players = []; S.isHost = false; S.roomCode = '';
  clearInterval(S.spyTimerInt); clearInterval(S.huTimerInt);
  go('home');
}

// ─────────────────────────────────────────────
// MESSAGE HANDLER
// ─────────────────────────────────────────────
function onMsg(msg) {
  switch (msg.type) {
    case 'GOTO':
      if (msg.screen === 'lobby') {
        S.spyCrossed = new Set();
        S.spyVotes = {};
        S.spySelectedVote = null;
        clearInterval(S.spyTimerInt);
      }
      go(msg.screen);
      break;
    case 'SPY_START':
      if (!S.isHost) {
        S.spyAssignments  = msg.assignments;
        S.spyLocation     = msg.location;
        S.spyMyAssignment = msg.assignments[S.room.myId];
        S.spyCrossed      = new Set();
        spyDiscuss();
      }
      break;
    case 'SPY_DISCUSS': if (!S.isHost) spyDiscuss(); break;
    case 'SPY_PHASE':
      if (msg.phase === 'vote' && !S.isHost) { S.spySelectedVote = null; go('spy-vote'); }
      if (msg.phase === 'guess-loc' && !S.isHost) go('spy-guess-loc');
      break;
    case 'SPY_VOTE':
      S.spyVotes[msg.voterId] = msg.targetId;
      if (S.isHost && Object.keys(S.spyVotes).length === S.players.length) {
        autoReveal();
      } else if (S.screen === 'spy-vote') {
        render();
      }
      break;
    case 'SPY_RESULT':
      S.spyResult   = msg.result;
      S.spyLocation = msg.location;
      clearInterval(S.spyTimerInt);
      go('spy-result');
      break;
  }
}

function onPlayers(players) {
  S.players = players;
  if (S.screen === 'lobby') render();
}

function onDisconn(msg) { toast(msg); }

// ─────────────────────────────────────────────
// GAME LAUNCHERS
// ─────────────────────────────────────────────
function launchGame(id) {
  if (!S.isHost) return;
  if (id === 'headsup') go('hu-decks');
}

// ─────────────────────────────────────────────
// SPY FLOW
// ─────────────────────────────────────────────
function startSpy() {
  const { location, assignments } = generateAssignments(S.players);
  S.spyAssignments  = assignments;
  S.spyLocation     = location;
  S.spyVotes        = {};
  S.spySelectedVote = null;
  S.spyCrossed      = new Set();
  S.spyMyAssignment = assignments[S.room.myId];
  Object.values(S.room.connections).forEach(conn => {
    conn.send({ type: 'SPY_START', assignments, location });
  });
}

function spyDiscuss() {
  S.spyTimer = 480;
  clearInterval(S.spyTimerInt);
  S.spyTimerInt = setInterval(() => {
    S.spyTimer = Math.max(0, S.spyTimer - 1);
    const numEl = document.getElementById('timer-num');
    const arcEl = document.getElementById('timer-arc');
    if (numEl) {
      numEl.textContent = `${Math.floor(S.spyTimer / 60)}:${String(S.spyTimer % 60).padStart(2, '0')}`;
    }
    if (arcEl) {
      const R = 52, C = 2 * Math.PI * R;
      arcEl.setAttribute('stroke-dasharray', `${C * S.spyTimer / 480} ${C}`);
      arcEl.setAttribute('stroke', S.spyTimer > 120 ? '#cc2222' : S.spyTimer > 30 ? 'var(--accent-yellow)' : '#ff4444');
    }
    if (S.spyTimer === 0) {
      clearInterval(S.spyTimerInt);
      if (S.isHost) S.room?.send({ type: 'SPY_PHASE', phase: 'vote' });
      go('spy-vote');
    }
  }, 1000);
  go('spy-discuss');
}

function castVote(targetId) {
  const myId = S.room?.myId;
  if (!myId || !targetId || S.spyVotes[myId]) return;
  S.spyVotes[myId] = targetId;
  S.spySelectedVote = null;
  S.room?.send({ type: 'SPY_VOTE', voterId: myId, targetId });
  if (S.isHost && Object.keys(S.spyVotes).length === S.players.length) {
    autoReveal();
  } else {
    render();
  }
}

function spyGuessLocation(guessName) {
  if (!S.spyMyAssignment?.isSpy) return;
  const correct = S.spyLocation?.name === guessName;
  const result = getVoteResult(S.spyVotes, S.spyAssignments);
  result.spyGuessedLocation = correct;
  result.caughtSpy = true; // spy was caught by vote, now guessing
  S.spyResult = result;
  clearInterval(S.spyTimerInt);
  S.room?.send({ type: 'SPY_RESULT', result, location: S.spyLocation });
  go('spy-result');
}

function autoReveal() {
  if (!S.isHost) return;
  const result = getVoteResult(S.spyVotes, S.spyAssignments);
  result.spyGuessedLocation = false;
  clearInterval(S.spyTimerInt);

  if (result.caughtSpy) {
    // Spy was correctly identified — give them one chance to guess the location
    S.room?.send({ type: 'SPY_PHASE', phase: 'guess-loc' });
    go('spy-guess-loc');
  } else {
    // Wrong person voted — spy wins immediately
    S.spyResult = result;
    S.room?.send({ type: 'SPY_RESULT', result, location: S.spyLocation });
    go('spy-result');
  }
}

// ─────────────────────────────────────────────
// HEADS UP FLOW
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// HEADS UP — ORIENTATION & AUDIO
// ─────────────────────────────────────────────
let _huOrientInt = null;

function playBeep(freq, dur) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq; o.type = 'sine';
    g.gain.setValueAtTime(0.4, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
  } catch(e) {}
}

function huIsLandscape() {
  if (screen.orientation) return screen.orientation.type.startsWith('landscape');
  return window.innerWidth > window.innerHeight;
}

function huLandscapeCheck() {
  if (S.screen !== 'hu-play' || S.huPhase !== 'wait') return;
  if (huIsLandscape()) {
    S.huPhase = 'countdown';
    S.huCountdown = 3;
    render();
    huRunCountdown();
  }
}

function huRunCountdown() {
  playBeep(880, 0.14);
  let count = 3;
  _huOrientInt = setInterval(() => {
    count--;
    S.huCountdown = count;
    const el = document.getElementById('hu-cd-num');
    if (el) el.textContent = count > 0 ? count : 'GO!';
    if (count > 0) {
      playBeep(880, 0.14);
    } else {
      clearInterval(_huOrientInt);
      _huOrientInt = null;
      playBeep(1320, 0.3);
      setTimeout(() => {
        if (S.screen !== 'hu-play') return;
        S.huPhase = 'playing';
        huAttachTilt();
        huStartTimer();
        render();
      }, 450);
    }
  }, 1000);
}

function huAttachTilt() {
  if (window._huTilt) window.removeEventListener('deviceorientation', window._huTilt);
  let lastTilt = 0;
  window._huTilt = e => {
    if (S.screen !== 'hu-play' || S.huPhase !== 'playing') return;
    const b = e.beta;
    if (b === null) return;
    const now = Date.now();
    if (now - lastTilt < 900) return;
    if (b < -20)      { lastTilt = now; huGot(); }
    else if (b > 20)  { lastTilt = now; huSkip(); }
  };
  window.addEventListener('deviceorientation', window._huTilt);
}

function huStartTimer() {
  clearInterval(S.huTimerInt);
  S.huTimerInt = setInterval(() => {
    S.huTimer = Math.max(0, S.huTimer - 1);
    const n = document.getElementById('hu-timer-num');
    const a = document.getElementById('hu-arc');
    if (n) n.textContent = S.huTimer;
    if (a) {
      const R = 28, C = 2 * Math.PI * R;
      a.setAttribute('stroke-dasharray', `${C * S.huTimer / S.huSession.timeLimit} ${C}`);
      a.setAttribute('stroke', S.huTimer > 20 ? 'var(--accent-green)' : S.huTimer > 10 ? 'var(--accent-yellow)' : 'var(--accent)');
    }
    if (S.huTimer === 0) huEnd();
  }, 1000);
}

function startHeadsUp(deckId) {
  const launch = () => {
    S.huSession   = new HeadsUpSession(deckId);
    S.huTimer     = S.huSession.timeLimit;
    S.huPhase     = 'wait';
    S.huCountdown = 3;
    clearInterval(S.huTimerInt);
    clearInterval(_huOrientInt);
    _huOrientInt = null;
    if (window._huTilt) { window.removeEventListener('deviceorientation', window._huTilt); delete window._huTilt; }
    window.addEventListener('orientationchange', huLandscapeCheck);
    window.addEventListener('resize', huLandscapeCheck);
    go('hu-play');
    setTimeout(huLandscapeCheck, 150);
  };

  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(() => launch())
      .catch(() => launch());
  } else {
    launch();
  }
}

function huGot() {
  if (!S.huSession || S.huSession.isDone()) return;
  S.huSession.markGot();
  flash('hu-card', 'hu-flash-got');
  if (S.huSession.isDone()) { huEnd(); return; }
  const wEl = document.querySelector('.hu-card-word');
  if (wEl) wEl.textContent = S.huSession.current() || '';
  const el = document.getElementById('hu-score-got');
  if (el) el.textContent = S.huSession.got;
}

function huSkip() {
  if (!S.huSession || S.huSession.isDone()) return;
  S.huSession.markSkip();
  flash('hu-card', 'hu-flash-skip');
  if (S.huSession.isDone()) { huEnd(); return; }
  const wEl = document.querySelector('.hu-card-word');
  if (wEl) wEl.textContent = S.huSession.current() || '';
  const el = document.getElementById('hu-score-skip');
  if (el) el.textContent = S.huSession.skipped;
}

function huEnd() {
  clearInterval(S.huTimerInt);
  clearInterval(_huOrientInt);
  _huOrientInt = null;
  if (window._huTilt) { window.removeEventListener('deviceorientation', window._huTilt); delete window._huTilt; }
  window.removeEventListener('orientationchange', huLandscapeCheck);
  window.removeEventListener('resize', huLandscapeCheck);
  go('hu-result');
}

function flash(id, cls) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 280);
}

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function go(screen) { S.screen = screen; render(); }

function toast(msg) {
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  wrap.innerHTML = '';
  wrap.appendChild(t);
  setTimeout(() => t.remove(), 2700);
}

function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

const AV_CLASSES = ['av-0','av-1','av-2','av-3','av-4','av-5'];
function avClass(name) {
  const n = String(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AV_CLASSES[n % AV_CLASSES.length];
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
render();

const _params = new URLSearchParams(location.search);
const _code   = _params.get('join');
if (_code) {
  setTimeout(() => {
    const el = document.getElementById('inp-code');
    if (el) { el.value = _code.toUpperCase(); toast('Enter your name then join!'); }
  }, 80);
}
