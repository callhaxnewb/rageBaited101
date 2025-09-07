import React from 'react';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import './Buddy.css';

const AUDIO_OUTPUT_DETECTION_THRESHOLD = 0.05;

type BuddyProps = {
  color?: string;
};

export default function Buddy({ color = '#9f5dff' }: BuddyProps) {
  const { volume } = useLiveAPIContext();
  const isTalking = volume > AUDIO_OUTPUT_DETECTION_THRESHOLD;

  // Dynamically adjust styles based on volume
  const coreScale = 1 + volume * 2;
  const glowIntensity = Math.min(1, 0.2 + volume * 5); // Glow opacity

  const dynamicStyles = {
    '--color-main': color,
    '--color-glow': `${color}${Math.round(glowIntensity * 255).toString(16).padStart(2, '0')}`,
  } as React.CSSProperties;

  return (
    <div className="ai-core-container" style={dynamicStyles}>
      <div className="ai-core core-ring-1"></div>
      <div className="ai-core core-ring-2"></div>
      <div className="ai-core core-ring-3"></div>
      <div
        className={`core-center ${isTalking ? 'is-talking' : ''}`}
        style={{ transform: `scale(${coreScale})` }}
      ></div>
    </div>
  );
}