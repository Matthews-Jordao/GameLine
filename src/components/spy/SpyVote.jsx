import { useGame, avClass } from '../../context/GameContext.jsx';
import { Icon } from '../../lib/icons.jsx';

export default function SpyVote() {
  const { state, dispatch, actions, roomRef } = useGame();
  const myId = roomRef.current?.myId;
  const myVote = state.spyVotes[myId];
  const selected = state.spySelectedVote;
  const others = state.players.filter(p => p.id !== myId);
  const voteCount = Object.keys(state.spyVotes).length;

  return (
    <div className="sa-screen">
      <div className="sa-topbar">
        <button className="sa-back-btn" onClick={actions.leaveRoom}><Icon name="back" /> LEAVE</button>
        <div className="sa-topbar-brand">SECRET AGENT</div>
        <div className="sa-topbar-phase">VOTE</div>
      </div>

      <div className="sa-vote-hero">
        <div className="sa-vote-emblem"><Icon name="spy" /></div>
        <div className="sa-vote-title">IDENTIFY THE SPY</div>
        <div className="sa-vote-sub">{voteCount} of {state.players.length} agents confirmed</div>
      </div>

      <div className="sa-vote-list">
        {others.map(p => {
          const isSelected = !myVote && selected === p.id;
          const isVoted    = myVote === p.id;
          return (
            <button key={p.id}
              className={`sa-vote-option ${isSelected || isVoted ? 'sa-vote-option--selected' : ''} ${myVote ? 'sa-vote-option--locked' : ''}`}
              onClick={() => { if (!myVote) dispatch({ type: 'SPY_SELECT_VOTE', id: p.id }); }}
              disabled={!!myVote}>
              <div className={`sa-agent-av ${avClass(p.name)}`}>{p.name.charAt(0).toUpperCase()}</div>
              <div className="sa-vote-name">{p.name}</div>
              <div className="sa-vote-meta">
                {isVoted && <span className="sa-vote-check"><Icon name="check" /></span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="sa-vote-footer">
        {myVote
          ? <div className="sa-standby-msg">Vote confirmed — awaiting all agents...</div>
          : (
            <>
              <button className="sa-btn-mission btn" onClick={() => { if (selected) actions.castVote(selected); }} disabled={!selected}>
                <Icon name="vote" /> CONFIRM VOTE
              </button>
              {!selected && <div className="sa-hint-text">Select a suspect first</div>}
            </>
          )
        }
      </div>
    </div>
  );
}
