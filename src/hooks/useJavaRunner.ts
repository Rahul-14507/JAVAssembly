"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { JavaBoxAdapter } from "@/lib/javabox/adapter";
import { Diagnostic, ExecutionResult, RuntimeStatus } from "@/lib/javabox/types";

export function useJavaRunner() {
  const [runtimeStatus, setRuntimeStatus] = useState<RuntimeStatus>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("Initializing environment...");
  const [bootProgress, setBootProgress] = useState<number>(0);
  const [bootStage, setBootStage] = useState<string>("Preparing Java environment");
  const [stdout, setStdout] = useState<string>("");
  const [stderr, setStderr] = useState<string>("");
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const adapterRef = useRef<JavaBoxAdapter | null>(null);

  useEffect(() => {
    const adapter = JavaBoxAdapter.getInstance();
    adapterRef.current = adapter;

    const unsubscribe = adapter.subscribeStatus((status, message) => {
      setRuntimeStatus(status);
      if (message) setStatusMessage(message);
      setIsRunning(status === "compiling" || status === "running");
    });

    // Automatically trigger background lazy initialization
    adapter
      .initialize((percent, stage) => {
        setBootProgress(percent);
        setBootStage(stage);
      })
      .catch((err) => {
        console.warn("[useJavaRunner] Initialization deferred/failed:", err);
      });

    return () => {
      unsubscribe();
    };
  }, []);

  const runCode = useCallback(async (source: string, stdin: string = "") => {
    if (!adapterRef.current) return;

    setStdout("");
    setStderr("");
    setExitCode(null);
    setDurationMs(null);
    setDiagnostics([]);
    setIsRunning(true);

    try {
      const result: ExecutionResult = await adapterRef.current.compileAndRun(source, stdin, {
        timeoutMs: 25000,
        onStdoutChunk: (chunk) => {
          setStdout((prev) => prev + chunk);
        },
        onStderrChunk: (chunk) => {
          setStderr((prev) => prev + chunk);
        },
      });

      setStdout(result.stdout);
      setStderr(result.stderr);
      setExitCode(result.exitCode);
      setDurationMs(result.durationMs);
      setDiagnostics(result.diagnostics);
    } catch (err: any) {
      setStderr((prev) => prev + "\n" + (err.message || String(err)));
      setExitCode(1);
    } finally {
      setIsRunning(false);
    }
  }, []);

  const stopCode = useCallback(() => {
    if (adapterRef.current) {
      adapterRef.current.stop();
    }
  }, []);

  const clearOutput = useCallback(() => {
    setStdout("");
    setStderr("");
    setExitCode(null);
    setDurationMs(null);
  }, []);

  return {
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
  };
}

