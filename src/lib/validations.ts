import { z } from "zod";

/* -------------------------------------------------------------------------
 * Accounts
 * ---------------------------------------------------------------------- */

export const USERNAME_PATTERN = /^[a-z0-9_]+$/;

/** Handles that would collide with routes or read as official. */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "apple",
  "applescore",
  "apple_score",
  "api",
  "home",
  "login",
  "signup",
  "logout",
  "profile",
  "settings",
  "leaderboard",
  "collection",
  "catalog",
  "catalogue",
  "achievements",
  "compare",
  "welcome",
  "u",
  "me",
  "root",
  "support",
  "help",
  "null",
  "undefined",
]);

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(20, "Username must be at most 20 characters.")
  .transform((value) => value.toLowerCase())
  .refine((value) => USERNAME_PATTERN.test(value), {
    message: "Use letters, numbers and underscores only.",
  })
  .refine((value) => !RESERVED_USERNAMES.has(value), {
    message: "That username is reserved.",
  });

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(254, "Email is too long.")
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

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: "Choose a password you have not used here before.",
    path: ["newPassword"],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password to confirm."),
  confirmation: z.literal("DELETE", {
    errorMap: () => ({ message: 'Type "DELETE" to confirm.' }),
  }),
});

/* -------------------------------------------------------------------------
 * Profile
 * ---------------------------------------------------------------------- */

export const MAX_DISPLAY_NAME = 40;
export const MAX_BIO = 160;

function graphemeCount(value: string): number {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(value)].length;
  }
  return [...value].length;
}

/** True for exactly one emoji grapheme (skin tones and ZWJ sequences included). */
export function isSingleEmoji(value: string): boolean {
  return EMOJI_PATTERN.test(value) && graphemeCount(value) === 1;
}

/** A single emoji (one extended grapheme cluster that is an emoji). */
const EMOJI_PATTERN =
  /^\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic}|[\u{1F3FB}-\u{1F3FF}])*$/u;

export const AVATAR_HUES = [0, 25, 45, 90, 150, 190, 215, 250, 280, 320] as const;

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .max(MAX_DISPLAY_NAME, `Display name must be at most ${MAX_DISPLAY_NAME} characters.`)
    .transform((value) => (value === "" ? null : value)),
  bio: z
    .string()
    .trim()
    .max(MAX_BIO, `Bio must be at most ${MAX_BIO} characters.`)
    .transform((value) => (value === "" ? null : value)),
  avatarEmoji: z
    .string()
    .trim()
    // The longest real emoji sequences (tag-sequence flags) are 14 UTF-16 units.
    .max(24, "Pick a single emoji.")
    .transform((value) => (value === "" ? null : value))
    .refine((value) => value === null || isSingleEmoji(value), {
      message: "Pick a single emoji.",
    }),
  avatarHue: z.union([
    z.null(),
    z.coerce.number().int().min(0, "Pick a colour.").max(359, "Pick a colour."),
  ]),
  isPublic: z.boolean(),
});

export type ProfileInput = z.input<typeof profileSchema>;

/* -------------------------------------------------------------------------
 * Inventory
 * ---------------------------------------------------------------------- */

export const MAX_QUANTITY = 99;

/** Upper bound on a hand-entered price. The Apple Lisa was $9,995; be generous. */
export const MAX_PRICE_PAID = 50_000;

const quantityField = z.coerce
  .number()
  .int("Quantity must be a whole number.")
  .min(1, "Quantity must be at least 1.")
  .max(MAX_QUANTITY, `Quantity must be at most ${MAX_QUANTITY}.`);

const quantityOrZeroField = z.coerce
  .number()
  .int("Quantity must be a whole number.")
  .min(0, "Quantity cannot be negative.")
  .max(MAX_QUANTITY, `Quantity must be at most ${MAX_QUANTITY}.`);

// The null branch comes first so a null survives instead of being coerced to 0.
const pricePaidField = z.union([
  z.null(),
  z.coerce
    .number()
    .int("Price must be a whole number of dollars.")
    .min(0, "Price cannot be negative.")
    .max(MAX_PRICE_PAID, `Price must be at most $${MAX_PRICE_PAID.toLocaleString("en-US")}.`),
]);

export const productIdSchema = z.object({
  productId: z.string().min(1, "Product is required.").max(64),
});

export const addProductSchema = z.object({
  productId: z.string().min(1, "Product is required.").max(64),
  quantity: quantityField,
  pricePaidUSD: pricePaidField.optional(),
});

export const setQuantitySchema = z.object({
  productId: z.string().min(1, "Product is required.").max(64),
  quantity: quantityOrZeroField,
});

/**
 * Editing one owned line: quantity plus an optional price paid.
 * A null price means "fall back to the product's MSRP".
 */
export const updateOwnedItemSchema = z.object({
  productId: z.string().min(1, "Product is required.").max(64),
  quantity: quantityOrZeroField,
  pricePaidUSD: pricePaidField,
});

/** The welcome flow: a handful of products added in one go. */
export const onboardingSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1).max(64), quantity: quantityField }))
    .max(12, "Add at most 12 products to start — you can add more afterwards."),
});

/* -------------------------------------------------------------------------
 * Social
 * ---------------------------------------------------------------------- */

export const usernameParamSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .transform((value) => value.toLowerCase()),
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

export const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const profileFormSchema = z.object({
  displayName: z.string().trim().max(MAX_DISPLAY_NAME, `At most ${MAX_DISPLAY_NAME} characters.`),
  bio: z.string().trim().max(MAX_BIO, `At most ${MAX_BIO} characters.`),
  avatarEmoji: z
    .string()
    .trim()
    .max(24, "Pick a single emoji.")
    .refine((value) => value === "" || isSingleEmoji(value), { message: "Pick a single emoji." }),
  avatarHue: z.number().int().min(0).max(359).nullable(),
  isPublic: z.boolean(),
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>;
export type ProfileFormValues = z.infer<typeof profileFormSchema>;
