"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { LogIn, Sparkles, UserPlus } from "lucide-react";
import {
  useCurrentUser,
  useLogin,
  useRegister,
} from "@/components/api/use-current-user";
import { PinInput } from "@/components/pin-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { isValidPinFormat, PIN_LENGTH } from "@/lib/auth";

const USERNAME_RE = /^[a-z0-9_-]{3,24}$/i;

export function AuthScreen({ children }: { children: ReactNode }) {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-sm text-muted-foreground animate-pulse">
          Loading…
        </div>
      </div>
    );
  }

  if (user) return <>{children}</>;

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-2xl">School Wave Studios</CardTitle>
            <CardDescription className="mt-1">
              Sign in to your account, or create one if it&apos;s your first
              time.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">
                <LogIn className="mr-1 h-3.5 w-3.5" />
                Sign in
              </TabsTrigger>
              <TabsTrigger value="register">
                <UserPlus className="mr-1 h-3.5 w-3.5" />
                Create account
              </TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register" className="mt-4">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginForm() {
  const login = useLogin();
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");

  const canSubmit =
    username.trim().length >= 3 && isValidPinFormat(pin) && !login.isPending;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    login.mutate(
      { username: username.trim().toLowerCase(), pin },
      {
        onError: () => setPin(""),
      },
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="login-username">Username</Label>
        <Input
          id="login-username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={24}
          placeholder="Type your username"
          autoFocus
        />
      </div>
      <div className="space-y-2">
        <Label className="block text-center text-xs uppercase tracking-wider text-muted-foreground">
          PIN
        </Label>
        <PinInput
          value={pin}
          onChange={setPin}
          length={PIN_LENGTH}
          disabled={login.isPending}
          error={login.isError}
          ariaLabel="Sign-in PIN"
        />
      </div>
      {login.isError && (
        <p className="text-center text-sm text-destructive">
          {login.error instanceof Error ? login.error.message : "Sign in failed."}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!canSubmit}>
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const register = useRegister();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");

  const usernameOk = USERNAME_RE.test(username);
  const nameOk = name.trim().length > 0;
  const pinOk = isValidPinFormat(pin);
  const confirmOk = pin === confirm && confirm.length === PIN_LENGTH;
  const canSubmit =
    usernameOk && nameOk && pinOk && confirmOk && !register.isPending;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    register.mutate({
      username: username.trim().toLowerCase(),
      name: name.trim(),
      pin,
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label htmlFor="reg-username">Username</Label>
        <Input
          id="reg-username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          maxLength={24}
          placeholder="3–24 letters / numbers / -_"
          aria-invalid={username.length > 0 && !usernameOk}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reg-name">Your name</Label>
        <Input
          id="reg-name"
          autoComplete="given-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
          placeholder="What should we call you?"
        />
      </div>
      <div className="space-y-2">
        <Label className="block text-center text-xs uppercase tracking-wider text-muted-foreground">
          PIN
        </Label>
        <PinInput
          value={pin}
          onChange={setPin}
          length={PIN_LENGTH}
          disabled={register.isPending}
          ariaLabel="New PIN"
        />
      </div>
      <div className="space-y-2">
        <Label className="block text-center text-xs uppercase tracking-wider text-muted-foreground">
          Confirm PIN
        </Label>
        <PinInput
          value={confirm}
          onChange={setConfirm}
          length={PIN_LENGTH}
          disabled={register.isPending}
          error={confirm.length === PIN_LENGTH && pin !== confirm}
          ariaLabel="Confirm PIN"
        />
      </div>
      {register.isError && (
        <p className="text-center text-sm text-destructive">
          {register.error instanceof Error
            ? register.error.message
            : "Registration failed."}
        </p>
      )}
      <Button type="submit" size="lg" disabled={!canSubmit}>
        {register.isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Your data stays on your dad&apos;s server. Only you (with this PIN)
        can read it.
      </p>
    </form>
  );
}
