"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Terminal, Keyboard, AlertCircle } from "lucide-react";
import { InputPanel } from "./InputPanel";
import { OutputPanel } from "./OutputPanel";
import { DiagnosticsPanel } from "./DiagnosticsPanel";
import { Diagnostic } from "@/lib/javabox/types";

type Tab = "output" | "input" | "diagnostics";

interface BottomPanelProps {
  stdin: string;
  onStdinChange: (val: string) => void;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number | null;
  diagnostics: Diagnostic[];
  isRunning: boolean;
  onClearOutput: () => void;
  onSelectDiagnostic?: (diag: Diagnostic) => void;
}

export const BottomPanel: React.FC<BottomPanelProps> = ({
  stdin,
  onStdinChange,
  stdout,
  stderr,
  exitCode,
  durationMs,
  diagnostics,
  isRunning,
  onClearOutput,
  onSelectDiagnostic,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("output");
  const [panelHeight, setPanelHeight] = useState<number>(260);
  const isDraggingRef = useRef<boolean>(false);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  // Auto-switch to output when code begins running
  useEffect(() => {
    if (isRunning) {
      setActiveTab("output");
    }
  }, [isRunning]);

  // Auto-switch to diagnostics if there are diagnostic errors/warnings
  useEffect(() => {
    if (diagnostics.length > 0) {
      setActiveTab("diagnostics");
    }
  }, [diagnostics]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = panelHeight;
    document.body.style.cursor = "row-resize";
  }, [panelHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = startYRef.current - e.clientY;
      const newHeight = Math.max(140, Math.min(window.innerHeight - 150, startHeightRef.current + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      style={{ height: `${panelHeight}px` }}
      className="w-full flex flex-col bg-surface border-t border-border shrink-0 select-none relative transition-colors duration-150"
    >
      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className="w-full h-2 absolute -top-1 left-0 cursor-row-resize z-30 group flex items-center justify-center"
        title="Drag to resize bottom panel"
      >
        <div className="w-10 h-1 rounded-full bg-border group-hover:bg-accent group-hover:scale-y-125 transition-all" />
      </div>

      {/* Panel Tab Header */}
      <div className="h-9 border-b border-border px-3 flex items-center justify-between bg-surface-muted/40 shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Output Tab */}
          <button
            onClick={() => setActiveTab("output")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === "output"
                ? "bg-surface text-text-primary shadow-xs border border-border"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output</span>
            {exitCode !== null && (
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  exitCode === 0 ? "bg-success" : "bg-error"
                }`}
              />
            )}
          </button>

          {/* Input Tab */}
          <button
            onClick={() => setActiveTab("input")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === "input"
                ? "bg-surface text-text-primary shadow-xs border border-border"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Input</span>
            {stdin.trim().length > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            )}
          </button>

          {/* Diagnostics Tab */}
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all ${
              activeTab === "diagnostics"
                ? "bg-surface text-text-primary shadow-xs border border-border"
                : "text-text-secondary hover:text-text-primary hover:bg-surface/50"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Diagnostics</span>
            {diagnostics.length > 0 && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded-full bg-error/10 text-error border border-error/20">
                {diagnostics.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === "output" && (
          <OutputPanel
            stdout={stdout}
            stderr={stderr}
            exitCode={exitCode}
            durationMs={durationMs}
            isRunning={isRunning}
            onClear={onClearOutput}
          />
        )}
        {activeTab === "input" && (
          <InputPanel value={stdin} onChange={onStdinChange} disabled={isRunning} />
        )}
        {activeTab === "diagnostics" && (
          <DiagnosticsPanel
            diagnostics={diagnostics}
            onSelectDiagnostic={onSelectDiagnostic}
          />
        )}
      </div>
    </div>
  );
};
