/** Traduction des codes d'erreur de l'authentification en messages compréhensibles. */
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  INVALID_EMAIL: "Adresse email invalide.",
  INVALID_PASSWORD: "Mot de passe incorrect.",
  EMAIL_NOT_VERIFIED:
    "Votre adresse email n'est pas encore confirmée. Nous venons de vous renvoyer le lien de confirmation.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cette adresse email.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cette adresse email.",
  PASSWORD_TOO_SHORT: "Le mot de passe est trop court.",
  PASSWORD_TOO_LONG: "Le mot de passe est trop long.",
  INVALID_TOKEN: "Ce lien n'est plus valide. Il a peut-être déjà été utilisé ou a expiré.",
  TOKEN_EXPIRED: "Ce lien a expiré. Demandez-en un nouveau.",
  EMAIL_ALREADY_VERIFIED: "Votre adresse email est déjà confirmée. Vous pouvez vous connecter.",
  SESSION_EXPIRED: "Votre session a expiré. Reconnectez-vous.",
  TOO_MANY_REQUESTS: "Trop de tentatives. Patientez une minute avant de réessayer.",
  ORGANIZATION_ALREADY_EXISTS: "Cette adresse est déjà utilisée par une autre entreprise.",
  SLUG_IS_TAKEN: "Cette adresse est déjà utilisée par une autre entreprise.",
  YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS:
    "Vous avez atteint le nombre maximal d'entreprises pour votre compte.",
};

export const GENERIC_ERROR = "Une erreur inattendue est survenue. Réessayez dans un instant.";

export function authErrorMessage(error: { code?: string; status?: number } | null | undefined) {
  if (!error) return GENERIC_ERROR;
  if (error.status === 429) return MESSAGES.TOO_MANY_REQUESTS;
  return (error.code && MESSAGES[error.code]) || GENERIC_ERROR;
}

/** N'autorise que des chemins internes, pour éviter les redirections ouvertes. */
export function safeRedirect(path: string | null | undefined, fallback = "/tableau-de-bord") {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\"))
    return fallback;
  return path;
}
