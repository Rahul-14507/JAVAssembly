import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JavaBox Playground",
  description: "Browser-based local Java 21 compilation and execution environment powered by WebAssembly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased h-screen w-screen overflow-hidden bg-background text-text-primary">
        {children}
      </body>
    </html>
  );
}

