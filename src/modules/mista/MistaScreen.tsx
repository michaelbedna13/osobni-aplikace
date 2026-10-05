import { Suspense, lazy, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Sheet } from "../../components/Sheet";
import { Sprite } from "../../components/Sprite";
import { Topbar } from "../../components/Topbar";
import { MODULE_BY_KEY } from "../../lib/modules";
import {
  distanceKm, formatKm, navLinks, newPlace, reverseName, searchPlaces, useAddPlace, useDeletePlace, usePlaces, useUpdatePlace,
  type FoundPlace, type Place,
} from "./data";

// knihovna mapy je velká, načte se až s obrazovkou Míst
const MapView = lazy(() => import("./MapView"));

const MODULE = MODULE_BY_KEY.mista;
type Filter = { kind: "all" } | { kind: "chci" } | { kind: "byl" } | { kind: "list"; name: string };
type Spot = { lat: number; lng: number };

const pad = (n: number) => String(n).padStart(2, "0");
const todayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function MistaScreen() {
  const { data: places = [], isLoading, error } = usePlaces();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>({ kind: "all" });
  const [selected, setSelected] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ kind: "add"; found?: FoundPlace } | { kind: "detail"; id: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const [pending, setPending] = useState<Spot | null>(null);
  const [me, setMe] = useState<Spot | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  useEffect(() => {
    if (!params.has("nova")) return;
    setParams({}, { replace: true });
    setSheet({ kind: "add" });
  }, [params, setParams]);

  const lists = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of places) if (p.list) counts.set(p.list, (counts.get(p.list) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [places]);
  const visible = places
    .filter((p) => filter.kind === "all" || (filter.kind === "list" ? p.list === filter.name : p.status === filter.kind))
    .sort((a, b) => (me ? distanceKm(me, a) - distanceKm(me, b) : 0));
  const wanted = places.filter((p) => p.status === "chci").length;

  const locate = () => {
    setGeoErr(null);
    if (!navigator.geolocation) { setGeoErr("Poloha není k dispozici."); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setGeoErr("Polohu se nepodařilo zjistit. Povol ji appce v Nastavení → Soukromí → Polohové služby."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const onSelect = useCallback((id: string) => { setSelected(id); setSheet({ kind: "detail", id }); }, []);
  const onPick = async (lat: number, lng: number) => {
    setPicking(false);
    setPending({ lat, lng });
    const found = await reverseName(lat, lng);
    setSheet({ kind: "add", found: { name: found?.name ?? "", address: found?.address ?? null, lat, lng } });
  };
  const detail = sheet?.kind === "detail" ? places.find((p) => p.id === sheet.id) : null;

  return (
    <div className="screen module" style={{ "--accent": MODULE.color, "--deep": MODULE.deep } as CSSProperties}>
      <Topbar title="Místa" right={<button className="link" onClick={locate}>Kde jsem</button>} />

      <div className="map-wrap">
        <Suspense fallback={<div className="map-box" aria-hidden="true" />}>
          <MapView places={visible} selectedId={selected} pending={pending} me={me} onSelect={onSelect} onPick={picking ? onPick : undefined} />
        </Suspense>
        {picking && (
          <div className="map-banner">
            <span>Ťukni do mapy, kde to je</span>
            <button className="link" onClick={() => setPicking(false)}>Zrušit</button>
          </div>
        )}
      </div>
      {geoErr && <p className="error">{geoErr}</p>}
      {error && <p className="error">Nepodařilo se načíst místa. Zkontroluj připojení.</p>}

      <button className="btn-hero" onClick={() => { setPending(null); setSheet({ kind: "add" }); }}><Sprite name="i-plus" size={24} /> Přidat místo</button>

      <div className="score">
        <div><b>{wanted}</b><span>chci navštívit</span></div>
        <div><b>{places.length - wanted}</b><span>navštíveno</span></div>
        <div><b>{lists.length}</b><span>seznamů</span></div>
      </div>

      <div className="chips kind-chips" role="group" aria-label="Filtr">
        {([["all", "Vše"], ["chci", "Chci"], ["byl", "Byl jsem"]] as const).map(([k, label]) => (
          <button key={k} className={`chip${filter.kind === k ? " on" : ""}`} aria-pressed={filter.kind === k} onClick={() => setFilter({ kind: k })}>{label}</button>
        ))}
        {lists.map((l) => {
          const on = filter.kind === "list" && filter.name === l.name;
          return <button key={l.name} className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => setFilter({ kind: "list", name: l.name })}>{l.name} <span className="chip-count">{l.count}</span></button>;
        })}
      </div>

      {isLoading ? <p className="empty">Načítám…</p> : visible.length === 0 ? (
        <p className="empty">{places.length ? "Tady nic není." : "Zatím žádná místa. Přidej první – hledáním, nebo ťuknutím do mapy."}</p>
      ) : (
        <ul className="list">
          {visible.map((p) => (
            <li key={p.id}>
              <button className={`list-btn place-row${p.id === selected ? " on" : ""}`} onClick={() => onSelect(p.id)}>
                <span className={`map-dot small ${p.status}`} aria-hidden="true" />
                <span className="grow">
                  <b>{p.name}</b>
                  <span className="occasion-kind">{[p.list, p.address].filter(Boolean).join(" · ") || (p.status === "byl" ? "navštíveno" : "chci navštívit")}</span>
                </span>
                {me && <span className="small muted">{formatKm(distanceKm(me, p))}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {sheet?.kind === "add" && (
        <AddSheet
          found={sheet.found ?? null}
          me={me}
          lists={lists.map((l) => l.name)}
          onPickOnMap={() => { setSheet(null); setPicking(true); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onUseMe={me ? () => setSheet({ kind: "add", found: { name: "", address: null, lat: me.lat, lng: me.lng } }) : locate}
          onClose={() => { setSheet(null); setPending(null); }}
          onSaved={(id) => { setPending(null); setSelected(id); setSheet(null); }}
        />
      )}
      {detail && <DetailSheet place={detail} me={me} lists={lists.map((l) => l.name)} onClose={() => setSheet(null)} />}
    </div>
  );
}

function ListField({ value, onChange, lists }: { value: string; onChange: (v: string) => void; lists: string[] }) {
  return (
    <>
      <label htmlFor="place-list" className="field-label">Seznam (nepovinný)</label>
      <input id="place-list" className="input" maxLength={60} placeholder="Třeba Výlety, Restaurace…" value={value} onChange={(e) => onChange(e.target.value)} />
      {lists.length > 0 && (
        <div className="chips">
          {lists.map((l) => <button key={l} type="button" className={`chip${value === l ? " on" : ""}`} onClick={() => onChange(value === l ? "" : l)}>{l}</button>)}
        </div>
      )}
    </>
  );
}

function AddSheet({ found, me, lists, onPickOnMap, onUseMe, onClose, onSaved }: {
  found: FoundPlace | null;
  me: Spot | null;
  lists: string[];
  onPickOnMap: () => void;
  onUseMe: () => void;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoundPlace[] | null>(null);
  const [chosen, setChosen] = useState<FoundPlace | null>(found);
  const [name, setName] = useState(found?.name ?? "");
  const [list, setList] = useState("");
  const [status, setStatus] = useState<"chci" | "byl">("chci");
  const [note, setNote] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const add = useAddPlace();

  useEffect(() => { setChosen(found); setName(found?.name ?? ""); }, [found]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3 || chosen) { setResults(null); return; }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      try {
        const r = await searchPlaces(q, me);
        if (!cancelled) { setResults(r); setErr(null); }
      } catch {
        if (!cancelled) setErr("Hledání teď nefunguje. Zkus vybrat místo na mapě.");
      }
    }, 450);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [query, me, chosen]);

  const save = () => {
    if (!chosen) return;
    const p = newPlace({ name: name.trim(), lat: chosen.lat, lng: chosen.lng, address: chosen.address, list: list.trim() || null, status, note: note.trim() || null, visited_at: status === "byl" ? todayKey() : null });
    add.mutate(p);
    onSaved(p.id);
  };

  return (
    <Sheet title="Nové místo" onClose={onClose}>
      {!chosen ? (
        <>
          <input className="input search" type="search" aria-label="Hledat místo" placeholder="Hledat: Lokál Dlouhá, Sněžka, Brno…" value={query} onChange={(e) => setQuery(e.target.value)} />
          {err && <p className="small muted">{err}</p>}
          {results && results.length > 0 && (
            <ul className="list result-list">
              {results.map((r, i) => (
                <li key={`${r.lat}-${r.lng}-${i}`}>
                  <button className="list-btn" onClick={() => { setChosen(r); setName(r.name); }}>
                    <span className="grow"><b>{r.name}</b><span className="occasion-kind">{r.address}{me ? ` · ${formatKm(distanceKm(me, r))}` : ""}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {results && results.length === 0 && <p className="small muted">Nic se nenašlo.</p>}
          <div className="row2">
            <button className="btn tap" onClick={onPickOnMap}>Vybrat na mapě</button>
            <button className="btn tap" onClick={onUseMe}>Kde právě jsem</button>
          </div>
        </>
      ) : (
        <>
          <p className="small muted">{chosen.address ?? `${chosen.lat.toFixed(5)}, ${chosen.lng.toFixed(5)}`} · <button className="link inline" onClick={() => { setChosen(null); setQuery(""); }}>jiné místo</button></p>
          <label htmlFor="place-name" className="field-label">Název</label>
          <input id="place-name" className="input" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
          <ListField value={list} onChange={setList} lists={lists} />
          <div className="seg seg-wide" role="group" aria-label="Stav" style={{ marginTop: 14 }}>
            <button className={`seg-btn${status === "chci" ? " on" : ""}`} aria-pressed={status === "chci"} onClick={() => setStatus("chci")}>Chci navštívit</button>
            <button className={`seg-btn${status === "byl" ? " on" : ""}`} aria-pressed={status === "byl"} onClick={() => setStatus("byl")}>Byl jsem</button>
          </div>
          <label htmlFor="place-note" className="field-label">Poznámka</label>
          <input id="place-note" className="input" maxLength={1000} placeholder="Co tam ochutnat, s kým jet…" value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="btn dark tap wide" disabled={!name.trim()} onClick={save}>Uložit místo</button>
        </>
      )}
    </Sheet>
  );
}

function DetailSheet({ place, me, lists, onClose }: { place: Place; me: Spot | null; lists: string[]; onClose: () => void }) {
  const [name, setName] = useState(place.name);
  const [list, setList] = useState(place.list ?? "");
  const [note, setNote] = useState(place.note ?? "");
  const update = useUpdatePlace();
  const remove = useDeletePlace();
  const nav = navLinks(place);
  const changed = name !== place.name || list !== (place.list ?? "") || note !== (place.note ?? "");

  return (
    <Sheet title={place.name} onClose={onClose}>
      <p className="small muted">{[place.address, me ? `${formatKm(distanceKm(me, place))} odsud` : null].filter(Boolean).join(" · ")}</p>
      <span className="field-label">Navigovat</span>
      <div className="nav-grid">
        <a className="btn tap" href={nav.apple} target="_blank" rel="noreferrer">Apple Mapy</a>
        <a className="btn tap" href={nav.mapy} target="_blank" rel="noreferrer">Mapy.com</a>
        <a className="btn tap" href={nav.google} target="_blank" rel="noreferrer">Google</a>
      </div>
      <button className="btn tap wide" onClick={() => update.mutate({ ...place, status: place.status === "byl" ? "chci" : "byl", visited_at: place.status === "byl" ? null : todayKey() })}>
        {place.status === "byl" ? "Vrátit mezi „chci navštívit“" : "Byl jsem tam"}
      </button>
      <label htmlFor="place-edit-name" className="field-label">Název</label>
      <input id="place-edit-name" className="input" maxLength={200} value={name} onChange={(e) => setName(e.target.value)} />
      <ListField value={list} onChange={setList} lists={lists} />
      <label htmlFor="place-edit-note" className="field-label">Poznámka</label>
      <textarea id="place-edit-note" className="input" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
      <button className="btn dark tap wide" disabled={!changed || !name.trim()} onClick={() => { update.mutate({ ...place, name: name.trim(), list: list.trim() || null, note: note.trim() || null }); onClose(); }}>Uložit změny</button>
      <button className="btn tap wide" onClick={() => {
        if (!window.confirm(`Smazat ${place.name}?`)) return;
        remove.mutate(place.id);
        onClose();
      }}>Smazat</button>
    </Sheet>
  );
}

