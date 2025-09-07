import './AuthForm.css';
import React, { useState } from 'react';
import { useUser } from '@/lib/state';

type SignUpFormProps = {
  onSignUp: () => void;
  onSwitchToLogin: () => void;
};

export default function SignUpForm({
  onSignUp,
  onSwitchToLogin,
}: SignUpFormProps) {
  const { setName, setCollege, setState } = useUser();
  const [nameInput, setNameInput] = useState('');
  const [collegeInput, setCollegeInput] = useState('');
  const [stateInput, setStateInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Set user info in global state
    setName(nameInput);
    setCollege(collegeInput);
    setState(stateInput);
    // Simulate successful signup and login
    onSignUp();
  };

  return (
    <div className="auth-form-container">
      <h1>Sign Up</h1>
      <p>Create an account to begin your training.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            required
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input type="email" id="signup-email" name="email" required />
        </div>
        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            type="password"
            id="signup-password"
            name="password"
            required
          />
        </div>
        <div className="form-group optional">
          <label htmlFor="college">College / Organization (Optional)</label>
          <input
            type="text"
            id="college"
            name="college"
            value={collegeInput}
            onChange={e => setCollegeInput(e.target.value)}
            placeholder="Helps the AI cook up better bait"
          />
        </div>
        <div className="form-group optional">
          <label htmlFor="state">State (Optional)</label>
          <input
            type="text"
            id="state"
            name="state"
            value={stateInput}
            onChange={e => setStateInput(e.target.value)}
          />
        </div>
        <button type="submit" className="button primary auth-button">
          Create Account
        </button>
      </form>
      <p className="switch-view-text">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="switch-view-button">
          Log In
        </button>
      </p>
    </div>
  );
}