"use client";

import { useState, type FormEvent } from "react";
import {
  KeyRound,
  LogOut,
  Pencil,
  ShieldAlert,
  Trash2,
  UserCircle2,
} from "lucide-react";
import {
  useChangePin,
  useCurrentUser,
  useDeleteAccount,
  useLogout,
  useUpdateName,
} from "@/components/api/use-current-user";
import { PinInput } from "@/components/pin-input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isValidPinFormat, PIN_LENGTH } from "@/lib/auth";

export function AccountSection() {
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCircle2 className="h-5 w-5" /> Account
        </CardTitle>
        <CardDescription>
          Your account details and PIN. The account is shared across every
          device you sign in from.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {user ? (
          <div className="rounded-md border border-border bg-card p-3">
            <div className="text-sm">
              <span className="text-muted-foreground">Name: </span>
              <span className="font-semibold">{user.name}</span>
            </div>
            <div className="mt-1 text-sm">
              <span className="text-muted-foreground">Username: </span>
              <span className="font-mono text-xs">@{user.username}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not signed in.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setNameDialogOpen(true)}
            disabled={!user}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Change name
          </Button>
          <Button
            variant="outline"
            onClick={() => setPinDialogOpen(true)}
            disabled={!user}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Change PIN
          </Button>
          <Button
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={!user || logout.isPending}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {logout.isPending ? "Signing out…" : "Sign out"}
          </Button>
          <DeleteAccountDialog disabled={!user} />
        </div>
      </CardContent>

      {user && (
        <>
          <ChangeNameDialog
            open={nameDialogOpen}
            onOpenChange={setNameDialogOpen}
            currentName={user.name}
          />
          <ChangePinDialog
            open={pinDialogOpen}
            onOpenChange={setPinDialogOpen}
          />
        </>
      )}
    </Card>
  );
}

function ChangeNameDialog({
  open,
  onOpenChange,
  currentName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentName: string;
}) {
  const updateName = useUpdateName();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName(currentName);
    setError(null);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (trimmed === currentName) {
      onOpenChange(false);
      return;
    }
    setError(null);
    updateName.mutate(trimmed, {
      onSuccess: () => onOpenChange(false),
      onError: (err) => setError(err instanceof Error ? err.message : "Failed"),
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change name</DialogTitle>
          <DialogDescription>
            Your display name. Shown when the app greets you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Name</Label>
            <Input
              id="new-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              maxLength={32}
              autoFocus
              disabled={updateName.isPending}
            />
          </div>
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={updateName.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                updateName.isPending ||
                !name.trim() ||
                name.trim() === currentName
              }
            >
              {updateName.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangePinDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const changePin = useChangePin();
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setCurrentPin("");
    setNewPin("");
    setConfirm("");
    setError(null);
  }

  function handleOpenChange(v: boolean) {
    if (!v) reset();
    onOpenChange(v);
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!isValidPinFormat(currentPin)) {
      setError(`Current PIN must be ${PIN_LENGTH} digits.`);
      return;
    }
    if (!isValidPinFormat(newPin)) {
      setError(`New PIN must be ${PIN_LENGTH} digits.`);
      return;
    }
    if (newPin !== confirm) {
      setError("New PINs don't match.");
      return;
    }
    if (newPin === currentPin) {
      setError("New PIN must be different from the current one.");
      return;
    }
    setError(null);
    changePin.mutate(
      { currentPin, newPin },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
        onError: (err) =>
          setError(err instanceof Error ? err.message : "Failed"),
      },
    );
  }

  const canSubmit =
    isValidPinFormat(currentPin) &&
    isValidPinFormat(newPin) &&
    newPin === confirm &&
    !changePin.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Change PIN</DialogTitle>
          <DialogDescription>
            Enter your current PIN, then a new one.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-5 py-2">
          <div className="space-y-2">
            <Label className="block text-center text-xs uppercase tracking-wider text-muted-foreground">
              Current PIN
            </Label>
            <PinInput
              value={currentPin}
              onChange={(v) => {
                setCurrentPin(v);
                if (error) setError(null);
              }}
              length={PIN_LENGTH}
              autoFocus
              disabled={changePin.isPending}
              ariaLabel="Current PIN"
            />
          </div>
          <div className="space-y-2">
            <Label className="block text-center text-xs uppercase tracking-wider text-muted-foreground">
              New PIN
            </Label>
            <PinInput
              value={newPin}
              onChange={(v) => {
                setNewPin(v);
                if (error) setError(null);
              }}
              length={PIN_LENGTH}
              disabled={changePin.isPending}
              ariaLabel="New PIN"
            />
          </div>
          <div className="space-y-2">
            <Label className="block text-center text-xs uppercase tracking-wider text-muted-foreground">
              Confirm new PIN
            </Label>
            <PinInput
              value={confirm}
              onChange={(v) => {
                setConfirm(v);
                if (error) setError(null);
              }}
              length={PIN_LENGTH}
              disabled={changePin.isPending}
              error={
                !!confirm && confirm.length === PIN_LENGTH && confirm !== newPin
              }
              ariaLabel="Confirm new PIN"
            />
          </div>
          {error && (
            <p className="text-center text-sm text-destructive">{error}</p>
          )}
          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={changePin.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {changePin.isPending ? "Saving…" : "Change PIN"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog({ disabled }: { disabled: boolean }) {
  const deleteAccount = useDeleteAccount();
  const [confirmation, setConfirmation] = useState("");
  const canDelete = confirmation === "DELETE" && !deleteAccount.isPending;

  return (
    <AlertDialog onOpenChange={(v) => !v && setConfirmation("")}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={disabled}
          />
        }
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Delete account
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Delete your account?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account AND every lesson, homework,
            note, scoreboard entry, calendar event, and flashcard deck that
            belongs to it. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-confirm" className="text-xs">
            Type <span className="font-mono font-semibold">DELETE</span> to
            confirm
          </Label>
          <Input
            id="delete-confirm"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            disabled={deleteAccount.isPending}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteAccount.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (!canDelete) return;
              deleteAccount.mutate();
            }}
            disabled={!canDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleteAccount.isPending ? "Deleting…" : "Delete everything"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
