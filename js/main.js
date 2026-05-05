import { RoomManager } from './room.js';
import { LOCATIONS, generateAssignments, getVoteResult } from './games/spy.js';
import { DECKS, HeadsUpSession } from './games/headsup.js';

// ─────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────
const S = {
  screen: 'home',
  room: null,
  players: [],
  myName: '',
  isHost: false,
  roomCode: '',
  // spy
  spyAssignments: null,
  spyLocation: null,
  spyMyAssignment: null,
  spyVotes: {},
  spyResult: null,
  spyTimer: 480,
  spyTimerInt: null,
  // headsup
  huSession: null,
  huTimer: 60,
  huTimerInt: null,
};

const $app = document.getElementById('app');

// ─────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────
function render() {
  $app.innerHTML = `
    <div class="app-bg">
      <div class="app-bg-grid"></div>
      <div class="app-bg-vignette"></div>
      <div class="app-bg-glow abg-1"></div>
      <div class="app-bg-glow abg-2"></div>
    </div>
    <div class="rotate-hint">
      <div style="font-size:3rem">📱</div>
      <div style="font-family:'Unbounded',sans-serif;font-size:1.4rem;font-weight:900;">Rotate your phone</div>
      <div style="color:var(--muted);font-size:0.85rem;">Party Pocket works best in portrait mode</div>
    </div>
    ${view()}
    <div class="toasts" id="toasts"></div>
  `;
  bind();
}

function view() {
  switch (S.screen) {
    case 'home':          return vHome();
    case 'lobby':         return vLobby();
    case 'game-select':   return vGameSelect();
    case 'spy-role':      return vSpyRole();
    case 'spy-discuss':   return vSpyDiscuss();
    case 'spy-vote':      return vSpyVote();
    case 'spy-result':    return vSpyResult();
    case 'hu-decks':      return vHuDecks();
    case 'hu-play':       return vHuPlay();
    case 'hu-result':     return vHuResult();
    default:              return vHome();
  }
}

// ─────────────────────────────────────────────
// SCREENS
// ─────────────────────────────────────────────

function vHome() {
  return `
  <div class="screen stack-0" style="justify-content:center;min-height:100vh;">
    <div class="stack-20" style="display:flex;flex-direction:column;align-items:center;gap:20px;width:100%;padding-top:0;">

      <div class="home-hero">
        <div class="home-hero-emoji">🎉</div>
        <div class="home-hero-logo">Party Pocket</div>
        <div class="home-hero-sub">Free party games • No downloads • No accounts</div>
      </div>

      <div class="card card-glow-purple stack-16" style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <div class="form-label">Your name</div>
          <input class="input" id="inp-name" placeholder="Enter your name..." maxlength="16" value="${esc(S.myName)}" autocomplete="off" autocorrect="off" spellcheck="false"/>
        </div>
        <button class="btn btn-pink" id="btn-create">
          <span style="font-size:1rem;">🏠</span> Create a Room
        </button>
        <div class="divider">or join a room</div>
        <div>
          <div class="form-label">Room code</div>
          <input class="input input-code" id="inp-code" placeholder="ABCD" maxlength="4" value="" autocomplete="off" autocorrect="off" autocapitalize="characters" spellcheck="false"/>
        </div>
        <button class="btn btn-cyan" id="btn-join">
          <span style="font-size:1rem;">🚀</span> Join Room
        </button>
      </div>

      <a href="index.html" class="back-home">← Back to home</a>
    </div>
  </div>`;
}

