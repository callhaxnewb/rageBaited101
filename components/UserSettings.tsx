import './UserSettings.css';
import Modal from './Modal';
import { useDebate, useUI } from '@/lib/state';
import { useState } from 'react';

export default function UserSettings() {
  const { setShowUserConfig } = useUI();
  const { startOnboarding, topic, setTopic, stance, setStance } = useDebate();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');

  function handleNext() {
    if (!topic.trim()) {
      setError('You gotta give me a topic to cook with.');
      return;
    }
    setError('');
    setStep(2);
  }

  function handleStart() {
    if (!stance.trim()) {
      setError("C'mon, what's your take? Don't be shy.");
      return;
    }
    setError('');
    setShowUserConfig(false);
    startOnboarding();
  }

  return (
    <Modal onClose={() => setShowUserConfig(false)}>
      <div className="userSettings">
        {step === 1 && (
          <>
            <h2>Welcome to the RageBait Trainer!</h2>
            <p>
              This is an unhinged, real-time rage bait simulator designed to
              help you master the art of online chaos and develop an unshakable
              mental frame.
            </p>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleNext();
              }}
            >
              <p>First, what's a topic you feel strongly about?</p>
              <input
                type="text"
                name="topic"
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="e.g., 'Star Wars sequels are underrated'"
                autoFocus
              />

              {error && <p className="error-message">{error}</p>}
              <button type="submit" className="button primary">
                Next <span className="icon">arrow_forward</span>
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <h2>Aight, bet.</h2>
            <p className="topic-recap">
              Topic: <strong>"{topic}"</strong>
            </p>
            <p>Now, what's your actual take? What do you believe?</p>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleStart();
              }}
            >
              <textarea
                name="stance"
                value={stance}
                onChange={e => setStance(e.target.value)}
                placeholder="e.g., 'The sequels had the best character development and lightsaber fights, no cap.'"
                rows={4}
                autoFocus
              />

              {error && <p className="error-message">{error}</p>}

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="button secondary"
                >
                  <span className="icon">arrow_back</span> Back
                </button>
                <button type="submit" className="button primary">
                  Let's Cook
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}