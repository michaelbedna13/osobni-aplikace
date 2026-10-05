import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef } from "react";
import type { Place } from "./data";
import { MAP_STYLE } from "./mapStyle";

interface Props {
  places: Place[];
  selectedId: string | null;
  pending: { lat: number; lng: number } | null;
  me: { lat: number; lng: number } | null;
  onSelect: (id: string) => void;
  /** Ťuknutí do prázdné mapy zruší výběr. */
  onDeselect?: () => void;
  /** Když je zapnutý výběr na mapě: ťuknutí vybere bod. */
  onPick?: (lat: number, lng: number) => void;
}

function dot(cls: string, label?: string) {
  const el = document.createElement("span");
  el.className = `map-dot ${cls}`;
  if (label) {
    const tag = document.createElement("span");
    tag.className = "map-dot-label";
    const name = document.createElement("b");
    name.textContent = label;
    const hint = document.createElement("small");
    hint.textContent = "ťukni pro detail";
    tag.append(name, hint);
    el.appendChild(tag);
  }
  return el;
}

/** Mapa (MapLibre + vlastní zjednodušený styl nad podklady OpenFreeMap / OpenStreetMap). */
export default function MapView({ places, selectedId, pending, me, onSelect, onDeselect, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const fitted = useRef(false);
  const ready = useRef(false);
  const onReady = useRef<(() => void) | null>(null);
  const pickRef = useRef(onPick);
  const selectRef = useRef(onSelect);
  const deselectRef = useRef(onDeselect);
  pickRef.current = onPick;
  selectRef.current = onSelect;
  deselectRef.current = onDeselect;

  useEffect(() => {
    if (!box.current) return;
    // nová mapa (i při opětovném připojení komponenty) se znovu napasuje na místa
    fitted.current = false;
    ready.current = false;
    const m = new maplibregl.Map({
      container: box.current,
      style: MAP_STYLE,
      center: [15.5, 49.8],
      zoom: 6,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      fadeDuration: 0,
    });
    m.touchZoomRotate.disableRotation();
    m.keyboard.disableRotation();
    m.on("click", (e) => {
      if (pickRef.current) pickRef.current(e.lngLat.lat, e.lngLat.lng);
      else deselectRef.current?.();
    });
    // zdroj dat jen jako malé „i“ v rohu, rozbalí se ťuknutím
    m.once("load", () => {
      box.current?.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show");
      ready.current = true;
      onReady.current?.();
      onReady.current = null;
    });
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    markers.current.forEach((mk) => mk.remove());
    markers.current = [];
    const add = (el: HTMLElement, lng: number, lat: number) => markers.current.push(new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat([lng, lat]).addTo(m));

    // vybrané místo navrch (přidává se poslední)
    const ordered = [...places].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId));
    for (const p of ordered) {
      const on = p.id === selectedId;
      const el = dot(`${p.status}${on ? " on" : ""}`, on ? p.name : undefined);
      el.setAttribute("role", "button");
      el.setAttribute("aria-label", p.name);
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        selectRef.current(p.id);
      });
      add(el, p.lng, p.lat);
    }
    if (pending) add(dot("pending"), pending.lng, pending.lat);
    if (me) add(dot("me"), me.lng, me.lat);

    if (!fitted.current && places.length) {
      fitted.current = true;
      const bounds = new maplibregl.LngLatBounds();
      places.forEach((p) => bounds.extend([p.lng, p.lat]));
      const fit = () => m.fitBounds(bounds, { padding: 48, maxZoom: 13, duration: 0 });
      // hned (kamera se nastaví i před načtením podkladů) a pro jistotu ještě po načtení
      fit();
      if (!ready.current) onReady.current = fit;
    }
  }, [places, selectedId, pending, me]);

  // vybrané místo, nový bod nebo moje poloha do středu
  const flyTo = (lat: number, lng: number, zoom: number) => {
    const m = map.current;
    if (m) m.flyTo({ center: [lng, lat], zoom: Math.max(m.getZoom(), zoom), duration: 600 });
  };
  useEffect(() => {
    const p = places.find((x) => x.id === selectedId);
    if (p) flyTo(p.lat, p.lng, 13);
  }, [selectedId, places]);
  useEffect(() => {
    if (pending) flyTo(pending.lat, pending.lng, 14);
  }, [pending]);
  useEffect(() => {
    if (me) flyTo(me.lat, me.lng, 13);
  }, [me]);

  return <div ref={box} className={`map-box${onPick ? " picking" : ""}`} role="application" aria-label="Mapa míst" />;
}