function vLobby() {
  const url = `${location.origin}${location.pathname}?join=${S.roomCode}`;
  const myId = S.room?.myId;

  return `
  <div class="screen stack-16" style="display:flex;flex-direction:column;gap:16px;">
    <div class="app-header">
      <a href="index.html" class="app-logo">PartyPocket</a>
      <button class="app-back" id="btn-back">✕ Leave</button>
    </div>

    <div class="room-code-box" id="btn-copy-code" title="Tap to copy code">
      <div class="room-code-eyebrow">Room Code — tap to copy</div>
      <div class="room-code-value">${S.roomCode}</div>
      <div class="room-code-hint">Others go to partypocket.app and enter this code</div>
    </div>

    <div class="card stack-12" style="display:flex;flex-direction:column;gap:12px;">
      <div class="row row-between items-center" style="display:flex;flex-direction:row;align-items:center;justify-content:space-between;">
        <div style="font-family:'Unbounded',sans-serif;font-size:0.78rem;font-weight:900;">
          Players <span style="color:var(--muted);">(${S.players.length})</span>
        </div>
        <div style="display:flex;align-items:center;gap:7px;font-size:0.75rem;color:var(--green);font-weight:700;">
          <div class="waiting-dot"></div> Live
        </div>
      </div>
      <div class="player-list">
        ${S.players.map(p => `
          <div class="player-chip">
            <div class="player-avatar" style="background:${avBg(p.emoji)}">${p.emoji}</div>
            <div class="player-chip-name">${esc(p.name)}</div>
            ${p.isHost ? '<div class="player-chip-tag tag-host">Host</div>' : ''}
            ${p.id === myId && !p.isHost ? '<div class="player-chip-tag tag-you">You</div>' : ''}
          </div>
        `).join('')}
      </div>
    </div>

    ${S.isHost ? `
      <button class="btn btn-green" id="btn-pick-game" ${S.players.length < 2 ? 'disabled' : ''}>
        <span style="font-size:1rem;">🎮</span> Pick a Game
      </button>
      ${S.players.length < 2 ? `<div class="text-center text-muted text-sm">Need at least 2 players to start</div>` : ''}
    ` : `
      <div class="info-box info-purple text-center">
        ⏳ Waiting for the host to start the game…
      </div>
    `}

    <button class="btn btn-ghost btn-sm" id="btn-copy-link">
      🔗 Copy Invite Link
    </button>
  </div>`;
}

function vGameSelect() {
  const n = S.players.length;
  return `
  <div class="screen stack-20" style="display:flex;flex-direction:column;gap:20px;">
    <div class="app-header">
      <a href="index.html" class="app-logo">PartyPocket</a>
      <button class="app-back" id="btn-to-lobby">← Lobby</button>
    </div>

    <div style="font-family:'Unbounded',sans-serif;font-size:1.3rem;font-weight:900;letter-spacing:-0.02em;width:100%;">
      Pick a game 🎮
    </div>

    <div class="section-label">📡 Multi-Device — everyone joins</div>
    <div class="game-grid">
      <div class="game-tile t-pink ${n < 3 ? 'game-tile-coming' : ''}" data-game="spy">
        <span class="game-tile-badge badge-multi">Multi</span>
        <div class="game-tile-emoji">🕵️</div>
        <div class="game-tile-name">Secret Agent</div>
        <div class="game-tile-players">3+ players</div>
      </div>
      <div class="game-tile t-purple game-tile-coming">
        <span class="game-tile-badge badge-soon">Soon</span>
        <div class="game-tile-emoji">🧠</div>
        <div class="game-tile-name">Trivia Blitz</div>
        <div class="game-tile-players">2+ players</div>
      </div>
    </div>
    ${n < 3 ? `<div class="info-box info-pink text-sm">Secret Agent needs 3+ players (you have ${n})</div>` : ''}

    <div class="section-label">📱 Single Device — pass it around</div>
    <div class="game-grid">
      <div class="game-tile t-green" data-game="headsup">
        <span class="game-tile-badge badge-solo">Solo</span>
        <div class="game-tile-emoji">🙋</div>
        <div class="game-tile-name">Heads Up!</div>
        <div class="game-tile-players">2+ players</div>
      </div>
      <div class="game-tile t-orange game-tile-coming">
        <span class="game-tile-badge badge-soon">Soon</span>
        <div class="game-tile-emoji">🔥</div>
        <div class="game-tile-name">Truth or Dare</div>
        <div class="game-tile-players">3+ players</div>
      </div>
      <div class="game-tile t-cyan game-tile-coming">
        <span class="game-tile-badge badge-soon">Soon</span>
        <div class="game-tile-emoji">🤔</div>
        <div class="game-tile-name">Would You Rather</div>
        <div class="game-tile-players">2+ players</div>
      </div>
      <div class="game-tile t-yellow game-tile-coming">
        <span class="game-tile-badge badge-soon">Soon</span>
        <div class="game-tile-emoji">🎨</div>
        <div class="game-tile-name">Doodle & Guess</div>
        <div class="game-tile-players">3+ players</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%;">
      ${csRow('🍾','Never Have I Ever')}${csRow('📖','Story Builder')}
      ${csRow('🎵','Name That Tune')} ${csRow('🃏','Hot Take')}
    </div>
  </div>`;
}

function csRow(e, n) {
  return `<div style="display:flex;align-items:center;gap:8px;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;opacity:0.4;">
    <span style="font-size:1.2rem;">${e}</span>
    <span style="font-size:0.78rem;font-weight:700;">${n}</span>
    <span style="margin-left:auto;font-size:0.6rem;color:var(--muted);font-weight:900;text-transform:uppercase;letter-spacing:0.06em;">Soon</span>
  </div>`;
}

