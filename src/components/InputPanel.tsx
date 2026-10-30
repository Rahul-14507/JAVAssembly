"use client";

import React from "react";

interface InputPanelProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const InputPanel: React.FC<InputPanelProps> = ({ value, onChange, disabled }) => {
  return (
    <div className="w-full h-full flex flex-col bg-surface p-3 select-text">
      <div className="flex items-center justify-between mb-2">
        <label
          htmlFor="stdin-input"
          className="text-xs font-medium text-text-secondary font-mono tracking-tight"
        >
          Standard Input (stdin)
        </label>
        <span className="text-[11px] text-text-secondary/70">
          Passed to System.in when program executes
        </span>
      </div>
      <textarea
        id="stdin-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Enter input for your Java program..."
        className="flex-1 w-full p-2.5 rounded bg-background/50 border border-border text-xs font-mono text-text-primary resize-none focus:outline-none focus:border-accent focus:bg-surface transition-colors"
        spellCheck={false}
      />
    </div>
  );
};

