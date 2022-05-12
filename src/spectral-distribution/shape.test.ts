import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, it } from "vitest";
import { Shape } from "./shape";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("SpectralShape", () => {
  describe("constructor", () => {
    it("should construct with span", () => {
      const s = new Shape([0, 10], 1);
      expect(s.start).toBe(0);
      expect(s.end).toBe(10);
      expect(s.interval).toBe(1);
    });

    it("should construct with start and end", () => {
      const s = new Shape(-3, 15, 0.3);
      expect(s.start).toBe(-3);
      expect(s.end).toBe(15);
      expect(s.interval).toBe(0.3);
    });
  });

  describe("validation", () => {
    it("should throw if end is smaller than start", () => {
      expect(() => new Shape(5, 10, 1)).not.toThrow();
      expect(() => new Shape(10, 5, 1)).toThrow();
    });

    it("should throw interval does not fit in span", () => {
      expect(() => new Shape(-0.5, 0.4, 0.1)).not.toThrow();
      expect(() => new Shape(2, 5, 2)).toThrow();
      expect(() => new Shape(2, 5.1, 1)).toThrow();
    });

    it("should throw interval is equal to or smaller than 0", () => {
      expect(() => new Shape(2, 5, 1)).not.toThrow();
      expect(() => new Shape(2, 5, 0)).toThrow();
      expect(() => new Shape(2, 5, -0.1)).toThrow();
    });
  });

  describe("isInDomain", () => {
    it("is false outside domain", () => {
      const s = new Shape(-1.5, 9, 0.5);
      expect(s.isInDomain(-2)).toBe(false);
      expect(s.isInDomain(11)).toBe(false);
    });

    it("is true inside domain", () => {
      const s = new Shape(-1.5, 9, 0.5);
      expect(s.isInDomain(-1.5)).toBe(true);
      expect(s.isInDomain(0)).toBe(true);
      expect(s.isInDomain(5)).toBe(true);
      expect(s.isInDomain(9)).toBe(true);
    });
  });
});
