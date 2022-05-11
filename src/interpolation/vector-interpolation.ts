import { Shape } from "../spectral-distribution/shape";
import * as interpolator from "./scalar-interpolation";

function vectorizeInterpolator(
  Interp: new (
    shape: Shape,
    samples: readonly number[]
  ) => interpolator.Interpolator<number>
): new (shape: Shape, samples: number[][]) => interpolator.Interpolator<
  number[]
> {
  return class VectorInterpolator
    implements interpolator.Interpolator<number[]>
  {
    shape: Shape;
    samples: readonly number[][];
    interpolators: interpolator.Interpolator<number>[];
    constructor(shape: Shape, samples: number[][]) {
      this.shape = shape;
      this.samples = samples;
      this.interpolators = samples[0].map(
        (_, i) => new Interp(shape, this.createProxy(samples, i))
      );
    }

    private createProxy(arr: number[][], i: number): readonly number[] {
      const handler: ProxyHandler<number[][]> = {
        get(target: number[][], prop: PropertyKey) {
          if (target.hasOwnProperty(prop) && prop !== "length") {
            return target[prop as number][i];
          }
          return Reflect.get(target, prop);
        },
      };
      // behaves like a 1d readonly view of array
      return new Proxy(arr, handler) as unknown as readonly number[];
    }

    sampleAt(x: number[]): number[][];
    sampleAt(x: number): number[];
    sampleAt(x: number | number[]): number[] | number[][];
    sampleAt(x: number | number[]): number[] | number[][] {
      if (Array.isArray(x)) {
        return x.map((x) => this._sampleAt(x));
      }
      return this._sampleAt(x);
    }

    _sampleAt(x: number): number[] {
      return this.interpolators.map((interp) => interp.sampleAt(x));
    }
  };
}

export const NearestNeighbor = vectorizeInterpolator(
  interpolator.NearestNeighbor
);
export const Linear = vectorizeInterpolator(interpolator.Linear);
export const Sprague = vectorizeInterpolator(interpolator.Sprague);
