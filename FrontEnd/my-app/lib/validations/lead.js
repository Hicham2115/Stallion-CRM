import { z } from "zod";

export const PRODUCT_TYPES = [
  "static_website",
  "online_store",
  "crm",
  "platform",
  "mobile_app",
  "saas",
];

const LOW_TICKET_PRODUCT_TYPES = ["static_website", "online_store", "crm"];

/** static_website/online_store/crm -> low_ticket, platform/mobile_app/saas -> high_ticket */
export function trackForProductType(productType) {
  return LOW_TICKET_PRODUCT_TYPES.includes(productType)
    ? "low_ticket"
    : "high_ticket";
}

export const BUDGET_BANDS = [
  "<5k",
  "5-15k",
  "15-40k",
  "40-80k",
  "80-200k",
  "200k+",
];

/** Which budget bands make sense to offer for each track. */
export const BUDGET_BANDS_BY_TRACK = {
  low_ticket: ["<5k", "5-15k", "15-40k", "40-80k"],
  high_ticket: ["15-40k", "40-80k", "80-200k", "200k+"],
};

export const DESIRED_LAUNCH_OPTIONS = [
  "asap",
  "1-3mo",
  "3-6mo",
  "6mo+",
  "exploring",
];

const MAX_BRIEF_FILE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_BRIEF_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
];

export const stepContactSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().min(7, "Enter a valid phone number"),
  role: z
    .string()
    .trim()
    .max(80, "Keep it under 80 characters")
    .optional()
    .or(z.literal("")),
  is_decision_maker: z.boolean({
    message: "Let us know if you're the decision maker",
  }),
});

/** Entry-gate capture — just enough to identify a visitor before they browse the site. */
export const gateLeadSchema = stepContactSchema.pick({
  full_name: true,
  email: true,
});

export const stepBusinessSchema = z.object({
  business_type: z.string().trim().min(2, "Tell us your business type"),
  product_type: z.enum(PRODUCT_TYPES, { message: "Select a project type" }),
});

export const stepBantSchema = z.object({
  budget_band: z.enum(BUDGET_BANDS, { message: "Select a budget range" }),
  need_description: z
    .string()
    .trim()
    .min(10, "Give us a bit more detail (10+ characters)")
    .max(2000, "Keep it under 2000 characters"),
  desired_launch: z.enum(DESIRED_LAUNCH_OPTIONS, {
    message: "Select a timeline",
  }),
});

/** Optional brief file — validated separately since it never travels through JSON. */
export function validateBriefFile(file) {
  if (!file || file.size === 0) return { ok: true };
  if (file.size > MAX_BRIEF_FILE_BYTES) {
    return { ok: false, message: "File must be under 10MB" };
  }
  if (!ACCEPTED_BRIEF_FILE_TYPES.includes(file.type)) {
    return { ok: false, message: "Accepted formats: PDF, Word, PNG, JPG" };
  }
  return { ok: true };
}

export const attributionSchema = z.object({
  utm_source: z.string().trim().max(255).nullable().optional(),
  utm_medium: z.string().trim().max(255).nullable().optional(),
  utm_campaign: z.string().trim().max(255).nullable().optional(),
  utm_content: z.string().trim().max(255).nullable().optional(),
  utm_term: z.string().trim().max(255).nullable().optional(),
  gclid: z.string().trim().max(255).nullable().optional(),
  fbclid: z.string().trim().max(255).nullable().optional(),
  referrer: z.string().trim().max(500).nullable().optional(),
  landing_page: z.string().trim().max(500).nullable().optional(),
});

/** Full payload shape, used by the API route as the final source of truth. */
export const leadSchema = stepContactSchema
  .extend(stepBusinessSchema.shape)
  .extend(stepBantSchema.shape)
  .extend({
    track: z.enum(["low_ticket", "high_ticket"]),
    attribution: attributionSchema.optional().default({}),
  })
  .superRefine((data, ctx) => {
    const allowed = BUDGET_BANDS_BY_TRACK[data.track] ?? BUDGET_BANDS;
    if (!allowed.includes(data.budget_band)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budget_band"],
        message: "Selected budget is out of range for this project type",
      });
    }
  });
