import { describe, expect, it } from "vitest";
import { authErrorMessage, GENERIC_ERROR, safeRedirect } from "@/lib/auth-errors";
import { validateResetPassword, validateSignIn, validateSignUp } from "@/lib/validation/auth";

describe("validation de l'inscription", () => {
  it("normalise l'email (minuscules, espaces)", () => {
    const r = validateSignUp({
      name: " Camille ",
      email: "  Camille@Exemple.FR ",
      password: "MotDePasse2026",
    });
    expect(r.ok && r.data).toEqual({
      name: "Camille",
      email: "camille@exemple.fr",
      password: "MotDePasse2026",
    });
  });
  it("exige une lettre et un chiffre dans le mot de passe", () => {
    expect(
      validateSignUp({ name: "Ca", email: "a@b.fr", password: "aaaaaaaaaaaa" }).errors.password,
    ).toMatch(/une lettre et un chiffre/);
    expect(
      validateSignUp({ name: "Ca", email: "a@b.fr", password: "123456789012" }).errors.password,
    ).toMatch(/une lettre et un chiffre/);
  });
  it("renvoie un message par champ, en français", () => {
    const r = validateSignUp({ name: "", email: "x", password: "" });
    expect(r.ok).toBe(false);
    expect(r.errors).toEqual({
      name: "Indiquez votre nom (2 caractères minimum).",
      email: "Adresse email invalide.",
      password: "Le mot de passe doit contenir au moins 10 caractères.",
    });
  });
  it("connexion : mot de passe requis", () => {
    expect(validateSignIn({ email: "a@b.fr", password: "" }).errors.password).toBe(
      "Indiquez votre mot de passe.",
    );
  });
  it("réinitialisation : les deux saisies doivent correspondre", () => {
    expect(
      validateResetPassword({ password: "MotDePasse2026", confirm: "Autre2026xx" }).errors.confirm,
    ).toBe("Les deux mots de passe ne correspondent pas.");
    expect(
      validateResetPassword({ password: "MotDePasse2026", confirm: "MotDePasse2026" }).ok,
    ).toBe(true);
  });
});

describe("messages d'erreur d'authentification", () => {
  it("traduit les codes connus", () => {
    expect(authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(
      "Email ou mot de passe incorrect.",
    );
  });
  it("gère la limitation de tentatives (429)", () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/Trop de tentatives/);
  });
  it("retombe sur un message générique", () => {
    expect(authErrorMessage({ code: "INCONNU" })).toBe(GENERIC_ERROR);
    expect(authErrorMessage(null)).toBe(GENERIC_ERROR);
  });
});

describe("safeRedirect (anti redirection ouverte)", () => {
  it.each([
    [null, "/tableau-de-bord"],
    ["/onboarding", "/onboarding"],
    ["/tableau-de-bord?onglet=1", "/tableau-de-bord?onglet=1"],
    ["https://evil.example.com", "/tableau-de-bord"],
    ["//evil.example.com", "/tableau-de-bord"],
    ["/\\evil.example.com", "/tableau-de-bord"],
    ["javascript:alert(1)", "/tableau-de-bord"],
  ])("%s → %s", (input, expected) => expect(safeRedirect(input)).toBe(expected));
});
