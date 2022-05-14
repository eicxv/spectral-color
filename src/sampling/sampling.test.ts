import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, test } from "vitest";
import { range } from "../utils/utils";
import { nearestExtrapolator } from "./extrapolation/nearest";
import { linearInterpolator } from "./interpolation/linear";
import { composeSampler, Sampler } from "./sampling";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

function zip<T, U>(a: T[], b: U[]): [T, U][] {
  return a.map((e, i) => [e, b[i]]);
}

describe("compose sampler", () => {
  function testScalar(sampler: Sampler, samples: number[] | number[][], x: number[], y: number[]): void {
    test.each(zip(x, y))("single sample", (x, y) => {
      expect(sampler(x, samples)).toBeDeepCloseTo(y, 10);
    });
    test("multi sample", () => {
      expect(sampler(x, samples)).toBeDeepCloseTo(y, 10);
    });
  }
  function testVector(sampler: Sampler, samples: number[] | number[][], x: number[], y: number[][]): void {
    test.each(zip(x, y))("single sample", (x, y) => {
      expect(sampler(x, samples)).toBeDeepCloseTo(y, 10);
    });
    test("multi sample", () => {
      expect(sampler(x, samples)).toBeDeepCloseTo(y, 10);
    });
  }
  const sampler = composeSampler(linearInterpolator, nearestExtrapolator);
  const samples1d = [0, 4, 3.5, 1.7, 4, 5];

  describe("scalar", () => {
    describe("interpolation at integers", () => {
      const x = range(0, 6);
      const y = samples1d;
      testScalar(sampler, samples1d, x, y);
    });
    describe("interpolation", () => {
      const x = [0.4, 1.2, 2.25, 4.6, 5];
      const y = [1.6, 3.9, 3.05, 4.6, 5];
      testScalar(sampler, samples1d, x, y);
    });
    describe("extrapolation", () => {
      const x = [-1, -3.4, 0, 5, 5.34];
      const y = [0, 0, 0, 5, 5];
      testScalar(sampler, samples1d, x, y);
    });
  });

  const samples2d = [
    [0, 3],
    [4, 2],
    [3.5, 2.6],
    [1.7, 1.5],
    [4, -2.5],
    [5, -2.1],
  ];

  describe("vector", () => {
    describe("interpolation at integers", () => {
      const x = range(0, 6);
      const y = samples2d;
      testVector(sampler, samples2d, x, y);
    });
    describe("interpolation", () => {
      const x = [0.4, 1.2, 2.25, 4.6, 5];
      const y = [
        [1.6, 2.6],
        [3.9, 2.12],
        [3.05, 2.325],
        [4.6, -2.26],
        [5, -2.1],
      ];
      testVector(sampler, samples2d, x, y);
    });
    describe("extrapolation", () => {
      const x = [-1, -3.4, 0, 5, 5.34];
      const y = [
        [0, 3],
        [0, 3],
        [0, 3],
        [5, -2.1],
        [5, -2.1],
      ];
      testVector(sampler, samples2d, x, y);
    });
  });
});
