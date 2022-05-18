import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { beforeEach, describe, expect, it, test } from "vitest";
import { nearestExtrapolator } from "../sampling/extrapolation/nearest";
import { spragueInterpolator } from "../sampling/interpolation/sprague";
import { Shape } from "./shape";
import { SpectralDistribution } from "./spectral-distribution";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

function expectSD(
  sd: SpectralDistribution<number | number[]>,
  expected: {
    shape: Shape;
    samples: number[] | number[][];
  },
  otherSds: SpectralDistribution<number | number[]>[]
): void {
  expect(sd).toBeInstanceOf(SpectralDistribution);
  for (const otherSd of otherSds) {
    expect(sd).not.toBe(otherSd);
  }
  expect(sd.shape).toEqual(expected.shape);
  expect(sd.samples).toBeDeepCloseTo(expected.samples);
}

describe("SpectralDistribution", () => {
  describe("constructor", () => {
    it("should construct distribution", () => {
      const samples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const samplesCopy = samples.slice();
      const shape = new Shape(-0.5, 0.5, 0.1);
      const sd = new SpectralDistribution({ shape, samples });
      expectSD(sd, { shape: new Shape(-0.5, 0.5, 0.1), samples: samplesCopy }, []);
    });
  });

  describe("sampleAt", () => {
    let sd: SpectralDistribution<number>;
    const samples = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    beforeEach(() => {
      const shape = new Shape([0, 1], 0.1);
      sd = new SpectralDistribution({ shape, samples });
    });
    it("should return original data at intervals", () => {
      expect(sd.sampleAt([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])).toBeDeepCloseTo(samples);
      expect(sd.sampleAt(0.1)).toBeDeepCloseTo(1);
    });
    it("should interpolate", () => {
      expect(sd.sampleAt([0.05, 0.15])).toBeDeepCloseTo([0.5, 1.5]);
      expect(sd.sampleAt(0.05)).toBeDeepCloseTo(0.5);
    });
    it("should extrapolate", () => {
      expect(sd.sampleAt([-0.05, 1.5])).toBeDeepCloseTo([0, 10]);
      expect(sd.sampleAt(-1)).toBeDeepCloseTo(0);
    });
  });

  describe("resample", () => {
    let sd: SpectralDistribution<number>;
    const samples = [-4, 0, 2, 1, 4, 7];
    beforeEach(() => {
      const shape = new Shape([0, 2.5], 0.5);
      sd = new SpectralDistribution({
        shape,
        samples,
        interpolator: spragueInterpolator,
        extrapolator: nearestExtrapolator,
      });
    });
    it("resampling to same shape should return original samples", () => {
      expectSD(sd.resample(sd.shape), { shape: new Shape([0, 2.5], 0.5), samples: [-4, 0, 2, 1, 4, 7] }, [
        sd,
      ]);
    });
  });

  describe("map", () => {
    it("should return transformed distribution", () => {
      const samples = [0, 1, 2, 3, 4, 5];
      const shape = new Shape([0, 25], 5);
      const sd = new SpectralDistribution({ shape, samples });
      const f = (x: number): number => x * x;
      const mapped = sd.map(f);
      expectSD(mapped, { shape: new Shape([0, 25], 5), samples: samples.map(f) }, [sd]);
    });

    it("map to multi channel", () => {
      const samples = [0, 1, 2, 3, 4, 5];
      const shape = new Shape([0, 25], 5);
      const sd = new SpectralDistribution({ shape, samples });
      const f = (x: number): [number, number, number] => [1, x, x * x];
      const mapped = sd.map(f);
      expectSD(mapped, { shape: new Shape([0, 25], 5), samples: samples.map(f) }, [sd]);
    });
  });

  describe("combine", () => {
    it("single channel", () => {
      const sd1 = new SpectralDistribution({ shape: new Shape([0, 25], 5), samples: [0, 4, 1, 7, 8, 6] });
      const sd2 = new SpectralDistribution({ shape: new Shape([10, 30], 20), samples: [2, 10] });
      // sd2 interploated and extrapolated to sd1.shape = [2, 2, 2, 4, 6, 8]
      const combined = sd1.combine(sd2, Math.max);
      expectSD(combined, { shape: new Shape([0, 25], 5), samples: [2, 4, 2, 7, 8, 8] }, [sd1, sd2]);
    });

    it("multiple channels", () => {
      const sd1 = new SpectralDistribution({ shape: new Shape([0, 25], 5), samples: [0, 4, 1, 7, 8, 6] });
      const sd2 = new SpectralDistribution({
        shape: new Shape([10, 30], 20),
        samples: [
          [2, -4],
          [10, 16],
        ],
      });
      // sd2 interploated and extrapolated to sd1.shape = [[2, -4], [2, -4], [2, -4], [4, 1], [6, 6], [8, 11]]
      const combined = sd1.combine(sd2, (a, b) => [a, ...b]);
      expectSD(
        combined,
        {
          shape: new Shape([0, 25], 5),
          samples: [
            [0, 2, -4],
            [4, 2, -4],
            [1, 2, -4],
            [7, 4, 1],
            [8, 6, 6],
            [6, 8, 11],
          ],
        },
        [sd1, sd2]
      );
    });
  });

  describe("broadcastBinaryOperator", () => {
    const sdNum = new SpectralDistribution({ shape: new Shape([5, 25], 5), samples: [0, 4, 1, 7, 8] });
    const sdArr = new SpectralDistribution({
      shape: new Shape([5, 25], 5),
      samples: [
        [0, 6],
        [4, 4],
        [1, -3],
        [7, 4],
        [8, 1],
      ],
    });
    const num = 3;
    const arr = [-2, 6];
    const casesList = [
      {
        operator: "add",
        cases: [
          {
            args: [sdNum, num],
            expected: [3, 7, 4, 10, 11],
          },
          {
            args: [sdNum, arr],
            expected: [
              [-2, 6],
              [2, 10],
              [-1, 7],
              [5, 13],
              [6, 14],
            ],
          },
          {
            args: [sdNum, sdNum],
            expected: [0, 8, 2, 14, 16],
          },
          {
            args: [sdNum, sdArr],
            expected: [
              [0, 6],
              [8, 8],
              [2, -2],
              [14, 11],
              [16, 9],
            ],
          },
          {
            args: [sdArr, num],
            expected: [
              [3, 9],
              [7, 7],
              [4, 0],
              [10, 7],
              [11, 4],
            ],
          },
          {
            args: [sdArr, arr],
            expected: [
              [-2, 12],
              [2, 10],
              [-1, 3],
              [5, 10],
              [6, 7],
            ],
          },
          {
            args: [sdArr, sdNum],
            expected: [
              [0, 6],
              [8, 8],
              [2, -2],
              [14, 11],
              [16, 9],
            ],
          },
        ],
      },
      {
        operator: "subtract",
        cases: [
          {
            args: [sdNum, num],
            expected: [-3, 1, -2, 4, 5],
          },
          {
            args: [sdNum, arr],
            expected: [
              [2, -6],
              [6, -2],
              [3, -5],
              [9, 1],
              [10, 2],
            ],
          },
          {
            args: [sdNum, sdNum],
            expected: [0, 0, 0, 0, 0],
          },
          {
            args: [sdNum, sdArr],
            expected: [
              [0, -6],
              [0, 0],
              [0, 4],
              [0, 3],
              [0, 7],
            ],
          },
          {
            args: [sdArr, num],
            expected: [
              [-3, 3],
              [1, 1],
              [-2, -6],
              [4, 1],
              [5, -2],
            ],
          },
          {
            args: [sdArr, arr],
            expected: [
              [2, 0],
              [6, -2],
              [3, -9],
              [9, -2],
              [10, -5],
            ],
          },
          {
            args: [sdArr, sdNum],
            expected: [
              [0, 6],
              [0, 0],
              [0, -4],
              [0, -3],
              [0, -7],
            ],
          },
        ],
      },
      {
        operator: "multiply",
        cases: [
          {
            args: [sdNum, num],
            expected: [0, 12, 3, 21, 24],
          },
          {
            args: [sdNum, arr],
            expected: [
              [0, 0],
              [-8, 24],
              [-2, 6],
              [-14, 42],
              [-16, 48],
            ],
          },
          {
            args: [sdNum, sdNum],
            expected: [0, 16, 1, 49, 64],
          },
          {
            args: [sdNum, sdArr],
            expected: [
              [0, 0],
              [16, 16],
              [1, -3],
              [49, 28],
              [64, 8],
            ],
          },
          {
            args: [sdArr, num],
            expected: [
              [0, 18],
              [12, 12],
              [3, -9],
              [21, 12],
              [24, 3],
            ],
          },
          {
            args: [sdArr, arr],
            expected: [
              [0, 36],
              [-8, 24],
              [-2, -18],
              [-14, 24],
              [-16, 6],
            ],
          },
          {
            args: [sdArr, sdNum],
            expected: [
              [0, 0],
              [16, 16],
              [1, -3],
              [49, 28],
              [64, 8],
            ],
          },
        ],
      },
      {
        operator: "divide",
        cases: [
          {
            args: [sdNum, num],
            expected: [0 / 3, 4 / 3, 1 / 3, 7 / 3, 8 / 3],
          },
          {
            args: [sdNum, arr],

            expected: [
              [0, 0],
              [-2, 2 / 3],
              [-1 / 2, 1 / 6],
              [-7 / 2, 7 / 6],
              [-4, 4 / 3],
            ],
          },
          {
            args: [sdNum, sdNum],
            expected: [NaN, 1, 1, 1, 1],
          },
          {
            args: [sdNum, sdArr],
            expected: [
              [NaN, 0],
              [1, 1],
              [1, -1 / 3],
              [1, 7 / 4],
              [1, 8],
            ],
          },
          {
            args: [sdArr, num],
            expected: [
              [0, 6 / 3],
              [4 / 3, 4 / 3],
              [1 / 3, -1],
              [7 / 3, 4 / 3],
              [8 / 3, 1 / 3],
            ],
          },
          {
            args: [sdArr, arr],
            expected: [
              [0, 1],
              [-2, 2 / 3],
              [-1 / 2, -1 / 2],
              [-7 / 2, 2 / 3],
              [-4, 1 / 6],
            ],
          },
          {
            args: [sdArr, sdNum],
            expected: [
              [NaN, Infinity],
              [1, 1],
              [1, -3],
              [1, 4 / 7],
              [1, 1 / 8],
            ],
          },
        ],
      },
    ] as {
      operator: "add" | "subtract" | "multiply" | "divide";
      cases: {
        name?: string[];
        args: [
          SpectralDistribution<number | number[]>,
          number | number[] | SpectralDistribution<number | number[]>
        ];
        expected: number[][];
      }[];
    }[];

    const getName = (obj: number | number[] | SpectralDistribution<number | number[]>): string =>
      obj instanceof SpectralDistribution
        ? `${obj.constructor.name}<${obj.samples[0].constructor.name}>`
        : obj.constructor.name;
    casesList.map((item) => item.cases.map((c) => (c.name = c.args.map(getName))));

    describe.each(casesList)("$operator", ({ operator, cases }) => {
      test.each(cases)("$name", ({ args, expected }) => {
        const [sd, arg] = args;
        const r = sd[operator](arg);
        expectSD(r, { shape: sd.shape, samples: expected }, []);
      });
    });

    it("single channel", () => {
      const sd1 = new SpectralDistribution({ shape: new Shape([0, 25], 5), samples: [0, 4, 1, 7, 8, 6] });
      const sd2 = new SpectralDistribution({ shape: new Shape([10, 30], 20), samples: [2, 10] });
      // sd2 interploated and extrapolated to sd1.shape = [2, 2, 2, 4, 6, 8]
      const combined = sd1.combine(sd2, Math.max);
      expectSD(combined, { shape: new Shape([0, 25], 5), samples: [2, 4, 2, 7, 8, 8] }, [sd1, sd2]);
    });

    it("multiple channels", () => {
      const sd1 = new SpectralDistribution({ shape: new Shape([0, 25], 5), samples: [0, 4, 1, 7, 8, 6] });
      const sd2 = new SpectralDistribution({
        shape: new Shape([10, 30], 20),
        samples: [
          [2, -4],
          [10, 16],
        ],
      });
      // sd2 interploated and extrapolated to sd1.shape = [[2, -4], [2, -4], [2, -4], [4, 1], [6, 6], [8, 11]]
      const combined = sd1.combine(sd2, (a, b) => [a, ...b]);
      expectSD(
        combined,
        {
          shape: new Shape([0, 25], 5),
          samples: [
            [0, 2, -4],
            [4, 2, -4],
            [1, 2, -4],
            [7, 4, 1],
            [8, 6, 6],
            [6, 8, 11],
          ],
        },
        [sd1, sd2]
      );
    });
  });
});
