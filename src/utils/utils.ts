export function range(start: number, n: number, interval = 1): number[] {
  return Array.from(new Array(n), (_, i) => i * interval + start);
}

export function linearCombination(a: number[], b: number[]): number {
  return a.reduce((acc, e, i) => acc + e * b[i], 0);
}

export function powerSeries(x: number, n: number): number[] {
  return Array.from(new Array(n), (_, i) => x ** i);
}
