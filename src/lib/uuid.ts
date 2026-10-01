/** Stálé UUID odvozené z textu (stejný vstup = stejné id). Díky tomu jde import spustit opakovaně bez duplicit. */
export async function stableId(input: string) {
  const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input)));
  const bytes = hash.slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // verze 5 (odvozené)
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // varianta RFC 4122
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
