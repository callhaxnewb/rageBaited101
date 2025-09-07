import './AgentEdit.css';
import { useRef } from 'react';
import { Agent } from '@/lib/presets/agents';
import { useAgent, useUI } from '@/lib/state';

export default function EditAgent() {
  const agents = useAgent(state => state.agents);
  const currentAgentId = useAgent(state => state.currentAgentId);
  const agent = agents.find(a => a.id === currentAgentId);
  const updateAgent = useAgent(state => state.update);
  const nameInput = useRef(null);
  const { setShowAgentEdit } = useUI();

  function onClose() {
    setShowAgentEdit(false);
  }

  function updateCurrentAgent(adjustments: Partial<Agent>) {
    if (agent) {
      updateAgent(agent.id, adjustments);
    }
  }

  if (!agent) {
    return null;
  }

  return (
    <div className="edit-agent-panel">
      <form className="editAgent">
        <div className="agent-form-name">
          <input
            className="largeInput"
            type="text"
            placeholder="Name"
            value={agent.name}
            onChange={e => updateCurrentAgent({ name: e.target.value })}
            ref={nameInput}
          />
        </div>
        <div className="agent-form-personality">
          <label>Personality</label>
          <textarea
            value={agent.personality}
            onChange={e =>
              updateCurrentAgent({ personality: e.target.value })
            }
            rows={9}
            placeholder="What's my vibe? Am I a chill troll or a chaos agent? What's my agenda?"
          />
        </div>
      </form>
      <div className="edit-agent-actions">
        <button
          onClick={() => onClose()}
          className="button primary"
        >
          Done
        </button>
      </div>
    </div>
  );
}