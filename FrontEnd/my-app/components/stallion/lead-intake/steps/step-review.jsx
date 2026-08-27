import { Pencil } from "lucide-react";

const PRODUCT_TYPE_LABELS = {
  static_website: "Static website",
  online_store: "Online store",
  crm: "CRM",
  platform: "Platform",
  mobile_app: "Mobile app",
  saas: "SaaS product",
};

function ReviewRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2.5 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className="text-sm font-medium text-white">{value || "—"}</span>
    </div>
  );
}

export function StepReview({ form, onEditStep }) {
  const values = form.state.values;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-heading text-lg font-bold text-white">
          Quick check
        </h3>
        <p className="mt-1 text-sm text-white/50">
          Make sure everything looks right before we get into the details.
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">
            Contact
          </p>
          <button
            type="button"
            onClick={() => onEditStep(0)}
            className="flex items-center gap-1 text-xs font-medium text-[#bafc0c] hover:underline"
          >
            <Pencil className="size-3" /> Edit
          </button>
        </div>
        <ReviewRow label="Name" value={values.full_name} />
        <ReviewRow label="Email" value={values.email} />
        <ReviewRow label="Phone" value={values.phone} />
        <ReviewRow label="Role" value={values.role} />
        <ReviewRow
          label="Decision maker"
          value={values.is_decision_maker ? "Yes" : "No"}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-xs font-semibold tracking-wide text-white/50 uppercase">
            Project
          </p>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="flex items-center gap-1 text-xs font-medium text-[#bafc0c] hover:underline"
          >
            <Pencil className="size-3" /> Edit
          </button>
        </div>
        <ReviewRow label="Business type" value={values.business_type} />
        <ReviewRow
          label="Project type"
          value={PRODUCT_TYPE_LABELS[values.product_type]}
        />
      </div>
    </div>
  );
}
