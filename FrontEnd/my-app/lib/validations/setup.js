import { z } from "zod";

// The plain object schema, for per-field validators (setupFields.shape.x) —
// .refine() below wraps it in a ZodEffects, which has no .shape.
export const setupFields = z.object({
  name: z.string().min(2, "Enter your name."),
  email: z
    .string()
    .min(1, "Enter your email address.")
    .email("That does not look like a valid email address."),
  password: z.string().min(8, "At least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your password."),
});

export const setupSchema = setupFields.refine(
  (data) => data.password === data.confirmPassword,
  { message: "Passwords do not match.", path: ["confirmPassword"] },
);
