import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Icon } from "../../components/Icon";
import { Tabs } from "../../components/Tabs";
import { Topbar } from "../../components/Topbar";
import { plural } from "../../lib/format";
import { MODULE_BY_KEY } from "../../lib/modules";
import { fetchPreview } from "../odkazy/data";
import { domainOf, extractUrl } from "../odkazy/util";
import {
  PRIORITY_NAMES, closeWish, computeWishStats, daysToWait, formatKc, newWish, parsePrice, sortWishes, useAddWish, useDeleteWish, useUpdateWish, useWishes,
  type Wish,
} from "./data";

const MODULE = MODULE_BY_KEY.wishlist;
const DNI: [string, string, string] = ["den", "dny", "dní"];

function Thumb({ wish }: { wish: Wish }) {
  const [broken, setBroken] = useState(false);
  if (wish.image_url && !broken) return <img className="link-thumb" src={wish.image_url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  return <span className="link-thumb link-letter" aria-hidden="true"><Icon name="wishlist" size={36} /></span>;
}

function PriorityPicker({ value, onChange }: { value: 1 | 2 | 3; onChange: (v: 1 | 2 | 3) => void }) {
  return (
    <div className="seg seg-wide" role="group" aria-label="Priorita">
      {([1, 2, 3] as const).map((p) => <button key={p} type="button" className={`seg-btn${value === p ? " on" : ""}`} aria-pressed={value === p} onClick={() => onChange(p)}>{PRIORITY_NAMES[p]}</button>)}
    </div>
  );
}

export function WishlistScreen() {
  const { data: wishes = [], isLoading, error } = useWishes();
  const stats = useMemo(() => computeWishStats(wishes), [wishes]);
  const update = useUpdateWish();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState<"chci" | "koupeno" | "nechci">("chci");
  const [sheet, setSheet] = useState<{ kind: "add" } | { kind: "detail"; id: string } | null>(null);

  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    setSheet({ kind: "add" });
  }, [params, setParams]);

  // náhled (obrázek, web) pro přání s odkazem
  const fetching = useRef(new Set<string>());
  useEffect(() => {
    const todo = wishes.filter((w) => w.url && !w.preview_done && !fetching.current.has(w.id)).slice(0, 5);
    if (!todo.length) return;
    todo.forEach((w) => fetching.current.add(w.id));
    void (async () => {
      for (const w of todo) {
        const p = await fetchPreview(w.url!);
        update.mutate({ ...w, image_url: w.image_url ?? p.image_url, site: w.site ?? p.site, preview_done: true });
      }
    })();
  }, [wishes, update]);

  const visible = tab === "chci" ? sortWishes(wishes.filter((w) => w.status === "chci")) : wishes.filter((w) => w.status === tab).sort((a, b) => (b.closed_at ?? "").localeCompare(a.closed_at ?? ""));
  const detail = sheet?.kind === "detail" ? wishes.find((w) => w.id === sheet.id) : null;

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <div className="band">
        <Topbar title="Wishlist" />
        <div className="hero">
          <span className="icon-slot"><Icon name="wishlist" size={96} /></span>
          <span className="hero-num">{stats.open}</span>
          <span className="hero-cap">{plural(stats.open, ["přání", "přání", "přání"])} za {formatKc(stats.openTotal)}</span>
          <p className="hero-line">{stats.waiting ? `${stats.waiting} ještě čeká na 30 dní` : "Nic nečeká, můžeš vybírat."}</p>
        </div>
        <button className="btn-hero" onClick={() => setSheet({ kind: "add" })}><Icon name="i-plus" size={24} /> Přidat přání</button>
      </div>

      {error && <p className="error">Nepodařilo se načíst přání. Zkontroluj připojení.</p>}

      <div className="score">
        <div><b>{formatKc(stats.openTotal).replace(" Kč", "")}</b><span>Kč chci</span></div>
        <div><b>{formatKc(stats.boughtTotal).replace(" Kč", "")}</b><span>Kč koupeno</span></div>
        <div><b>{formatKc(stats.saved).replace(" Kč", "")}</b><span>Kč ušetřeno</span></div>
      </div>

      <Tabs label="Seznam" value={tab} onChange={setTab} items={[{ id: "chci", label: "Chci" }, { id: "koupeno", label: "Koupeno" }, { id: "nechci", label: "Už nechci" }]} />

      {isLoading ? <p className="empty">Načítám…</p> : visible.length === 0 ? (
        <p className="empty">{tab === "chci" ? "Prázdno. Až něco uvidíš, přidej to sem a nech to 30 dní uležet." : tab === "koupeno" ? "Zatím nic koupeného." : "Až něco přestaneš chtít, započítá se to do ušetřených."}</p>
      ) : (
        <ul className="link-list">
          {visible.map((w) => {
            const wait = daysToWait(w);
            return (
              <li key={w.id}>
                <button className="link-card wish-card" onClick={() => setSheet({ kind: "detail", id: w.id })}>
                  <Thumb wish={w} />
                  <span className="grow">
                    <b>{w.title}</b>
                    <span className="occasion-kind">
                      {[w.price !== null ? formatKc(w.price) : null, PRIORITY_NAMES[w.priority], w.site].filter(Boolean).join(" · ")}
                    </span>
                    {w.status === "chci" && wait > 0 && <span className="wait-tag">Počkej ještě {wait} {plural(wait, DNI)}</span>}
                    {w.status === "chci" && w.wait_until && wait === 0 && <span className="wait-tag ready">30 dní uběhlo – pořád to chceš?</span>}
                  </span>
                  {w.priority === 3 && <Icon name="heart" size={20} tone="wishlist" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {sheet?.kind === "add" && <AddSheet onClose={() => setSheet(null)} />}
      {detail && <DetailSheet wish={detail} onClose={() => setSheet(null)} />}
    </div>
  );
}

function AddSheet({ onClose }: { onClose: () => void }) {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [priority, setPriority] = useState<1 | 2 | 3>(2);
  const [wait, setWait] = useState(true);
  const [loading, setLoading] = useState(false);
  const add = useAddWish();
  const url = link.trim() ? extractUrl(link) : null;
  const priceNum = parsePrice(price);
  const valid = title.trim().length > 0 && (!price.trim() || priceNum !== null) && (!link.trim() || !!url);

  // po vložení odkazu zkusí doplnit název
  useEffect(() => {
    if (!url || title) return;
    let cancelled = false;
    setLoading(true);
    void fetchPreview(url).then((p) => {
      if (!cancelled && p.title) setTitle((t) => t || p.title!.slice(0, 300));
    }).finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [url]); // název se doplní jen při změně odkazu

  const save = () => {
    add.mutate(newWish({ title: title.trim(), url, site: url ? domainOf(url) : null, price: priceNum, priority }, wait));
    onClose();
  };

  return (
    <Sheet title="Nové přání" onClose={onClose}>
      <label htmlFor="wish-url" className="field-label">Odkaz (nepovinný)</label>
      <input id="wish-url" className="input" inputMode="url" autoComplete="off" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
      <label htmlFor="wish-title" className="field-label">Co to je {loading && <span className="small muted">(načítám název…)</span>}</label>
      <input id="wish-title" className="input" maxLength={300} placeholder="Třeba sluchátka" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="wish-price" className="field-label">Cena v Kč (nepovinná)</label>
      <input id="wish-price" className="input" inputMode="decimal" placeholder="2 490" value={price} onChange={(e) => setPrice(e.target.value)} />
      {price.trim() && priceNum === null && <p className="error">Cenu napiš jako číslo.</p>}
      <span className="field-label">Jak moc</span>
      <PriorityPicker value={priority} onChange={setPriority} />
      <label className="check">
        <input type="checkbox" checked={wait} onChange={(e) => setWait(e.target.checked)} />
        Pravidlo 30 dní (koupím, až když to budu chtít i za měsíc)
      </label>
      <button className="btn dark tap wide" disabled={!valid} onClick={save}>Přidat</button>
    </Sheet>
  );
}

function DetailSheet({ wish, onClose }: { wish: Wish; onClose: () => void }) {
  const [title, setTitle] = useState(wish.title);
  const [price, setPrice] = useState(wish.price !== null ? String(wish.price).replace(".", ",") : "");
  const [note, setNote] = useState(wish.note ?? "");
  const update = useUpdateWish();
  const remove = useDeleteWish();
  const wait = daysToWait(wish);
  const priceNum = parsePrice(price);
  const changed = title !== wish.title || priceNum !== wish.price || note !== (wish.note ?? "");

  const set = (patch: Partial<Wish>) => update.mutate({ ...wish, ...patch });

  return (
    <Sheet title={wish.title} onClose={onClose}>
      {wish.image_url && <img className="link-image" src={wish.image_url} alt="" referrerPolicy="no-referrer" />}
      {wish.url && <a className="btn-hero" href={wish.url} target="_blank" rel="noreferrer">Otevřít {wish.site ?? domainOf(wish.url)}</a>}
      {wish.status === "chci" ? (
        <>
          {wait > 0 && <p className="wait-tag big">Počkej ještě {wait} {plural(wait, DNI)}. Pak se zeptám, jestli to pořád chceš.</p>}
          <div className="row2">
            <button className="btn tap" onClick={() => { update.mutate(closeWish(wish, "koupeno")); onClose(); }}>Koupeno</button>
            <button className="btn tap" onClick={() => { update.mutate(closeWish(wish, "nechci")); onClose(); }}>Už nechci</button>
          </div>
          {wish.wait_until && <button className="link" onClick={() => set({ wait_until: null })}>Zrušit čekání</button>}
        </>
      ) : (
        <button className="btn tap wide" onClick={() => update.mutate(closeWish(wish, "chci"))}>Vrátit mezi přání</button>
      )}

      <span className="field-label">Jak moc</span>
      <PriorityPicker value={wish.priority} onChange={(p) => set({ priority: p })} />
      <label htmlFor="wish-edit-title" className="field-label">Název</label>
      <input id="wish-edit-title" className="input" maxLength={300} value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="wish-edit-price" className="field-label">Cena v Kč</label>
      <input id="wish-edit-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
      <label htmlFor="wish-edit-note" className="field-label">Poznámka</label>
      <textarea id="wish-edit-note" className="input" rows={2} maxLength={1000} placeholder="Velikost, barva, kde je to levnější…" value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn dark tap wide" disabled={!changed || !title.trim() || (!!price.trim() && priceNum === null)} onClick={() => {
        set({ title: title.trim(), price: priceNum, note: note.trim() || null });
        onClose();
      }}>Uložit změny</button>
      <button className="btn tap wide" onClick={() => {
        if (!window.confirm(`Smazat ${wish.title}?`)) return;
        remove.mutate(wish.id);
        onClose();
      }}>Smazat</button>
    </Sheet>
  );
}
