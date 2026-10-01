import { useState, type FormEvent } from "react";
import { Symbol } from "../components/Symbol";
import { signIn } from "../lib/auth";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await signIn(email, password);
    setBusy(false);
    if (err) setError("Přihlášení se nepovedlo. Zkontroluj e-mail a heslo.");
  };

  return (
    <div className="login">
      <div className="login-symbols" aria-hidden="true">
        <Symbol module="piva" size={52} />
        <Symbol module="meditace" size={52} />
        <Symbol module="hlaskomat" size={52} />
        <Symbol module="lide" size={52} />
      </div>
      <h1>Osobní appka</h1>
      <form className="card login-form" onSubmit={submit}>
        <label htmlFor="email">E-mail</label>
        <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label htmlFor="password">Heslo</label>
        <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn dark tap wide" type="submit" disabled={busy}>{busy ? "Přihlašuji…" : "Přihlásit se"}</button>
      </form>
    </div>
  );
}
