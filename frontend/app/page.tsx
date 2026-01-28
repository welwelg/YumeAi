"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/store/useStore";
import BottomNav from "@/components/ui/BottomNav";
import WriteTab from "@/components/ui/WriteTab";
import StudioTab from "@/components/ui/StudioTab";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { activeTab, setSessionId } = useStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const storedSession = useStore.getState().sessionId;
    if (!storedSession) {
      setSessionId(crypto.randomUUID());
    }
  }, [setSessionId]);

  // Prevent hydration
  if (!mounted) return null;

  return (
    <main className="flex flex-col min-h-screen transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b bg-white/80 backdrop-blur-md border-slate-200 dark:bg-slate-950/80 dark:border-slate-800">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-transparent bg-linear-to-r from-pink-500 to-violet-500 bg-clip-text">
            YUMEAI
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Pocket Studio</p>
        </div>

        {/* Theme Toggle Button */}
        <Button
          variant="ghost" 
          size="icon"     
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-full hover:bg-slate-200 dark:hover:bg-slate-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 text-yellow-500 transition-all" />
          ) : (
            <Moon className="w-5 h-5 transition-all text-slate-700" />
          )}
        </Button>
      </header>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "write" ? <WriteTab /> : <StudioTab />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </main>
  );
}