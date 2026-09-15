import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { App } from "./App";
import "./index.css";

// Replaces src/app/layout.tsx (Next.js root layout) - the
// skip-to-main link, TooltipProvider and Toaster that previously
// wrapped every page in the App Router now wrap the whole SPA here.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        Skip to main content
      </a>
      <TooltipProvider delayDuration={200}>
        <App />
      </TooltipProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "!rounded-xl !border !border-ink-200 !bg-white !shadow-lg !font-sans !text-navy-900",
            description: "!text-ink-500",
            actionButton: "!bg-navy-900 !text-white !rounded-md",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
