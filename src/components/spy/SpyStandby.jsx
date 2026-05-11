import { useGame } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';

export default function SpyStandby() {
  const { state, actions, roomRef } = useGame();

  const startGame = () => {
    actions.startSpy();
  };

  return (
    <div className="sa-screen">
      <div className="sa-topbar">
        <button className="sa-back-btn" onClick={actions.leaveRoom}><Icon name="back" /> LEAVE</button>
        <div className="sa-topbar-brand">SECRET AGENT</div>
        <div className="sa-topbar-phase">BRIEFING</div>
      </div>

      <div className="sa-role-hero">
        <div className="sa-role-emblem">
          <div className="sa-role-emblem-ring"><Icon name="spy" /></div>
          <div className="sa-emblem-ping" />
          <div className="sa-emblem-ping sa-emblem-ping--delay" />
        </div>
        <div className="sa-role-you-are">OPERATION</div>
        <div className="sa-role-name">STANDING BY</div>
      </div>

      {/* ── HOW TO PLAY ── */}
      <div className="sa-how-to-play">
        <div className="sa-htp-title">HOW TO PLAY</div>

        <div className="sa-htp-section">
          <div className="sa-htp-section-label">THE SETUP</div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="spy" /></span>
            <span>One player is secretly the <strong>Spy</strong>. Everyone else knows the secret location and their role — the spy knows neither.</span>
          </div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="person" /></span>
            <span>Each player gets their assignment on their own device. Keep it secret — don't show anyone.</span>
          </div>
        </div>

        <div className="sa-htp-section">
          <div className="sa-htp-section-label">THE DISCUSSION (8 MIN)</div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="chat" /></span>
            <span>A randomly chosen player goes first and asks anyone a question. The person who answers then gets to ask the next question.</span>
          </div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="shield" /></span>
            <span><strong>Agents:</strong> Ask clever questions to expose the spy without revealing the location to them.</span>
          </div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="badge" /></span>
            <span><strong>Spy:</strong> Listen carefully, blend in, and try to figure out the location. Use your list to eliminate locations.</span>
          </div>
        </div>

        <div className="sa-htp-section">
          <div className="sa-htp-section-label">VOTING</div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="vote" /></span>
            <span>When the timer ends — or when <strong>all players</strong> tap "Commence Voting" — everyone votes on who they think the spy is.</span>
          </div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="check" /></span>
            <span>The player with the most votes is accused. If they're the spy, the spy gets one final chance to guess the location to escape.</span>
          </div>
        </div>

        <div className="sa-htp-section">
          <div className="sa-htp-section-label">WINNING</div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="people" /></span>
            <span><strong>Agents win</strong> if they vote out the spy and the spy can't name the location.</span>
          </div>
          <div className="sa-htp-row">
            <span className="sa-htp-icon"><Icon name="spy" /></span>
            <span><strong>Spy wins</strong> if an innocent player gets voted out, OR if the spy correctly guesses the location after being caught.</span>
          </div>
        </div>
      </div>

      <div className="sa-role-footer">
        {state.isHost
          ? <button className="sa-btn-mission btn" onClick={startGame}><Icon name="arrow" /> START OPERATION</button>
          : <div className="sa-standby-msg">Awaiting handler command...</div>
        }
      </div>
    </div>
  );
}
