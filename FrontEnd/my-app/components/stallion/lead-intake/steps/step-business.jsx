import { Building2, LayoutGrid } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { stepBusinessSchema, trackForProductType } from "@/lib/validations/lead";

const PRODUCT_TYPE_LABELS = {
  static_website: "Static website",
  online_store: "Online store",
  crm: "CRM",
  platform: "Platform",
  mobile_app: "Mobile app",
  saas: "SaaS product",
};

function fieldError(field) {
  const [error] = field.state.meta.errors;
  return field.state.meta.isTouched && error ? error : null;
}

export function StepBusiness({ form }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-heading text-lg font-bold text-white">What are we building?</h3>
        <p className="mt-1 text-sm text-white/50">A quick sense of the business and the project.</p>
      </div>

      <form.Field
        name="business_type"
        validators={{ onChange: ({ value }) => stepBusinessSchema.shape.business_type.safeParse(value).error?.issues[0]?.message }}
      >
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="business_type">
              <Building2 className="size-3.5 text-white/40" /> Business type
            </Label>
            <Input
              id="business_type"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder="e.g. Real estate agency"
              className="h-11 bg-white/[0.03] text-[15px]"
            />
            {fieldError(field) && <p className="text-xs text-red-400">{fieldError(field)}</p>}
          </div>
        )}
      </form.Field>

      <form.Field name="product_type">
        {(field) => (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="product_type">
              <LayoutGrid className="size-3.5 text-white/40" /> Project type
            </Label>
            <Select
              value={field.state.value}
              onValueChange={(value) => {
                field.handleChange(value);
                form.setFieldValue("track", trackForProductType(value));
              }}
            >
              <SelectTrigger id="product_type" className="h-11 w-full bg-white/[0.03] text-[15px]">
                <SelectValue placeholder="Select a project type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </form.Field>
    </div>
  );
}
