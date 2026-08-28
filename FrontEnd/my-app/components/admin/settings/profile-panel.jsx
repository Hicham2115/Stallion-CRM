"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LoaderCircle, Lock, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import {
  fieldBase,
  fieldErrorText,
  fieldInvalid,
  fieldLabel,
} from "@/components/deck/field";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { cn } from "@/lib/utils";

const inputBase = cn(fieldBase, "h-11 px-3.5");

/** The 422 field error for a given key, falling back to the generic
 *  message — same shape Laravel's validator returns everywhere else. */
function fieldError(error, key) {
  return error?.response?.data?.errors?.[key]?.[0];
}

// Editing your OWN account — name/email and a separate password change.
// Deliberately not the same component as CreateAccountPanel/RepsPanel:
// those manage OTHER users' (mock rep) accounts; this hits the real
// PATCH /api/profile[/password] endpoints for whoever is actually signed in.
export function ProfilePanel() {
  const queryClient = useQueryClient();
  const { data: user, isPending } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/api/user")).data,
  });

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {isPending || !user ? (
        <InfoFormSkeleton />
      ) : (
        // Keyed by user.id so a fresh user object (rare — same session,
        // one account) remounts with new useState initializers instead of
        // needing an effect to resync state that was set for a stale one.
        <InfoForm key={user.id} user={user} onSaved={() => queryClient.invalidateQueries({ queryKey: ["me"] })} />
      )}
      <PasswordForm />
    </div>
  );
}

function InfoFormSkeleton() {
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Personal Info" hint="Your name and email" />
      <PanelBody className="flex flex-col gap-4">
        <Skeleton className="h-11 w-full rounded-xl" />
        <Skeleton className="h-11 w-full rounded-xl" />
      </PanelBody>
    </Panel>
  );
}

function InfoForm({ user, onSaved }) {
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [touched, setTouched] = useState(false);

  const save = useMutation({
    mutationFn: async () => (await api.patch("/api/profile", { name: name.trim(), email: email.trim() })).data,
    onSuccess: () => {
      toast.success("Profile updated");
      onSaved();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (!name.trim() || !email.trim()) return;
    save.mutate();
  }

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Personal Info" hint="Your name and email" />
      <PanelBody className="flex flex-1 flex-col">
        <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col gap-4">
          <div>
            <label htmlFor="profile-name" className={fieldLabel}>
              Full name
            </label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              aria-invalid={touched && !name.trim()}
              className={cn(inputBase, "mt-2", touched && !name.trim() && fieldInvalid)}
            />
            {touched && !name.trim() && (
              <p className={cn("mt-1.5", fieldErrorText)}>Enter your name.</p>
            )}
          </div>

          <div>
            <label htmlFor="profile-email" className={fieldLabel}>
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              aria-invalid={touched && !email.trim()}
              className={cn(inputBase, "mt-2", touched && !email.trim() && fieldInvalid)}
            />
            {touched && !email.trim() && (
              <p className={cn("mt-1.5", fieldErrorText)}>Enter your email.</p>
            )}
          </div>

          <div className="mt-auto pt-2">
            <Button type="submit" size="lg" disabled={save.isPending} className="h-11 rounded-xl font-semibold">
              {save.isPending ? (
                <>
                  <LoaderCircle aria-hidden className="deck-spin size-4" />
                  Saving…
                </>
              ) : (
                <>
                  <UserIcon aria-hidden />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      </PanelBody>
    </Panel>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);

  const change = useMutation({
    mutationFn: async () =>
      (
        await api.patch("/api/profile/password", {
          current_password: current,
          password: next,
          password_confirmation: confirm,
        })
      ).data,
    onSuccess: () => {
      toast.success("Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
      setShow(false);
      setTouched(false);
    },
    onError: (error) => {
      // A field-level error (wrong current password) already renders inline
      // below — a toast on top of it would just repeat the same thing.
      if (!fieldError(error, "current_password") && !fieldError(error, "password")) {
        toast.error(getErrorMessage(error));
      }
    },
  });

  const localMismatch = touched && next && confirm && next !== confirm;
  const localTooShort = touched && next && next.length < 8;

  function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (!current || !next || !confirm || next !== confirm || next.length < 8) return;
    change.mutate();
  }

  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title="Change Password" hint="Requires your current password" />
      <PanelBody className="flex flex-1 flex-col">
        <form onSubmit={handleSubmit} noValidate className="flex flex-1 flex-col gap-4">
          <div>
            <label htmlFor="profile-current-password" className={fieldLabel}>
              Current password
            </label>
            <div className="relative mt-2">
              <input
                id="profile-current-password"
                type={show ? "text" : "password"}
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                autoComplete="current-password"
                aria-invalid={Boolean(fieldError(change.error, "current_password"))}
                className={cn(inputBase, "pr-11", fieldError(change.error, "current_password") && fieldInvalid)}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
                aria-pressed={show}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-ink-muted transition hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              >
                {show ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
              </button>
            </div>
            {fieldError(change.error, "current_password") && (
              <p className={cn("mt-1.5", fieldErrorText)}>{fieldError(change.error, "current_password")}</p>
            )}
          </div>

          <div>
            <label htmlFor="profile-new-password" className={fieldLabel}>
              New password
            </label>
            <input
              id="profile-new-password"
              type={show ? "text" : "password"}
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
              aria-invalid={localTooShort}
              className={cn(inputBase, "mt-2", localTooShort && fieldInvalid)}
            />
            {localTooShort && <p className={cn("mt-1.5", fieldErrorText)}>At least 8 characters.</p>}
          </div>

          <div>
            <label htmlFor="profile-confirm-password" className={fieldLabel}>
              Confirm new password
            </label>
            <input
              id="profile-confirm-password"
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              aria-invalid={localMismatch}
              className={cn(inputBase, "mt-2", localMismatch && fieldInvalid)}
            />
            {localMismatch && <p className={cn("mt-1.5", fieldErrorText)}>Passwords do not match.</p>}
          </div>

          <div className="mt-auto pt-2">
            <Button type="submit" size="lg" disabled={change.isPending} className="h-11 rounded-xl font-semibold">
              {change.isPending ? (
                <>
                  <LoaderCircle aria-hidden className="deck-spin size-4" />
                  Changing…
                </>
              ) : (
                <>
                  <Lock aria-hidden />
                  Change password
                </>
              )}
            </Button>
          </div>
        </form>
      </PanelBody>
    </Panel>
  );
}
