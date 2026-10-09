import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { formatDate, plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { useSettings } from "../../lib/settings";
import { usePeople } from "../lide/data";
import { useBeers } from "../piva/data";
import {
  EXPENSE_PERIODS, EXPENSE_PRESETS, PERIOD_NAMES, balancesByPerson, computeFinanceStats, dayKey, daysUntil, debts, expenseMonthly, expenses, formatKc, monthly,
  nextDue, nextRenewal, parseAmount, roundKc, savings, subscriptions,
  type Debt, type Expense, type ExpensePeriod, type Period, type SavingsGoal, type Subscription,
} from "./data";

const MODULE = MODULE_BY_KEY.finance;
type Tab = "vydaje" | "predplatne" | "dluhy" | "sporeni";
const TABS: Tab[] = ["vydaje", "predplatne", "dluhy", "sporeni"];
const DNI: [string, string, string] = ["den", "dny", "dní"];
const when = (days: number) => (days === 0 ? "dnes" : days === 1 ? "zítra" : `za ${days} ${plural(days, DNI)}`);

export function FinanceScreen() {
  const { data: subs = [], error } = subscriptions.useList();
  const { data: ds = [] } = debts.useList();
  const { data: goals = [] } = savings.useList();
  const { data: exps = [] } = expenses.useList();
  const { data: beers = [] } = useBeers();
  const { settings, update: updateSettings } = useSettings();
  const stats = useMemo(() => computeFinanceStats(subs, ds, goals, exps), [subs, ds, goals, exps]);
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>("vydaje");
  const [sheet, setSheet] = useState<
    { kind: "exp"; item: Expense | null } | { kind: "sub"; item: Subscription | null } | { kind: "debt"; item: Debt | null } | { kind: "goal"; item: SavingsGoal | null } | { kind: "beer" } | null
  >(null);

  useEffect(() => {
    const t = params.get("tab");
    if (TABS.includes(t as Tab)) setTab(t as Tab);
    else if (params.has("nova")) setSheet({ kind: "exp", item: null });
    else return;
    setParams({}, { replace: true });
  }, [params, setParams]);

  const year = new Date().getFullYear();
  const beersThisYear = beers.filter((b) => new Date(b.drunk_at).getFullYear() === year).length;
  const upcoming = subs.filter((s) => s.active).map((s) => ({ s, next: nextRenewal(s.next_date, s.period) })).sort((a, b) => a.next.getTime() - b.next.getTime());
  const balances = balancesByPerson(ds);
  const addCurrent = () =>
    setSheet(tab === "vydaje" ? { kind: "exp", item: null } : tab === "predplatne" ? { kind: "sub", item: null } : tab === "dluhy" ? { kind: "debt", item: null } : { kind: "goal", item: null });
  const activeExps = exps.filter((e) => e.active).sort((a, b) => expenseMonthly(b) - expenseMonthly(a));

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Finance" />
        <div className="hero hero-long">
          <span className="icon-slot"><Icon name="finance" size={96} /></span>
          <span className="hero-num">{Math.round(stats.monthlyTotal).toLocaleString("cs-CZ")}</span>
          <span className="hero-cap">Kč měsíčně pravidelně</span>
          <p className="hero-line">výdaje {roundKc(stats.monthlyExpenses)} · předplatné {roundKc(stats.monthlySubs)} · za rok {roundKc(stats.yearlyTotal)}</p>
        </div>
        <button className="btn-hero" onClick={addCurrent}>
          <Icon name="i-plus" size={24} /> {tab === "vydaje" ? "Přidat výdaj" : tab === "predplatne" ? "Přidat předplatné" : tab === "dluhy" ? "Zapsat dluh" : "Nový spořicí cíl"}
        </button>
      </div>

      {error && <p className="error">Nepodařilo se načíst finance. Zkontroluj připojení.</p>}

      <div className="score">
        <div><b>{Math.round(stats.owedToMe).toLocaleString("cs-CZ")}</b><span>Kč dluží mně</span></div>
        <div><b>{Math.round(stats.iOwe).toLocaleString("cs-CZ")}</b><span>Kč dlužím já</span></div>
        <div><b>{Math.round(stats.savedTotal).toLocaleString("cs-CZ")}</b><span>Kč naspořeno</span></div>
      </div>

      <button className="panel beer-panel" onClick={() => setSheet({ kind: "beer" })}>
        <Icon name="piva" size={32} />
        <span className="grow">
          <b>Za piva letos ≈ {roundKc(beersThisYear * settings.beer_price)}</b>
          <span className="small muted">{beersThisYear} {plural(beersThisYear, ["pivo", "piva", "piv"])} × {formatKc(settings.beer_price)} · změnit cenu</span>
        </span>
      </button>

      <Tabs label="Část" value={tab} onChange={setTab} items={[{ id: "vydaje", label: "Výdaje" }, { id: "predplatne", label: "Předplatné" }, { id: "dluhy", label: "Dluhy" }, { id: "sporeni", label: "Spoření" }]} />

      {tab === "vydaje" && (
        <div className="tab-panel">
          {exps.length === 0 ? <p className="empty">Žádné výdaje. Zapiš nájem, internet, energie… a uvidíš, kolik tě měsíčně stojí bydlení a provoz.</p> : (
            <>
              {activeExps.length > 1 && (
                <div className="panel exp-share" aria-label="Podíl výdajů">
                  <div className="exp-bar">
                    {activeExps.map((e, i) => <i key={e.id} style={{ flexGrow: expenseMonthly(e), opacity: 1 - (i % 4) * 0.2 }} title={e.name} />)}
                  </div>
                  <span className="small muted">{activeExps.slice(0, 3).map((e) => `${e.name} ${Math.round((expenseMonthly(e) / stats.monthlyExpenses) * 100)} %`).join(" · ")}</span>
                </div>
              )}
              <ul className="list">
                {activeExps.map((e) => {
                  const due = e.period === "mesic" && e.due_day ? daysUntil(nextDue(e.due_day)) : null;
                  return (
                    <li key={e.id}>
                      <button className={`list-btn${due !== null && due <= 3 ? " soon" : ""}`} onClick={() => setSheet({ kind: "exp", item: e })}>
                        <span className="grow">
                          <b>{e.name}</b>
                          <span className="occasion-kind">
                            {EXPENSE_PERIODS[e.period].adj} {formatKc(e.amount)}{e.due_day && e.period === "mesic" ? ` · platí se ${e.due_day}. (${when(due ?? 0)})` : ""}{e.note ? ` · ${e.note}` : ""}
                          </span>
                        </span>
                        <span className="money">{roundKc(expenseMonthly(e))}<small>/měs</small></span>
                      </button>
                    </li>
                  );
                })}
                {exps.filter((e) => !e.active).map((e) => (
                  <li key={e.id}>
                    <button className="list-btn inactive" onClick={() => setSheet({ kind: "exp", item: e })}>
                      <span className="grow"><b>{e.name}</b><span className="occasion-kind">už neplatím</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {tab === "predplatne" && (
        <div className="tab-panel">
          {subs.length === 0 ? <p className="empty">Žádné předplatné. Přidej Netflix, Spotify, telefon… a uvidíš, kolik to dělá za rok.</p> : (
            <ul className="list">
              {upcoming.map(({ s, next }) => {
                const d = daysUntil(next);
                return (
                  <li key={s.id}>
                    <button className={`list-btn${d <= 3 ? " soon" : ""}`} onClick={() => setSheet({ kind: "sub", item: s })}>
                      <span className="grow"><b>{s.name}</b><span className="occasion-kind">{PERIOD_NAMES[s.period].adj} {formatKc(s.price)} · obnova {formatDate(next)} ({when(d)})</span></span>
                      <span className="money">{roundKc(monthly(s))}<small>/měs</small></span>
                    </button>
                  </li>
                );
              })}
              {subs.filter((s) => !s.active).map((s) => (
                <li key={s.id}>
                  <button className="list-btn inactive" onClick={() => setSheet({ kind: "sub", item: s })}>
                    <span className="grow"><b>{s.name}</b><span className="occasion-kind">zrušené</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "dluhy" && (
        <div className="tab-panel">
          {balances.length > 0 && (
            <div className="panel">
              <h3>Kdo s kým</h3>
              <ul className="ranking">
                {balances.map((b) => (
                  <li key={b.person}>
                    <span className="grow">{b.person}</span>
                    <span className={`money ${b.balance > 0 ? "plus" : "minus"}`}>{b.balance > 0 ? "dluží mi " : "dlužím "}{formatKc(Math.abs(b.balance))}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ds.length === 0 ? <p className="empty">Nikdo nikomu nic nedluží. Zatím.</p> : (
            <ul className="list">
              {ds.map((d) => (
                <li key={d.id}>
                  <button className={`list-btn${d.settled_at ? " inactive" : ""}`} onClick={() => setSheet({ kind: "debt", item: d })}>
                    <span className="grow">
                      <b>{d.direction === "mi" ? `${d.person} → já` : `já → ${d.person}`}</b>
                      <span className="occasion-kind">{[d.note, formatDate(new Date(d.created_at)), d.settled_at ? "vyrovnáno" : null].filter(Boolean).join(" · ")}</span>
                    </span>
                    <span className={`money ${d.direction === "mi" ? "plus" : "minus"}`}>{formatKc(d.amount)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === "sporeni" && (
        <div className="tab-panel">
          {goals.length === 0 ? <p className="empty">Žádný spořicí cíl. Na co šetříš?</p> : goals.map((g) => {
            const pct = Math.min(100, (g.saved / g.target) * 100);
            return (
              <button key={g.id} className="panel goal-card" onClick={() => setSheet({ kind: "goal", item: g })}>
                <div className="row-between"><b>{g.name}</b><span className="money">{Math.round(pct)} %</span></div>
                <div className="ch-progress" style={{ "--team": MODULE.color } as CSSProperties}><i style={{ width: `${pct}%` }} /></div>
                <span className="small muted">{roundKc(g.saved)} z {roundKc(g.target)}{g.deadline ? ` · do ${formatDate(new Date(g.deadline), true)}` : ""}</span>
              </button>
            );
          })}
        </div>
      )}

      {sheet?.kind === "exp" && <ExpenseSheet item={sheet.item} existing={exps.map((e) => e.name)} onClose={() => setSheet(null)} />}
      {sheet?.kind === "sub" && <SubSheet item={sheet.item} onClose={() => setSheet(null)} />}
      {sheet?.kind === "debt" && <DebtSheet item={sheet.item} onClose={() => setSheet(null)} />}
      {sheet?.kind === "goal" && <GoalSheet item={sheet.item} onClose={() => setSheet(null)} />}
      {sheet?.kind === "beer" && (
        <AmountSheet title="Cena jednoho piva" initial={settings.beer_price} onClose={() => setSheet(null)} onSave={(v) => updateSettings({ beer_price: v })} />
      )}
    </div>
  );
}

function AmountField({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} className="input" inputMode="decimal" placeholder="0" value={value} onChange={(e) => onChange(e.target.value)} />
      {value.trim() && parseAmount(value) === null && <p className="error">Napiš částku číslem.</p>}
    </>
  );
}

const show = (n: number | null | undefined) => (n === null || n === undefined ? "" : String(n).replace(".", ","));

function ExpenseSheet({ item, existing, onClose }: { item: Expense | null; existing: string[]; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [amount, setAmount] = useState(show(item?.amount));
  const [period, setPeriod] = useState<ExpensePeriod>(item?.period ?? "mesic");
  const [dueDay, setDueDay] = useState(item?.due_day ? String(item.due_day) : "");
  const [note, setNote] = useState(item?.note ?? "");
  const add = expenses.useAdd();
  const update = expenses.useUpdate();
  const remove = expenses.useRemove();
  const a = parseAmount(amount);
  const day = dueDay.trim() ? Number(dueDay) : null;
  const dayOk = day === null || (Number.isInteger(day) && day >= 1 && day <= 31);
  const valid = name.trim() && a !== null && dayOk;
  const presets = EXPENSE_PRESETS.filter((p) => !existing.includes(p) || p === item?.name);

  const save = () => {
    const fields = { name: name.trim(), amount: a!, period, due_day: period === "mesic" ? day : null, note: note.trim() || null };
    if (item) update.mutate({ ...item, ...fields });
    else add.mutate({ id: crypto.randomUUID(), active: true, created_at: new Date().toISOString(), ...fields });
    onClose();
  };

  return (
    <Sheet title={item ? item.name : "Nový výdaj"} onClose={onClose}>
      <label htmlFor="exp-name" className="field-label">Co</label>
      <input id="exp-name" className="input" maxLength={100} placeholder="Nájem, internet, elektřina…" value={name} onChange={(e) => setName(e.target.value)} />
      {!item && presets.length > 0 && (
        <div className="chips">
          {presets.map((p) => <button key={p} type="button" className={`chip${name === p ? " on" : ""}`} onClick={() => setName(p)}>{p}</button>)}
        </div>
      )}
      <AmountField id="exp-amount" label="Kolik (Kč)" value={amount} onChange={setAmount} />
      <span className="field-label">Jak často</span>
      <div className="seg seg-wide" role="group" aria-label="Perioda">
        {(Object.keys(EXPENSE_PERIODS) as ExpensePeriod[]).map((k) => <button key={k} type="button" className={`seg-btn${period === k ? " on" : ""}`} aria-pressed={period === k} onClick={() => setPeriod(k)}>{EXPENSE_PERIODS[k].adj}</button>)}
      </div>
      {period === "mesic" && (
        <>
          <label htmlFor="exp-day" className="field-label">Den splatnosti (nepovinné)</label>
          <input id="exp-day" className="input" inputMode="numeric" maxLength={2} placeholder="např. 15" value={dueDay} onChange={(e) => setDueDay(e.target.value.replace(/\D/g, ""))} />
          {!dayOk && <p className="error">Den v měsíci, 1 až 31.</p>}
        </>
      )}
      <label htmlFor="exp-note" className="field-label">Poznámka</label>
      <input id="exp-note" className="input" maxLength={500} placeholder="Záloha, trvalý příkaz, dodavatel…" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn dark tap wide" disabled={!valid} onClick={save}>{item ? "Uložit" : "Přidat"}</button>
      {item && (
        <>
          <button className="btn tap wide" onClick={() => { update.mutate({ ...item, active: !item.active }); onClose(); }}>{item.active ? "Už neplatím" : "Zase platím"}</button>
          <button className="link" onClick={() => { if (window.confirm(`Smazat ${item.name}?`)) { remove.mutate(item.id); onClose(); } }}>Smazat</button>
        </>
      )}
    </Sheet>
  );
}

function SubSheet({ item, onClose }: { item: Subscription | null; onClose: () => void }) {
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(show(item?.price));
  const [period, setPeriod] = useState<Period>(item?.period ?? "mesic");
  const [next, setNext] = useState(item ? dayKey(nextRenewal(item.next_date, item.period)) : dayKey(new Date()));
  const [note, setNote] = useState(item?.note ?? "");
  const add = subscriptions.useAdd();
  const update = subscriptions.useUpdate();
  const remove = subscriptions.useRemove();
  const p = parseAmount(price);
  const valid = name.trim() && p !== null && /^\d{4}-\d{2}-\d{2}$/.test(next);

  const save = () => {
    const fields = { name: name.trim(), price: p!, period, next_date: next, note: note.trim() || null };
    if (item) update.mutate({ ...item, ...fields });
    else add.mutate({ id: crypto.randomUUID(), active: true, created_at: new Date().toISOString(), ...fields });
    onClose();
  };

  return (
    <Sheet title={item ? item.name : "Nové předplatné"} onClose={onClose}>
      <label htmlFor="sub-name" className="field-label">Co</label>
      <input id="sub-name" className="input" maxLength={100} placeholder="Netflix, Spotify, telefon…" value={name} onChange={(e) => setName(e.target.value)} />
      <AmountField id="sub-price" label="Cena v Kč" value={price} onChange={setPrice} />
      <span className="field-label">Jak často</span>
      <div className="seg seg-wide" role="group" aria-label="Perioda">
        {(Object.keys(PERIOD_NAMES) as Period[]).map((k) => <button key={k} type="button" className={`seg-btn${period === k ? " on" : ""}`} aria-pressed={period === k} onClick={() => setPeriod(k)}>{PERIOD_NAMES[k].adj}</button>)}
      </div>
      <label htmlFor="sub-next" className="field-label">Příští platba</label>
      <input id="sub-next" className="input" type="date" value={next} onChange={(e) => setNext(e.target.value)} />
      <label htmlFor="sub-note" className="field-label">Poznámka</label>
      <input id="sub-note" className="input" maxLength={500} placeholder="Platí se z karty…, sdílené s…" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn dark tap wide" disabled={!valid} onClick={save}>{item ? "Uložit" : "Přidat"}</button>
      {item && (
        <>
          <button className="btn tap wide" onClick={() => { update.mutate({ ...item, active: !item.active }); onClose(); }}>{item.active ? "Zrušil(a) jsem ho" : "Zase platím"}</button>
          <button className="link" onClick={() => { if (window.confirm(`Smazat ${item.name}?`)) { remove.mutate(item.id); onClose(); } }}>Smazat</button>
        </>
      )}
    </Sheet>
  );
}

function DebtSheet({ item, onClose }: { item: Debt | null; onClose: () => void }) {
  const [person, setPerson] = useState(item?.person ?? "");
  const [amount, setAmount] = useState(show(item?.amount));
  const [direction, setDirection] = useState<"mi" | "ja">(item?.direction ?? "mi");
  const [note, setNote] = useState(item?.note ?? "");
  const { data: people = [] } = usePeople();
  const add = debts.useAdd();
  const update = debts.useUpdate();
  const remove = debts.useRemove();
  const a = parseAmount(amount);
  const valid = person.trim() && a !== null && a > 0;

  const save = () => {
    const fields = { person: person.trim(), amount: a!, direction, note: note.trim() || null };
    if (item) update.mutate({ ...item, ...fields });
    else add.mutate({ id: crypto.randomUUID(), settled_at: null, created_at: new Date().toISOString(), ...fields });
    onClose();
  };

  return (
    <Sheet title={item ? "Dluh" : "Nový dluh"} onClose={onClose}>
      <div className="seg seg-wide" role="group" aria-label="Směr">
        <button type="button" className={`seg-btn${direction === "mi" ? " on" : ""}`} aria-pressed={direction === "mi"} onClick={() => setDirection("mi")}>Dluží mi</button>
        <button type="button" className={`seg-btn${direction === "ja" ? " on" : ""}`} aria-pressed={direction === "ja"} onClick={() => setDirection("ja")}>Dlužím já</button>
      </div>
      <label htmlFor="debt-person" className="field-label">Kdo</label>
      <input id="debt-person" className="input" maxLength={80} value={person} onChange={(e) => setPerson(e.target.value)} />
      {people.length > 0 && (
        <div className="chips">
          {people.slice(0, 12).map((p) => <button key={p.id} type="button" className={`chip${person === p.name ? " on" : ""}`} onClick={() => setPerson(p.name)}>{p.name}</button>)}
        </div>
      )}
      <AmountField id="debt-amount" label="Kolik (Kč)" value={amount} onChange={setAmount} />
      <label htmlFor="debt-note" className="field-label">Za co</label>
      <input id="debt-note" className="input" maxLength={500} placeholder="Lístky na koncert, oběd…" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn dark tap wide" disabled={!valid} onClick={save}>{item ? "Uložit" : "Zapsat"}</button>
      {item && (
        <>
          <button className="btn tap wide" onClick={() => { update.mutate({ ...item, settled_at: item.settled_at ? null : new Date().toISOString() }); onClose(); }}>
            {item.settled_at ? "Ještě není vyrovnáno" : "Vyrovnáno"}
          </button>
          <button className="link" onClick={() => { if (window.confirm("Smazat dluh?")) { remove.mutate(item.id); onClose(); } }}>Smazat</button>
        </>
      )}
    </Sheet>
  );
}

function GoalSheet({ item: opened, onClose }: { item: SavingsGoal | null; onClose: () => void }) {
  // vždy aktuální verze cíle ze seznamu – po vložení částky se hned ukáže nový stav
  // a „Uložit změny“ nepřepíše naspořenou částku starou hodnotou z otevření okna
  const { data: goals = [] } = savings.useList();
  const item = opened ? goals.find((g) => g.id === opened.id) ?? opened : null;
  const [name, setName] = useState(item?.name ?? "");
  const [target, setTarget] = useState(show(item?.target));
  const [deadline, setDeadline] = useState(item?.deadline ?? "");
  const [deposit, setDeposit] = useState("");
  const add = savings.useAdd();
  const update = savings.useUpdate();
  const remove = savings.useRemove();
  const t = parseAmount(target);
  const dep = parseAmount(deposit);
  const valid = name.trim() && t !== null && t > 0;

  const save = () => {
    const fields = { name: name.trim(), target: t!, deadline: deadline || null };
    if (item) update.mutate({ ...item, ...fields });
    else add.mutate({ id: crypto.randomUUID(), saved: 0, created_at: new Date().toISOString(), ...fields });
    onClose();
  };
  const move = (sign: 1 | -1) => {
    if (!item || dep === null) return;
    update.mutate({ ...item, saved: Math.max(0, Math.round((item.saved + sign * dep) * 100) / 100) });
    setDeposit("");
  };

  return (
    <Sheet title={item ? item.name : "Spořicí cíl"} onClose={onClose}>
      {item && (
        <div className="panel">
          <p className="challenge-num"><b>{roundKc(item.saved)}</b> z {roundKc(item.target)}</p>
          <div className="ch-progress" style={{ "--team": MODULE.color } as CSSProperties}><i style={{ width: `${Math.min(100, (item.saved / item.target) * 100)}%` }} /></div>
          <AmountField id="goal-deposit" label="Částka" value={deposit} onChange={setDeposit} />
          <div className="row2">
            <button className="btn dark tap" disabled={!dep} onClick={() => move(1)}>+ Přidat</button>
            <button className="btn tap" disabled={!dep} onClick={() => move(-1)}>− Vybrat</button>
          </div>
        </div>
      )}
      <label htmlFor="goal-name" className="field-label">Na co</label>
      <input id="goal-name" className="input" maxLength={100} placeholder="Dovolená, nový telefon…" value={name} onChange={(e) => setName(e.target.value)} />
      <AmountField id="goal-target" label="Cíl (Kč)" value={target} onChange={setTarget} />
      <label htmlFor="goal-deadline" className="field-label">Do kdy (nepovinné)</label>
      <input id="goal-deadline" className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      <button className="btn tap wide" disabled={!valid} onClick={save}>{item ? "Uložit změny" : "Vytvořit cíl"}</button>
      {item && <button className="link" onClick={() => { if (window.confirm(`Smazat cíl ${item.name}?`)) { remove.mutate(item.id); onClose(); } }}>Smazat</button>}
    </Sheet>
  );
}

function AmountSheet({ title, initial, onClose, onSave }: { title: string; initial: number; onClose: () => void; onSave: (v: number) => void }) {
  const [value, setValue] = useState(show(initial));
  const v = parseAmount(value);
  return (
    <Sheet title={title} onClose={onClose}>
      <AmountField id="amount" label="Kč" value={value} onChange={setValue} />
      <button className="btn dark tap wide" disabled={v === null} onClick={() => { onSave(v!); onClose(); }}>Uložit</button>
    </Sheet>
  );
}
