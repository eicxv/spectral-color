import { mapRange } from "../utils/utils";

interface ScalarSampler {
  (x: number, samples: readonly number[]): number;
}

interface VectorSampler extends ScalarSampler {
  (x: number, samples: readonly number[][]): number[];
  (x: number, samples: readonly number[] | readonly number[][]): number | number[];
}

interface MappedVectorSampler extends VectorSampler {
  (x: number[], samples: readonly number[]): number[];
  (x: number[], samples: readonly number[][]): number[][];
  (x: number[], samples: readonly number[] | readonly number[][]): number[] | number[][];

  (x: number | number[], samples: readonly number[]): number | number[];
  (x: number | number[], samples: readonly number[][]): number[] | number[][];
  (x: number | number[], samples: readonly number[] | readonly number[][]): number | number[] | number[][];
}

export type Sampler = MappedVectorSampler;
export type Interpolator = ScalarSampler;
export type Extrapolator = ScalarSampler;

export function getWindow(
  x0: number,
  samples: readonly number[],
  windowSize: number,
  extrapolate?: (i: number, samples: readonly number[]) => number
): number[] {
  return mapRange((i) => samples[i] ?? extrapolate?.(i, samples), x0 - (windowSize / 2 - 1), windowSize);
}

export function vectorizeSampler(interp: ScalarSampler): VectorSampler {
  function vectorizedSampler(x: number, samples: readonly number[]): number;
  function vectorizedSampler(x: number, samples: readonly number[][]): number[];
  function vectorizedSampler(x: number, samples: readonly number[] | readonly number[][]): number | number[];
  function vectorizedSampler(x: number, samples: readonly number[] | readonly number[][]): number | number[] {
    if (Array.isArray(samples[0])) {
      const s = samples as readonly number[][];
      return mapRange((i) => interp(x, createColumnView(s, i)), 0, s[0].length);
    }
    return interp(x, samples as readonly number[]);
  }
  return vectorizedSampler;
}

function mapSampler(interp: VectorSampler): MappedVectorSampler {
  function mappedSampler(x: number, samples: readonly number[]): number;
  function mappedSampler(x: number[], samples: readonly number[]): number[];
  function mappedSampler(x: number | number[], samples: readonly number[]): number | number[];
  function mappedSampler(x: number, samples: readonly number[][]): number[];
  function mappedSampler(x: number[], samples: readonly number[][]): number[][];
  function mappedSampler(x: number | number[], samples: readonly number[][]): number[] | number[][];
  function mappedSampler(x: number, samples: readonly number[] | readonly number[][]): number | number[];
  function mappedSampler(
    x: number[],
    samples: readonly number[] | readonly number[][]
  ): number[] | number[][];
  function mappedSampler(
    x: number | number[],
    samples: readonly number[] | readonly number[][]
  ): number | number[] | number[][];
  function mappedSampler(
    x: number | number[],
    samples: readonly number[] | readonly number[][]
  ): number | number[] | number[][] {
    if (Array.isArray(x)) {
      return x.map((x_) => interp(x_, samples)) as number[] | number[][];
    }
    return interp(x, samples);
  }
  return mappedSampler;
}

export function composeSampler(interpolator: Interpolator, extrapolator: Extrapolator): Sampler {
  const composedSampler: ScalarSampler = function (x: number, samples: readonly number[]): number {
    if (x >= 0 && x < samples.length - 1) {
      return interpolator(x, samples);
    }
    return extrapolator(x, samples);
  };
  const vectorizedSampler = vectorizeSampler(composedSampler);
  const sampler = mapSampler(vectorizedSampler);
  return sampler;
}

function createColumnView(array: readonly number[][], columnIndex: number): readonly number[] {
  const handler: ProxyHandler<number[][]> = {
    get(target: number[][], prop: PropertyKey) {
      if (target.hasOwnProperty(prop) && prop !== "length") {
        return target[prop as number][columnIndex];
      }
      return Reflect.get(target, prop);
    },
  };
  // behaves like a 1d view of column
  return new Proxy(array, handler) as unknown as readonly number[];
}
