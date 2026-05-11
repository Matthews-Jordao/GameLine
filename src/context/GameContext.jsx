import { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react';
import { RoomManager } from '../lib/room.js';
import { generateAssignments, getVoteResult } from '../lib/games/spy.js';
import { HeadsUpSession } from '../lib/games/headsup.js';

const GameContext = createContext(null);

const AV_CLASSES = ['av-0','av-1','av-2','av-3','av-4','av-5'];
export function avClass(name) {
  const n = String(name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return AV_CLASSES[n % AV_CLASSES.length];
}

export function getRoleIcon(role) {
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
  return 'badge';
}

const initialState = {
  screen: 'home',
  showDonate: false,
  players: [],
  myName: '',
  isHost: false,
  roomCode: '',
  selectedGame: null,
  reconnecting: false,

  spyAssignments: null,
  spyLocation: null,
  spyMyAssignment: null,
  spyVotes: {},
  spySelectedVote: null,
  spyResult: null,
  spyTimer: 480,
  spyCrossed: [],
  spyCommenceVotes: [],
  spyFirstPlayer: null,

  huSession: null,
  huSelectedDeck: null,
  huOpenFilter: null,
  huAgeFilter: 'all',
  huDiffFilter: 'all',
  huPhase: 'wait',
  huCountdown: 3,
  huTimer: 60,

  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'GO':           return { ...state, screen: action.screen };
    case 'SET_PLAYERS':  return { ...state, players: action.players };
    case 'SHOW_DONATE':  return { ...state, showDonate: action.show };
    case 'SELECT_GAME':  return { ...state, selectedGame: action.game };
    case 'TOAST':        return { ...state, toast: action.message };
    case 'CLEAR_TOAST':  return { ...state, toast: null };
    case 'SET_RECONNECTING': return { ...state, reconnecting: action.value };

    case 'CREATE_ROOM': return { ...state, myName: action.name, isHost: true, roomCode: action.code, screen: 'lobby' };
    case 'JOIN_ROOM':   return { ...state, myName: action.name, isHost: false, roomCode: action.code, screen: 'lobby' };
    case 'LEAVE_ROOM':  return { ...initialState, screen: 'home' };

    case 'GOTO':
      if (action.screen === 'lobby') {
        return { ...state, screen: 'lobby', spyCrossed: [], spyVotes: {}, spySelectedVote: null,
          spyTimer: 480, spyCommenceVotes: [], spyFirstPlayer: null, spyResult: null };
      }
      return { ...state, screen: action.screen };

    case 'SPY_STARTED': return {
      ...state,
      spyAssignments: action.assignments,
      spyLocation: action.location,
      spyMyAssignment: action.assignments[action.myId],
      spyCrossed: [],
      spyVotes: {},
      spySelectedVote: null,
      spyCommenceVotes: [],
      spyFirstPlayer: action.firstPlayer,
      screen: 'spy-discuss',
      spyTimer: 480,
    };

    case 'SPY_TIMER': return { ...state, spyTimer: action.value };

    case 'SPY_TOGGLE_CROSS': {
      const name = action.name;
      const crossed = state.spyCrossed.includes(name)
        ? state.spyCrossed.filter(n => n !== name)
        : [...state.spyCrossed, name];
      return { ...state, spyCrossed: crossed };
    }

    case 'SPY_VOTE_RECEIVED':
      // Deduplicate — each player can only vote once
      if (state.spyVotes[action.voterId]) return state;
      return { ...state, spyVotes: { ...state.spyVotes, [action.voterId]: action.targetId } };

    case 'SPY_SELECT_VOTE': return { ...state, spySelectedVote: action.id };

    case 'SPY_PHASE':
      if (action.phase === 'vote')      return { ...state, screen: 'spy-vote', spySelectedVote: null };
      if (action.phase === 'guess-loc') return { ...state, screen: 'spy-guess-loc' };
      return state;

    case 'SPY_RESULT':
      return { ...state, spyResult: action.result, spyLocation: action.location, spyTimer: 0, screen: 'spy-result' };

    case 'SPY_COMMENCE_VOTE':
      if (state.spyCommenceVotes.includes(action.playerId)) return state;
      return { ...state, spyCommenceVotes: [...state.spyCommenceVotes, action.playerId] };

    case 'HU_SELECT_DECK':   return { ...state, huSelectedDeck: action.deckId };
    case 'HU_CLOSE_DECK':    return { ...state, huSelectedDeck: null };
    case 'HU_SET_FILTER':    return { ...state, [action.key]: action.value, huOpenFilter: null };
    case 'HU_OPEN_FILTER':   return { ...state, huOpenFilter: action.filter };
    case 'HU_CLOSE_FILTER':  return { ...state, huOpenFilter: null };
    case 'HU_SET_PHASE':     return { ...state, huPhase: action.phase };
    case 'HU_SET_COUNTDOWN': return { ...state, huCountdown: action.value };
    case 'HU_SET_TIMER':     return { ...state, huTimer: action.value };
    case 'HU_SET_SESSION':   return { ...state, huSession: action.session, huTimer: action.timer, huPhase: 'wait', huCountdown: 3 };
    case 'HU_UPDATE_SESSION': return { ...state, huSession: { ...action.session } };

    default: return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const roomRef     = useRef(null);
  const stateRef    = useRef(state);
  const spyTimerRef = useRef(null);
  const wakeLockRef = useRef(null);
  const huTimerRef  = useRef(null);
  const huOrientRef = useRef(null);
  const revealedRef = useRef(false); // guards autoReveal from double-fire

  useEffect(() => { stateRef.current = state; }, [state]);

  // Auto-clear toast
  useEffect(() => {
    if (!state.toast) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_TOAST' }), 2700);
    return () => clearTimeout(t);
  }, [state.toast]);

  // ── Wake Lock ────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          if (document.visibilityState === 'visible') requestWakeLock();
        });
      }
    } catch {}
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current && stateRef.current.roomCode) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [requestWakeLock]);

  // ── Spy timer ────────────────────────────────
  const startSpyTimer = useCallback(() => {
    clearInterval(spyTimerRef.current);
    dispatch({ type: 'SPY_TIMER', value: 480 });
    spyTimerRef.current = setInterval(() => {
      const s = stateRef.current;
      const next = Math.max(0, s.spyTimer - 1);
      dispatch({ type: 'SPY_TIMER', value: next });
      if (next === 0) clearInterval(spyTimerRef.current);
    }, 1000);
  }, []);

  // ── Auto-trigger: vote phase when timer hits 0 (host) ──
  useEffect(() => {
    if (!state.isHost || state.screen !== 'spy-discuss' || state.spyTimer !== 0) return;
    triggerVotePhase();
  }, [state.spyTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-trigger: vote phase when everyone wants to commence (host) ──
  useEffect(() => {
    if (!state.isHost || state.screen !== 'spy-discuss') return;
    if (state.players.length > 0 && state.spyCommenceVotes.length >= state.players.length) {
      triggerVotePhase();
    }
  }, [state.spyCommenceVotes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-trigger: reveal when all votes cast (host) ──
  useEffect(() => {
    if (!state.isHost || state.screen !== 'spy-vote') return;
    if (state.players.length > 0 && Object.keys(state.spyVotes).length >= state.players.length) {
      if (!revealedRef.current) {
        revealedRef.current = true;
        autoReveal();
      }
    }
  }, [state.spyVotes]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset revealedRef when moving out of vote screen
  useEffect(() => {
    if (state.screen !== 'spy-vote') revealedRef.current = false;
  }, [state.screen]);

  // ── Message handler ──────────────────────────
  const handleMessage = useCallback((msg) => {
    const s = stateRef.current;
    switch (msg.type) {
      case 'GOTO':
        if (msg.screen === 'lobby') clearInterval(spyTimerRef.current);
        dispatch({ type: 'GOTO', screen: msg.screen });
        break;

      case 'SPY_START':
        if (!s.isHost) {
          dispatch({
            type: 'SPY_STARTED',
            assignments: msg.assignments,
            location: msg.location,
            firstPlayer: msg.firstPlayer,
            myId: roomRef.current?.myId,
          });
          startSpyTimer();
        }
        break;

      case 'SPY_PHASE':
        clearInterval(spyTimerRef.current);
        dispatch({ type: 'SPY_PHASE', phase: msg.phase });
        break;

      case 'SPY_VOTE':
        dispatch({ type: 'SPY_VOTE_RECEIVED', voterId: msg.voterId, targetId: msg.targetId });
        break;

      case 'SPY_RESULT':
        clearInterval(spyTimerRef.current);
        dispatch({ type: 'SPY_RESULT', result: msg.result, location: msg.location });
        break;

      case 'SPY_COMMENCE_VOTE':
        dispatch({ type: 'SPY_COMMENCE_VOTE', playerId: msg.playerId });
        break;
    }
  }, [startSpyTimer]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──────────────────────────────────
  const toast = useCallback((msg) => dispatch({ type: 'TOAST', message: msg }), []);
  const go    = useCallback((screen) => dispatch({ type: 'GO', screen }), []);

  const createRoom = useCallback(async (name) => {
    const rm = new RoomManager(
      handleMessage,
      (players) => dispatch({ type: 'SET_PLAYERS', players }),
      (msg) => toast(msg),
      () => dispatch({ type: 'SET_RECONNECTING', value: true }),
    );
    roomRef.current = rm;
    const code = await rm.createRoom(name);
    dispatch({ type: 'CREATE_ROOM', name, code });
    await requestWakeLock();
    return code;
  }, [handleMessage, requestWakeLock, toast]);

  const joinRoom = useCallback(async (name, code) => {
    const rm = new RoomManager(
      handleMessage,
      (players) => { dispatch({ type: 'SET_PLAYERS', players }); dispatch({ type: 'SET_RECONNECTING', value: false }); },
      (msg) => toast(msg),
      () => dispatch({ type: 'SET_RECONNECTING', value: true }),
    );
    roomRef.current = rm;
    await rm.joinRoom(code, name);
    dispatch({ type: 'JOIN_ROOM', name, code: code.toUpperCase() });
    await requestWakeLock();
  }, [handleMessage, requestWakeLock, toast]);

  const leaveRoom = useCallback(() => {
    clearInterval(spyTimerRef.current);
    clearInterval(huTimerRef.current);
    clearInterval(huOrientRef.current);
    if (window._huTilt) { window.removeEventListener('deviceorientation', window._huTilt); delete window._huTilt; }
    roomRef.current?.destroy();
    roomRef.current = null;
    releaseWakeLock();
    dispatch({ type: 'LEAVE_ROOM' });
  }, [releaseWakeLock]);

  // ── Spy actions ──────────────────────────────
  const startSpy = useCallback(() => {
    const s = stateRef.current;
    const { location, assignments, firstPlayer } = generateAssignments(s.players);
    dispatch({
      type: 'SPY_STARTED',
      assignments,
      location,
      firstPlayer,
      myId: roomRef.current?.myId,
    });
    // Broadcast game start to all guests
    roomRef.current?.send({ type: 'SPY_START', assignments, location, firstPlayer });
    startSpyTimer();
  }, [startSpyTimer]);

  const triggerVotePhase = useCallback(() => {
    clearInterval(spyTimerRef.current);
    const s = stateRef.current;
    if (s.screen === 'spy-vote' || s.screen === 'spy-result' || s.screen === 'spy-guess-loc') return;
    roomRef.current?.send({ type: 'SPY_PHASE', phase: 'vote' });
    dispatch({ type: 'SPY_PHASE', phase: 'vote' });
  }, []);

  const castVote = useCallback((targetId) => {
    const s = stateRef.current;
    const myId = roomRef.current?.myId;
    if (!myId || !targetId || s.spyVotes[myId]) return;
    dispatch({ type: 'SPY_VOTE_RECEIVED', voterId: myId, targetId });
    roomRef.current?.send({ type: 'SPY_VOTE', voterId: myId, targetId });
  }, []);

  const commenceVote = useCallback(() => {
    const myId = roomRef.current?.myId;
    if (!myId) return;
    const s = stateRef.current;
    if (s.spyCommenceVotes.includes(myId)) return;
    dispatch({ type: 'SPY_COMMENCE_VOTE', playerId: myId });
    roomRef.current?.send({ type: 'SPY_COMMENCE_VOTE', playerId: myId });
  }, []);

  const autoReveal = useCallback(() => {
    const s = stateRef.current;
    if (!s.isHost) return;
    const result = getVoteResult(s.spyVotes, s.spyAssignments);
    result.spyGuessedLocation = false;
    clearInterval(spyTimerRef.current);
    if (result.caughtSpy) {
      roomRef.current?.send({ type: 'SPY_PHASE', phase: 'guess-loc' });
      dispatch({ type: 'SPY_PHASE', phase: 'guess-loc' });
    } else {
      roomRef.current?.send({ type: 'SPY_RESULT', result, location: s.spyLocation });
      dispatch({ type: 'SPY_RESULT', result, location: s.spyLocation });
    }
  }, []);

  const spyGuessLocation = useCallback((guessName) => {
    const s = stateRef.current;
    if (!s.spyMyAssignment?.isSpy) return;
    const correct = s.spyLocation?.name === guessName;
    const result = getVoteResult(s.spyVotes, s.spyAssignments);
    result.spyGuessedLocation = correct;
    result.caughtSpy = true;
    clearInterval(spyTimerRef.current);
    roomRef.current?.send({ type: 'SPY_RESULT', result, location: s.spyLocation });
    dispatch({ type: 'SPY_RESULT', result, location: s.spyLocation });
  }, []);

  // ── HeadsUp actions ──────────────────────────
  const playBeep = (freq, dur) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = freq; o.type = 'sine';
      g.gain.setValueAtTime(0.4, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch {}
  };

  const huEnd = useCallback(() => {
    clearInterval(huTimerRef.current);
    clearInterval(huOrientRef.current);
    if (window._huTilt) { window.removeEventListener('deviceorientation', window._huTilt); delete window._huTilt; }
    if (document.exitFullscreen && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen && document.webkitFullscreenElement) document.webkitExitFullscreen();
    go('hu-result');
  }, [go]);

  const huGot = useCallback(() => {
    const s = stateRef.current;
    if (!s.huSession || s.huSession.isDone()) return;
    s.huSession.markGot();
    dispatch({ type: 'HU_UPDATE_SESSION', session: s.huSession });
    if (s.huSession.isDone()) huEnd();
  }, [huEnd]);

  const huSkip = useCallback(() => {
    const s = stateRef.current;
    if (!s.huSession || s.huSession.isDone()) return;
    s.huSession.markSkip();
    dispatch({ type: 'HU_UPDATE_SESSION', session: s.huSession });
    if (s.huSession.isDone()) huEnd();
  }, [huEnd]);

  const huAttachTilt = useCallback(() => {
    if (window._huTilt) window.removeEventListener('deviceorientation', window._huTilt);
    const calibSamples = [];
    const CALIB = 20, THRESHOLD = 28, RESET_ZONE = 10;
    let baseline = null, needsReset = true;
    window._huTilt = (e) => {
      const s = stateRef.current;
      if (s.screen !== 'hu-play' || s.huPhase !== 'playing') return;
      const b = e.beta;
      if (b === null) return;
      if (baseline === null) {
        calibSamples.push(b);
        if (calibSamples.length >= CALIB) baseline = calibSamples.reduce((a, x) => a + x, 0) / CALIB;
        return;
      }
      const tilt = b - baseline;
      if (needsReset) { if (Math.abs(tilt) < RESET_ZONE) needsReset = false; return; }
      if      (tilt < -THRESHOLD) { needsReset = true; huGot(); }
      else if (tilt >  THRESHOLD) { needsReset = true; huSkip(); }
    };
    window.addEventListener('deviceorientation', window._huTilt);
  }, [huGot, huSkip]);

  const huStartTimer = useCallback(() => {
    clearInterval(huTimerRef.current);
    huTimerRef.current = setInterval(() => {
      const s = stateRef.current;
      const next = Math.max(0, s.huTimer - 1);
      dispatch({ type: 'HU_SET_TIMER', value: next });
      if (next === 0) { clearInterval(huTimerRef.current); huEnd(); }
    }, 1000);
  }, [huEnd]);

  const huStartCountdown = useCallback(() => {
    dispatch({ type: 'HU_SET_PHASE', phase: 'countdown' });
    dispatch({ type: 'HU_SET_COUNTDOWN', value: 3 });
    playBeep(880, 0.14);
    let count = 3;
    huOrientRef.current = setInterval(() => {
      count--;
      dispatch({ type: 'HU_SET_COUNTDOWN', value: count });
      if (count > 0) { playBeep(880, 0.14); }
      else {
        clearInterval(huOrientRef.current);
        playBeep(1320, 0.3);
        setTimeout(() => {
          if (stateRef.current.screen !== 'hu-play') return;
          dispatch({ type: 'HU_SET_PHASE', phase: 'playing' });
          huAttachTilt();
          huStartTimer();
        }, 450);
      }
    }, 1000);
  }, [huAttachTilt, huStartTimer]);

  const startHeadsUp = useCallback((deckId) => {
    const launch = () => {
      clearInterval(huTimerRef.current);
      clearInterval(huOrientRef.current);
      if (window._huTilt) { window.removeEventListener('deviceorientation', window._huTilt); delete window._huTilt; }
      const session = new HeadsUpSession(deckId);
      dispatch({ type: 'HU_SET_SESSION', session, timer: session.timeLimit });
      go('hu-play');
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(launch).catch(launch);
    } else {
      launch();
    }
  }, [go]);

  const value = {
    state,
    dispatch,
    roomRef,
    actions: {
      go, toast, createRoom, joinRoom, leaveRoom,
      startSpy, triggerVotePhase, castVote, commenceVote, spyGuessLocation,
      startHeadsUp, huStartCountdown, huGot, huSkip, huEnd,
    },
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() { return useContext(GameContext); }
