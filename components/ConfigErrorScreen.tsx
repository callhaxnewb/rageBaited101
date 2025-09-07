import './ConfigErrorScreen.css';

type ConfigErrorScreenProps = {
  missingKeys: string[];
};

export default function ConfigErrorScreen({
  missingKeys,
}: ConfigErrorScreenProps) {
  return (
    <div className="config-error-screen">
      <div className="config-error-box">
        <div className="icon-container">
          <span className="icon">error</span>
        </div>
        <h2>Configuration Error</h2>
        <p>The application cannot start because the following required environment variables are missing:</p>
        <ul>
          {missingKeys.map(key => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
        <p className="instructions">
          Please ensure these are set in your environment and restart the application.
        </p>
      </div>
    </div>
  );
}