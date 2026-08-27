import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Enter your email address.")
    .email("That does not look like a valid email address."),
  password: z.string().min(1, "Enter your password."),
  // .min(8, "Password must be at least 8 characters."),
});
