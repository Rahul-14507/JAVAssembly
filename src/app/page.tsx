"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { AppToolbar } from "@/components/AppToolbar";
import { CodeEditor, CodeEditorHandle } from "@/components/CodeEditor";
import { BottomPanel } from "@/components/BottomPanel";
import { StatusBar } from "@/components/StatusBar";
import { RuntimeStatusBanner } from "@/components/RuntimeStatus";
import { useJavaRunner } from "@/hooks/useJavaRunner";
import { Diagnostic } from "@/lib/javabox/types";

const DEFAULT_JAVA_CODE = `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        System.out.println("Hello from JavaBox!");

        if (sc.hasNextInt()) {
            int a = sc.nextInt();

            if (sc.hasNextInt()) {
                int b = sc.nextInt();
                System.out.println("Sum: " + (a + b));
            }
        }

        // sc.close(); // Keep System.in open for JVM session reuse
    }
}
`;

const DEFAULT_STDIN = `10 20`;

const STORAGE_KEY_CODE = "javabox_source_v1";
const STORAGE_KEY_STDIN = "javabox_stdin_v1";
const STORAGE_KEY_THEME = "javassembly_theme";

export default function PlaygroundPage() {
  const [code, setCode] = useState<string>(DEFAULT_JAVA_CODE);
  const [stdin, setStdin] = useState<string>(DEFAULT_STDIN);
  const [isModified, setIsModified] = useState<boolean>(false);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [cursorPos, setCursorPos] = useState<{ line: number; column: number }>({
    line: 1,
    column: 1,
  });

  const codeRef = useRef(code);
  const stdinRef = useRef(stdin);
  codeRef.current = code;
  stdinRef.current = stdin;

  const editorRef = useRef<CodeEditorHandle>(null);

  const {
    runtimeStatus,
    statusMessage,
    bootProgress,
    bootStage,
    stdout,
    stderr,
    exitCode,
    durationMs,
    diagnostics,
    isRunning,
    runCode,
    stopCode,
    clearOutput,
  } = useJavaRunner();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCode = localStorage.getItem(STORAGE_KEY_CODE);
      const savedStdin = localStorage.getItem(STORAGE_KEY_STDIN);
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as "light" | "dark" | null;

      if (savedCode !== null) {
        setCode(savedCode);
        if (savedCode !== DEFAULT_JAVA_CODE) {
          setIsModified(true);
        }
      }
      if (savedStdin !== null) {
        setStdin(savedStdin);
      }
      if (savedTheme === "light" || savedTheme === "dark") {
        setTheme(savedTheme);
        document.documentElement.classList.toggle("dark", savedTheme === "dark");
      } else {
        // Default to dark mode for sleek developer experience
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    } catch {
      // LocalStorage unavailable/disabled
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
      }
      try {
        localStorage.setItem(STORAGE_KEY_THEME, next);
      } catch {
        // storage error
      }
      return next;
    });
  }, []);

  // Save changes locally
  const saveLocally = useCallback((newCode: string, newStdin: string) => {
    try {
      localStorage.setItem(STORAGE_KEY_CODE, newCode);
      localStorage.setItem(STORAGE_KEY_STDIN, newStdin);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setIsModified(newCode !== DEFAULT_JAVA_CODE);
    saveLocally(newCode, stdin);
  };

  const handleStdinChange = (newStdin: string) => {
    setStdin(newStdin);
    saveLocally(code, newStdin);
  };

  const handleRun = useCallback((overrideCode?: string, overrideStdin?: string) => {
    if (isRunning) return;
    const src = typeof overrideCode === "string" ? overrideCode : codeRef.current;
    const input = typeof overrideStdin === "string" ? overrideStdin : stdinRef.current;
    runCode(src, input);
  }, [isRunning, runCode]);

  const handleReset = useCallback(() => {
    codeRef.current = DEFAULT_JAVA_CODE;
    stdinRef.current = DEFAULT_STDIN;
    setCode(DEFAULT_JAVA_CODE);
    setStdin(DEFAULT_STDIN);
    setIsModified(false);
    saveLocally(DEFAULT_JAVA_CODE, DEFAULT_STDIN);
  }, [saveLocally]);

  // Expose test helper methods on window for automated verification
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any)._setPlaygroundCode = (newCode: string) => {
        codeRef.current = newCode;
        setCode(newCode);
        saveLocally(newCode, stdinRef.current);
      };
      (window as any)._setPlaygroundStdin = (newStdin: string) => {
        stdinRef.current = newStdin;
        setStdin(newStdin);
        saveLocally(codeRef.current, newStdin);
      };
      (window as any)._runPlayground = (overrideCode?: string, overrideStdin?: string) => {
        handleRun(overrideCode, overrideStdin);
      };
    }
  }, [handleRun, saveLocally]);

  const handleSelectDiagnostic = useCallback((diag: Diagnostic) => {
    if (diag.line && editorRef.current) {
      editorRef.current.revealLocation(diag.line, diag.column || 1);
    }
  }, []);

  // Global keyboard shortcuts (Ctrl+Enter / Cmd+Enter, Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === "Enter") {
        e.preventDefault();
        handleRun();
      }

      if (modifier && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        saveLocally(code, stdin);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun, code, stdin, saveLocally]);

  return (
    <div className="flex flex-col h-screen w-screen bg-background overflow-hidden relative">
      {/* Top Application Toolbar */}
      <AppToolbar
        filename="Main.java"
        isModified={isModified}
        runtimeStatus={runtimeStatus}
        isRunning={isRunning}
        theme={theme}
        onToggleTheme={toggleTheme}
        onRun={handleRun}
        onStop={stopCode}
        onReset={handleReset}
      />

      {/* Main Workspace: Code Editor (top/center) & Resizable Bottom Panel */}
      <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        <div className="flex-1 min-h-0 relative">
          <CodeEditor
            ref={editorRef}
            value={code}
            theme={theme}
            onChange={handleCodeChange}
            onRun={handleRun}
            onSave={() => saveLocally(code, stdin)}
            onCursorChange={(line, column) => setCursorPos({ line, column })}
          />
        </div>

        <BottomPanel
          stdin={stdin}
          onStdinChange={handleStdinChange}
          stdout={stdout}
          stderr={stderr}
          exitCode={exitCode}
          durationMs={durationMs}
          diagnostics={diagnostics}
          isRunning={isRunning}
          onClearOutput={clearOutput}
          onSelectDiagnostic={handleSelectDiagnostic}
        />
      </main>

      {/* Bottom Status Bar */}
      <StatusBar
        runtimeStatus={runtimeStatus}
        statusMessage={statusMessage}
        cursorPos={cursorPos}
      />

      {/* Boot & Initial Progress Overlay */}
      <RuntimeStatusBanner
        runtimeStatus={runtimeStatus}
        statusMessage={statusMessage}
        bootProgress={bootProgress}
        bootStage={bootStage}
        onRetry={() => window.location.reload()}
      />
    </div>
  );
}
