import { User, Mail, Phone, Briefcase } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { stepContactSchema } from "@/lib/validations/lead";

function fieldError(field) {
  const [error] = field.state.meta.errors;
  return field.state.meta.isTouched && error ? error : null;
}

export function StepContact({ form }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-heading text-lg font-bold text-white">Who are we talking to?</h3>
        <p className="mt-1 text-sm text-white/50">Tell us a bit about yourself.</p>
      </div>

      <form.Field
        name="full_name"
        validators={{ onChange: ({ value }) => stepContactSchema.shape.full_name.safeParse(value).error?.issues[0]?.message }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">
              <User className="size-3.5 text-white/40" /> Full name
            </Label>
            <Input
              id="full_name"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="Jane Smith"
              className="h-11 bg-white/[0.03] text-[15px]"
            />
            {fieldError(field) && <p className="text-xs text-red-400">{fieldError(field)}</p>}
          </div>
        )}
      </form.Field>

      <form.Field
        name="email"
        validators={{ onChange: ({ value }) => stepContactSchema.shape.email.safeParse(value).error?.issues[0]?.message }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">
              <Mail className="size-3.5 text-white/40" /> Email
            </Label>
            <Input
              id="email"
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="jane@company.com"
              className="h-11 bg-white/[0.03] text-[15px]"
            />
            {fieldError(field) && <p className="text-xs text-red-400">{fieldError(field)}</p>}
          </div>
        )}
      </form.Field>

      <form.Field
        name="phone"
        validators={{ onChange: ({ value }) => stepContactSchema.shape.phone.safeParse(value).error?.issues[0]?.message }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">
              <Phone className="size-3.5 text-white/40" /> Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="+15551234567"
              className="h-11 bg-white/[0.03] text-[15px]"
            />
            {fieldError(field) ? (
              <p className="text-xs text-red-400">{fieldError(field)}</p>
            ) : (
              <p className="text-xs text-white/35">E.164 format, e.g. +15551234567</p>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="role">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">
              <Briefcase className="size-3.5 text-white/40" /> Role
              <span className="font-normal text-white/35">(optional)</span>
            </Label>
            <Input
              id="role"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Owner, Marketing Manager..."
              className="h-11 bg-white/[0.03] text-[15px]"
            />
          </div>
        )}
      </form.Field>

      <form.Field name="is_decision_maker">
        {(field) => (
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
            <div>
              <p className="text-sm font-medium text-white">Are you the decision maker?</p>
              <p className="text-xs text-white/40">For this project or purchase</p>
            </div>
            <Switch checked={field.state.value} onCheckedChange={(checked) => field.handleChange(checked)} />
          </div>
        )}
      </form.Field>
    </div>
  );
}
