"use client";

import React, { useRef, useImperativeHandle, forwardRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";

export interface CodeEditorHandle {
  revealLocation: (line: number, column?: number) => void;
  focus: () => void;
}

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onSave?: () => void;
  onCursorChange?: (line: number, column: number) => void;
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ value, onChange, onRun, onSave, onCursorChange }, ref) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    // Sync value if changed programmatically
    React.useEffect(() => {
      if (editorRef.current && editorRef.current.getValue() !== value) {
        editorRef.current.setValue(value);
      }
    }, [value]);

    useImperativeHandle(ref, () => ({
      revealLocation: (line: number, column: number = 1) => {
        if (editorRef.current) {
          editorRef.current.revealPositionInCenter({ lineNumber: line, column });
          editorRef.current.setPosition({ lineNumber: line, column });
          editorRef.current.focus();
        }
      },
      focus: () => {
        editorRef.current?.focus();
      },
    }));

    const handleEditorDidMount: OnMount = (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      // Define custom warm light theme matching design system
      monaco.editor.defineTheme("javabox-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "70756B", fontStyle: "italic" },
          { token: "keyword", foreground: "3F6B50", fontStyle: "bold" },
          { token: "string", foreground: "287A4B" },
          { token: "number", foreground: "A96B19" },
          { token: "type", foreground: "242821", fontStyle: "bold" },
          { token: "delimiter", foreground: "70756B" },
        ],
        colors: {
          "editor.background": "#FFFFFF",
          "editor.foreground": "#242821",
          "editorLineNumber.foreground": "#A8ACA2",
          "editorLineNumber.activeForeground": "#242821",
          "editorGutter.background": "#F5F5F0",
          "editor.lineHighlightBackground": "#F9F9F6",
          "editorCursor.foreground": "#242821",
          "editor.selectionBackground": "#DCDDD5",
          "editor.inactiveSelectionBackground": "#ECECE6",
        },
      });

      monaco.editor.setTheme("javabox-light");

      // Register Ctrl+Enter / Cmd+Enter for Run
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
        onRun();
      });

      // Register Ctrl+S / Cmd+S for Save
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        onSave?.();
      });

      // Track cursor position
      editor.onDidChangeCursorPosition((e) => {
        onCursorChange?.(e.position.lineNumber, e.position.column);
      });
    };

    return (
      <div className="w-full h-full relative overflow-hidden bg-editor-bg border-b border-border">
        <Editor
          height="100%"
          language="java"
          value={value}
          onChange={(val) => onChange(val || "")}
          onMount={handleEditorDidMount}
          loading={
            <div className="w-full h-full flex items-center justify-center text-xs text-text-secondary bg-surface font-mono">
              Loading editor...
            </div>
          }
          options={{
            fontFamily: "JetBrains Mono, SFMono-Regular, Menlo, monospace",
            fontSize: 14,
            lineHeight: 22,
            lineNumbers: "on",
            renderLineHighlight: "all",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: "off",
            automaticLayout: true,
            tabSize: 4,
            bracketPairColorization: { enabled: true },
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    );
  }
);

CodeEditor.displayName = "CodeEditor";
