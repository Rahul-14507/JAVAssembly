import { Diagnostic, ExecutionResult, RuntimeStatus, ProgressCallback } from "./types";

declare global {
  interface Window {
    _javaboxModule?: any;
    crossOriginIsolated?: boolean;
  }
}

export class JavaBoxAdapter {
  private static instance: JavaBoxAdapter | null = null;
  private status: RuntimeStatus = "idle";
  private statusListeners: Set<(status: RuntimeStatus, message?: string) => void> = new Set();
  private module: any = null;
  private currentStdout: string[] = [];
  private currentStderr: string[] = [];
  private currentDiagnostics: Diagnostic[] = [];
  private onStdoutChunk?: (chunk: string) => void;
  private onStderrChunk?: (chunk: string) => void;
  private exitResolver?: (exitCode: number) => void;
  private onProtocolPrint?: (text: string) => void;
  private isExecutionRunning = false;
  private maxOutputBytes = 128 * 1024; // 128 KB
  private totalOutputBytes = 0;

  private constructor() {}

  public static getInstance(): JavaBoxAdapter {
    if (!JavaBoxAdapter.instance) {
      JavaBoxAdapter.instance = new JavaBoxAdapter();
    }
    return JavaBoxAdapter.instance;
  }

  public getStatus(): RuntimeStatus {
    return this.status;
  }

  public subscribeStatus(cb: (status: RuntimeStatus, message?: string) => void): () => void {
    this.statusListeners.add(cb);
    cb(this.status);
    return () => this.statusListeners.delete(cb);
  }

  private setStatus(status: RuntimeStatus, message?: string) {
    this.status = status;
    this.statusListeners.forEach((cb) => cb(status, message));
  }

  public async initialize(onProgress?: ProgressCallback): Promise<void> {
    if (this.module && this.status === "ready") {
      return;
    }
    if (this.status === "initializing" || this.status === "downloading") {
      return;
    }

    if (typeof window === "undefined") {
      throw new Error("JavaBox can only run in the browser");
    }

    if (!window.crossOriginIsolated) {
      const err = "Cross-Origin Isolation is required (SharedArrayBuffer). COOP and COEP headers must be set.";
      this.setStatus("error", err);
      throw new Error(err);
    }

    try {
      this.setStatus("downloading", "Preparing WebAssembly runtime...");
      onProgress?.(10, "Fetching JavaBox WebAssembly binary...");

      // 1. Fetch & stream compile WASM module
      const wasmFetch = fetch("/javabox/javabox-direct.wasm");
      const wasmPromise = WebAssembly.compileStreaming(wasmFetch);

      onProgress?.(30, "Importing JavaBox module...");
      // Use dynamic import function so TypeScript and bundlers do not attempt static module resolution
      const dynamicImport = new Function("url", "return import(url)");
      const moduleNamespace = await dynamicImport("/javabox/javabox-direct.mjs");
      const createModule = moduleNamespace.default;

      onProgress?.(50, "Compiling WebAssembly binary...");
      const compiledWasm = await wasmPromise;

      this.setStatus("initializing", "Booting OpenJDK 21 JVM...");
      onProgress?.(70, "Starting OpenJDK Zero JVM...");

      const directModuleConfig: any = {
        locateFile: (path: string) => `/javabox/${path}`,
        instantiateWasm: (imports: any, callback: any) => {
          WebAssembly.instantiate(compiledWasm, imports).then((instance) => {
            callback(instance, compiledWasm);
          });
          return {};
        },
        print: (text: string) => {
          this.handlePrint(text);
        },
        printErr: (text: string) => {
          this.handlePrintErr(text);
        },
        onExit: (code: number) => {
          if (this.exitResolver) {
            this.exitResolver(code);
          }
        },
      };

      const Module = await createModule(directModuleConfig);
      this.module = Module;
      window._javaboxModule = Module;
      (window as any)._javaboxAdapterInstance = this;

      // Enable ring buffer stdin
      Module.ccall("jvm_enable_ring_buffer_stdin", null, [], []);

      onProgress?.(90, "Waiting for CompileServer daemon...");

      // Ping until JBOX_PONG is received
      await this.waitForCompileServerReady(60000);

      this.setStatus("ready", "Java 21 Runtime Ready");
      onProgress?.(100, "Java environment ready");
    } catch (err: any) {
      console.error("[JavaBoxAdapter] Initialization error:", err);
      this.setStatus("error", err.message || "Initialization failed");
      throw err;
    }
  }

