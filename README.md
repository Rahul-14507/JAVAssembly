# JAVAssembly

A lightweight, modern in-browser Java IDE and playground powered by WebAssembly. Write, compile, and execute real Java 21 code entirely on the client side without any server-side JVM, backend API, or remote compilation service.

---

## Features

- **100% Client-Side Execution:** Runs OpenJDK 21 Zero bytecode interpreter compiled to WebAssembly via Emscripten.
- **Sub-Second Compile & Run:** Persistent in-memory `CompileServer` daemon keeps the JVM warm to execute repeated runs in 150–500ms.
- **Full Standard I/O Support:** Standard input (`stdin`), standard output (`stdout`), standard error (`stderr`), and accurate process exit codes (`0`, `1`, etc.).
- **Interactive Stdin Bridge:** Powered by SharedArrayBuffer ring buffer and Atomics/futex synchronization between the UI thread and the WebAssembly worker thread.
- **Structured Compiler Diagnostics:** Captures compiler errors and warnings with file name, line, column, and error message, clickable to navigate directly in Monaco Editor.
- **Restrained Modern UI/UX:** Built with Next.js, React, Tailwind CSS, and Monaco Editor using a warm, distraction-free technical aesthetic.

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Google Chrome, Microsoft Edge, or any modern Chromium-based browser.

### 3. Build for production

```bash
npm run build
npm run start
```

---

## Architecture

```
Browser Tab
  ├── Next.js / React Frontend Chrome
  │     ├── AppToolbar (Run, Stop, Reset, Status)
  │     ├── Monaco Code Editor (Java syntax highlighting & diagnostics)
  │     ├── Resizable Bottom Panel (Output, Input/stdin, Diagnostics)
  │     └── StatusBar (Java 21, Execution Engine, Cursor Ln/Col)
  │
  └── JavaBox WebAssembly Runtime (Direct WASM Mode)
        ├── javabox-direct.wasm (~3.27MB WebAssembly core)
        ├── javabox-direct.data (~72.1MB JDK 21 modules & class library)
        ├── OpenJDK 21 Zero Bytecode Interpreter
        └── Persistent CompileServer Daemon
              ├── javax.tools.JavaCompiler (In-memory bytecode compilation)
              ├── MemoryClassLoader (Dynamic byte[] class loading)
              └── SharedArrayBuffer Ring Buffer (stdin/stdout bridging)
```

---

## Security & Browser Requirements

JavaBox requires **`SharedArrayBuffer`** and multithreading primitives (`Atomics.wait` and `Atomics.notify`), which require Cross-Origin Isolation:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

These headers are configured in `next.config.mjs`.

### Supported Browsers

- Google Chrome 92+
- Microsoft Edge 92+
- Mozilla Firefox 79+
- Safari 15.2+

---

## Keyboard Shortcuts

- **Ctrl+Enter** (Windows/Linux) / **⌘+Enter** (macOS): Compile and Run the Java program.
- **Ctrl+S** (Windows/Linux) / **⌘+S** (macOS): Save source code and stdin locally (prevents browser save dialog).

---

## License

MIT / GPLv2 (OpenJDK components subject to GPLv2 with Classpath Exception).
