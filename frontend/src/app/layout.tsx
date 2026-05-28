export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "VEXA — Intelligent Financial Copilot",
  description: "AI-powered financial intelligence for the modern professional.",
  openGraph: {
    title: "VEXA — Intelligent Financial Copilot",
    description: "AI-powered financial intelligence for the modern professional.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-base-bg text-ink-primary font-body antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1A2235",
              color: "#F0F4FF",
              border: "1px solid #1E2D4A",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#00D084", secondary: "#0B1020" } },
            error:   { iconTheme: { primary: "#FF4444", secondary: "#0B1020" } },
          }}
        />
      </body>
    </html>
  );
}
