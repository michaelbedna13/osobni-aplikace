import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Icon } from "../../components/Icon";
import { Topbar } from "../../components/Topbar";
import { useAuth } from "../../lib/auth";
import { MODULE_BY_KEY } from "../../lib/modules";
import { supabase } from "../../lib/supabase";

// Zámek modulu Untrois: heslo si uživatel nastaví sám při prvním otevření. Ukládá se jen otisk (PBKDF2 se solí)
// v user_settings.untrois_lock, bez Supabase nebo bez sloupce v prohlížeči. Odemčení platí, dokud appka neodejde
// do pozadí. Je to ochrana soukromí na půjčeném telefonu, ne šifrování dat.

const MODULE = MODULE_BY_KEY.untrois;
const LOCAL_KEY = "untrois-lock";
let unlocked = false;

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => { if (document.hidden) unlocked = false; });
}

const hex = (buf: ArrayBuffer | Uint8Array) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => new Uint8Array((s.match(/../g) ?? []).map((h) => parseInt(h, 16)));

async function derive(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations: 150_000, hash: "SHA-256" }, key, 256);
  return hex(bits);
}

async function makeLock(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `${hex(salt)}:${await derive(password, salt)}`;
}

async function checkLock(lock: string, password: string) {
  const [salt, hash] = lock.split(":");
  return (await derive(password, unhex(salt))) === hash;
}

const readLocal = () => { try { return localStorage.getItem(LOCAL_KEY); } catch { return null; } };
const writeLocal = (v: string) => { try { localStorage.setItem(LOCAL_KEY, v); } catch { /* jen do zavření */ } };

/** Uložený otisk hesla: Supabase, když je sloupec k dispozici, jinak prohlížeč. */
function useStoredLock() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [state, setState] = useState<{ lock: string | null; remote: boolean; failed?: boolean } | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (supabase && userId) {
        const { data, error } = await supabase.from("user_settings").select("untrois_lock").eq("user_id", userId).maybeSingle();
        if (!error) {
          if (alive) setState({ lock: (data?.untrois_lock as string | null) ?? null, remote: true });
          return;
        }
        // jiná chyba než chybějící sloupec (např. bez připojení): neotvírat, aby nešlo nastavit nové heslo
        if (error.code !== "42703") {
          if (alive) setState({ lock: null, remote: true, failed: true });
          return;
        }
      }
      if (alive) setState({ lock: readLocal(), remote: false });
    })();
    return () => { alive = false; };
  }, [userId]);

  const save = async (lock: string) => {
    if (state?.remote && supabase && userId) {
      const { error } = await supabase.from("user_settings").upsert({ user_id: userId, untrois_lock: lock });
      if (error) throw error;
    } else writeLocal(lock);
    setState((s) => ({ lock, remote: s?.remote ?? false }));
  };
  return { loading: state === undefined, failed: !!state?.failed, lock: state?.lock ?? null, save };
}

export function UntroisLock({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(unlocked);
  const { loading, failed, lock, save } = useStoredLock();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const relock = () => { if (document.hidden) setOpen(false); };
    document.addEventListener("visibilitychange", relock);
    return () => document.removeEventListener("visibilitychange", relock);
  }, []);

  if (open) return <>{children}</>;

  const creating = !loading && !failed && !lock;
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (creating) {
      if (password.length < 4) return setError("Heslo musí mít aspoň 4 znaky.");
      if (password !== again) return setError("Hesla se neshodují.");
    }
    setBusy(true);
    try {
      if (creating) await save(await makeLock(password));
      else if (!(await checkLock(lock!, password))) {
        setBusy(false);
        setPassword("");
        return setError("Špatné heslo.");
      }
      unlocked = true;
      setOpen(true);
    } catch {
      setError("Heslo se nepodařilo uložit. Zkontroluj připojení.");
    }
    setBusy(false);
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title="Untrois" />
      <form className="lock" onSubmit={submit}>
        <Icon name="lock" size={72} />
        <h2>{creating ? "Nastav si heslo" : "Zamčeno"}</h2>
        <p className="muted">
          {creating ? "Untrois se bude otevírat jen s tímhle heslem. Ulož si ho, obnovit ho nejde." : "Zadej heslo k Untrois."}
        </p>
        {failed && <p className="error">Zámek se nepodařilo ověřit. Zkontroluj připojení a zkus to znovu.</p>}
        {!loading && !failed && (
          <>
            <input className="input" type="password" autoComplete={creating ? "new-password" : "current-password"} aria-label="Heslo"
              placeholder="Heslo" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            {creating && (
              <input className="input" type="password" autoComplete="new-password" aria-label="Heslo znovu"
                placeholder="Heslo znovu" value={again} onChange={(e) => setAgain(e.target.value)} />
            )}
            {error && <p className="error">{error}</p>}
            <button className="btn-hero" type="submit" disabled={busy || !password}>
              <Icon name={creating ? "check" : "i-play"} size={22} /> {creating ? "Nastavit a otevřít" : "Otevřít"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
