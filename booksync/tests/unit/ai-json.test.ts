import { describe, expect, it } from "vitest";
import { extractJson, utcDay } from "@/domain/ai/json";

describe("lecture des réponses JSON", () => {
  it("JSON pur, bloc de code, texte autour", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":[1,2]}\n```')).toEqual({ a: [1, 2] });
    expect(extractJson('Voici : {"a":"x } y","b":{"c":2}} merci')).toEqual({ a: "x } y", b: { c: 2 } });
    expect(extractJson("pas de json")).toBeNull();
    expect(extractJson('{"a":')).toBeNull();
  });
  it("jour UTC", () => {
    expect(utcDay(new Date("2026-11-25T23:30:00-02:00"))).toBe("2026-11-26");
  });
});
