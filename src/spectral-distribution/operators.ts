export const add = {
  scalar: {
    scalar: (a: number, b: number): number => a + b,
    vector: (a: number, b: number[]): number[] => b.map((b) => a + b),
  },
  vector: {
    scalar: (a: number[], b: number): number[] => a.map((a) => a + b),
    vector: (a: number[], b: number[]): number[] => a.map((a, i) => a + b[i]),
  },
};
