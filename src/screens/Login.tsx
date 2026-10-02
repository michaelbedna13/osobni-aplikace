import { useState, type FormEvent } from "react";
import { Sprite } from "../components/Sprite";
import { NightStars } from "../components/Topbar";
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
    if (err) setError("Tohle heslo nesedí. Zkontroluj e-mail a heslo a zkus to znovu.");
  };

  return (
    <div className="screen night">
      <NightStars />
      <div className="login">
        <div className="login-cast" aria-hidden="true">
          <Sprite name="piva" size={64} anim="bob" />
          <Sprite name="meditace" size={64} />
          <Sprite name="hlaskomat" size={64} anim="bob" />
          <Sprite name="lide" size={64} />
        </div>
        <h1>Osobní appka</h1>
        <form className="panel login-form form" onSubmit={submit}>
          <label htmlFor="email" className="field-label">E-mail</label>
          <input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <label htmlFor="password" className="field-label">Heslo</label>
          <input id="password" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn dark tap wide" type="submit" disabled={busy}>{busy ? "Načítám…" : "Start"}</button>
        </form>
      </div>
    </div>
  );
}
