import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface Character {
  name: string;
  visual_description: string;
}

interface Panel {
  panel_index: number;
  narrative_description: string;
  visual_prompt: string;
}

interface Scene {
  scene_index: number;
  location: string;
  panels: Panel[];
}

interface StoryAnalysis {
  title: string;
  characters: Character[];
  scenes: Scene[];
}

interface GeneratedPanel {
  id: string;
  sceneIndex: number;
  panelIndex: number;
  narrativeDescription: string;
  visualPrompt: string;
  imageUrl: string | null;
  displayOrder: number;
}

interface AppState {
  // Current tab
  activeTab: 'write' | 'studio';
  setActiveTab: (tab: 'write' | 'studio') => void;

  // Input text
  inputText: string;
  setInputText: (text: string) => void;

  // Story analysis
  analysis: StoryAnalysis | null;
  setAnalysis: (analysis: StoryAnalysis | null) => void;

  // Generated panels (for display in studio)
  panels: GeneratedPanel[];
  setPanels: (panels: GeneratedPanel[]) => void;
  addPanel: (panel: GeneratedPanel) => void;
  updatePanel: (id: string, updates: Partial<GeneratedPanel>) => void;
  deletePanel: (id: string) => void;
  reorderPanels: (startIndex: number, endIndex: number) => void;

  // Session ID for Supabase
  sessionId: string;
  setSessionId: (id: string) => void;

  // Loading states
  isAnalyzing: boolean;
  setIsAnalyzing: (loading: boolean) => void;
  generatingPanelId: string | null;
  setGeneratingPanelId: (id: string | null) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Tab state
      activeTab: 'write',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Input text
      inputText: '',
      setInputText: (text) => set({ inputText: text }),

      // Analysis
      analysis: null,
      setAnalysis: (analysis) => set({ analysis }),

      // Panels
      panels: [],
      setPanels: (panels) => set({ panels }),
      
      addPanel: (panel) =>
        set((state) => ({
          panels: [...state.panels, panel],
        })),

      updatePanel: (id, updates) =>
        set((state) => ({
          panels: state.panels.map((panel) =>
            panel.id === id ? { ...panel, ...updates } : panel
          ),
        })),

       deletePanel: (id) =>
    set((state) => ({
      panels: state.panels.filter((panel) => panel.id !== id),
    })),

// CONFIRMATION for Drag and Drop
      reorderPanels: (startIndex, endIndex) =>
        set((state) => {
          
          const newPanels = Array.from(state.panels);
          
          const [removed] = newPanels.splice(startIndex, 1);
       
          newPanels.splice(endIndex, 0, removed);
        
          return {
            panels: newPanels.map((panel, index) => ({
              ...panel,
              displayOrder: index,
            })),
          };
        }),

      // Session
      sessionId: '',
      setSessionId: (id) => set({ sessionId: id }),

      // Loading
      isAnalyzing: false,
      setIsAnalyzing: (loading) => set({ isAnalyzing: loading }),
      generatingPanelId: null,
      setGeneratingPanelId: (id) => set({ generatingPanelId: id }),
    }),
    {
      name: 'yumeai-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        inputText: state.inputText,
        sessionId: state.sessionId,
      }),
    }
  )
);