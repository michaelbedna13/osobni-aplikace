import { useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { backupToBeers, backupToPeople, backupToQuotes, parseBackup, type Backup } from "../lib/importBackup";
import type { Person } from "../modules/lide/data";
import { formatDate, plural } from "../lib/format";
import { createStore } from "../lib/db";
import type { Beer } from "../modules/piva/data";
import { QUOTES_KEY, store as quoteStore } from "../modules/hlaskomat/data";

const beerStore = createStore<Beer>("beers", "drunk_at");
const peopleStore = createStore<Person>("people", "created_at");

type State =
  | { step: "idle" }
  | { step: "ready"; backup: Exclude<Backup, { kind: "unknown" }> }
  | { step: "busy" }
  | { step: "done"; message: string }
  | { step: "error"; message: string };

/** Import záloh z původních appek (Piva, Hláškomat). Opakovaný import nevytvoří duplicity. */
export function ImportSection() {
  const [state, setState] = useState<State>({ step: "idle" });
  const queryClient = useQueryClient();

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const backup = parseBackup(JSON.parse(await file.text()));
      if (backup.kind === "unknown") setState({ step: "error", message: "Tenhle soubor nevypadá jako záloha Piv, Hláškomatu ani lidí." });
      else setState({ step: "ready", backup });
    } catch {
      setState({ step: "error", message: "Soubor se nepodařilo přečíst. Musí to být záloha ve formátu JSON." });
    }
  };

  const run = async () => {
    if (state.step !== "ready") return;
    const { backup } = state;
    setState({ step: "busy" });
    try {
      if (backup.kind === "piva") {
        await beerStore.insertMissing(await backupToBeers(backup.days));
        await queryClient.invalidateQueries({ queryKey: ["beers"] });
        setState({ step: "done", message: `Hotovo: ${backup.total} ${plural(backup.total, ["pivo", "piva", "piv"])} je v appce.` });
      } else if (backup.kind === "lide") {
        // u lidí import údaje opraví; poznámku a datum přidání zachová
        const existing = new Map((await peopleStore.list("1970-01-01T00:00:00.000Z")).map((p) => [p.id, p]));
        const people = (await backupToPeople(backup.people)).map((p) => {
          const old = existing.get(p.id);
          return old ? { ...p, note: p.note ?? old.note, created_at: old.created_at } : p;
        });
        await peopleStore.upsert(people);
        await queryClient.invalidateQueries({ queryKey: ["people"] });
        setState({ step: "done", message: `Hotovo: ${backup.people.length} ${plural(backup.people.length, ["člověk", "lidé", "lidí"])} je v Lidech a dárcích.` });
      } else {
        await quoteStore.insertMissing(await backupToQuotes(backup.quotes));
        await queryClient.invalidateQueries({ queryKey: QUOTES_KEY });
        setState({ step: "done", message: `Hotovo: ${backup.quotes.length} ${plural(backup.quotes.length, ["hláška", "hlášky", "hlášek"])} je v appce.` });
      }
    } catch {
      setState({ step: "error", message: "Import se nepovedl. Zkontroluj připojení a zkus to znovu." });
    }
  };

  return (
    <section className="sec">
      <h2>Import ze zálohy</h2>
      <div className="panel">
      <p className="small">Záloha z původní appky na piva, z Hláškomatu nebo seznam lidí (soubor .json). Když import spustíš znovu, nic se nezdvojí.</p>
      <label className="btn tap wide file-btn">
        Vybrat soubor
        <input type="file" accept="application/json,.json" onChange={onFile} />
      </label>

      {state.step === "ready" && (
        <div className="success">
          <p>
            {state.backup.kind === "piva"
              ? `Piva: ${state.backup.total} ${plural(state.backup.total, ["pivo", "piva", "piv"])} ve ${state.backup.days.length} dnech (${formatDate(new Date(`${state.backup.days[0].day}T12:00`), true)} až ${formatDate(new Date(`${state.backup.days[state.backup.days.length - 1].day}T12:00`), true)})`
              : state.backup.kind === "lide"
              ? `Lidé: ${state.backup.people.length} (${state.backup.people.slice(0, 3).map((p) => p.name).join(", ")}${state.backup.people.length > 3 ? "…" : ""})`
              : `Hláškomat: ${state.backup.quotes.length} ${plural(state.backup.quotes.length, ["hláška", "hlášky", "hlášek"])}`}
          </p>
          <button className="btn dark tap wide" onClick={run}>Importovat</button>
        </div>
      )}
      {state.step === "busy" && <p className="success" role="status">Importuji…</p>}
      {state.step === "done" && <p className="success" role="status">{state.message}</p>}
      {state.step === "error" && <p className="error" role="alert">{state.message}</p>}
      </div>
    </section>
  );
}
