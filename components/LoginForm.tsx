import './AuthForm.css';

type LoginFormProps = {
  onLogin: () => void;
  onSwitchToSignUp: () => void;
};

export default function LoginForm({ onLogin, onSwitchToSignUp }: LoginFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate successful login
    onLogin();
  };

  return (
    <div className="auth-form-container">
      <h1>Log In</h1>
      <p>Welcome back. Enter the arena.</p>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit" className="button primary auth-button">
          Log In
        </button>
      </form>
      <p className="switch-view-text">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignUp} className="switch-view-button">
          Sign Up
        </button>
      </p>
    </div>
  );
}