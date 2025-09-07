import './ControlTray.css';
import cn from 'classnames';
import { memo, useEffect, useRef, useState } from 'react';
import { AudioRecorder } from '../../../lib/audio-recorder';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { Difficulty, useDebate, useUser } from '@/lib/state';

// TypeScript declarations for the Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

interface SpeechRecognitionStatic {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionStatic;
    webkitSpeechRecognition: SpeechRecognitionStatic;
  }
}

function ControlTray() {
  const [audioRecorder] = useState(() => new AudioRecorder());
  const { client, connected, disconnect } = useLiveAPIContext();
  const {
    difficulty,
    setDifficulty,
    status,
    startDebate,
    endDebate,
    endWarmUp,
    addTranscriptItem,
    isUserMuted,
    setIsUserMuted,
    incrementUserSpeakingTime,
    resetUserSpeakingTime,
    setIsUserCurrentlySpeaking,
  } = useDebate();
  const { name } = useUser();

  const isDebating = status === 'debating';
  const isWarmingUp = status === 'warming-up';

  // Toggle mute functionality
  useEffect(() => {
    if (!isDebating && !isWarmingUp) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle mute on spacebar press
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setIsUserMuted(!useDebate.getState().isUserMuted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Ensure mic is muted when session ends
      setIsUserMuted(true);
    };
  }, [isDebating, isWarmingUp, setIsUserMuted]);

  const speakingTimerRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);

  // User speaking detection for timer
  useEffect(() => {
    const SPEAKING_THRESHOLD = 0.02; // Volume threshold to consider as speaking

    const onVolume = (volume: number) => {
      if (volume > SPEAKING_THRESHOLD) {
        // User is speaking
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          setIsUserCurrentlySpeaking(true);
        }
        if (!speakingTimerRef.current) {
          speakingTimerRef.current = window.setInterval(() => {
            incrementUserSpeakingTime();
          }, 1000);
        }
      } else {
        // User is silent or background noise
        if (isSpeakingRef.current && !silenceTimeoutRef.current) {
          silenceTimeoutRef.current = window.setTimeout(() => {
            // If still silent after a delay, stop the timer.
            isSpeakingRef.current = false;
            setIsUserCurrentlySpeaking(false);
            if (speakingTimerRef.current) {
              clearInterval(speakingTimerRef.current);
              speakingTimerRef.current = null;
            }
          }, 750); // 750ms of silence to register as stopped talking
        }
      }
    };

    if (!isUserMuted && (isDebating || isWarmingUp)) {
      audioRecorder.on('volume', onVolume);
    } else {
      // Cleanup when muted or debate ends
      if (isSpeakingRef.current) {
        isSpeakingRef.current = false;
        setIsUserCurrentlySpeaking(false);
      }
      resetUserSpeakingTime();
      if (speakingTimerRef.current) {
        clearInterval(speakingTimerRef.current);
        speakingTimerRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
      audioRecorder.off('volume', onVolume);
    }

    return () => {
      audioRecorder.off('volume', onVolume);
    };
  }, [
    isUserMuted,
    isDebating,
    isWarmingUp,
    audioRecorder,
    incrementUserSpeakingTime,
    resetUserSpeakingTime,
    setIsUserCurrentlySpeaking,
  ]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: 'audio/pcm;rate=16000',
          data: base64,
        },
      ]);
    };
    if (connected && !isUserMuted && audioRecorder) {
      audioRecorder.on('data', onData);
      audioRecorder.start();
    } else {
      audioRecorder.stop();
    }
    return () => {
      audioRecorder.stop();
      audioRecorder.off('data', onData);
    };
  }, [connected, client, isUserMuted, audioRecorder]);

  const handleSessionControl = () => {
    if (status === 'debating') {
      disconnect();
      endDebate();
    } else if (status === 'preparing') {
      startDebate();
    }
  };

  const handleEndWarmUp = () => {
    disconnect();
    endWarmUp();
  };

  const isPreparing = status === 'preparing';
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Effect for Web Speech API transcription
  useEffect(() => {
    if ((!isDebating && !isWarmingUp) || isUserMuted) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      console.error('Speech Recognition not supported in this browser.');
      addTranscriptItem({
        speaker: 'System',
        text: 'Sorry, your browser does not support the speech-to-text feature for transcription.',
      });
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = false; // Only capture final results
      // Use en-IN for better recognition of Indian English and Hinglish code-switching.
      recognition.lang = 'en-IN';
      recognitionRef.current = recognition;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Iterate through all new results since the last event
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          // Check if the result is final and has content
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            if (transcript) {
              addTranscriptItem({
                speaker: name || 'You',
                text: transcript,
                isUser: true,
              });
            }
          }
        }
      };

      recognition.onend = () => {
        // The service sometimes stops. If we are still in a session and not muted, restart it.
        const currentState = useDebate.getState();
        if (
          (currentState.status === 'debating' ||
            currentState.status === 'warming-up') &&
          !currentState.isUserMuted
        ) {
          recognitionRef.current?.start();
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
      };
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Can throw if already started.
      console.warn('Could not start speech recognition', e);
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, [isDebating, isWarmingUp, isUserMuted, addTranscriptItem, name]);

  return (
    <section className="control-tray">
      <div className="difficulty-selector">
        {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
          <button
            key={d}
            className={cn('difficulty-button', { active: difficulty === d })}
            onClick={() => setDifficulty(d)}
            disabled={isDebating || isWarmingUp}
          >
            {d}
          </button>
        ))}
      </div>

      {isWarmingUp ? (
        <button className="end-warmup-button" onClick={handleEndWarmUp}>
          End Warm-Up
        </button>
      ) : (
        <button
          className="action-button connect-toggle"
          onClick={handleSessionControl}
          disabled={!isPreparing && !isDebating}
        >
          <span className="material-symbols-outlined filled">
            {isDebating ? 'pause' : 'play_arrow'}
          </span>
        </button>
      )}

      <div className="mic-container">
        <button
          className={cn('action-button mic-button', { muted: isUserMuted })}
          disabled={!isDebating && !isWarmingUp}
          onClick={() => setIsUserMuted(!isUserMuted)}
          aria-live="polite"
          aria-label={
            isUserMuted
              ? 'Microphone muted, press to unmute'
              : 'Microphone on, press to mute'
          }
        >
          {!isUserMuted ? (
            <span className="material-symbols-outlined filled">mic</span>
          ) : (
            <span className="material-symbols-outlined filled">mic_off</span>
          )}
        </button>
        <span className="push-to-talk-label">
          {isDebating || isWarmingUp ? 'Press SPACE to toggle mic' : ''}
        </span>
      </div>
    </section>
  );
}

export default memo(ControlTray);