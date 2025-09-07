import './Header.css';
import { useUI, useUser } from '@/lib/state';

export default function Header() {
  const { showUserConfig, setShowUserConfig, setShowAgentEdit } = useUI();
  const { name } = useUser();

  return (
    <header>
      <div className="header-title">
        <h1>RageBait Trainer</h1>
      </div>
      <div className="header-controls">
        <button
          onClick={() => setShowAgentEdit(true)}
          className="header-button edit-agent-button"
        >
          <span className="icon">edit</span> Edit Troll
        </button>
        <button
          className="userSettingsButton"
          onClick={() => setShowUserConfig(!showUserConfig)}
        >
          <p className="user-name">{name || 'Your name'}</p>
          <span className="icon">tune</span>
        </button>
      </div>
    </header>
  );
}