  private handlePrint(text: string) {
    if (this.onProtocolPrint) {
      this.onProtocolPrint(text);
    }

    // Check for exit code
    const exitMatch = text.match(/JBOX_EXIT:(\d+)/);
    if (exitMatch) {
      const code = parseInt(exitMatch[1], 10);
      if (this.exitResolver) {
        this.exitResolver(code);
      }
      return;
    }

    // Filter protocol signals from normal output
    if (/^JBOX_(PONG|COMPILE|END|PING|DOOM)/.test(text)) {
      return;
    }
    if (/^={5,}/.test(text)) {
      return;
    }

    if (this.totalOutputBytes < this.maxOutputBytes) {
      this.currentStdout.push(text);
      this.totalOutputBytes += text.length;
      if (this.onStdoutChunk) {
        this.onStdoutChunk(text + "\n");
      }
    } else if (this.totalOutputBytes === this.maxOutputBytes) {
      const limitNotice = "\n[Output truncated: exceeded maximum output limit of 128KB]";
      this.currentStdout.push(limitNotice);
      this.totalOutputBytes += limitNotice.length + 1;
      if (this.onStdoutChunk) {
        this.onStdoutChunk(limitNotice + "\n");
      }
    }
  }

  private handlePrintErr(text: string) {
    // Filter internal JVM threads / daemon noise
    if (/^Exception in thread "(Finalizer|Common-Cleaner|DoomLoop|Reference Handler|Logging-Cleaner)"/.test(text)) {
      return;
    }
    if (text === "java.lang.NullPointerException") {
      return;
    }
    // Filter daemon teardown stream closed errors when user code closes System.in (sc.close())
    if (/^Exception in thread "main" java\.io\.IOException: Stream closed/.test(text)) {
      return;
    }
    if (/^\s*at (java\.base\/(java\.io|sun\.nio)|CompileServer)/.test(text)) {
      return;
    }

    if (this.totalOutputBytes < this.maxOutputBytes) {
      this.currentStderr.push(text);
      this.totalOutputBytes += text.length;
      if (this.onStderrChunk) {
        this.onStderrChunk(text + "\n");
      }
    }
  }

  private async waitForCompileServerReady(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    let gotPong = false;

    return new Promise<void>((resolve, reject) => {
      const pingInterval = setInterval(() => {
        if (gotPong) {
          clearInterval(pingInterval);
          return;
        }
        if (Date.now() - startTime > timeoutMs) {
          clearInterval(pingInterval);
          this.onProtocolPrint = undefined;
          reject(new Error("Timeout waiting for Java CompileServer to warm up"));
          return;
        }
        try {
          this.writeStdin("JBOX_PING\n");
        } catch {
          // ignore until fully initialized
        }
      }, 1000);

      this.onProtocolPrint = (text: string) => {
        if (text.includes("JBOX_PONG")) {
          gotPong = true;
          clearInterval(pingInterval);
          this.onProtocolPrint = undefined;
          resolve();
        }
      };
    });
  }

  public writeStdin(input: string): void {
    if (!this.module) {
      throw new Error("JavaBox runtime is not initialized");
    }
    this.module.ccall("jvm_stdin_write_string", null, ["string"], [input]);
  }

  public parseDiagnostics(output: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const lines = output.split("\n");
    // Format: [/]FileName.java:Line: (error|warning|note): Message
    const headerRegex = /^(?:\/)?([a-zA-Z0-9_$]+\.java):(\d+):\s*(error|warning|note):\s*(.+)$/;
    const pointerRegex = /^(\s*)\^/;

    for (let i = 0; i < lines.length; i++) {
      const match = headerRegex.exec(lines[i]);
      if (match) {
        const file = match[1];
        const line = parseInt(match[2], 10);
        const severity = match[3] === "note" ? "info" : (match[3] as "error" | "warning");
        const message = match[4];

        let column: number | undefined;
        // Search next few lines for column pointer
        for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
          const ptrMatch = pointerRegex.exec(lines[j]);
          if (ptrMatch) {
            column = ptrMatch[1].length + 1;
            break;
          }
        }

        diagnostics.push({
          file,
          line,
          column,
          severity,
          message,
        });
      }
    }