// ─── SPY ───

function vSpyRole() {
  const a = S.spyMyAssignment;
  if (!a) return `<div class="screen"><div class="text-muted text-center" style="margin-top:50%;transform:translateY(-50%);">Loading…</div></div>`;

  if (a.isSpy) {
    return `
    <div class="screen stack-16" style="display:flex;flex-direction:column;gap:16px;">
      <div class="app-header">
        <a href="index.html" class="app-logo">PartyPocket</a>
        <div style="font-size:0.72rem;color:var(--muted);font-weight:700;font-family:'Unbounded',sans-serif;">🕵️ SECRET AGENT</div>
      </div>

      <div class="role-reveal-card role-spy">
        <div class="role-eyebrow">Your identity</div>
        <span class="role-big-emoji">🕵️</span>
        <div class="role-main">YOU ARE<br/>THE SPY</div>
        <div class="role-sub">You don't know the location.<br/>Ask smart questions. Blend in.</div>
        <div class="role-badge">Guess the location to win!</div>
      </div>

      <div class="card stack-10" style="display:flex;flex-direction:column;gap:10px;">
        <div class="section-label">Possible locations</div>
        <div class="location-grid">
          ${LOCATIONS.map(l => `<div class="location-pill">${l.emoji} ${l.name}</div>`).join('')}
        </div>
      </div>

      ${S.isHost
        ? `<button class="btn btn-pink" id="btn-spy-start">Everyone's ready — Start! 🚀</button>`
        : `<div class="info-box info-purple text-center">⏳ Waiting for host to start the round…</div>`
      }
    </div>`;
  }

  return `
  <div class="screen stack-16" style="display:flex;flex-direction:column;gap:16px;">
    <div class="app-header">
      <a href="index.html" class="app-logo">PartyPocket</a>
      <div style="font-size:0.72rem;color:var(--muted);font-weight:700;font-family:'Unbounded',sans-serif;">🕵️ SECRET AGENT</div>
    </div>

    <div class="role-reveal-card role-civilian">
      <div class="role-eyebrow">The location is</div>
      <span class="role-big-emoji">${a.location.emoji}</span>
      <div class="role-main">${a.location.name}</div>
      <div style="height:1px;background:rgba(0,240,255,0.12);margin:14px 0;"></div>
      <div class="role-eyebrow" style="margin-bottom:4px;">Your role</div>
      <div style="font-family:'Unbounded',sans-serif;font-size:1.1rem;font-weight:900;">${a.role}</div>
      <div class="role-badge">Find the spy! Don't reveal the location.</div>
    </div>

    ${S.isHost
      ? `<button class="btn btn-pink" id="btn-spy-start">Everyone's ready — Start! 🚀</button>`
      : `<div class="info-box info-cyan text-center">⏳ Waiting for host to start the round…</div>`
    }
  </div>`;
}

function vSpyDiscuss() {
  const mins = Math.floor(S.spyTimer / 60);
  const secs = String(S.spyTimer % 60).padStart(2, '0');
  const pct = S.spyTimer / 480;
  const R = 38, C = 2 * Math.PI * R;
  const col = S.spyTimer > 120 ? 'var(--cyan)' : S.spyTimer > 30 ? 'var(--yellow)' : 'var(--pink)';
  const a = S.spyMyAssignment;

  return `
  <div class="screen stack-14" style="display:flex;flex-direction:column;gap:14px;">
    <div class="app-header">
      <a href="index.html" class="app-logo">PartyPocket</a>
      <div class="timer-ring" style="position:relative;width:80px;height:80px;flex-shrink:0;">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="${R}" fill="none" stroke="var(--surface3)" stroke-width="5"/>
          <circle id="timer-arc" cx="40" cy="40" r="${R}" fill="none" stroke="${col}" stroke-width="5"
            stroke-dasharray="${C*pct} ${C}" stroke-dashoffset="${C/4}" stroke-linecap="round"
            style="transition:stroke-dasharray 1s linear,stroke 0.4s;"/>
        </svg>
        <div class="timer-num" id="timer-num" style="font-size:1rem;">${mins}:${secs}</div>
      </div>
    </div>

    <div class="discuss-role-pill">
      <div class="discuss-role-label">Your role</div>
      <div class="discuss-role-value">
        ${a?.isSpy
          ? `🕵️ <span style="color:var(--purple);">SPY</span> — you don't know the location!`
          : `${a?.location?.emoji} ${a?.location?.name} &mdash; <span style="color:var(--cyan);">${a?.role}</span>`
        }
      </div>
    </div>

    <div class="card stack-10" style="display:flex;flex-direction:column;gap:10px;">
      <div class="section-label">Players</div>
      <div class="player-list">
        ${S.players.map(p => `
          <div class="player-chip">
            <div class="player-avatar" style="background:${avBg(p.emoji)}">${p.emoji}</div>
            <div class="player-chip-name">${esc(p.name)}</div>
            ${p.isHost ? '<div class="player-chip-tag tag-host">Host</div>' : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="info-box info-yellow">
      💬 Take turns asking one question each.<br/>
      🎯 Civilians: spot the spy!<br/>
      🕵️ Spy: blend in &amp; guess the location to win!
    </div>

    ${S.isHost ? `<button class="btn btn-pink" id="btn-spy-vote">🗳️ Start Voting</button>` : ''}
  </div>`;
}

function vSpyVote() {
  const myId = S.room?.myId;
  const myVote = S.spyVotes[myId];
  const others = S.players.filter(p => p.id !== myId);

  return `
  <div class="screen stack-20" style="display:flex;flex-direction:column;gap:20px;">
    <div class="app-header">
      <a href="index.html" class="app-logo">PartyPocket</a>
      <div style="font-size:0.72rem;color:var(--muted);font-weight:700;font-family:'Unbounded',sans-serif;">🗳️ VOTE</div>
    </div>

    <div class="card card-glow-pink text-center stack-8" style="display:flex;flex-direction:column;gap:8px;">
      <div style="font-size:2rem;">🕵️</div>
      <div style="font-family:'Unbounded',sans-serif;font-size:1rem;font-weight:900;">Who is the spy?</div>
      <div class="text-muted text-sm">Vote for who you think is the secret agent</div>
    </div>

    <div class="stack-8" style="display:flex;flex-direction:column;gap:8px;width:100%;">
      ${others.map(p => `
        <button class="vote-option ${myVote === p.id ? 'voted' : ''}" data-vote="${p.id}">
          <div class="vote-option-avatar" style="background:${avBg(p.emoji)}">${p.emoji}</div>
          <div style="flex:1;">${esc(p.name)}</div>
          ${myVote === p.id ? `<div style="color:var(--pink);font-size:0.8rem;">✓ Your vote</div>` : ''}
        </button>
      `).join('')}
    </div>

    ${S.isHost
      ? `<button class="btn btn-pink" id="btn-spy-reveal" style="margin-top:8px;">🎭 Reveal the Spy!</button>`
      : `<div class="info-box info-purple text-center">${myVote ? '✅ Vote cast! Waiting for host to reveal…' : 'Tap a name to cast your vote'}</div>`
    }
  </div>`;
}

function vSpyResult() {
  const r = S.spyResult;
  if (!r) return '';
  const spy = S.players.find(p => p.id === r.spyId);
  const voted = S.players.find(p => p.id === r.topId);
  const a = S.spyMyAssignment;

  return `
  <div class="screen stack-16" style="display:flex;flex-direction:column;gap:16px;">
    <div class="app-header">
      <a href="index.html" class="app-logo">PartyPocket</a>
      <div style="font-size:0.72rem;color:var(--muted);font-weight:700;font-family:'Unbounded',sans-serif;">🕵️ RESULTS</div>
    </div>

    <div class="result-hero ${r.caughtSpy ? 'result-win' : 'result-lose'}">
      <span class="result-emoji-big">${r.caughtSpy ? '🎉' : '🕵️'}</span>
      <div class="result-title">${r.caughtSpy ? 'Spy Caught!' : 'Spy Escapes!'}</div>
      <div class="result-desc">
        ${r.caughtSpy
          ? `You voted out <strong>${esc(voted?.name || '?')}</strong> — who really was the spy!`
          : `You voted out <strong>${esc(voted?.name || '?')}</strong>, but the real spy was <strong>${esc(spy?.name || '?')}</strong>!`
        }
      </div>
    </div>

    <div class="card stack-10" style="display:flex;flex-direction:column;gap:10px;">
      <div class="section-label">The location was</div>
      <div style="font-family:'Unbounded',sans-serif;font-size:1.6rem;font-weight:900;color:var(--cyan);">
        ${S.spyLocation?.emoji} ${S.spyLocation?.name}
      </div>
      <div class="section-label" style="margin-top:6px;">The spy was</div>
      <div class="player-chip">
        <div class="player-avatar" style="background:${avBg(spy?.emoji || '🕵️')}">${spy?.emoji || '🕵️'}</div>
        <div class="player-chip-name">${esc(spy?.name || '?')}</div>
        <div class="player-chip-tag" style="background:rgba(176,96,255,0.12);color:var(--purple);">🕵️ SPY</div>
      </div>
    </div>

    ${S.isHost ? `
      <div class="stack-8" style="display:flex;flex-direction:column;gap:8px;width:100%;">
        <button class="btn btn-pink" id="btn-spy-again">🔄 Play Again</button>
        <button class="btn btn-ghost" id="btn-to-game-select">← Game Menu</button>
      </div>
    ` : `<div class="info-box info-purple text-center">Waiting for host to continue…</div>`}
  </div>`;
}

// ─── HEADS UP ───

function vHuDecks() {
  return `
  <div class="screen stack-20" style="display:flex;flex-direction:column;gap:20px;">
    <div class="app-header">
      <a href="index.html" class="app-logo">PartyPocket</a>
      <button class="app-back" id="btn-back">← Back</button>
    </div>

    <div style="font-family:'Unbounded',sans-serif;font-size:1.3rem;font-weight:900;letter-spacing:-0.02em;width:100%;">
      🙋 Heads Up!
    </div>

    <div class="info-box info-green stack-4" style="display:flex;flex-direction:column;gap:4px;">
      <div style="font-weight:900;margin-bottom:4px;">How to play</div>
      📱 Hold the phone to your forehead<br/>
      👥 Friends describe the word — don't say it!<br/>
      ⬇️ <strong>Tilt back</strong> = Got It &nbsp; ⬆️ <strong>Tilt forward</strong> = Skip
    </div>

    <div class="section-label">Choose a deck</div>
    <div class="game-grid">
      ${DECKS.map(d => `
        <div class="game-tile headsup-deck-tile ${d.color}" data-deck="${d.id}"
          style="border-color:${d.border};">
          <div class="headsup-deck-emoji">${d.emoji}</div>
          <div class="headsup-deck-name">${d.name}</div>
          <div class="headsup-deck-count">${d.cards.length} cards</div>
        </div>
      `).join('')}
    </div>
  </div>`;
}

function vHuPlay() {
  const g = S.huSession;
  if (!g || g.isDone() || S.huTimer <= 0) {
    return `
    <div class="screen stack-20" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;min-height:100vh;">
      <div style="font-size:4rem;animation:resultPop 0.4s cubic-bezier(0.34,1.56,0.64,1) both;">🎉</div>
      <div style="font-family:'Unbounded',sans-serif;font-size:1.6rem;font-weight:900;text-align:center;">Time's up!</div>
      <button class="btn btn-green" id="btn-hu-results" style="max-width:300px;">See Results →</button>
    </div>`;
  }

  const word = g.current();
  const deck = g.deck;
  const pct = S.huTimer / g.timeLimit;
  const R = 32, C = 2 * Math.PI * R;
  const col = S.huTimer > 20 ? 'var(--green)' : S.huTimer > 10 ? 'var(--yellow)' : 'var(--pink)';

  return `
  <div class="screen stack-14" style="display:flex;flex-direction:column;gap:14px;">
    <div class="app-header">
      <div style="font-family:'Unbounded',sans-serif;font-size:0.72rem;font-weight:900;color:var(--muted);">${deck.emoji} ${deck.name}</div>
      <div style="display:flex;align-items:center;gap:14px;">
        <div class="score-row" style="gap:14px;">
          <div class="score-box">
            <div id="hu-score-got" class="score-num" style="color:var(--green);font-size:1.4rem;">${g.got}</div>
            <div class="score-lbl">Got</div>
          </div>
          <div class="score-box">
            <div id="hu-score-skip" class="score-num" style="color:var(--muted);font-size:1.4rem;">${g.skipped}</div>
            <div class="score-lbl">Skip</div>
          </div>
        </div>
        <div style="position:relative;width:70px;height:70px;flex-shrink:0;">
          <svg width="70" height="70" viewBox="0 0 70 70">
            <circle cx="35" cy="35" r="${R}" fill="none" stroke="var(--surface3)" stroke-width="5"/>
            <circle id="hu-arc" cx="35" cy="35" r="${R}" fill="none" stroke="${col}" stroke-width="5"
              stroke-dasharray="${C*pct} ${C}" stroke-dashoffset="${C/4}" stroke-linecap="round"
              style="transition:stroke-dasharray 1s linear,stroke 0.4s;"/>
          </svg>
          <div id="hu-timer-num" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Unbounded',sans-serif;font-size:0.95rem;font-weight:900;">${S.huTimer}</div>
        </div>
      </div>
    </div>

    <div class="hu-play-card" id="hu-card"
      style="background:${deck.bg};border-color:${deck.border};">
      <div class="hu-play-card-category" style="color:${deck.accent};">${deck.name}</div>
      <div class="hu-play-card-word" style="color:${deck.accent};">${word}</div>
      <div class="hu-play-card-hint" style="margin-top:6px;">Hold phone to forehead &amp; tilt!</div>
    </div>

    <div style="display:flex;gap:10px;width:100%;">
      <button class="btn btn-outline-pink" id="btn-hu-skip" style="flex:1;">
        ⬆️ Skip
      </button>
      <button class="btn btn-green" id="btn-hu-got" style="flex:1.6;">
        ⬇️ Got It!
      </button>
    </div>

    <button class="btn btn-ghost btn-sm" id="btn-hu-end">End Round</button>
  </div>`;
}

function vHuResult() {
  const g = S.huSession;
  if (!g) return '';
  const deck = g.deck;

  return `
  <div class="screen stack-16" style="display:flex;flex-direction:column;gap:16px;">
    <div class="app-header">
      <a href="index.html" class="app-logo">PartyPocket</a>
      <div style="font-size:0.72rem;color:var(--muted);font-weight:700;font-family:'Unbounded',sans-serif;">RESULTS</div>
    </div>

    <div class="result-hero result-win text-center">
      <span class="result-emoji-big">${deck.emoji}</span>
      <div class="result-title" style="font-size:1.4rem;">${g.got} Got It!</div>
      <div class="result-desc">${g.skipped} skipped • ${deck.name}</div>
    </div>

    <div class="card stack-8" style="display:flex;flex-direction:column;gap:8px;max-height:280px;overflow-y:auto;">
      <div class="section-label">Card history</div>
      ${g.history.map(h => `
        <div class="history-row">
          <span style="font-size:1rem;">${h.result === 'got' ? '✅' : '⏭️'}</span>
          <span style="font-weight:700;${h.result === 'got' ? 'color:var(--green)' : 'color:var(--muted2)'};">${esc(h.word)}</span>
        </div>
      `).join('')}
    </div>

    <div style="display:flex;gap:10px;width:100%;">
      <button class="btn btn-ghost" id="btn-back" style="flex:1;">← Decks</button>
      <button class="btn btn-green" id="btn-hu-replay" style="flex:1.5;">Play Again! 🔄</button>
    </div>
  </div>`;
}

// ─────────────────────────────────────────────
// EVENT BINDING
// ─────────────────────────────────────────────
function bind() {
  // Home
  on('btn-create', () => doCreate());
  on('btn-join', () => doJoin());
  onKey('inp-name', 'Enter', () => doCreate());
  onKey('inp-code', 'Enter', () => doJoin());

  // Lobby
  on('btn-back', () => leaveRoom());
  on('btn-pick-game', () => {
    if (S.isHost) S.room?.send({ type: 'GOTO', screen: 'game-select' });
    go('game-select');
  });
  on('btn-copy-code', () => {
    navigator.clipboard?.writeText(S.roomCode).then(() => toast('Code copied! 📋')).catch(() => toast('Code: ' + S.roomCode));
  });
  on('btn-copy-link', () => {
    const url = `${location.origin}${location.pathname}?join=${S.roomCode}`;
    navigator.clipboard?.writeText(url).then(() => toast('Invite link copied! 🔗')).catch(() => toast('Code: ' + S.roomCode));
  });

  // Game select
  on('btn-to-lobby', () => go('lobby'));
  document.querySelectorAll('.game-tile:not(.game-tile-coming)[data-game]').forEach(t => {
    t.addEventListener('click', () => launchGame(t.dataset.game));
  });

  // Spy
  on('btn-spy-start', () => {
    S.room?.send({ type: 'SPY_DISCUSS' });
    spyDiscuss();
  });
  on('btn-spy-vote', () => {
    S.room?.send({ type: 'SPY_PHASE', phase: 'vote' });
    go('spy-vote');
  });
  on('btn-spy-reveal', () => spyReveal());
  on('btn-spy-again', () => {
    S.room?.send({ type: 'GOTO', screen: 'game-select' });
    go('game-select');
  });
  on('btn-to-game-select', () => {
    S.room?.send({ type: 'GOTO', screen: 'game-select' });
    go('game-select');
  });
  document.querySelectorAll('.vote-option[data-vote]').forEach(b => {
    b.addEventListener('click', () => castVote(b.dataset.vote));
  });

  // Heads Up
  document.querySelectorAll('[data-deck]').forEach(d => {
    d.addEventListener('click', () => startHeadsUp(d.dataset.deck));
  });
  on('btn-hu-got',     () => huGot());
  on('btn-hu-skip',    () => huSkip());
  on('btn-hu-end',     () => huEnd());
  on('btn-hu-results', () => go('hu-result'));
  on('btn-hu-replay',  () => go('hu-decks'));
  if (S.screen === 'hu-decks' || S.screen === 'hu-result') {
    on('btn-back', () => go(S.room ? 'game-select' : 'home'));
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
  if (btn) { btn.disabled = true; btn.textContent = 'Creating…'; }
  try {
    const room = new RoomManager(onMsg, onPlayers, onDisconn);
    S.room = room; S.isHost = true;
    const code = await room.createRoom(name);
    S.roomCode = code;
    go('lobby');
  } catch(e) {
    toast(e.message || 'Could not create room');
    if (btn) { btn.disabled = false; btn.innerHTML = '<span style="font-size:1rem;">🏠</span> Create a Room'; }
  }
}

async function doJoin() {
  const name = document.getElementById('inp-name')?.value?.trim();
  const code = document.getElementById('inp-code')?.value?.trim().toUpperCase();
  if (!name) { toast('Enter your name first!'); return; }
  if (!code || code.length < 4) { toast('Enter the 4-letter room code!'); return; }
  S.myName = name;
  const btn = document.getElementById('btn-join');
  if (btn) { btn.disabled = true; btn.textContent = 'Joining…'; }
  try {
    const room = new RoomManager(onMsg, onPlayers, onDisconn);
    S.room = room; S.isHost = false; S.roomCode = code;
    await room.joinRoom(code, name);
    go('lobby');
  } catch(e) {
    toast(e.message || 'Could not join room');
    if (btn) { btn.disabled = false; btn.innerHTML = '<span style="font-size:1rem;">🚀</span> Join Room'; }
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
      go(msg.screen);
      break;

    case 'SPY_START':
      if (!S.isHost) {
        const myId = S.room.myId;
        S.spyAssignments = msg.assignments;
        S.spyLocation = msg.location;
        S.spyMyAssignment = msg.assignments[myId];
        go('spy-role');
      }
      break;

    case 'SPY_DISCUSS':
      if (!S.isHost) spyDiscuss();
      break;

    case 'SPY_PHASE':
      if (msg.phase === 'vote' && !S.isHost) go('spy-vote');
      break;

    case 'SPY_VOTE':
      S.spyVotes[msg.voterId] = msg.targetId;
      break;

    case 'SPY_RESULT':
      S.spyResult = msg.result;
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

function onDisconn(msg) {
  toast(msg);
}

// ─────────────────────────────────────────────
// GAME LAUNCHERS
// ─────────────────────────────────────────────
function launchGame(id) {
  if (!S.isHost) return;
  if (id === 'spy') {
    if (S.players.length < 3) { toast('Need 3+ players for Secret Agent!'); return; }
    startSpy();
  } else if (id === 'headsup') {
    go('hu-decks');
  }
}

// ─────────────────────────────────────────────
// SPY FLOW
// ─────────────────────────────────────────────
function startSpy() {
  const { location, assignments } = generateAssignments(S.players);
  S.spyAssignments = assignments;
  S.spyLocation = location;
  S.spyVotes = {};

  if (S.isHost) {
    const myId = S.room.myId;
    S.spyMyAssignment = assignments[myId];
    // Send each player their assignment directly
    Object.entries(S.room.connections).forEach(([peerId, conn]) => {
      conn.send({ type: 'SPY_START', assignments, location });
    });
    go('spy-role');
  }
}

function spyDiscuss() {
  S.spyTimer = 480;
  clearInterval(S.spyTimerInt);
  S.spyTimerInt = setInterval(() => {
    S.spyTimer = Math.max(0, S.spyTimer - 1);
    // Patch timer in DOM without full re-render
    const numEl = document.getElementById('timer-num');
    const arcEl = document.getElementById('timer-arc');
    if (numEl) {
      const m = Math.floor(S.spyTimer / 60);
      const s = String(S.spyTimer % 60).padStart(2, '0');
      numEl.textContent = `${m}:${s}`;
    }
    if (arcEl) {
      const R = 38, C = 2 * Math.PI * R;
      const pct = S.spyTimer / 480;
      arcEl.setAttribute('stroke-dasharray', `${C * pct} ${C}`);
      arcEl.setAttribute('stroke', S.spyTimer > 120 ? 'var(--cyan)' : S.spyTimer > 30 ? 'var(--yellow)' : 'var(--pink)');
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
  if (!myId) return;
  S.spyVotes[myId] = targetId;
  S.room?.send({ type: 'SPY_VOTE', voterId: myId, targetId });
  render();
}

function spyReveal() {
  if (!S.isHost) return;
  const result = getVoteResult(S.spyVotes, S.spyAssignments);
  S.spyResult = result;
  S.room?.send({ type: 'SPY_RESULT', result, location: S.spyLocation });
  clearInterval(S.spyTimerInt);
  go('spy-result');
}

// ─────────────────────────────────────────────
// HEADS UP FLOW
// ─────────────────────────────────────────────
function startHeadsUp(deckId) {
  S.huSession = new HeadsUpSession(deckId);
  S.huTimer = S.huSession.timeLimit;
  clearInterval(S.huTimerInt);
  go('hu-play');
  // Tilt controls — remove any previous listener before adding a fresh one
  if (window._huTilt) { window.removeEventListener('deviceorientation', window._huTilt); delete window._huTilt; }
  if (window.DeviceOrientationEvent) {
    let lastTilt = 0;
    window._huTilt = (e) => {
      const b = e.beta;
      if (b === null) return;
      const now = Date.now();
      if (now - lastTilt < 600) return; // debounce
      if (b > 55) { lastTilt = now; huGot(); }
      else if (b < -25) { lastTilt = now; huSkip(); }
    };
    window.addEventListener('deviceorientation', window._huTilt);
  }
  S.huTimerInt = setInterval(() => {
    S.huTimer = Math.max(0, S.huTimer - 1);
    const n = document.getElementById('hu-timer-num');
    const a = document.getElementById('hu-arc');
    if (n) n.textContent = S.huTimer;
    if (a) {
      const R = 32, C = 2 * Math.PI * R;
      a.setAttribute('stroke-dasharray', `${C * S.huTimer / S.huSession.timeLimit} ${C}`);
      a.setAttribute('stroke', S.huTimer > 20 ? 'var(--green)' : S.huTimer > 10 ? 'var(--yellow)' : 'var(--pink)');
    }
    if (S.huTimer === 0) huEnd();
  }, 1000);
}

function huGot() {
  if (!S.huSession || S.huSession.isDone()) return;
  S.huSession.markGot();
  flash('hu-card', 'hu-flash-got');
  if (S.huSession.isDone()) { huEnd(); return; }
  const wEl = document.querySelector('.hu-play-card-word');
  if (wEl) wEl.textContent = S.huSession.current() || '';
  const gotEl = document.getElementById('hu-score-got');
  if (gotEl) gotEl.textContent = S.huSession.got;
}

function huSkip() {
  if (!S.huSession || S.huSession.isDone()) return;
  S.huSession.markSkip();
  flash('hu-card', 'hu-flash-skip');
  if (S.huSession.isDone()) { huEnd(); return; }
  const wEl = document.querySelector('.hu-play-card-word');
  if (wEl) wEl.textContent = S.huSession.current() || '';
  const skipEl = document.getElementById('hu-score-skip');
  if (skipEl) skipEl.textContent = S.huSession.skipped;
}

function huEnd() {
  clearInterval(S.huTimerInt);
  if (window._huTilt) { window.removeEventListener('deviceorientation', window._huTilt); delete window._huTilt; }
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
function go(screen) {
  S.screen = screen;
  render();
}

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

const AV_BKGS = [
  'linear-gradient(135deg,#ff2d78,#b060ff)',
  'linear-gradient(135deg,#00f0ff,#007799)',
  'linear-gradient(135deg,#00ff88,#007744)',
  'linear-gradient(135deg,#ffe600,#aa9900)',
  'linear-gradient(135deg,#ff7a30,#aa4400)',
  'linear-gradient(135deg,#b060ff,#6600cc)',
];
function avBg(emoji) {
  return AV_BKGS[(emoji?.codePointAt(0) || 0) % AV_BKGS.length];
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
render();

// Auto-fill code from URL
const _params = new URLSearchParams(location.search);
const _code = _params.get('join');
if (_code) {
  setTimeout(() => {
    const el = document.getElementById('inp-code');
    if (el) { el.value = _code.toUpperCase(); toast('Enter your name then join!'); }
  }, 80);
}
