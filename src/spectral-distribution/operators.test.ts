import { toBeDeepCloseTo, toMatchCloseTo } from "jest-matcher-deep-close-to";
import { describe, expect, test } from "vitest";
import { add, broadcastBinaryOperator, divide, multiply, subtract } from "./operators";

expect.extend({ toBeDeepCloseTo, toMatchCloseTo });

describe("operators", () => {
  describe.each([
    {
      operator: add,
      name: "add",
      cases: [
        { a: 1, b: 2, expected: 3 },
        { a: [1, 3], b: 2, expected: [3, 5] },
        { a: 4, b: [-1, 3], expected: [3, 7] },
        { a: [1, 3], b: [4, 4], expected: [5, 7] },
      ],
    },
    {
      operator: subtract,
      name: "subtract",
      cases: [
        { a: 1, b: 2, expected: -1 },
        { a: [1, 3], b: 2, expected: [-1, 1] },
        { a: 4, b: [-1, 3], expected: [5, 1] },
        { a: [1, 3], b: [4, 4], expected: [-3, -1] },
      ],
    },
    {
      operator: multiply,
      name: "multiply",
      cases: [
        { a: 1, b: 2, expected: 2 },
        { a: [1, 3], b: 2, expected: [2, 6] },
        { a: 4, b: [-1, 3], expected: [-4, 12] },
        { a: [1, 3], b: [4, 4], expected: [4, 12] },
      ],
    },
    {
      operator: divide,
      name: "divide",
      cases: [
        { a: 1, b: 2, expected: 1 / 2 },
        { a: [1, 3], b: 2, expected: [1 / 2, 3 / 2] },
        { a: 4, b: [-1, 3], expected: [-4, 4 / 3] },
        { a: [1, 3], b: [4, 4], expected: [1 / 4, 3 / 4] },
      ],
    },
  ])("$name", ({ operator, cases }) => {
    test.each(cases)("$a, $b = $expected", ({ a, b, expected }) => {
      const value = broadcastBinaryOperator(operator, a, b)(a, b);
      expect(value).toBeDeepCloseTo(expected, 8);
    });
  });
});
