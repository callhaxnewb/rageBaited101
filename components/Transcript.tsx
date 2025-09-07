import './Transcript.css';
import { useDebate } from '@/lib/state';
import React, { useEffect, useRef } from 'react';
import c from 'classnames';

export default function Transcript() {
  const { transcript } = useDebate();
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop =
        transcriptContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="transcript-container" ref={transcriptContainerRef}>
      <div className="transcript">
        {transcript.map((item, index) => (
          <div
            key={index}
            className={c('transcript-item', {
              'user-message': !!item.isUser,
              'system-message': item.speaker.toLowerCase() === 'system',
            })}
          >
            <span className="speaker">{item.speaker}:</span>
            <span className="text">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}