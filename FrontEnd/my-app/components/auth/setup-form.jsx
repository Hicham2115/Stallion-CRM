"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react";
import {
  fieldBase,
  fieldErrorText,
  fieldIcon,
  fieldIconInvalid,
  fieldInvalid,
  fieldLabel,
} from "@/components/deck/field";
import { api } from "@/lib/axios";
import { getErrorMessage } from "@/lib/get-error-message";
import { useSessionStore } from "@/lib/store/session-store";
import { setupFields, setupSchema } from "@/lib/validations/setup";
import { cn } from "@/lib/utils";

function fieldError(field) {
  const [error] = field.state.meta.errors;
  return field.state.meta.isTouched && error ? error : null;
}

const inputBase = cn(
  fieldBase,
  "h-12 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.035)] focus:shadow-[inset_0_1px_0_0_rgb(255_255_255/0.07),0_10px_30px_-16px_rgb(186_252_12/0.55)]",
);
const errorText = cn("mt-2", fieldErrorText);
const delay = (ms) => ({ "--reveal-delay": `${ms}ms` });

// First-run only — see routes/api.php's note on SetupController. Creates a
// real admin account and, in the same request, deletes the seeded demo
// accounts and every demo lead, so nothing from the seed survives it.
export function SetupForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const createAccount = useMutation({
    mutationFn: async (values) => {
      try {
        const response = await api.post("/api/setup", {
          name: values.name,
          email: values.email,
          password: values.password,
          password_confirmation: values.confirmPassword,
        });
        return response.data;
      } catch (error) {
        throw new Error(getErrorMessage(error));
      }
    },
    onSuccess: (data) => {
      useSessionStore.getState().setSession({
        role: data.user.role,
        token: data.token,
      });
      toast.success("Your account is ready");
      router.replace("/admin");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const form = useForm({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
    onSubmit: async ({ value }) => {
      if (!confirmWipe) return;
      const parsed = setupSchema.safeParse(value);
      if (!parsed.success) return;
      await createAccount.mutateAsync(parsed.data);
    },
  });

  return (
    <div className="w-full max-w-[27rem]">
      <div
        className="reveal-card deck-lift relative overflow-hidden rounded-md border border-hairline bg-deck-card/85 p-7 backdrop-blur-xl sm:p-9"
        style={delay(220)}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(186_252_12/0.45),transparent)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 bg-[radial-gradient(70%_100%_at_50%_0%,rgb(186_252_12/0.05),transparent_72%)]"
        />

        <header>
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-brand">
            First-run setup
          </p>
          <h2 className="mt-3 font-display text-[1.75rem] font-semibold tracking-[-0.025em] text-ink">
            Create your admin account
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            This replaces the demo sign-ins from the seed data — you only do this once.
          </p>
        </header>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
          noValidate
          className="mt-6 space-y-5"
        >
          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) =>
                setupFields.shape.name.safeParse(value).error?.issues[0]?.message,
            }}
          >
            {(field) => (
              <div>
                <label htmlFor="name" className={fieldLabel}>
                  Your name
                </label>
                <div className="group relative mt-2.5">
                  <UserIcon
                    aria-hidden
                    className={cn(fieldIcon, fieldError(field) && fieldIconInvalid)}
                  />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={Boolean(fieldError(field))}
                    aria-describedby={fieldError(field) ? "name-error" : undefined}
                    className={cn(inputBase, "pl-11 pr-4", fieldError(field) && fieldInvalid)}
                  />
                </div>
                {fieldError(field) && (
                  <p id="name-error" role="alert" className={errorText}>
                    {fieldError(field)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field
            name="email"
            validators={{
              onChange: ({ value }) =>
                setupFields.shape.email.safeParse(value).error?.issues[0]?.message,
            }}
          >
            {(field) => (
              <div>
                <label htmlFor="email" className={fieldLabel}>
                  Email address
                </label>
                <div className="group relative mt-2.5">
                  <Mail
                    aria-hidden
                    className={cn(fieldIcon, fieldError(field) && fieldIconInvalid)}
                  />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={Boolean(fieldError(field))}
                    aria-describedby={fieldError(field) ? "email-error" : undefined}
                    className={cn(inputBase, "pl-11 pr-4", fieldError(field) && fieldInvalid)}
                  />
                </div>
                {fieldError(field) && (
                  <p id="email-error" role="alert" className={errorText}>
                    {fieldError(field)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <div>
                <label htmlFor="password" className={fieldLabel}>
                  Password
                </label>
                <div className="group relative mt-2.5">
                  <Lock
                    aria-hidden
                    className={cn(fieldIcon, fieldError(field) && fieldIconInvalid)}
                  />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    className={cn(inputBase, "pl-11 pr-12")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-ink-muted transition hover:bg-white/[0.06] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                  >
                    {showPassword ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
                  </button>
                </div>
              </div>
            )}
          </form.Field>

          <form.Field
            name="confirmPassword"
            validators={{
              onChangeListenTo: ["password"],
              onChange: ({ value, fieldApi }) =>
                value !== fieldApi.form.getFieldValue("password") ? "Passwords do not match." : undefined,
            }}
          >
            {(field) => (
              <div>
                <label htmlFor="confirmPassword" className={fieldLabel}>
                  Confirm password
                </label>
                <div className="group relative mt-2.5">
                  <Lock
                    aria-hidden
                    className={cn(fieldIcon, fieldError(field) && fieldIconInvalid)}
                  />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={field.state.value}
                    onChange={(event) => field.handleChange(event.target.value)}
                    onBlur={field.handleBlur}
                    aria-invalid={Boolean(fieldError(field))}
                    aria-describedby={fieldError(field) ? "confirmPassword-error" : undefined}
                    className={cn(inputBase, "pl-11 pr-4", fieldError(field) && fieldInvalid)}
                  />
                </div>
                {fieldError(field) && (
                  <p id="confirmPassword-error" role="alert" className={errorText}>
                    {fieldError(field)}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <label className="group flex cursor-pointer select-none items-start gap-2.5 pt-0.5">
            <span className="relative mt-0.5 grid size-[18px] shrink-0 place-items-center">
              <input
                type="checkbox"
                checked={confirmWipe}
                onChange={(event) => setConfirmWipe(event.target.checked)}
                className="peer absolute inset-0 cursor-pointer appearance-none rounded-md outline-none"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-md border border-hairline-strong bg-white/[0.03] transition-colors peer-checked:border-status-critical peer-checked:bg-status-critical peer-focus-visible:ring-2 peer-focus-visible:ring-status-critical/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-deck-card"
              />
            </span>
            <span className="text-[0.8125rem] leading-relaxed text-ink-muted transition-colors group-hover:text-ink-soft">
              I understand this deletes the demo accounts and all demo leads.
            </span>
          </label>

          <button
            type="submit"
            disabled={createAccount.isPending || !confirmWipe}
            className="deck-sweep group relative isolate flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-md bg-[linear-gradient(100deg,var(--brand-green-mid),var(--brand-lime))] text-[0.9375rem] font-semibold tracking-[-0.01em] text-[#0a1000] shadow-[0_12px_32px_-14px_rgb(186_252_12/0.65)] transition duration-200 hover:-translate-y-0.5 hover:brightness-[1.06] hover:shadow-[0_18px_40px_-14px_rgb(186_252_12/0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-deck-card active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100"
          >
            {createAccount.isPending ? (
              <>
                <LoaderCircle aria-hidden className="deck-spin size-4" />
                Creating account
              </>
            ) : (
              <>
                Create account
                <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
