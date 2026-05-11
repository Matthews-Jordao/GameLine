import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { Icon } from '../lib/icons.jsx';

export default function Setup() {
  const { state, dispatch, actions } = useGame();
  const [name, setName] = useState(state.myName || '');
  const [code, setCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);

  // Pre-fill code from ?join= URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      setCode(joinCode.toUpperCase());
      actions.toast('Enter your name then join!');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!name.trim()) { actions.toast('Enter your name first!'); return; }
    setCreating(true);
    try {
      await actions.createRoom(name.trim());
    } catch (e) {
      actions.toast(e.message || 'Could not create room');
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!name.trim()) { actions.toast('Enter your name first!'); return; }
    if (!code.trim() || code.trim().length < 4) { actions.toast('Enter the 4-letter room code!'); return; }
    setJoining(true);
    try {
      await actions.joinRoom(name.trim(), code.trim().toUpperCase());
    } catch (e) {
      actions.toast(e.message || 'Could not join room');
      setJoining(false);
    }
  };

  if (state.selectedGame === 'spy') {
    return (
      <div className="ss-wrap">
        <button className="ss-back" onClick={() => dispatch({ type: 'GO', screen: 'home' })}>
          <Icon name="back" /> Back
        </button>
        <div className="ss-hero">
          <div className="ss-agency-label">GAMELINE INTELLIGENCE DIVISION</div>
          <div className="ss-emblem">
            <div className="ss-emblem-ring"><Icon name="spy" /></div>
            <div className="ss-emblem-ping" />
          </div>
          <div className="ss-op-label">// OPERATION //</div>
          <div className="ss-title">Secret Agent</div>
          <div className="ss-classified-stamp">CLASSIFIED</div>
          <div className="ss-badge-row">
            <span className="ss-badge">👥 3–10 AGENTS</span>
            <span className="ss-badge">🌐 MULTI-DEVICE</span>
          </div>
        </div>

        <div className="ss-folder">
          <div className="ss-folder-tab">AGENT DOSSIER</div>
          <div className="ss-folder-body">
            <div className="ss-folder-stamp">TOP SECRET</div>
            <div className="ss-field-label">AGENT DESIGNATION</div>
            <div className="ss-input-wrap">
              <span className="ss-input-icon"><Icon name="person" /></span>
              <input className="ss-input" id="inp-name" placeholder="Enter your name…" maxLength={16}
                value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoComplete="off" autoCorrect="off" spellCheck="false" />
            </div>
            <button className="ss-btn-create btn" onClick={handleCreate} disabled={creating}>
              <Icon name="home" /> {creating ? 'Creating…' : 'INITIATE MISSION'}
            </button>
            <div className="ss-or"><span>or enter access code</span></div>
            <div className="ss-join-row">
              <input className="ss-code-input" placeholder="ABCD" maxLength={4}
                value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                autoComplete="off" autoCorrect="off" autoCapitalize="characters" spellCheck="false" />
              <button className="ss-join-btn btn" onClick={handleJoin} disabled={joining}>
                <Icon name="arrow" />
              </button>
            </div>
          </div>
        </div>
        <div className="ss-footer"><Icon name="lock" /> CLASSIFIED · EYES ONLY · DO NOT DISTRIBUTE</div>
      </div>
    );
  }

  return (
    <div className="screen">
      <nav className="nav-bar">
        <button className="nav-back" onClick={() => dispatch({ type: 'GO', screen: 'home' })}>
          <Icon name="back" /> Back
        </button>
        <div className="nav-title--center">Game Line</div>
      </nav>
      <div className="setup-form">
        <div className="input-wrap">
          <span className="input-icon"><Icon name="person" /></span>
          <input className="input" placeholder="Your name..." maxLength={16}
            value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoComplete="off" autoCorrect="off" spellCheck="false" />
        </div>
        <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
          <Icon name="home" /> {creating ? 'Creating…' : 'Create a Room'}
        </button>
        <div className="divider">or join a room</div>
        <div className="join-row">
          <input className="input-code" placeholder="ABCD" maxLength={4}
            value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            autoComplete="off" autoCapitalize="characters" spellCheck="false" />
          <button className="btn btn-green btn-join" onClick={handleJoin} disabled={joining}>
            <Icon name="arrow" />
          </button>
        </div>
        <div className="hint-text"><Icon name="lock" /> Free forever · Works in any browser</div>
      </div>
    </div>
  );
}
