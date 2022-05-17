import { CIE_1931_2DEG as cmf31 } from "./spectral-data/color-matching-functions";
import { D65 } from "./spectral-data/illuminants";
import { SpectralDistribution } from "./spectral-distribution/spectral-distribution";

function scaleVec<T extends number[]>(v: T, s: number): T {
  return v.map((x) => x * s) as T;
}

export function spdToXyz(
  spec: SpectralDistribution<number>,
  cmfs: SpectralDistribution<[number, number, number]> = cmf31,
  emissive = false,
  illuminant: SpectralDistribution<number> = D65
): [number, number, number] {
  let xyz = cmfs.multiply(spec).sum();
  xyz = scaleVec(xyz, cmfs.shape.interval);
  if (!emissive) {
    const k = illuminant.combine(cmfs, (a, b) => a * b[1]).sum() * illuminant.shape.interval;
    xyz = scaleVec(xyz, 1 / k);
  }
  return xyz as [number, number, number];
}
