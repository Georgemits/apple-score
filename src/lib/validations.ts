import { z } from "zod";

export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(20, "Username must be at most 20 characters.")
  .transform((value) => value.toLowerCase())
  .refine((value) => USERNAME_PATTERN.test(value), {
    message: "Use letters, numbers and underscores only.",
  });

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.");

export const signupSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required."),
});

export const MAX_QUANTITY = 99;

export const addProductSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(MAX_QUANTITY, `Quantity must be at most ${MAX_QUANTITY}.`),
});

export const setQuantitySchema = z.object({
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(0, "Quantity cannot be negative.")
    .max(MAX_QUANTITY, `Quantity must be at most ${MAX_QUANTITY}.`),
});

/** Upper bound on a hand-entered second-hand price. */
export const MAX_PRICE_PAID = 50_000;

/**
 * Editing one owned line: quantity plus an optional second-hand price.
 * A null price means "fall back to the product's MSRP".
 */
export const updateOwnedItemSchema = z.object({
  productId: z.string().min(1, "Product is required."),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(0, "Quantity cannot be negative.")
    .max(MAX_QUANTITY, `Quantity must be at most ${MAX_QUANTITY}.`),
  // The null branch comes first so a null survives instead of being coerced to 0.
  pricePaidUSD: z.union([
    z.null(),
    z.coerce
      .number()
      .int("Price must be a whole number of dollars.")
      .min(0, "Price cannot be negative.")
      .max(MAX_PRICE_PAID, `Price must be at most $${MAX_PRICE_PAID.toLocaleString("en-US")}.`),
  ]),
});

export const productIdSchema = z.object({
  productId: z.string().min(1, "Product is required."),
});

export type SignupInput = z.input<typeof signupSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type AddProductInput = z.input<typeof addProductSchema>;

/* -------------------------------------------------------------------------
 * Client-side form schemas
 *
 * These mirror the server schemas but contain no `.transform()` calls, so the
 * inferred input and output types match — which is what React Hook Form's
 * resolver needs. Normalisation (lower-casing) still happens server-side.
 * ---------------------------------------------------------------------- */

export const signupFormSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Username must be at least 3 characters.")
      .max(20, "Username must be at most 20 characters.")
      .regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers and underscores only."),
    email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginFormSchema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
