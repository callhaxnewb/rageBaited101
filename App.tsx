import './App.css';
import { useState, useEffect } from 'react';
import ErrorScreen from './components/demo/ErrorSreen';
import UserSettings from './components/UserSettings';
import { LiveAPIProvider } from './contexts/LiveAPIContext';
import { useDebate, useUI } from './lib/state';
import PreparationScreen from './components/PreparationScreen';
import DebateScreen from './components/DebateScreen';
import ControlTray from './components/console/control-tray/ControlTray';
import Header from './components/Header';
import EditAgent from './components/AgentEdit';
import AnalysisScreen from './components/AnalysisScreen';
import Notepad from './components/Notepad';
import OnboardingChoice from './components/OnboardingChoice';
import WarmUpScreen from './components/WarmUpScreen';
import LoginScreen from './components/LoginScreen';
import ConfigErrorScreen from './components/ConfigErrorScreen';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
/**
 * Main application component that provides a real-time debate simulation.
 */
function App() {
  const { status } = useDebate();
  const { showUserConfig, showAgentEdit } = useUI();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkLoggedIn = () => {
      let token = localStorage.getItem('auth-token');
      if (token === null) {
        localStorage.setItem('auth-token', '');
        token = '';
      }
      if (token) {
        setIsAuthenticated(true);
      }
    };
    checkLoggedIn();
  }, []);

  if (typeof API_KEY !== 'string' || !API_KEY) {
    return <ConfigErrorScreen missingKeys={['API_KEY']} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="App">
      <LiveAPIProvider apiKey={API_KEY}>
        <ErrorScreen />
        {showUserConfig && <UserSettings />}
        {showAgentEdit && <EditAgent />}
        {status !== 'idle' && status !== 'analyzing' && <Header />}
        <main className="main-container">
          {status === 'idle' && (
            <div className="welcome-screen">
              <h1>RageBait Trainer</h1>
              <p>
                Master the art of online chaos. Learn to dish out and handle
                epic rage bait.
              </p>
              <p>Configure your user settings to begin.</p>
            </div>
          )}
          {status === 'onboarding' && <OnboardingChoice />}
          {status === 'preparing' && <PreparationScreen />}
          {status === 'warming-up' && <WarmUpScreen />}
          {status === 'debating' && <DebateScreen />}
          {status === 'analyzing' && <AnalysisScreen />}
          {(status === 'preparing' ||
            status === 'debating' ||
            status === 'warming-up') && <Notepad />}
        </main>
        {status !== 'idle' && status !== 'analyzing' && <ControlTray />}
      </LiveAPIProvider>
    </div>
  );
}

export default App;