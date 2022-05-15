import { SampleT, SpectralDistribution } from "./spectral-distribution";

export enum SampleType {
  Scalar = "scalar",
  Vector = "vector",
}

export type BroadcastResult<A extends SampleT, B extends SampleT> = A extends number
  ? B extends number
    ? A
    : B
  : B extends number
  ? A
  : A;

type BroadcastSignature<A extends SampleT, B extends SampleT> = (a: A, b: B) => BroadcastResult<A, B>;

type UnaryOperator =
  | ((a: number) => number)
  | ((a: number) => number[])
  | ((a: number[]) => number)
  | ((a: number[]) => number[]);

type BinaryOperator =
  | ((a: number, b: number) => number)
  | ((a: number, b: number) => number[])
  | ((a: number, b: number[]) => number)
  | ((a: number, b: number[]) => number[])
  | ((a: number[], b: number) => number)
  | ((a: number[], b: number) => number[])
  | ((a: number[], b: number[]) => number)
  | ((a: number[], b: number[]) => number[]);

export function add(a: number, b: number): number {
  return a + b;
}

export function subtract(a: number, b: number): number {
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  return a / b;
}

function getType(x: SampleT | SpectralDistribution<SampleT>): SampleType {
  if (x instanceof SpectralDistribution) {
    return x.type;
  }
  return Array.isArray(x) ? SampleType.Vector : SampleType.Scalar;
}

export function broadcastBinaryOperator<A extends SampleT, B extends SampleT>(
  f: (a: number, b: number) => number,
  a: A | SpectralDistribution<A>,
  b: B | SpectralDistribution<B>
): (a: A, b: B) => BroadcastResult<A, B>;
export function broadcastBinaryOperator(
  f: (a: number, b: number) => number,
  a: SampleT,
  b: SampleT
): BinaryOperator {
  return broadcastLookup[getType(a)][getType(b)](f);
}

const broadcastLookup = {
  [SampleType.Scalar]: {
    [SampleType.Scalar]: (f: BroadcastSignature<number, number>): BroadcastSignature<number, number> => f,
    [SampleType.Vector]:
      (f: BroadcastSignature<number, number>): BroadcastSignature<number, number[]> =>
      (a: number, b: number[]): number[] =>
        b.map((b) => f(a, b)),
  },
  [SampleType.Vector]: {
    [SampleType.Scalar]:
      (f: BroadcastSignature<number, number>): BroadcastSignature<number[], number> =>
      (a: number[], b: number): number[] =>
        a.map((a) => f(a, b)),
    [SampleType.Vector]:
      (f: BroadcastSignature<number, number>): BroadcastSignature<number[], number[]> =>
      (a: number[], b: number[]): number[] =>
        a.map((a, i) => f(a, b[i])),
  },
};
