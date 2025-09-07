import './OnboardingChoice.css';
import Modal from './Modal';
import { useDebate } from '@/lib/state';

export default function OnboardingChoice() {
  const { startWarmUp, startPreparation } = useDebate();

  function handleStartDebate() {
    startPreparation();
  }

  function handleStartWarmup() {
    startWarmUp();
  }

  // A modal that doesn't close on shroud click or escape key
  return (
    <Modal onClose={() => {}}>
      <div className="onboarding-choice">
        <h2>Aight, bet.</h2>
        <p>
          You tryna jump straight into the fire or you need a quick warm-up to
          check the vibes? The warm-up is unscored, it's not that deep.
        </p>
        <div className="onboarding-actions">
          <button onClick={handleStartWarmup} className="button">
            <span className="icon">coffee</span> Vibe Check (Warm-up)
          </button>
          <button onClick={handleStartDebate} className="button primary">
            <span className="icon">gavel</span> Enter the Arena (Scored)
          </button>
        </div>
      </div>
    </Modal>
  );
}