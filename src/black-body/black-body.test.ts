import { describe, expect, it } from "vitest";
import { transpose } from "./../utils/utils";
import { plancksLaw } from "./black-body";

describe("Black Body", () => {
  describe("Planck's Law", () => {
    const T = [2000, 5000, 10505.5, 20000];
    const wl = [300, 400, 505.1, 600].map((e) => e * 1e-9);
    const radiance = [1.888e6, 8.744e12, 2.5783e14, 6.611e14]; // from wolfram alpha
    const cases = transpose([radiance, T, wl]);

    it.each(cases)("should be true", (expectedR, T, wl) => {
      const r = plancksLaw(T, wl);
      const relativeError = Math.abs(r - expectedR) / expectedR;
      expect(relativeError).toBeLessThan(0.001);
    });
  });
});
