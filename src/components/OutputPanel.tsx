"use client";

import React, { useState } from "react";
import { Copy, Check, Trash2, Clock, CheckCircle2, AlertTriangle } from "lucide-react";

interface OutputPanelProps {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number | null;
  isRunning: boolean;
  onClear: () => void;
}

export const OutputPanel: React.FC<OutputPanelProps> = ({
  stdout,
  stderr,
  exitCode,
  durationMs,
  isRunning,
  onClear,
}) => {
  const [copied, setCopied] = useState(false);

  const combinedOutput = [stdout, stderr].filter(Boolean).join("\n");
  const hasContent = Boolean(stdout || stderr || exitCode !== null);

  const handleCopy = async () => {
    if (!combinedOutput) return;
    try {
      await navigator.clipboard.writeText(combinedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy output", err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface select-text overflow-hidden">
      {/* Mini header bar for output actions */}
      <div className="h-8 border-b border-border/80 px-3 flex items-center justify-between bg-surface-muted/40 text-[11px] select-none shrink-0">
        <div className="flex items-center gap-3">
          {exitCode !== null && (
            <span
              className={`flex items-center gap-1 font-mono px-1.5 py-0.5 rounded text-[10px] font-medium ${
                exitCode === 0
                  ? "bg-success/10 text-success border border-success/30"
                  : "bg-error/10 text-error border border-error/30"
              }`}
            >
              {exitCode === 0 ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              <span>Process exited with code {exitCode}</span>
            </span>
          )}

          {durationMs !== null && (
            <span className="flex items-center gap-1 font-mono text-text-secondary text-[11px]">
              <Clock className="w-3 h-3 text-text-secondary/70" />
              <span>{durationMs} ms</span>
            </span>
          )}

          {isRunning && (
            <span className="flex items-center gap-1.5 font-mono text-accent text-[11px]">
              <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
              <span>Executing in WebAssembly JVM...</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!hasContent}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copy all output to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
          <button
            onClick={onClear}
            disabled={!hasContent}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-text-secondary hover:text-text-primary hover:bg-surface border border-transparent hover:border-border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Clear output"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Output Content */}
      <div className="flex-1 p-3 overflow-auto font-mono text-xs leading-relaxed">
        {!hasContent && !isRunning ? (
          <div className="h-full flex items-center justify-center text-text-secondary/60 text-xs italic">
            Run your Java program to see its output here.
          </div>
        ) : (
          <div className="space-y-1">
            {stdout && (
              <pre className="whitespace-pre-wrap break-words text-text-primary font-mono">
                {stdout}
              </pre>
            )}
            {stderr && (
              <pre className="whitespace-pre-wrap break-words text-error font-mono font-medium">
                {stderr}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

