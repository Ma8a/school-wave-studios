"use client";

import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthScreen } from "@/components/auth-screen";
import { QueryProvider } from "@/components/query-provider";
import { SiteHeader } from "@/components/site-header";
import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <TooltipProvider delay={150}>
          <AuthScreen>
            <SiteHeader />
            <main className="flex-1">{children}</main>
          </AuthScreen>
        </TooltipProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
