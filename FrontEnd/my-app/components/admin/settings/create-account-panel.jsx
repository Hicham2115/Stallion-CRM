"use client";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, LoaderCircle, RefreshCw, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  fieldBase,
  fieldErrorText,
  fieldInvalid,
  fieldLabel,
} from "@/components/deck/field";
import { Panel, PanelBody, PanelHeader } from "@/components/deck/panel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { clientsConfig } from "@/config/clients";
import { settingsConfig } from "@/config/settings";
import { template } from "@/lib/format";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { cn } from "@/lib/utils";
const { content, features } = settingsConfig;
const inputBase = cn(fieldBase, "h-11 px-3.5");
// Uses crypto.getRandomValues, not Math.random (not a cryptographic RNG),
// since this is generating a real password. Alphabet omits characters that
// get misread when dictated over the phone or copied off a screen (0/O,
// 1/l/I).
function generatePassword(length) {
  const alphabet =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
  const bytes = new Uint32Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}
// POST /api/users — a real sign-in account. Role is one of
// UserController::MANAGEABLE_ROLES (sales/dev) — admin is intentionally
// never offered here, only via the one-time /setup flow. Password field is
// masked by default with a deliberate show toggle and generator, rather
// than the plain visible text input the prototype used.
export function CreateAccountPanel() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(settingsConfig.roleOptions[0].value);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const create = useMutation({
    mutationFn: async (payload) => (await api.post("/api/users", payload)).data,
    onSuccess: (user) => {
      // Team Accounts (reps-panel.jsx) lists both roles under one query key.
      queryClient.invalidateQueries({ queryKey: ["users", "team"] });
      toast.success(template(content.createToast, { name: user.name }));
      setName("");
      setEmail("");
      setRole(settingsConfig.roleOptions[0].value);
      setPassword("");
      setShowPassword(false);
      setErrors({});
    },
    onError: (error) => {
      const fieldErrorsFromApi = error.response?.data?.errors;
      const field = fieldErrorsFromApi
        ? Object.keys(fieldErrorsFromApi).find((k) => ["name", "email", "password"].includes(k))
        : null;
      if (field) {
        setErrors({ [field]: fieldErrorsFromApi[field][0] });
        document.getElementById(`rep-${field}`)?.focus();
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "Enter the rep's name.";
    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = "Enter a work email.";
    else if (!clientsConfig.validation.emailPattern.test(trimmedEmail))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Generate or type a temporary password.";
    else if (password.length < 8)
      next.password = "Password must be at least 8 characters.";
    return next;
  }
  function focusFirst(next) {
    const key = ["name", "email", "password"].find((k) => next[k]);
    if (key) document.getElementById(`rep-${key}`)?.focus();
  }
  function handleSubmit(event) {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) {
      focusFirst(next);
      return;
    }
    create.mutate({ name: name.trim(), email: email.trim(), password, role });
  }
  return (
    <Panel className="flex h-full flex-col">
      <PanelHeader title={content.createTitle} hint={content.createHint} />

      <PanelBody className="flex flex-1 flex-col">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-1 flex-col gap-4"
        >
          <div>
            <label htmlFor="rep-name" className={fieldLabel}>
              {content.nameLabel}
            </label>
            <input
              id="rep-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={content.namePlaceholder}
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "rep-name-error" : undefined}
              className={cn(inputBase, "mt-2", errors.name && fieldInvalid)}
            />
            {errors.name && (
              <p
                id="rep-name-error"
                role="alert"
                className={cn("mt-1.5", fieldErrorText)}
              >
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="rep-email" className={fieldLabel}>
              {content.emailLabel}
            </label>
            <input
              id="rep-email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={content.emailPlaceholder}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "rep-email-error" : undefined}
              className={cn(inputBase, "mt-2", errors.email && fieldInvalid)}
            />
            {errors.email && (
              <p
                id="rep-email-error"
                role="alert"
                className={cn("mt-1.5", fieldErrorText)}
              >
                {errors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="rep-role" className={fieldLabel}>
              {content.roleLabel}
            </label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="rep-role" className={cn(inputBase, "mt-2 w-full")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {settingsConfig.roleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="rep-password" className={fieldLabel}>
              {content.passwordLabel}
            </label>

            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <input
                  id="rep-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={content.passwordPlaceholder}
                  // Never offer to save this credential — it isn't the admin's own password.
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "rep-password-error" : "rep-password-hint"
                  }
                  className={cn(
                    inputBase,
                    "pr-11",
                    errors.password && fieldInvalid,
                  )}
                />

                {features.passwordTools && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword
                        ? content.hidePasswordLabel
                        : content.showPasswordLabel
                    }
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-muted transition hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden className="size-4" />
                    ) : (
                      <Eye aria-hidden className="size-4" />
                    )}
                  </button>
                )}
              </div>

              {features.passwordTools && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11 shrink-0 rounded-md"
                  onClick={() => {
                    setPassword(
                      generatePassword(settingsConfig.generatedPasswordLength),
                    );
                    // Reveal on generate so the admin can actually read it out.
                    setShowPassword(true);
                  }}
                >
                  <RefreshCw aria-hidden />
                  {content.generateLabel}
                </Button>
              )}
            </div>

            {errors.password ? (
              <p
                id="rep-password-error"
                role="alert"
                className={cn("mt-1.5", fieldErrorText)}
              >
                {errors.password}
              </p>
            ) : (
              <p
                id="rep-password-hint"
                className="mt-1.5 text-[0.75rem] text-ink-muted"
              >
                {content.passwordHint}
              </p>
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2 pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={create.isPending}
              className="h-11 rounded-md font-semibold"
            >
              {create.isPending ? (
                <>
                  <LoaderCircle aria-hidden className="deck-spin size-4" />
                  {content.createPendingLabel}
                </>
              ) : (
                <>
                  <UserPlus aria-hidden />
                  {content.createSubmitLabel}
                </>
              )}
            </Button>
          </div>
        </form>
      </PanelBody>
    </Panel>
  );
}
