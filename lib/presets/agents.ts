import { INTERLOCUTOR_VOICE, INTERLOCUTOR_VOICES } from './personas';

export const AGENT_COLORS = ['#9f5dff'];

export type Agent = {
  id: string;
  name: string;
  personality: string;
  bodyColor: string;
  voice: INTERLOCUTOR_VOICE;
  isPreset?: boolean;
};

export function createNewAgent(): Agent {
  return {
    id: crypto.randomUUID(),
    name: 'New Troll',
    personality: 'A chaotic troll with a hidden agenda.',
    bodyColor: AGENT_COLORS[0],
    voice:
      INTERLOCUTOR_VOICES[
        Math.floor(Math.random() * INTERLOCUTOR_VOICES.length)
      ],
    isPreset: false,
  };
}