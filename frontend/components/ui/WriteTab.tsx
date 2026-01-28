"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { useStore } from "@/store/useStore";
import axios from "axios";
import { supabase, StoryAnalysis, Scene, ScenePanel } from "@/lib/supabase";
import { toast } from "sonner";

export default function WriteTab() {
  const {
    inputText,
    setInputText,
    isAnalyzing,
    setIsAnalyzing,
    setAnalysis,
    setActiveTab,
    setSessionId,
    setPanels,
  } = useStore();

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    try {
      // Analyze with backend
      const apiUrl = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      }/api/analyze`;
      const payload = {
        text: inputText,
        art_style: "manhwa",
      };

      const response = await axios.post(apiUrl, payload, {
        timeout: 60000,
      });

      const rawData = response.data;
      const analysisData = {
        ...rawData,
        title: rawData.title || "Untitled Story",
      };

      setAnalysis(analysisData);
      await saveToSupabase(analysisData as StoryAnalysis);

      // Create panels for local state
      const panels: Array<{
        id: string;
        sceneIndex: number;
        panelIndex: number;
        narrativeDescription: string;
        visualPrompt: string;
        imageUrl: string | null;
        displayOrder: number;
      }> = [];
      let displayOrder = 0;

      analysisData.scenes.forEach((scene: Scene) => {
        scene.panels.forEach((panel: ScenePanel) => {
          panels.push({
            id: crypto.randomUUID(),
            sceneIndex: scene.scene_index,
            panelIndex: panel.panel_index,
            narrativeDescription: panel.narrative_description,
            visualPrompt: panel.visual_prompt,
            imageUrl: null,
            displayOrder: displayOrder++,
          });
        });
      });

      setPanels(panels);
      
      toast.success("Story analysis complete!");

      // Switch to studio tab on mobile
      if (window.innerWidth < 768) {
        setActiveTab("studio");
      }
    } catch (error) {
      let errorMessage = "An unknown error occurred.";

      if (axios.isAxiosError(error)) {
        const backendMessage =
          error.response?.data?.message ||
          error.response?.data?.detail ||
          error.response?.data?.error ||
          error.message;
        
        errorMessage = `Backend Error: ${backendMessage}`;

        if (error.code === "ERR_NETWORK") {
            errorMessage = "Cannot connect to backend. Please ensure your API is running on port 8000.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error("Analysis Failed", {
        description: errorMessage,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveToSupabase = async (
    analysisData: StoryAnalysis
  ): Promise<void> => {
    try {
      // Create session
      const { data: sessionData, error: sessionError } = await supabase
        .from("user_sessions")
        .insert({
          input_text: inputText,
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      const newSessionId = sessionData.id;
      setSessionId(newSessionId);

      // Save analysis
      const { data: analysisRecord, error: analysisError } = await supabase
        .from("story_analyses")
        .insert({
          session_id: newSessionId,
          title: analysisData.title || "Untitled Story",
          characters: analysisData.characters,
          scenes: analysisData.scenes,
        })
        .select()
        .single();

      if (analysisError) {
        throw analysisError;
      }

      // Save panels
      const panelRecords: Array<{
        session_id: string;
        analysis_id: string;
        scene_index: number;
        panel_index: number;
        narrative_description: string;
        visual_prompt: string;
        image_url: string | null;
        display_order: number;
      }> = [];
      let displayOrder = 0;

      analysisData.scenes.forEach((scene: Scene) => {
        scene.panels.forEach((panel: ScenePanel) => {
          panelRecords.push({
            session_id: newSessionId,
            analysis_id: analysisRecord.id,
            scene_index: scene.scene_index,
            panel_index: panel.panel_index,
            narrative_description: panel.narrative_description,
            visual_prompt: panel.visual_prompt,
            image_url: null,
            display_order: displayOrder++,
          });
        });
      });

      const { error: panelsError } = await supabase
        .from("panels")
        .insert(panelRecords);

      if (panelsError) {
        throw panelsError;
      }

    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Content*/}
      <div className="flex-1 p-4 pb-20 overflow-y-auto sm:p-6 md:p-8 md:pb-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h2 className="mb-1 text-lg font-bold transition-colors sm:text-xl md:text-2xl text-slate-800 dark:text-slate-200 sm:mb-2">
            Story Script
          </h2>
          <p className="text-xs transition-colors sm:text-sm text-slate-500 dark:text-slate-400">
            Paste your chapter text to generate panels
          </p>
        </div>

        {/* Textarea */}
        <Textarea
          placeholder="Paste your chapter text here... 
            Example:
            'Kael walked into the neon-lit bar, his coat dripping with rain. The bartender glanced up, recognition flickering in her eyes...'"
          
          className="w-full transition-colors 
            bg-white dark:bg-slate-900 
            border-slate-200 dark:border-slate-700 
            text-slate-900 dark:text-slate-200 
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            resize-none focus-visible:ring-violet-500 
            text-sm sm:text-base
            min-h-[200px] sm:min-h-[300px] md:min-h-[400px] lg:min-h-[500px]
            mb-4"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !inputText.trim()}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold 
            min-h-11 sm:min-h-12 md:min-h-[52px]
            text-xs sm:text-sm md:text-base
            transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 sm:h-5 sm:w-5 animate-spin" />
              Analyzing Story...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2 sm:h-5 sm:w-5" />
              Analyze & Create Storyboard
            </>
          )}
        </Button>
      </div>
    </div>
  );
}