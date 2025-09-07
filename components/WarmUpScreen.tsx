import './DebateScreen.css'; // Reuse styles
import { useEffect, useRef } from 'react';
import { Modality, Part } from '@google/genai';
import Buddy from './Buddy';
import { useLiveAPIContext } from '../contexts/LiveAPIContext';
import { createWarmUpInstructions } from '@/lib/prompts';
import { useAgent, useDebate, useUser } from '@/lib/state';
import Transcript from './Transcript';
import { PERSONAS } from '@/lib/presets/personas';

export default function WarmUpScreen() {
  const { client, connected, setConfig, connect } = useLiveAPIContext();
  const user = useUser();
  const { addTranscriptItem, difficulty } = useDebate();
  // We force the 'Easy' agent for the warm-up to ensure a friendly experience.
  const agent = useAgent(state => state.agents.find(a => a.id === 'Easy'))!;
  const hasStartedSessionRef = useRef(false);

  // Set the configuration for the Live API with the warm-up prompt
  useEffect(() => {
    // The warm-up instructions require a persona object that includes rules.
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
        parts: [{ text: createWarmUpInstructions(promptPersona, user) }],
      },
    });
  }, [setConfig, user, agent, difficulty]);

  // Initiate the session when the component mounts
  useEffect(() => {
    if (!connected) {
      connect();
      return;
    }
    if (!hasStartedSessionRef.current) {
      hasStartedSessionRef.current = true;
      client.send(
        {
          text: 'The user has entered the warm-up room. Please greet them warmly and introduce the topic.',
        },
        true,
      );
    }
  }, [connect, connected, client]);

  // Handle incoming text from the AI
  useEffect(() => {
    function onContent(data: { modelTurn?: { parts: Part[] } }) {
      const parts = data.modelTurn?.parts;
      if (!parts || !Array.isArray(parts) || parts.length === 0) return;

      const fullText = parts.map(part => part.text).filter(Boolean).join('');
      if (!fullText.trim()) return;

      addTranscriptItem({
        speaker: agent.name,
        text: fullText.trim(),
        isUser: false,
      });
    }

    client.on('content', onContent);
    return () => client.off('content', onContent);
  }, [client, addTranscriptItem, agent.name]);

  return (
    <div className="debate-screen">
      <div className="face-container">
        <Buddy color={agent.bodyColor} />
      </div>
      <Transcript />
    </div>
  );
}