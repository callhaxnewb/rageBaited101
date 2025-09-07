import { GoogleGenAI, Type } from '@google/genai';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Agent } from './presets/agents';
import { PERSONAS, Persona } from './presets/personas';
import { WARMUP_TOPICS } from './presets/topics';

/**
 * User
 */
export type User = {
  name?: string;
  college?: string;
  state?: string;
};

export const useUser = create<
  {
    setName: (name: string) => void;
    setCollege: (college: string) => void;
    setState: (state: string) => void;
  } & User
>()(
  persist(
    set => ({
      name: '',
      college: '',
      state: '',
      setName: name => set({ name }),
      setCollege: college => set({ college }),
      setState: state => set({ state }),
    }),
    {
      name: 'ragebait-user-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Debate
 */
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type TranscriptItem = {
  speaker: string;
  text: string;
  isUser?: boolean;
};
export type DebatePhase = 'open' | 'userClosing' | 'aiClosing';

export type RadarChartData = {
  Structure: number;
  Evidence: number;
  'On Topic': number;
  Clarity: number;
  Comebacks: number;
  'Bait Quality': number;
};

export type DebateStatus =
  | 'idle'
  | 'onboarding'
  | 'preparing'
  | 'warming-up'
  | 'debating'
  | 'analyzing';

type DebateState = {
  difficulty: Difficulty;
  topic: string;
  stance: string;
  status: DebateStatus;
  debateStartTime: number | null;
  transcript: TranscriptItem[];
  notepadText: string;
  isAnalyzing: boolean;
  analysis: string;
  radarChartData: RadarChartData | null;
  overallScore: number | null;
  isUserMuted: boolean;
  userSpeakingTime: number; // in seconds
  debatePhase: DebatePhase;
  closingTimer: number;
  isUserCurrentlySpeaking: boolean;
  setDifficulty: (difficulty: Difficulty) => void;
  setTopic: (topic: string) => void;
  setStance: (stance: string) => void;
  startOnboarding: () => void;
  startWarmUp: () => void;
  endWarmUp: () => void;
  startPreparation: () => void;
  startDebate: () => void;
  endDebate: () => void;
  addTranscriptItem: (item: TranscriptItem) => void;
  setNotepadText: (text: string) => void;
  getPersona: () => Persona;
  generateAnalysis: (user: User) => Promise<void>;
  resetDebate: () => void;
  setIsUserMuted: (isMuted: boolean) => void;
  incrementUserSpeakingTime: () => void;
  resetUserSpeakingTime: () => void;
  setDebatePhase: (phase: DebatePhase) => void;
  setClosingTimer: (time: number) => void;
  decrementClosingTimer: () => void;
  setIsUserCurrentlySpeaking: (isSpeaking: boolean) => void;
};

export const useDebate = create<DebateState>((set, get) => ({
  difficulty: 'Medium',
  topic: '',
  stance: '',
  status: 'idle',
  debateStartTime: null,
  transcript: [],
  notepadText: '',
  isAnalyzing: false,
  analysis: '',
  radarChartData: null,
  overallScore: null,
  isUserMuted: true,
  userSpeakingTime: 0,
  debatePhase: 'open',
  closingTimer: 30,
  isUserCurrentlySpeaking: false,
  setDifficulty: difficulty => {
    if (get().difficulty === difficulty) return;
    set({ difficulty });
    // Also update the agent to the corresponding preset.
    useAgent.setState({ currentAgentId: difficulty });
  },
  setTopic: topic => set({ topic }),
  setStance: stance => set({ stance }),
  startOnboarding: () => {
    set({ status: 'onboarding' });
  },
  startWarmUp: () => {
    const warmUpTopic =
      WARMUP_TOPICS[Math.floor(Math.random() * WARMUP_TOPICS.length)];
    // Ensure agent is set to Easy for the warm-up
    useAgent.getState().setCurrent('Easy');
    set({
      status: 'warming-up',
      difficulty: 'Easy',
      topic: warmUpTopic,
      transcript: [
        { speaker: 'System', text: `Warm-Up Topic: ${warmUpTopic}` },
        {
          speaker: 'System',
          text: 'This is a low-stakes vibe check. Mic is on the right. Hit SPACE to talk.',
        },
      ],
      isUserMuted: true, // Start muted
    });
  },
  endWarmUp: () => {
    set({
      status: 'onboarding',
      transcript: [], // Clear transcript for the next session
      topic: '',
    });
  },
  startPreparation: () => {
    const { topic } = get();
    set({
      status: 'preparing',
      transcript: [{ speaker: 'System', text: `Topic: ${topic}` }],
    });
  },
  startDebate: () =>
    set({
      status: 'debating',
      isUserMuted: true,
      debateStartTime: Date.now(),
      debatePhase: 'open',
    }),
  endDebate: () => {
    set({ status: 'analyzing' });
  },
  addTranscriptItem: item =>
    set(state => ({ transcript: [...state.transcript, item] })),
  setNotepadText: text => set({ notepadText: text }),
  getPersona: () => PERSONAS[get().difficulty],
  generateAnalysis: async (user: User) => {
    set({
      isAnalyzing: true,
      analysis: '',
      radarChartData: null,
      overallScore: null,
    });
    const { transcript, userSpeakingTime, debateStartTime } = get();
    const transcriptString = transcript
      .map(item => `${item.speaker}: ${item.text}`)
      .join('\n');
    const userName = user.name || 'the user';

    const debateEndTime = Date.now();
    const totalDurationSeconds = debateStartTime
      ? Math.round((debateEndTime - debateStartTime) / 1000)
      : 300;
    const participationPercentage =
      totalDurationSeconds > 0
        ? Math.round((userSpeakingTime / totalDurationSeconds) * 100)
        : 0;

    const analysisPrompt = `You are an expert online troll and master of Gen Z internet culture. Your name is Coach Chad. Analyze the following transcript of a user trying to rage bait and handle rage bait. Provide a brutally honest but funny breakdown for the user, "${userName}".

**Metrics:**
- Total Session Duration: ${totalDurationSeconds} seconds.
- "${userName}"'s Talking Time: ${userSpeakingTime} seconds.
- "${userName}"'s Yap Rate: ${participationPercentage}%.

**Analysis Instructions:**
Analyze the session based on the transcript and metrics.
Your response MUST be a valid JSON object.
The JSON object must have three top-level keys: "scores", "feedback", and "overallScore".

1.  **"scores"**: An object containing six metrics. Each metric must be rated on a scale of 1 to 10. The keys must be exactly: "Structure", "Evidence", "On Topic", "Clarity", "Comebacks", and "Bait Quality".
    - Structure: Were the user's points coherent or just random word-vomit?
    - Evidence: Did they back up claims, even with meme-level "trust me bro" sources?
    - On Topic: Did they stay on track or get lost in the sauce?
    - Clarity: Was their yap session understandable?
    - Comebacks: How good were their responses to the bait? Quick, witty, or did they get ratio'd?
    - Bait Quality: How effective was their own rage bait? Did it get a reaction? Was it creative or just cringe?
2.  **"feedback"**: A string containing your qualitative analysis in Markdown format. Structure this feedback into three sections: "### The Good (What was Based)", "### The Bad (What was Cringe)", and "### How to Level Up Your Game". Keep the tone like a slightly toxic but helpful gamer friend. Use Gen Z slang. **Write your feedback using normal sentence case, not all caps.**
3.  **"overallScore"**: A single number representing a holistic evaluation of the user's performance, on a scale from 1 to 10. This is their overall Rage Baiter rating.

**TRANSCRIPT:**
${transcriptString}`;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scores: {
                type: Type.OBJECT,
                properties: {
                  Structure: { type: Type.NUMBER },
                  Evidence: { type: Type.NUMBER },
                  'On Topic': { type: Type.NUMBER },
                  Clarity: { type: Type.NUMBER },
                  Comebacks: { type: Type.NUMBER },
                  'Bait Quality': { type: Type.NUMBER },
                },
              },
              feedback: { type: Type.STRING },
              overallScore: { type: Type.NUMBER },
            },
          },
        },
      });

      const parsedResponse = JSON.parse(response.text);
      set({
        analysis: parsedResponse.feedback,
        radarChartData: parsedResponse.scores,
        overallScore: parsedResponse.overallScore,
        isAnalyzing: false,
      });
    } catch (error) {
      console.error('Error generating analysis:', error);
      set({
        analysis:
          "Sorry, I couldn't generate an analysis for this session. The vibes were off.",
        isAnalyzing: false,
      });
    }
  },
  resetDebate: () => {
    useUI.getState().setShowUserConfig(true);
    set({
      status: 'idle',
      topic: '',
      stance: '',
      transcript: [],
      notepadText: '',
      isAnalyzing: false,
      analysis: '',
      radarChartData: null,
      overallScore: null,
      debateStartTime: null,
      debatePhase: 'open',
      closingTimer: 30,
      isUserCurrentlySpeaking: false,
    });
  },
  setIsUserMuted: isMuted => set({ isUserMuted: isMuted }),
  incrementUserSpeakingTime: () =>
    set(state => ({ userSpeakingTime: state.userSpeakingTime + 1 })),
  resetUserSpeakingTime: () => set({ userSpeakingTime: 0 }),
  setDebatePhase: phase => set({ debatePhase: phase }),
  setClosingTimer: time => set({ closingTimer: time }),
  decrementClosingTimer: () =>
    set(state => ({ closingTimer: state.closingTimer - 1 })),
  setIsUserCurrentlySpeaking: isSpeaking =>
    set({ isUserCurrentlySpeaking: isSpeaking }),
}));

