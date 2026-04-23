"use client";

import { Palette } from "lucide-react";
import { AccountSection } from "@/components/account-section";
import { CurrentWeekSection } from "@/components/current-week-section";
import { ThemePicker } from "@/components/theme-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Account and appearance.
        </p>
      </header>

      <AccountSection />

      <CurrentWeekSection />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" /> Theme
          </CardTitle>
          <CardDescription>
            Pick a color palette and a light / dark mode. Changes apply
            instantly across the whole app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePicker />
        </CardContent>
      </Card>

      <Separator />

      <p className="text-center text-xs text-muted-foreground">
        School Wave Studios · Version 0.8.0
      </p>
    </div>
  );
}
