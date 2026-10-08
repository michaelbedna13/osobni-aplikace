import { describe, expect, it } from "vitest";
import { groupByCategory, guessCategory, listText, newItem, parseItem, suggestions, type ShoppingItem } from "./data";

const item = (name: string, patch: Partial<ShoppingItem> = {}): ShoppingItem => ({ ...newItem(name), ...patch });

describe("parseItem", () => {
  it("čte množství na začátku i na konci", () => {
    expect(parseItem("2 mléka")).toEqual({ name: "mléka", qty: "2" });
    expect(parseItem("500 g sýra")).toEqual({ name: "sýra", qty: "500 g" });
    expect(parseItem("mléko 2x")).toEqual({ name: "mléko", qty: "2" });
    expect(parseItem("rohlíky x6")).toEqual({ name: "rohlíky", qty: "6" });
    expect(parseItem("vejce 10 ks")).toEqual({ name: "vejce", qty: "10 ks" });
    expect(parseItem("  toaletní   papír ")).toEqual({ name: "toaletní papír", qty: null });
  });
  it("číslo uvnitř názvu nechá být", () => {
    expect(parseItem("mléko 1,5 %").qty).toBeNull();
  });
});

describe("guessCategory", () => {
  it("pozná běžné věci", () => {
    expect(guessCategory("Banány")).toBe("Ovoce a zelenina");
    expect(guessCategory("Rohlíky")).toBe("Pečivo");
    expect(guessCategory("Polotučné mléko")).toBe("Mléčné a vejce");
    expect(guessCategory("Kuřecí prsa")).toBe("Maso a ryby");
    expect(guessCategory("Špagety")).toBe("Trvanlivé");
    expect(guessCategory("Mražená zelenina")).toBe("Mražené");
    expect(guessCategory("Hořká čokoláda")).toBe("Sladké a slané");
    expect(guessCategory("Pivo")).toBe("Nápoje");
    expect(guessCategory("Toaletní papír")).toBe("Drogerie");
    expect(guessCategory("Dárek pro mámu")).toBe("Ostatní");
  });
  it("krátká slova jen celá", () => {
    expect(guessCategory("Jarní cibulka")).toBe("Ovoce a zelenina");
    expect(guessCategory("Jar")).toBe("Drogerie");
    expect(guessCategory("Med")).toBe("Trvanlivé");
  });
});

describe("seznam", () => {
  it("newItem vezme množství, velké písmeno a oddělení", () => {
    const i = newItem("2 banány");
    expect(i).toMatchObject({ name: "Banány", qty: "2", category: "Ovoce a zelenina", done: false, archived: false });
  });
  it("řadí podle obchodu", () => {
    const groups = groupByCategory([item("pivo"), item("rohlíky"), item("banány")]);
    expect(groups.map((g) => g.category)).toEqual(["Ovoce a zelenina", "Pečivo", "Nápoje"]);
  });
  it("text ke sdílení jen s tím, co se má koupit", () => {
    const text = listText([item("2 rohlíky"), item("mléko", { done: true }), item("pivo", { archived: true })]);
    expect(text).toBe("Pečivo:\n- Rohlíky (2)");
  });
});

describe("suggestions", () => {
  const history = [
    item("mléko", { archived: true, done: true }), item("Mléko", { archived: true, done: true }), item("mléko", { archived: true, done: true }),
    item("chleba", { archived: true, done: true }), item("chleba", { archived: true, done: true }),
    item("banány", { archived: true, done: true }),
  ];
  it("nejčastější první a bez toho, co už je na seznamu", () => {
    expect(suggestions(history).map((s) => s.name.toLowerCase())).toEqual(["mléko", "chleba", "banány"]);
    expect(suggestions([...history, item("chleba")]).map((s) => s.name.toLowerCase())).toEqual(["mléko", "banány"]);
  });
  it("filtruje podle psaného textu bez diakritiky", () => {
    expect(suggestions(history, "mle").map((s) => s.name.toLowerCase())).toEqual(["mléko"]);
  });
});
