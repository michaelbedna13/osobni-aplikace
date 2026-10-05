// Vlastní zjednodušený styl mapy: vektorové podklady OpenFreeMap (OpenStreetMap, schéma OpenMapTiles),
// bez klíče a registrace. Kreslí se jen voda, zeleň, silnice, hranice států a názvy obcí.
import type { ExpressionSpecification, StyleSpecification } from "maplibre-gl";

export const MAP_COLORS = {
  land: "#0B2016",
  green: "#10291C",
  water: "#0B2A30",
  building: "#123022",
  minor: "#1A3527",
  road: "#24432F",
  main: "#2F5239",
  motorway: "#3D6448",
  border: "#4B6B5A",
  label: "#C9D8D2",
  labelDim: "#9FB8B8",
  halo: "#020F08",
};

const C = MAP_COLORS;
const NAME: ExpressionSpecification = ["coalesce", ["get", "name:cs"], ["get", "name"]];
const roadWidth = (base: number): ExpressionSpecification => ["interpolate", ["exponential", 1.6], ["zoom"], 6, base * 0.3, 10, base, 14, base * 3, 18, base * 10];

export const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: { type: "vector", url: "https://tiles.openfreemap.org/planet" },
  },
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  layers: [
    { id: "land", type: "background", paint: { "background-color": C.land } },
    {
      id: "green", type: "fill", source: "osm", "source-layer": "landcover",
      filter: ["in", ["get", "class"], ["literal", ["wood", "grass"]]],
      paint: { "fill-color": C.green },
    },
    { id: "park", type: "fill", source: "osm", "source-layer": "park", paint: { "fill-color": C.green } },
    { id: "water", type: "fill", source: "osm", "source-layer": "water", paint: { "fill-color": C.water } },
    {
      id: "river", type: "line", source: "osm", "source-layer": "waterway", minzoom: 8,
      filter: ["==", ["get", "class"], "river"],
      paint: { "line-color": C.water, "line-width": ["interpolate", ["linear"], ["zoom"], 8, 1, 14, 4] },
    },
    { id: "building", type: "fill", source: "osm", "source-layer": "building", minzoom: 14, paint: { "fill-color": C.building } },
    {
      id: "border", type: "line", source: "osm", "source-layer": "boundary",
      filter: ["all", ["==", ["get", "admin_level"], 2], ["!=", ["get", "maritime"], 1]],
      paint: { "line-color": C.border, "line-width": 1.2, "line-dasharray": [3, 2] },
    },
    {
      id: "road-minor", type: "line", source: "osm", "source-layer": "transportation", minzoom: 12,
      filter: ["in", ["get", "class"], ["literal", ["minor", "service"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": C.minor, "line-width": roadWidth(0.8) },
    },
    {
      id: "road", type: "line", source: "osm", "source-layer": "transportation", minzoom: 9,
      filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": C.road, "line-width": roadWidth(1) },
    },
    {
      id: "road-main", type: "line", source: "osm", "source-layer": "transportation", minzoom: 6,
      filter: ["in", ["get", "class"], ["literal", ["primary", "trunk"]]],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": C.main, "line-width": roadWidth(1.3) },
    },
    {
      id: "motorway", type: "line", source: "osm", "source-layer": "transportation", minzoom: 5,
      filter: ["==", ["get", "class"], "motorway"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": C.motorway, "line-width": roadWidth(1.6) },
    },
    {
      id: "village", type: "symbol", source: "osm", "source-layer": "place", minzoom: 11,
      filter: ["in", ["get", "class"], ["literal", ["village", "suburb"]]],
      layout: { "text-field": NAME, "text-font": ["Noto Sans Regular"], "text-size": 12 },
      paint: { "text-color": C.labelDim, "text-halo-color": C.halo, "text-halo-width": 1.5 },
    },
    {
      id: "town", type: "symbol", source: "osm", "source-layer": "place", minzoom: 8,
      filter: ["==", ["get", "class"], "town"],
      layout: { "text-field": NAME, "text-font": ["Noto Sans Regular"], "text-size": ["interpolate", ["linear"], ["zoom"], 8, 11, 13, 15] },
      paint: { "text-color": C.labelDim, "text-halo-color": C.halo, "text-halo-width": 1.5 },
    },
    {
      id: "city", type: "symbol", source: "osm", "source-layer": "place", minzoom: 4,
      filter: ["==", ["get", "class"], "city"],
      layout: { "text-field": NAME, "text-font": ["Noto Sans Bold"], "text-size": ["interpolate", ["linear"], ["zoom"], 4, 11, 12, 18] },
      paint: { "text-color": C.label, "text-halo-color": C.halo, "text-halo-width": 1.5 },
    },
  ],
};
