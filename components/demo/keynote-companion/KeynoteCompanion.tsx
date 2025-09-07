import { useEffect, useRef } from 'react';
import { Modality } from '@google/genai';

import Buddy from '../../Buddy';
import { useLiveAPIContext } from '../../../contexts/LiveAPIContext';
import { createSystemInstructions } from '@/lib/prompts';
import { useAgent, useDebate, useUser } from '@/lib/state';
import { PERSONAS } from '@/lib/presets/personas';

export default function KeynoteCompanion() {
  const { client, connected, setConfig } = useLiveAPIContext();
  const user = useUser();
  const agents = useAgent(state => state.agents);
  const currentAgentId = useAgent(state => state.currentAgentId);
  const current = agents.find(a => a.id === currentAgentId) ?? agents.find(a => a.id === 'Medium')!;
  const { difficulty } = useDebate();

  // Set the configuration for the Live API
  useEffect(() => {
    const promptPersona = {
      name: current.name,
      personality: current.personality,
      rules: PERSONAS[difficulty].rules,
    };
    setConfig({
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: current.voice },
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
  }, [setConfig, user, current, difficulty]);

  // Initiate the session when the Live API connection is established
  // Instruct the model to send an initial greeting message
  useEffect(() => {
    const beginSession = async () => {
      if (!connected) return;
      client.send(
        {
          text: 'Greet the user and introduce yourself and your role.',
        },
        true
      );
    };
    beginSession();
  }, [client, connected]);

  return (
    <div className="keynote-companion">
      <Buddy color={current.bodyColor} />
    </div>
  );
}