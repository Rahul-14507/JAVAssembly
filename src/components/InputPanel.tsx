"use client";

import React from "react";

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ value, onChange, disabled }) => {
  const lineCount = value.split("\n").length;
  const charCount = value.length;

  return (
    <div className="w-full h-full flex flex-col bg-surface p-2.5 sm:p-3 select-text transition-colors duration-150">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="stdin-input"
          className="text-xs font-medium text-text-secondary font-mono tracking-tight flex items-center gap-1.5"
        >
          <span>Standard Input (stdin)</span>
          <span className="hidden sm:inline text-[10px] text-text-secondary/60 font-sans font-normal">
            — Passed to System.in during execution
          </span>
        </label>
        <span className="text-[10px] font-mono text-text-secondary/70">
          {lineCount} {lineCount === 1 ? "line" : "lines"} • {charCount} chars
        </span>
      </div>
      <textarea
        id="stdin-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter input for your Java program (e.g. numbers, strings, or multi-line data)..."
        className="flex-1 w-full p-3 rounded-md bg-surface-muted border border-border text-xs font-mono text-text-primary resize-none focus:outline-none focus:border-accent focus:bg-surface transition-colors leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
};
