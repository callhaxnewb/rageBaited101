import { useState } from 'react';
import './LoginScreen.css';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';

type LoginScreenProps = {
  onLogin: () => void;
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [view, setView] = useState<'login' | 'signup'>('login');

  const switchToSignUp = () => setView('signup');
  const switchToLogin = () => setView('login');

  return (
    <div className="login-screen">
      <div className="auth-container">
        {view === 'login' ? (
          <LoginForm onLogin={onLogin} onSwitchToSignUp={switchToSignUp} />
        ) : (
          <SignUpForm onSignUp={onLogin} onSwitchToLogin={switchToLogin} />
        )}
      </div>
    </div>
  );
}