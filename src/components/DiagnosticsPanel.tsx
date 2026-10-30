"use client";

import React from "react";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { Diagnostic } from "@/lib/javabox/types";

interface DiagnosticsPanelProps {
  diagnostics: Diagnostic[];
  onSelectDiagnostic?: (diagnostic: Diagnostic) => void;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  diagnostics,
  onSelectDiagnostic,
}) => {
  if (diagnostics.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary/60 text-xs p-4 select-none">
        <CheckCircle2 className="w-6 h-6 text-success/60 mb-1" />
        <span>No diagnostics to report.</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-surface p-2 select-text">
      <div className="space-y-1">
        {diagnostics.map((diag, idx) => (
          <div
            key={idx}
            onClick={() => onSelectDiagnostic?.(diag)}
            className="flex items-start gap-2.5 p-2 rounded hover:bg-surface-muted/60 border border-transparent hover:border-border cursor-pointer transition-colors text-xs font-mono"
            title={diag.line ? `Click to jump to line ${diag.line}` : undefined}
          >
            <div className="mt-0.5 shrink-0">
              {diag.severity === "error" && (
                <AlertCircle className="w-3.5 h-3.5 text-error" />
              )}
              {diag.severity === "warning" && (
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              )}
              {diag.severity === "info" && (
                <Info className="w-3.5 h-3.5 text-accent" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 text-[11px] text-text-secondary">
                <span className="font-semibold text-text-primary uppercase tracking-wider text-[10px]">
                  {diag.severity}
                </span>
                {diag.file && <span>{diag.file}</span>}
                {diag.line && (
                  <span className="px-1 py-0.2 rounded bg-surface-muted border border-border/80">
                    Ln {diag.line}{diag.column ? `, Col ${diag.column}` : ""}
                  </span>
                )}
              </div>
              <div className="text-text-primary whitespace-pre-wrap break-words">
                {diag.message}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

