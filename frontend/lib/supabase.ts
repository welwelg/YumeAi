import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined. Put it in frontend/.env.local and restart the dev server.');
}
if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined. Put it in frontend/.env.local and restart the dev server.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export interface ScenePanel {
  panel_index: number;
  narrative_description: string;
  visual_prompt: string;
}

export interface Scene {
  scene_index: number;
  panels: ScenePanel[];
}

export interface StoryAnalysis {
  title: string | null;
  characters: { name: string }[];
  scenes: Scene[];
}

export interface Panel {
  id: string;
  session_id: string;
  analysis_id: string;
  scene_index: number;
  panel_index: number;
  narrative_description: string;
  visual_prompt: string;
  image_url: string | null;
  display_order: number;
  sceneIndex?: number;
  panelIndex?: number;
  narrativeDescription?: string;
  visualPrompt?: string;
  imageUrl?: string | null;
  displayOrder?: number;
}
