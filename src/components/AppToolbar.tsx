"use client";

import React, { useState } from "react";
import { Play, Square, RotateCcw, Check, AlertCircle, Terminal, Coffee } from "lucide-react";
import { RuntimeStatus } from "@/lib/javabox/types";

interface AppToolbarProps {
  filename: string;
  isModified: boolean;
  runtimeStatus: RuntimeStatus;
  isRunning: boolean;
  onRun: () => void;
  onStop: () => void;
  onReset: () => void;
}

export const AppToolbar: React.FC<AppToolbarProps> = ({
  filename,
  isModified,
  runtimeStatus,
  isRunning,
  onRun,
  onStop,
  onReset,
}) => {
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleResetClick = () => {
    if (isModified) {
      setShowConfirmReset(true);
    } else {
      onReset();
    }
  };

  const confirmReset = () => {
    setShowConfirmReset(false);
    onReset();
  };

  const isReadyToRun = runtimeStatus === "ready" && !isRunning;

  return (
    <header className="h-[52px] bg-surface border-b border-border px-4 flex items-center justify-between select-none shrink-0 z-20">
      {/* Left: Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-text-primary font-semibold tracking-tight">
          <div className="w-7 h-7 rounded bg-surface-muted border border-border flex items-center justify-center text-accent">
            <Coffee className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">JavaBox Playground</span>
        </div>
        <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary border border-border">
          Prototype
        </span>
      </div>

      {/* Center: File tab & modification status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1 rounded bg-surface-muted/60 border border-border/80 text-xs font-mono text-text-primary">
          <Terminal className="w-3.5 h-3.5 text-text-secondary" />
          <span>{filename}</span>
          {isModified && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-warning"
              title="Unsaved changes in local editor"
            />
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Reset Button */}
        {showConfirmReset ? (
          <div className="flex items-center gap-1 bg-surface-muted border border-border px-2 py-1 rounded text-xs animate-in fade-in duration-150">
            <span className="text-text-secondary text-[11px] mr-1">Reset code?</span>
            <button
              onClick={confirmReset}
              className="px-2 py-0.5 bg-error text-white rounded text-[11px] font-medium hover:opacity-90 transition-opacity"
            >
              Yes
            </button>
            <button
              onClick={() => setShowConfirmReset(false)}
              className="px-2 py-0.5 bg-surface text-text-primary border border-border rounded text-[11px] hover:bg-surface-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={handleResetClick}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface-muted border border-border/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reset code to default example"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}

        {/* Stop Button (shown only when running) */}
        {isRunning && (
          <button
            onClick={onStop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-error/10 text-error border border-error/30 hover:bg-error/20 transition-colors"
            title="Stop current execution"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Stop</span>
          </button>
        )}

        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={!isReadyToRun}
          className="flex items-center gap-2 px-4 py-1.5 rounded text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-secondary disabled:border disabled:border-border"
          title="Run Java code (Ctrl+Enter / ⌘+Enter)"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isRunning ? "Running..." : "Run"}</span>
          <span className="text-[10px] opacity-75 font-mono ml-0.5 border border-white/30 px-1 py-0.2 rounded">
            Ctrl+↵
          </span>
        </button>
      </div>
    </header>
  );
};