    return diagnostics;
  }

  public async compileAndRun(
    source: string,
    stdin: string = "",
    options?: {
      timeoutMs?: number;
      onStdoutChunk?: (chunk: string) => void;
      onStderrChunk?: (chunk: string) => void;
    }
  ): Promise<ExecutionResult> {
    if (this.isExecutionRunning) {
      throw new Error("An execution is already in progress.");
    }
    if (!this.module || this.status !== "ready") {
      await this.initialize();
    }

    const timeoutMs = options?.timeoutMs ?? 30000;
    this.isExecutionRunning = true;
    this.setStatus("compiling", "Compiling Java program...");

    this.currentStdout = [];
    this.currentStderr = [];
    this.totalOutputBytes = 0;
    this.onStdoutChunk = options?.onStdoutChunk;
    this.onStderrChunk = options?.onStderrChunk;

    // Detect class name
    const classMatch = source.match(/public\s+class\s+([A-Za-z0-9_$]+)/) || source.match(/class\s+([A-Za-z0-9_$]+)/);
    const className = classMatch ? classMatch[1] : "Main";

    const startTime = performance.now();

    return new Promise<ExecutionResult>((resolve) => {
      let isSettled = false;
      let timer: NodeJS.Timeout | null = null;

      const finish = (exitCode: number | null, timedOut: boolean = false) => {
        if (isSettled) return;
        isSettled = true;
        if (timer) clearTimeout(timer);
        this.exitResolver = undefined;
        this.isExecutionRunning = false;

        const durationMs = Math.round(performance.now() - startTime);
        const rawStdout = this.currentStdout.join("\n");
        const rawStderr = this.currentStderr.join("\n");

        if (timedOut) {
          this.currentStderr.push(`\n[Execution timed out after ${timeoutMs / 1000} seconds]`);
        }

        const combinedOutput = rawStdout + "\n" + rawStderr;
        const diagnostics = this.parseDiagnostics(combinedOutput);

        // Check if CompileServer is still healthy or if System.in was closed
        this.checkLiveness(600).then((isAlive) => {
          if (!isAlive) {
            this.module = null;
            this.setStatus("idle");
          } else {
            this.setStatus("ready");
          }
        });

        resolve({
          stdout: this.currentStdout.join("\n"),
          stderr: this.currentStderr.join("\n"),
          exitCode: timedOut ? 124 : exitCode,
          durationMs,
          diagnostics,
        });
      };

      this.exitResolver = (code: number) => {
        finish(code, false);
      };

      timer = setTimeout(() => {
        finish(null, true);
      }, timeoutMs);

      // 1. Send the compile command
      const compileCmd = `JBOX_COMPILE ${className}\n${source}\nJBOX_END\n`;
      this.writeStdin(compileCmd);

      // Transition to running status after short delay to compile
      setTimeout(() => {
        if (this.isExecutionRunning) {
          this.setStatus("running", "Executing program...");
          // Send stdin if any was provided
          if (stdin && stdin.length > 0) {
            const normalizedStdin = stdin.endsWith("\n") ? stdin : stdin + "\n";
            this.writeStdin(normalizedStdin);
          }
        }
      }, 300);
    });
  }

  public async checkLiveness(timeoutMs: number = 600): Promise<boolean> {
    if (!this.module) return false;
    let gotPong = false;
    this.onProtocolPrint = (text: string) => {
      if (text.includes("JBOX_PONG")) {
        gotPong = true;
      }
    };
    try {
      this.writeStdin("JBOX_PING\n");
    } catch {
      this.onProtocolPrint = undefined;
      return false;
    }

    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (gotPong) {
        this.onProtocolPrint = undefined;
        return true;
      }
      await new Promise((r) => setTimeout(r, 40));
    }
    this.onProtocolPrint = undefined;
    return false;
  }

  public stop(): void {
    if (this.isExecutionRunning && this.exitResolver) {
      this.exitResolver(130);
    }
  }
}
