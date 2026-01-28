"use client";

import { PenTool, LayoutGrid } from "lucide-react";
import { useStore } from "@/store/useStore";

export default function BottomNav() {
  const { activeTab, setActiveTab } = useStore();

  const tabs = [
    {
      id: "write" as const,
      label: "Write",
      icon: PenTool,
    },
    {
      id: "studio" as const,
      label: "Studio",
      icon: LayoutGrid,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex flex-col items-center justify-center flex-1 h-full gap-1
                transition-colors duration-200 min-h-11
                ${
                  isActive
                    ? "text-violet-400"
                    : "text-slate-400 hover:text-slate-300"
                }
              `}
            >
              <Icon className={`h-5 w-5 ${isActive ? "scale-110" : ""} transition-transform`} />
              <span className={`text-xs font-medium ${isActive ? "font-semibold" : ""}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}