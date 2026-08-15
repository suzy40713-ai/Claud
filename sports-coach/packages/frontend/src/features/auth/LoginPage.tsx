import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-auth.png`}
        alt="Kadence"
        className="w-full rounded-2xl shadow-lg shadow-indigo-900/10"
      />
      <h1 className="text-3xl font-bold text-slate-900">Connexion</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
        <input
          type="password"
          required
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
      <p className="text-base text-slate-500">
        Pas encore de compte ?{" "}
        <Link to="/register" className="font-semibold text-indigo-600">
          Cree un compte
        </Link>
      </p>
      <Link
        to="/ebook"
        className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-700"
      >
        📖 Nouveau : notre ebook "Transformation 90 Jours" →
      </Link>
    </div>
  );
}
