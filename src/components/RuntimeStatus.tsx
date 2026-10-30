"use client";

import React from "react";
import { AlertCircle, RefreshCw, Cpu, Layers } from "lucide-react";
import { RuntimeStatus } from "@/lib/javabox/types";

interface RuntimeStatusProps {
  runtimeStatus: RuntimeStatus;
  statusMessage: string;
  bootProgress: number;
  bootStage: string;
  onRetry?: () => void;
}

export const RuntimeStatusBanner: React.FC<RuntimeStatusProps> = ({
  runtimeStatus,
  statusMessage,
  bootProgress,
  bootStage,
  onRetry,
}) => {
  // If ready, idle, compiling or running, do not display overlay
  if (
    runtimeStatus === "ready" ||
    runtimeStatus === "compiling" ||
    runtimeStatus === "running" ||
    runtimeStatus === "idle"
  ) {
    return null;
  }

  const isBooting =
    runtimeStatus === "downloading" ||
    runtimeStatus === "initializing" ||
    runtimeStatus === "checking";

  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface border border-border rounded-lg shadow-lg p-6 flex flex-col items-center text-center">
        {isBooting ? (
          <>
            <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-1">
              Initializing Java 21 Environment
            </h2>
            <p className="text-xs text-text-secondary mb-5 max-w-sm">
              Loading OpenJDK 21 directly in your browser via WebAssembly. This happens only once and takes 3–5 seconds.
            </p>

            <div className="w-full bg-surface-muted rounded-full h-2 mb-2 overflow-hidden border border-border">
              <div
                className="bg-accent h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(8, bootProgress)}%` }}
              />
            </div>

            <div className="w-full flex justify-between items-center text-[11px] font-mono text-text-secondary">
              <span>{bootStage || statusMessage}</span>
              <span>{bootProgress}%</span>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-error/10 border border-error/20 flex items-center justify-center text-error mb-4">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold text-text-primary mb-1">
              Runtime Initialization Error
            </h2>
            <p className="text-xs text-error font-medium mb-3 max-w-sm">
              {statusMessage}
            </p>

            {statusMessage.includes("Cross-Origin Isolation") && (
              <div className="w-full text-left bg-surface-muted p-3 rounded border border-border mb-4 font-mono text-[11px] text-text-secondary leading-relaxed">
                <div className="font-semibold text-text-primary mb-1">Required HTTP Headers:</div>
                <div>Cross-Origin-Opener-Policy: same-origin</div>
                <div>Cross-Origin-Embedder-Policy: require-corp</div>
              </div>
            )}

            {onRetry && (
              <button
                onClick={onRetry}
                className="flex items-center gap-2 px-4 py-2 rounded text-xs font-semibold bg-accent text-white hover:bg-accent-hover transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Runtime Launch</span>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

