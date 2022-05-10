import { CIE_1931_2DEG as cmf31 } from "./distributions/color-matching-functions";
import { D65 } from "./distributions/illuminants";
import { ISpectralDistribution } from "./spectral-distribution";

type Vec3 = [number, number, number];

function scaleVec(v: number[], s: number): number[] {
  return v.map((x) => x * s);
}

export function spdToXyz(
  spec: ISpectralDistribution<number>,
  cmfs: ISpectralDistribution<number[]> = cmf31,
  emissive = false,
  illuminant: ISpectralDistribution<number> = D65
): Vec3 {
  let xyz = cmfs.zipWith(spec, (a, b) => scaleVec(a, b)).sum();
  xyz = scaleVec(xyz, cmfs.interval);
  if (!emissive) {
    const k =
      illuminant.zipWith(cmfs, (a, b) => a * b[1]).sum() * illuminant.interval;
    xyz = scaleVec(xyz, 1 / k);
  }
  return xyz as Vec3;
}

export function illuminateDistribution(
  spec: ISpectralDistribution<number>,
  illuminant: ISpectralDistribution<number> = D65
): ISpectralDistribution<number> {
  return spec.zipWith(illuminant, (a, b) => a * b);
}
