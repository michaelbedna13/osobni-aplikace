import { describe, expect, it } from "vitest";
import { canSee } from "./access";
import { MODULE_BY_KEY } from "./modules";

describe("soukromé moduly", () => {
  it("untrois vidí jen účet s příznakem", () => {
    expect(canSee(MODULE_BY_KEY.untrois, { untrois: true }, false)).toBe(true);
    expect(canSee(MODULE_BY_KEY.untrois, {}, false)).toBe(false);
    expect(canSee(MODULE_BY_KEY.untrois, { untrois: "ano" }, false)).toBe(false);
    expect(canSee(MODULE_BY_KEY.untrois, null, false)).toBe(false);
  });

  it("běžné moduly vidí každý, v ukázkovém režimu vše", () => {
    expect(canSee(MODULE_BY_KEY.piva, null, false)).toBe(true);
    expect(canSee(MODULE_BY_KEY.untrois, null, true)).toBe(true);
  });
});
