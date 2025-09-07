import './PreparationScreen.css';
import { useDebate } from '@/lib/state';
import React, { useEffect, useState } from 'react';

export default function PreparationScreen() {
  const { topic, startDebate } = useDebate();
  const [timer, setTimer] = useState(120); // 2 minutes in seconds

  useEffect(() => {
    if (timer <= 0) {
      startDebate();
      return;
    }

    const intervalId = setInterval(() => {
      setTimer(prevTimer => prevTimer - 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timer, startDebate]);

  const minutes = Math.floor(timer / 60);
  const seconds = timer % 60;

  const handleReadyClick = () => {
    setTimer(0); // This will trigger the useEffect to start the debate
  };

  return (
    <div className="preparation-screen">
      <div className="prep-content">
        <h2>Lock In</h2>
        <p className="topic-label">Your Topic Is:</p>
        <h3 className="topic-title">{topic}</h3>
        <div className="timer">{`${minutes}:${seconds.toString().padStart(2, '0')}`}</div>
        <p className="prep-instruction">
          You have 2 minutes to cook up your most unhinged takes. Make it spicy.
        </p>
        <button onClick={handleReadyClick} className="button primary ready-button">
          I'm Locked In
        </button>
      </div>
    </div>
  );
}