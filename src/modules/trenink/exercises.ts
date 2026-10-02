// Vestavěné cviky pro trénink doma: s jednoručkami a s vlastní vahou.
// Id jsou pevná (b-…), aby na ně šlo odkazovat ze šablon i z historie. Vlastní cviky mají UUID.

export type ExerciseKind = "weight_reps" | "reps" | "time";
export type ExerciseCategory = "cinky" | "vaha" | "jine";

export interface Exercise {
  id: string;
  name: string;
  kind: ExerciseKind;
  category: ExerciseCategory;
  /** Výchozí pauza po sérii v sekundách. */
  rest_s: number;
  /** Vestavěný cvik (nejde upravit ani smazat). */
  builtin?: boolean;
}

export const CATEGORY_NAMES: Record<ExerciseCategory, string> = { cinky: "S činkami", vaha: "Vlastní váha", jine: "Ostatní" };
export const KIND_NAMES: Record<ExerciseKind, string> = { weight_reps: "Váha × opakování", reps: "Jen opakování", time: "Výdrž (čas)" };

const b = (id: string, name: string, kind: ExerciseKind, category: ExerciseCategory, rest_s = 90): Exercise =>
  ({ id: `b-${id}`, name, kind, category, rest_s, builtin: true });

export const BUILTIN_EXERCISES: Exercise[] = [
  b("db-bench", "Tlaky s jednoručkami na lavici", "weight_reps", "cinky", 120),
  b("db-floor-press", "Tlaky s jednoručkami na zemi", "weight_reps", "cinky", 120),
  b("db-fly", "Rozpažování s jednoručkami", "weight_reps", "cinky"),
  b("db-shoulder-press", "Tlaky nad hlavu", "weight_reps", "cinky", 120),
  b("db-lateral", "Upažování", "weight_reps", "cinky", 60),
  b("db-row", "Přítahy jednoručky v předklonu", "weight_reps", "cinky"),
  b("db-pullover", "Pullover", "weight_reps", "cinky"),
  b("db-shrug", "Krčení ramen", "weight_reps", "cinky", 60),
  b("db-curl", "Bicepsový zdvih", "weight_reps", "cinky", 60),
  b("db-hammer", "Kladivové zdvihy", "weight_reps", "cinky", 60),
  b("db-french", "Francouzský tlak", "weight_reps", "cinky", 60),
  b("db-kickback", "Zapažování s jednoručkou", "weight_reps", "cinky", 60),
  b("db-goblet", "Goblet dřep", "weight_reps", "cinky", 120),
  b("db-rdl", "Rumunský mrtvý tah", "weight_reps", "cinky", 120),
  b("db-lunge", "Výpady s jednoručkami", "weight_reps", "cinky"),
  b("db-bulgarian", "Bulharský dřep", "weight_reps", "cinky"),
  b("db-calf", "Výpony na lýtka", "weight_reps", "cinky", 60),
  b("pushup", "Kliky", "reps", "vaha", 60),
  b("pullup", "Shyby", "reps", "vaha", 120),
  b("chinup", "Shyby podhmatem", "reps", "vaha", 120),
  b("dip", "Dipy", "reps", "vaha"),
  b("squat", "Dřepy", "reps", "vaha", 60),
  b("lunge", "Výpady", "reps", "vaha", 60),
  b("glute-bridge", "Most (zvedání pánve)", "reps", "vaha", 60),
  b("crunch", "Zkracovačky", "reps", "vaha", 45),
  b("leg-raise", "Zvedání nohou", "reps", "vaha", 60),
  b("burpee", "Angličáky", "reps", "vaha", 60),
  b("plank", "Prkno", "time", "vaha", 60),
  b("side-plank", "Boční prkno", "time", "vaha", 45),
  b("mountain", "Horolezec", "time", "vaha", 45),
  b("wall-sit", "Sed u zdi", "time", "vaha", 60),
];
