import { z } from "zod";

/** Doit rester aligné avec PASSWORD_MIN_LENGTH côté serveur (src/server/auth/auth.ts). */
export const PASSWORD_MIN = 10;
export const PASSWORD_RULE = `Au moins ${PASSWORD_MIN} caractères, dont une lettre et un chiffre.`;

const email = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Indiquez votre adresse email.")
  .pipe(z.email("Adresse email invalide."));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Le mot de passe doit contenir au moins ${PASSWORD_MIN} caractères.`)
  .max(128, "Le mot de passe ne peut pas dépasser 128 caractères.")
  .refine((v) => /[a-zA-ZÀ-ſ]/.test(v) && /\d/.test(v), {
    message: "Le mot de passe doit contenir au moins une lettre et un chiffre.",
  });

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indiquez votre nom (2 caractères minimum).")
    .max(80, "Le nom ne peut pas dépasser 80 caractères."),
  email,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Indiquez votre mot de passe."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Les deux mots de passe ne correspondent pas.",
  });

type FieldErrors<T> = Partial<Record<keyof T, string>>;

function validate<S extends z.ZodType>(schema: S, input: unknown) {
  const parsed = schema.safeParse(input);
  if (parsed.success)
    return {
      ok: true as const,
      data: parsed.data as z.infer<S>,
      errors: {} as FieldErrors<z.infer<S>>,
    };
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return { ok: false as const, errors: errors as FieldErrors<z.infer<S>> };
}

export type SignUpErrors = FieldErrors<z.infer<typeof signUpSchema>>;
export const validateSignUp = (input: unknown) => validate(signUpSchema, input);
export const validateSignIn = (input: unknown) => validate(signInSchema, input);
export const validateForgotPassword = (input: unknown) => validate(forgotPasswordSchema, input);
export const validateResetPassword = (input: unknown) => validate(resetPasswordSchema, input);
