import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Place } from "./data";

interface Props {
  places: Place[];
  selectedId: string | null;
  pending: { lat: number; lng: number } | null;
  me: { lat: number; lng: number } | null;
  onSelect: (id: string) => void;
  /** Když je zapnutý výběr na mapě: ťuknutí vybere bod. */
  onPick?: (lat: number, lng: number) => void;
}

const icon = (cls: string) => L.divIcon({ className: "", html: `<span class="map-pin ${cls}"></span>`, iconSize: [24, 24], iconAnchor: [12, 24] });

/** Mapa (Leaflet + tmavé podklady CARTO z OpenStreetMap). */
export function MapView({ places, selectedId, pending, me, onSelect, onPick }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    if (!box.current) return;
    const m = L.map(box.current, { zoomControl: false, attributionControl: true }).setView([49.8, 15.5], 7);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(m);
    m.on("click", (e: L.LeafletMouseEvent) => pickRef.current?.(e.latlng.lat, e.latlng.lng));
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => { m.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    for (const p of places) {
      L.marker([p.lat, p.lng], { icon: icon(`${p.status}${p.id === selectedId ? " on" : ""}`), title: p.name, zIndexOffset: p.id === selectedId ? 1000 : 0 })
        .on("click", () => onSelect(p.id))
        .addTo(g);
    }
    if (pending) L.marker([pending.lat, pending.lng], { icon: icon("pending"), zIndexOffset: 2000 }).addTo(g);
    if (me) L.marker([me.lat, me.lng], { icon: L.divIcon({ className: "", html: '<span class="map-me"></span>', iconSize: [16, 16] }), interactive: false }).addTo(g);
    if (!fitted.current && places.length) {
      fitted.current = true;
      m.fitBounds(L.latLngBounds(places.map((p) => [p.lat, p.lng] as [number, number])).pad(0.2), { maxZoom: 13 });
    }
  }, [places, selectedId, pending, me, onSelect]);

  // vybrané místo nebo nový bod do středu
  useEffect(() => {
    const p = places.find((x) => x.id === selectedId);
    if (p) map.current?.flyTo([p.lat, p.lng], Math.max(map.current.getZoom(), 13), { duration: 0.6 });
  }, [selectedId, places]);
  useEffect(() => {
    if (pending) map.current?.flyTo([pending.lat, pending.lng], Math.max(map.current.getZoom(), 14), { duration: 0.6 });
  }, [pending]);
  useEffect(() => {
    if (me) map.current?.flyTo([me.lat, me.lng], 13, { duration: 0.6 });
  }, [me]);

  return <div ref={box} className={`map-box${onPick ? " picking" : ""}`} role="application" aria-label="Mapa míst" />;
}
