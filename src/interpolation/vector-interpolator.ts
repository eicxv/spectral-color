import { SpectralShape } from "../spectral-shape";
import {
  IInterpolator,
  LinearInterpolator,
  NearestNeighborInterpolator,
  SpragueInterpolator,
} from "./interpolator";

export interface IVectorInterpolator {
  samples: readonly number[][];
  shape: SpectralShape;
  sampleAt(x: number): number[];
}

function vectorizeInterpolator(
  Interp: new (
    shape: SpectralShape,
    samples: readonly number[]
  ) => IInterpolator
): new (shape: SpectralShape, samples: number[][]) => IVectorInterpolator {
  return class VectorInterpolator implements IVectorInterpolator {
    shape: SpectralShape;
    samples: readonly number[][];
    interpolators: IInterpolator[];
    constructor(shape: SpectralShape, samples: number[][]) {
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

    sampleAt(x: number): number[] {
      return this.interpolators.map((interp) => interp.sampleAt(x));
    }
  };
}

export const NearestNeighborVectorInterpolator = vectorizeInterpolator(
  NearestNeighborInterpolator
);
export const LinearVectorInterpolator =
  vectorizeInterpolator(LinearInterpolator);
export const SpragueVectorInterpolator =
  vectorizeInterpolator(SpragueInterpolator);
