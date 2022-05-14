import { describe, expect, it } from "vitest";
import { nearestExtrapolator } from "./nearest";

describe("extrapolation", () => {
  describe("nearest", () => {
    const samples = [3.2, 5, 6, 7.2, -3];

    it("should throw in domain", () => {
      expect(() => nearestExtrapolator(0, samples)).not.toThrow();
      expect(() => nearestExtrapolator(1, samples)).toThrow();
      expect(() => nearestExtrapolator(2.4, samples)).toThrow();
      expect(() => nearestExtrapolator(4, samples)).not.toThrow();
      expect(() => nearestExtrapolator(4.1, samples)).not.toThrow();
      expect(() => nearestExtrapolator(-0.001, samples)).not.toThrow();
    });
    it("should extrapolate outside domain", () => {
      expect(nearestExtrapolator(-0.5, samples)).toBe(3.2);
      expect(nearestExtrapolator(-4.5, samples)).toBe(3.2);
      expect(nearestExtrapolator(6, samples)).toBe(-3);
    });
  });
});
