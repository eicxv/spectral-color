import { beforeEach, describe, expect, it, test } from "vitest";
import { createExtrapolator, ExtrapolatorType } from "./boundary-extrapolation";

describe("Extrapolation", () => {
  describe("createExtrapolator", () => {
    let extrapolator: ExtrapolatorType;
    const samples = new Array(10).fill(0);
    beforeEach(() => {
      const extrapolate = (_: readonly number[], x: number): number => x * x;
      extrapolator = createExtrapolator(samples, extrapolate);
    });

    it("should cache values", () => {
      const visited = [] as number[];
      const extrapolate = (_: readonly number[], x: number): number => {
        if (x in visited) {
          throw new Error("Should cache values");
        }
        visited.push(x);
        return x * x;
      };
      extrapolator = createExtrapolator(samples, extrapolate);
      const x = -1;
      expect(x in extrapolator).toBe(false);
      expect(() => extrapolator[x]).not.toThrow();
      expect(() => extrapolator[x]).not.toThrow();
      expect(x in extrapolator).toBe(true);
    });
    test("clear should clear cache", () => {
      const x = 6;
      expect(x in extrapolator).toBe(false);
      extrapolator[x];
      expect(x in extrapolator).toBe(true);
      extrapolator.clear();
      expect(x in extrapolator).toBe(false);
    });
    it("should return correct values", () => {
      expect(extrapolator[3]).toBe(9);
      expect(extrapolator[3]).toBe(9);
      expect(extrapolator[2]).toBe(4);
      expect(extrapolator[0]).toBe(0);
      expect(extrapolator[-4]).toBe(16);
    });
    it("should return undefined for non integer indices", () => {
      expect(extrapolator[3.4]).toBeUndefined();
      expect(extrapolator[2.4]).toBeUndefined();
      expect(extrapolator[0.4]).toBeUndefined();
      expect(extrapolator[-4.1]).toBeUndefined();
      expect(3.4 in extrapolator).toBe(false);
    });
  });
});
