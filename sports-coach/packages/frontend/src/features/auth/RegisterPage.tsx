import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { ApiError } from "../../lib/api";
import { Button } from "../../components/ui/Button";

export function RegisterPage() {
  const { register } = useAuth();
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
      await register(email, password);
      navigate("/onboarding");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <img
        src={`${import.meta.env.BASE_URL}images/hero-auth.png`}
        alt="Vory"
        className="w-full rounded-2xl shadow-lg shadow-indigo-900/10"
      />
      <h1 className="text-3xl font-bold text-slate-900">Creer un compte</h1>
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
          minLength={8}
          placeholder="Mot de passe (8 caracteres min.)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl border border-slate-300 px-4 py-3 text-base"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Creation..." : "Creer mon compte"}
        </Button>
      </form>
      <p className="text-base text-slate-500">
        Deja un compte ?{" "}
        <Link to="/login" className="font-semibold text-indigo-600">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
