"use client";

import React from "react";
import { Cpu, ShieldCheck, AlertCircle } from "lucide-react";
import { RuntimeStatus } from "@/lib/javabox/types";

interface StatusBarProps {
  runtimeStatus: RuntimeStatus;
  statusMessage: string;
  cursorPos: { line: number; column: number };
}

export const StatusBar: React.FC<StatusBarProps> = ({
  runtimeStatus,
  statusMessage,
  cursorPos,
}) => {
  const getStatusBadge = () => {
    switch (runtimeStatus) {
      case "ready":
        return {
          dotColor: "bg-success",
          label: "Ready",
          textColor: "text-text-primary",
        };
      case "compiling":
        return {
          dotColor: "bg-accent animate-pulse",
          label: "Compiling...",
          textColor: "text-accent",
        };
      case "running":
        return {
          dotColor: "bg-accent animate-pulse",
          label: "Running...",
          textColor: "text-accent",
        };
      case "downloading":
      case "initializing":
      case "checking":
        return {
          dotColor: "bg-warning animate-pulse",
          label: "Initializing JVM...",
          textColor: "text-warning",
        };
      case "error":
        return {
          dotColor: "bg-error",
          label: "Runtime Error",
          textColor: "text-error",
        };
      default:
        return {
          dotColor: "bg-text-secondary",
          label: "Idle",
          textColor: "text-text-secondary",
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <footer className="h-6 bg-surface-muted border-t border-border px-3 flex items-center justify-between text-[11px] font-mono text-text-secondary select-none shrink-0 z-20">
      {/* Left: Java 21 & JVM Status */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-text-primary">Java 21</span>
        <span className="text-border">|</span>
        <div className="flex items-center gap-1.5" title={statusMessage}>
          <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
          <span className={`font-medium ${badge.textColor}`}>{badge.label}</span>
        </div>
      </div>

      {/* Center: Real Local Execution Indicator */}
      <div className="hidden sm:flex items-center gap-1.5 text-text-secondary">
        <Cpu className="w-3 h-3 text-accent" />
        <span>Local Execution: WebAssembly OpenJDK Zero</span>
      </div>

      {/* Right: Cursor position */}
      <div className="flex items-center gap-2">
        <span>
          Ln {cursorPos.line}, Col {cursorPos.column}
        </span>
        <span className="text-border">|</span>
        <span className="text-[10px] uppercase tracking-wider text-text-secondary">UTF-8</span>
      </div>
    </footer>
  );
};