/**
 * UI
 */
export const useUI = create<{
  showUserConfig: boolean;
  setShowUserConfig: (show: boolean) => void;
  showAgentEdit: boolean;
  setShowAgentEdit: (show: boolean) => void;
}>(set => ({
  showUserConfig: true,
  setShowUserConfig: (show: boolean) => set({ showUserConfig: show }),
  showAgentEdit: false,
  setShowAgentEdit: (show: boolean) => set({ showAgentEdit: show }),
}));

/**
 * Agent
 */
const personaAgents: Agent[] = Object.entries(PERSONAS).map(
  ([id, persona]) => ({
    id,
    name: persona.name,
    personality: persona.personality,
    bodyColor: persona.bodyColor,
    voice: persona.voice,
    isPreset: true,
  })
);

interface AgentState {
  agents: Agent[];
  currentAgentId: string;
  setCurrent: (agent: Agent | string) => void;
  addAgent: (agent: Agent) => void;
  update: (id: string, adjustments: Partial<Agent>) => void;
}

export const useAgent = create<AgentState>()(
  persist(
    (set, get) => ({
      agents: [...personaAgents],
      currentAgentId: 'Medium', // Default to Medium
      setCurrent: (agentOrId: Agent | string) => {
        const id = typeof agentOrId === 'string' ? agentOrId : agentOrId.id;
        if (get().currentAgentId === id) return;

        set({ currentAgentId: id });

        const agent = get().agents.find(a => a.id === id);
        if (agent && agent.isPreset) {
          useDebate.setState({ difficulty: id as Difficulty });
        }
      },
      addAgent: (agent: Agent) => {
        set(state => ({ agents: [...state.agents, agent] }));
        get().setCurrent(agent);
      },
      update: (id: string, adjustments: Partial<Agent>) => {
        set(state => ({
          agents: state.agents.map(agent =>
            agent.id === id ? { ...agent, ...agent, ...adjustments } : agent
          ),
        }));
      },
    }),
    {
      name: 'debatemate-agents-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);