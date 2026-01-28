"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios, { isAxiosError } from "axios";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import {
  Loader2,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  GripVertical,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function StudioTab() {
  const {
    analysis,
    panels,
    generatingPanelId,
    setGeneratingPanelId,
    updatePanel,
    deletePanel,
    reorderPanels,
    sessionId,
    setPanels,
  } = useStore();

  const [isReordering, setIsReordering] = useState(false);

  // Load Panels
  useEffect(() => {
    if (!sessionId || panels.length > 0) return;

    const fetchPanels = async () => {
      try {
        const { data, error } = await supabase
          .from("panels")
          .select("*")
          .eq("session_id", sessionId)
          .order("display_order", { ascending: true })
          .order("created_at", { ascending: true });

        if (error) throw error;

        if (data) {
          const formattedPanels = data.map((p, index) => ({
            id: p.id,
            sceneIndex: p.scene_index,
            panelIndex: p.panel_index,
            narrativeDescription: p.narrative_description,
            visualPrompt: p.visual_prompt,
            imageUrl: p.image_url,
            displayOrder: p.display_order ?? index,
          }));
          setPanels(formattedPanels);
        }
      } catch (err) {
        console.error("Error fetching panels:", err);
      }
    };

    fetchPanels();
  }, [sessionId, setPanels, panels.length]);

  // Generate Image
  const handleGenerateImage = async (panelId: string, prompt: string) => {
    setGeneratingPanelId(panelId);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await axios.post(
        `${baseUrl}/api/generate-image`,
        { prompt, aspect_ratio: "9:16" },
        { timeout: 120000 }
      );

      const { image_url } = response.data;
      if (!image_url) throw new Error("No image URL returned");

      // Parallel update for speed
      await Promise.all([
        supabase.from("panels").update({ image_url }).eq("id", panelId),
        updatePanel(panelId, { imageUrl: image_url }),
      ]);
    } catch (error) {
      console.error("Generation failed:", error);
      const message = isAxiosError(error)
        ? error.response?.data?.message || error.message
        : (error as Error).message;
      alert(`Generation Error: ${message}`);
    } finally {
      setGeneratingPanelId(null);
    }
  };

  const handleDeletePanel = async (panelId: string) => {
    if (!confirm("Delete this panel?")) return;

    try {
      const { error } = await supabase
        .from("panels")
        .delete()
        .eq("id", panelId);

      if (error) throw error;
      deletePanel(panelId);
      // Show success message
      toast.success("Panel deleted successfully!");
    } catch (error) {
      toast.error(`Delete failed: ${error}`);
      alert("Delete failed. Please check console for details.");
    }
  };

  // Drag & Drop Reordering
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;

    if (!destination || destination.index === source.index) return;

    // Optimistic Update
    reorderPanels(source.index, destination.index);
    setIsReordering(true);

    // Database Sync
    try {
      const updatedPanels = useStore.getState().panels;

      const updatePromises = updatedPanels.map((panel, idx) =>
        supabase
          .from("panels")
          .update({ display_order: idx })
          .eq("id", panel.id)
      );

      const results = await Promise.all(updatePromises);
      if (results.some((r) => r.error)) throw new Error("Database sync failed");
    } catch (error) {
      console.error("Reorder failed in DB:", error);
    } finally {
      setIsReordering(false);
    }
  };

  // Empty State
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-slate-500">
        <ImageIcon className="w-16 h-16 mb-4 opacity-20 sm:h-20 sm:w-20" />
        <p className="text-sm text-center sm:text-base">
          No panels yet. <br className="hidden md:block" />
          Analyze text to create your storyboard.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */ }
      <div className="sticky top-0 z-10 p-4 transition-colors border-b bg-white/95 backdrop-blur-sm border-slate-200 dark:bg-slate-950/95 dark:border-slate-800 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold transition-colors text-slate-900 dark:text-slate-200 sm:text-2xl">
            {analysis.title || "Visual Storyboard"}
          </h2>
          {isReordering && (
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {analysis.characters.map((char, i) => (
            <Badge
              key={i}
              variant="outline"
              className="px-2 py-0.5 text-xs border-pink-500/50 text-pink-600 dark:text-pink-300 sm:px-3 sm:py-1 transition-colors"
            >
              {char.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="panel-stack">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`flex-1 overflow-y-auto pb-20 transition-colors ${
                snapshot.isDraggingOver
                  ? "bg-slate-100/50 dark:bg-slate-900/30"
                  : ""
              }`}
            >
              <div className="p-2 space-y-3 sm:p-6 sm:space-y-6 md:p-8">
                {panels.length === 0 ? (
                  <div className="py-8 text-center text-slate-500">
                    No panels generated yet.
                  </div>
                ) : (
                  panels.map((panel, index) => {
                    const isGenerating = generatingPanelId === panel.id;
                    return (
                      <Draggable
                        key={panel.id}
                        draggableId={panel.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`w-full mx-auto max-w-2xl bg-white dark:bg-slate-900 border rounded-lg overflow-hidden transition-all duration-200 ${
                              snapshot.isDragging
                                ? "shadow-2xl border-violet-500/80 scale-[1.02] rotate-1 z-50"
                                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm"
                            }`}
                          >
                            {/* Panel Toolbar */}
                            <div className="flex items-center justify-between p-2 transition-colors border-b border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-2">
                                {/* Drag Handle */}
                                <div
                                  {...provided.dragHandleProps}
                                  className="flex items-center justify-center transition-colors rounded w-11 h-11 text-slate-400 hover:text-violet-500 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-grab"
                                >
                                  <GripVertical className="w-6 h-6" />
                                </div>
                                {/* Number Badge */}
                                <Badge className="transition-colors bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                                  Panel {index + 1}
                                </Badge>
                              </div>

                              {/* Delete Button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeletePanel(panel.id)}
                                className="p-0 text-red-400 transition-colors w-11 h-11 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="w-5 h-5" />
                              </Button>
                            </div>

                            {/* Image Area */}
                            <div className="relative w-full transition-colors bg-slate-50 dark:bg-black aspect-9/16">
                              {panel.imageUrl ? (
                                <Image
                                  src={panel.imageUrl}
                                  alt={`Panel ${index + 1}`}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 50vw"
                                  priority={index < 2}
                                />
                              ) : (
                                <div className="flex items-center justify-center w-full h-full">
                                  <span className="text-xs text-slate-400 dark:text-slate-700">
                                    No Image
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Content Area */}
                            <div className="p-4 space-y-4">
                              <p className="text-sm italic transition-colors text-slate-600 dark:text-slate-300 line-clamp-3">
                                {panel.narrativeDescription}
                              </p>

                              {!panel.imageUrl && (
                                <Button
                                  onClick={() =>
                                    handleGenerateImage(
                                      panel.id,
                                      panel.visualPrompt
                                    )
                                  }
                                  disabled={isGenerating}
                                  className="w-full text-white h-11 bg-violet-600 hover:bg-violet-700"
                                >
                                  {isGenerating ? (
                                    <>
                                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />{" "}
                                      Generating...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-5 h-5 mr-2" />{" "}
                                      Generate Art
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })
                )}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}