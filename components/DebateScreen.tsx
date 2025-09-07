import './DebateScreen.css';
import { useEffect, useRef } from 'react';
import { Modality, Part } from '@google/genai';
import Buddy from './Buddy';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { createSystemInstructions } from '@/lib/prompts';
import { useAgent, useDebate, useUser } from '@/lib/state';
import Transcript from './Transcript';
import { PERSONAS } from '@/lib/presets/personas';
import { audioContext } from '@/lib/utils';

const DEBATE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

function ClosingTimer() {
  const { debatePhase, closingTimer } = useDebate();
  const agent = useAgent(state =>
    state.agents.find(a => a.id === state.currentAgentId),
  );

  if (debatePhase === 'open') {
    return null;
  }

  const speaker = debatePhase === 'userClosing' ? 'Your' : `${agent?.name}'s`;
  const time = Math.max(0, closingTimer);
  const isOvertime = closingTimer < 0;

  return (
    <div className="closing-timer-container">
      <h3>{speaker} Closing Statement</h3>
      <div className={`timer-display ${isOvertime ? 'overtime' : ''}`}>
        0:{time.toString().padStart(2, '0')}
      </div>
    </div>
  );
}

function playChime() {
  audioContext().then(ctx => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  });
}

export default function DebateScreen() {
  const { client, connected, setConfig, connect, disconnect, volume } =
    useLiveAPIContext();
  const user = useUser();
  const {
    addTranscriptItem,
    endDebate,
    difficulty,
    isUserMuted,
    debatePhase,
    setDebatePhase,
    closingTimer,
    setClosingTimer,
    decrementClosingTimer,
    isUserCurrentlySpeaking,
  } = useDebate();
  const agents = useAgent(state => state.agents);
  const currentAgentId = useAgent(state => state.currentAgentId);
  const agent =
    agents.find(a => a.id === currentAgentId) ??
    agents.find(a => a.id === 'Medium')!;
  const hasStartedDebateRef = useRef(false);
  const userSpeakingTimerIntervalRef = useRef<number | null>(null);
  const aiSpeakingTimerIntervalRef = useRef<number | null>(null);

  // Set the configuration for the Live API
  useEffect(() => {
    const promptPersona = {
      name: agent.name,
      personality: agent.personality,
      rules: PERSONAS[difficulty].rules,
    };
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: agent.voice },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: createSystemInstructions(promptPersona, user),
          },
        ],
      },
    });
  }, [setConfig, user, agent, difficulty]);

  // Initiate the session when the component mounts and start the debate
  useEffect(() => {
    if (!connected) {
      connect();
      return;
    }
    if (!hasStartedDebateRef.current) {
      hasStartedDebateRef.current = true;
      client.send(
        {
          text: 'The user is ready. Please begin the debate now by greeting the user and stating your initial position on the topic.',
        },
        true,
      );
    }
  }, [connect, connected, client]);

  // Timer to end the debate
  useEffect(() => {
    const timer = setTimeout(() => {
      if (connected && useDebate.getState().debatePhase === 'open') {
        client.send(
          {
            text: 'The 5-minute time limit has been reached. Please ask me for my 30-second closing statement, then provide your own, and then say "DEBATE_COMPLETE" and nothing else.',
          },
          true,
        );
      }
    }, DEBATE_DURATION_MS);

    return () => clearTimeout(timer);
  }, [client, connected]);

  // Content handling
  useEffect(() => {
    function onContent(data: { modelTurn?: { parts: Part[] } }) {
      const parts = data.modelTurn?.parts;
      if (!parts || !Array.isArray(parts) || parts.length === 0) {
        return;
      }

      // Collect all text from all parts. The AI response can be split.
      const fullText = parts
        .map(part => part.text)
        .filter(Boolean) // filter out null/undefined/empty parts
        .join(''); // join them into a single string

      let rawText = fullText.trim();
      if (!rawText) return;

      const debateCompleteSignal = 'DEBATE_COMPLETE';
      const hasDebateComplete = rawText.includes(debateCompleteSignal);

      // Remove the signal from the text to be transcribed, so we don't display it.
      if (hasDebateComplete) {
        rawText = rawText.replace(debateCompleteSignal, '').trim();
      }

      // Now that the signal is handled, process and transcribe the actual text content.
      if (rawText) {
        const textLower = rawText.toLowerCase();
        if (
          (textLower.includes('closing statement') ||
            textLower.includes('final remarks')) &&
          useDebate.getState().debatePhase === 'open'
        ) {
          setDebatePhase('userClosing');
          setClosingTimer(30);
        }

        const match = rawText.match(/\[(.*?)\]:\s*(.*)/s);
        let speaker = agent.name;
        let message = rawText;

        if (match && match[2]) {
          speaker = match[1].trim();
          message = match[2].trim();
        } else {
          console.warn(
            'AI response did not match expected format. Using raw text.',
            rawText,
          );
        }

        if (message) {
          addTranscriptItem({ speaker, text: message, isUser: false });
        }
      }

      // After transcribing any accompanying text, if the signal was present, end the debate.
      if (hasDebateComplete) {
        addTranscriptItem({
          speaker: 'System',
          text: 'Debate complete. Moving to analysis.',
        });
        disconnect();
        endDebate();
      }
    }

    client.on('content', onContent);
    return () => {
      client.off('content', onContent);
    };
  }, [
    client,
    addTranscriptItem,
    endDebate,
    disconnect,
    setDebatePhase,
    setClosingTimer,
    agent.name,
  ]);

  // Manage user's closing statement timer
  useEffect(() => {
    if (debatePhase === 'userClosing' && isUserCurrentlySpeaking) {
      if (!userSpeakingTimerIntervalRef.current) {
        userSpeakingTimerIntervalRef.current = window.setInterval(
          decrementClosingTimer,
          1000,
        );
      }
    } else {
      if (userSpeakingTimerIntervalRef.current) {
        clearInterval(userSpeakingTimerIntervalRef.current);
        userSpeakingTimerIntervalRef.current = null;
        if (debatePhase === 'userClosing') {
          client.send(
            {
              text: '(The user has finished their closing statement. Please provide your 30-second closing statement and then say DEBATE_COMPLETE.)',
            },
            true,
          );
        }
      }
    }
    return () => {
      if (userSpeakingTimerIntervalRef.current)
        clearInterval(userSpeakingTimerIntervalRef.current);
    };
  }, [debatePhase, isUserCurrentlySpeaking, client, decrementClosingTimer]);

  // Timer effects (chime, cutoff)
  useEffect(() => {
    if (debatePhase === 'userClosing') {
      if (closingTimer === 0) {
        playChime();
      } else if (closingTimer < -14) {
        // 45 seconds total
        if (userSpeakingTimerIntervalRef.current) {
          clearInterval(userSpeakingTimerIntervalRef.current);
          userSpeakingTimerIntervalRef.current = null;
          client.send(
            {
              text: '(The user has gone significantly over time. Interrupt them politely, ask them to wrap up, then give your closing statement.)',
            },
            false,
          );
        }
      }
    }
  }, [closingTimer, debatePhase, client]);

  // Manage AI's closing statement timer
  useEffect(() => {
    const isAiSpeaking = volume > 0.05;
    if (debatePhase === 'userClosing' && isAiSpeaking) {
      setDebatePhase('aiClosing');
      setClosingTimer(30);
    }

    if (debatePhase === 'aiClosing' && isAiSpeaking) {
      if (!aiSpeakingTimerIntervalRef.current) {
        aiSpeakingTimerIntervalRef.current = window.setInterval(
          decrementClosingTimer,
          1000,
        );
      }
    } else if (debatePhase === 'aiClosing' && !isAiSpeaking) {
      if (aiSpeakingTimerIntervalRef.current) {
        clearInterval(aiSpeakingTimerIntervalRef.current);
        aiSpeakingTimerIntervalRef.current = null;
      }
    }
    return () => {
      if (aiSpeakingTimerIntervalRef.current)
        clearInterval(aiSpeakingTimerIntervalRef.current);
    };
  }, [
    volume,
    debatePhase,
    setDebatePhase,
    setClosingTimer,
    decrementClosingTimer,
  ]);

  const inactivityTimerRef = useRef<number | null>(null);
  const wasAiSpeakingRef = useRef(false);

  // Effect for inactivity prompt
  useEffect(() => {
    const AI_SPEAKING_THRESHOLD = 0.05;
    const isAiSpeaking = volume > AI_SPEAKING_THRESHOLD;

    if (isAiSpeaking || isUserMuted) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    } else if (
      wasAiSpeakingRef.current &&
      !isAiSpeaking &&
      !isUserMuted &&
      connected
    ) {
      if (!inactivityTimerRef.current) {
        inactivityTimerRef.current = window.setTimeout(() => {
          const userName = useUser.getState().name || 'there';
          client.send(
            {
              text: `(The user seems unresponsive, prompt them by saying "What are your thoughts on this, ${userName}?")`,
            },
            true,
          );
          inactivityTimerRef.current = null;
        }, 20000); // 20 seconds
      }
    }

    wasAiSpeakingRef.current = isAiSpeaking;

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [volume, isUserMuted, connected, client]);

  return (
    <div className="debate-screen">
      <ClosingTimer />
      <div className="face-container">
        <Buddy color={agent.bodyColor} />
      </div>
      <Transcript />
    </div>
  );
}