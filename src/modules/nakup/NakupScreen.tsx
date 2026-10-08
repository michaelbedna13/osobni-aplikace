import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { useToast } from "../../components/Toast";
import { Topbar } from "../../components/Topbar";
import { plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import {
  CATEGORIES, groupByCategory, listText, newItem, suggestions, useAddItem, useDeleteItem, useShopping, useUpdateItems,
  type Category, type ShoppingItem,
} from "./data";

const MODULE = MODULE_BY_KEY.nakup;
const VECI: [string, string, string] = ["věc", "věci", "věcí"];

export function NakupScreen() {
  const { data: all = [], error } = useShopping();
  const add = useAddItem();
  const update = useUpdateItems();
  const [params, setParams] = useSearchParams();
  const [text, setText] = useState("");
  const [edit, setEdit] = useState<ShoppingItem | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // ?nova=1 z karty na Dnes nebo z tlačítka + rovnou otevře klávesnici
  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    input.current?.focus();
  }, [params, setParams]);

  const active = all.filter((i) => !i.archived);
  const toBuy = active.filter((i) => !i.done);
  const inCart = active.filter((i) => i.done).sort((a, b) => (b.done_at ?? "").localeCompare(a.done_at ?? ""));
  const sugg = suggestions(all, text, text.trim() ? 6 : 12);

  const addText = (t: string) => {
    if (!t.trim()) return;
    add.mutate(newItem(t));
    setText("");
    input.current?.focus();
  };

  const toggle = (i: ShoppingItem) => update.mutate([{ ...i, done: !i.done, done_at: i.done ? null : new Date().toISOString() }]);

  const clearCart = () => {
    const items = inCart.map((i) => ({ ...i, archived: true }));
    update.mutate(items);
    toast.show(`Košík vyčištěn (${items.length})`, [{ label: "Vrátit", run: () => update.mutate(items.map((i) => ({ ...i, archived: false }))) }]);
  };

  const share = async () => {
    const t = listText(all);
    if (navigator.share) {
      await navigator.share({ title: "Nákup", text: t }).catch(() => undefined);
    } else {
      await navigator.clipboard?.writeText(t);
      toast.show("Seznam je zkopírovaný");
    }
  };

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar
          title="Nákup"
          right={toBuy.length > 0 && <button className="block-btn" aria-label="Sdílet seznam" onClick={() => void share()}><Sprite name="i-share" size={20} /></button>}
        />
        <div className="hero">
          <span className="sprite-tile"><Sprite name="nakup" size={96} /></span>
          <span className="hero-num">{toBuy.length}</span>
          <span className="hero-cap">{plural(toBuy.length, VECI)} koupit</span>
          <p className="hero-line">{inCart.length ? `V košíku ${inCart.length}` : toBuy.length ? "Ťukni na položku, až ji dáš do košíku." : "Seznam je prázdný."}</p>
        </div>
        <form className="nk-add" onSubmit={(e) => { e.preventDefault(); addText(text); }}>
          <label htmlFor="nk-input" className="sr-only">Co koupit</label>
          <input
            id="nk-input" ref={input} className="input" autoComplete="off" enterKeyHint="done" maxLength={150}
            placeholder="Co koupit? Třeba 2 mléka" value={text} onChange={(e) => setText(e.target.value)}
          />
          <button className="btn-hero nk-add-btn" disabled={!text.trim()} aria-label="Přidat"><Sprite name="i-plus" size={24} /></button>
        </form>
        {sugg.length > 0 && (
          <div className="nk-sugg">
            {!text.trim() && <span className="small muted">Často kupuješ</span>}
            <div className="chips" role="group" aria-label="Návrhy">
              {sugg.map((s) => (
                <button key={s.name} type="button" className="chip" onClick={() => { add.mutate(newItem(s.name, s.category === "Ostatní" ? undefined : (s.category as Category))); setText(""); }}>+ {s.name}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && <p className="error">Nepodařilo se načíst seznam. Zkontroluj připojení.</p>}

      {active.length === 0 && <p className="empty">Napiš, co koupit. Položky se samy seřadí podle oddělení v obchodě.</p>}

      {groupByCategory(toBuy).map((g) => (
        <section key={g.category} className="nk-group">
          <h2 className="nk-cat">{g.category}</h2>
          <ul className="list">{g.items.map((i) => <Row key={i.id} item={i} onToggle={toggle} onEdit={setEdit} />)}</ul>
        </section>
      ))}

      {inCart.length > 0 && (
        <section className="nk-group">
          <div className="list-head">
            <h2>V košíku</h2>
            <button className="link" onClick={clearCart}>Vyčistit košík</button>
          </div>
          <ul className="list nk-cart">{inCart.map((i) => <Row key={i.id} item={i} onToggle={toggle} onEdit={setEdit} />)}</ul>
        </section>
      )}

      {edit && <EditSheet item={edit} onClose={() => setEdit(null)} />}
      {toast.element}
    </div>
  );
}

function Row({ item, onToggle, onEdit }: { item: ShoppingItem; onToggle: (i: ShoppingItem) => void; onEdit: (i: ShoppingItem) => void }) {
  return (
    <li className={`nk-row${item.done ? " done" : ""}`}>
      <button className="nk-check" aria-pressed={item.done} onClick={() => onToggle(item)}>
        <span className="nk-box" aria-hidden="true">{item.done && <Sprite name="check" size={20} />}</span>
        <span className="grow"><b>{item.name}</b>{item.qty && <span className="nk-qty">{item.qty}</span>}</span>
      </button>
      <button className="nk-edit" aria-label={`Upravit: ${item.name}`} onClick={() => onEdit(item)}><Sprite name="i-edit" size={20} /></button>
    </li>
  );
}

function EditSheet({ item, onClose }: { item: ShoppingItem; onClose: () => void }) {
  const [name, setName] = useState(item.name);
  const [qty, setQty] = useState(item.qty ?? "");
  const [category, setCategory] = useState(item.category);
  const update = useUpdateItems();
  const remove = useDeleteItem();

  const save = () => {
    update.mutate([{ ...item, name: name.trim().slice(0, 120), qty: qty.trim().slice(0, 30) || null, category }]);
    onClose();
  };

  return (
    <Sheet title="Upravit položku" onClose={onClose}>
      <label htmlFor="nk-name" className="field-label">Co</label>
      <input id="nk-name" className="input" maxLength={120} value={name} onChange={(e) => setName(e.target.value)} />
      <label htmlFor="nk-qty" className="field-label">Kolik (nepovinné)</label>
      <input id="nk-qty" className="input" maxLength={30} placeholder="2, 500 g, 1 balení…" value={qty} onChange={(e) => setQty(e.target.value)} />
      <span className="field-label">Oddělení</span>
      <div className="nk-cats" role="group" aria-label="Oddělení">
        {CATEGORIES.map((c) => <button key={c} type="button" className={`chip${category === c ? " on" : ""}`} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}
      </div>
      <button className="btn dark tap wide" disabled={!name.trim()} onClick={save}>Uložit</button>
      <button className="btn tap wide" onClick={() => { remove.mutate(item.id); onClose(); }}>Smazat ze seznamu</button>
    </Sheet>
  );
}
