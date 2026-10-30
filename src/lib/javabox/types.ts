export type DiagnosticSeverity = "error" | "warning" | "info";

export type Diagnostic = {
  severity: DiagnosticSeverity;
  message: string;
  file?: string;
  line?: number;
  column?: number;
};

export type ExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number | null;
  diagnostics: Diagnostic[];
};

export type RuntimeStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "initializing"
  | "ready"
  | "compiling"
  | "running"
  | "error";

export type ProgressCallback = (percent: number, message: string) => void;

