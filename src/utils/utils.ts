export function range(start: number, n: number, interval = 1): number[] {
  return Array.from(new Array(n), (_, i) => i * interval + start);
}

export function mapRange<T>(
  f: (x: number) => T,
  start: number,
  n: number,
  interval = 1
): Array<T> {
  return Array.from(new Array(n), (_, i) => f(i * interval + start));
}

export function linearCombination(a: number[], b: number[]): number {
  return a.reduce((acc, e, i) => acc + e * b[i], 0);
}

export function powerSeries(x: number, n: number): number[] {
  return Array.from(new Array(n), (_, i) => x ** i);
}

export function transpose(matrix: number[][]): number[][] {
  return matrix[0].map((_, i) => matrix.map((row) => row[i]));
}
