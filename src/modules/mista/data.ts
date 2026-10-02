import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStore } from "../../lib/db";

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address: string | null;
  list: string | null;
  status: "chci" | "byl";
  note: string | null;
  url: string | null;
  visited_at: string | null;
  created_at: string;
}

const store = createStore<Place>("places", "created_at");
const KEY = ["places"];
const byNewest = (a: Place, b: Place) => b.created_at.localeCompare(a.created_at);

export const usePlaces = () =>
  useQuery({ queryKey: KEY, queryFn: async () => (await store.list("1970-01-01T00:00:00.000Z")).sort(byNewest) });

function usePlaceMutation<V>(fn: (vars: V) => Promise<void>, apply: (list: Place[], vars: V) => Place[]) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: async (vars: V) => {
      await queryClient.cancelQueries({ queryKey: KEY });
      const previous = queryClient.getQueryData<Place[]>(KEY);
      queryClient.setQueryData<Place[]>(KEY, (list = []) => apply(list, vars).sort(byNewest));
      return { previous };
    },
    onError: (_e, _v, context) => queryClient.setQueryData(KEY, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

export const useAddPlace = () => usePlaceMutation<Place>((p) => store.insert(p), (list, p) => [...list, p]);
export const useUpdatePlace = () =>
  usePlaceMutation<Place>(({ id, created_at: _c, ...patch }) => store.update(id, patch), (list, p) => list.map((x) => (x.id === p.id ? p : x)));
export const useDeletePlace = () => usePlaceMutation<string>((id) => store.remove(id), (list, id) => list.filter((p) => p.id !== id));

export function newPlace(fields: Partial<Place> & Pick<Place, "name" | "lat" | "lng">): Place {
  return { id: crypto.randomUUID(), address: null, list: null, status: "chci", note: null, url: null, visited_at: null, created_at: new Date().toISOString(), ...fields };
}

/** Vzdálenost v km (haversine). */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b.lat - a.lat);
  const dLng = r(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

export const formatKm = (km: number) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)} km`);

/** Odkazy na navigaci. */
export const navLinks = (p: Pick<Place, "lat" | "lng" | "name">) => ({
  apple: `https://maps.apple.com/?daddr=${p.lat},${p.lng}&q=${encodeURIComponent(p.name)}`,
  mapy: `https://mapy.com/fnc/v1/route?end=${p.lng},${p.lat}`,
  google: `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`,
});

// ---------- hledání míst (Photon / OpenStreetMap, bez klíče) ----------

export interface FoundPlace { name: string; lat: number; lng: number; address: string | null }

interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: { name?: string; street?: string; housenumber?: string; city?: string; town?: string; village?: string; county?: string; country?: string; osm_value?: string };
}

export function fromPhoton(features: PhotonFeature[]): FoundPlace[] {
  return features.filter((f) => f.geometry?.coordinates && (f.properties?.name || f.properties?.street)).map((f) => {
    const p = f.properties!;
    const [lng, lat] = f.geometry!.coordinates!;
    const street = p.street ? `${p.street}${p.housenumber ? ` ${p.housenumber}` : ""}` : null;
    const place = p.city ?? p.town ?? p.village ?? p.county ?? null;
    const name = p.name ?? street!;
    return { name, lat, lng, address: [p.name ? street : null, place, p.country].filter(Boolean).join(", ") || null };
  });
}

export async function searchPlaces(query: string, near?: { lat: number; lng: number } | null): Promise<FoundPlace[]> {
  const q = encodeURIComponent(query.trim());
  if (!q) return [];
  const bias = near ? `&lat=${near.lat}&lon=${near.lng}` : "&lat=49.8&lon=15.5"; // jinak upřednostní Česko
  const r = await fetch(`https://photon.komoot.io/api/?q=${q}&limit=8${bias}`);
  if (!r.ok) throw new Error("Hledání selhalo");
  return fromPhoton((await r.json()).features ?? []);
}

/** Název místa podle souřadnic (když se přidává ťuknutím do mapy). */
export async function reverseName(lat: number, lng: number): Promise<FoundPlace | null> {
  try {
    const r = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&limit=1`);
    const found = fromPhoton((await r.json()).features ?? []);
    return found[0] ?? null;
  } catch {
    return null;
  }
}
