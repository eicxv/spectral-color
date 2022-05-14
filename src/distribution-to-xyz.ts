import { CIE_1931_2DEG as cmf31 } from "./spectral-data/color-matching-functions";
import { D65 } from "./spectral-data/illuminants";
import { SpectralDistribution } from "./spectral-distribution/spectral-distribution";

type Vec3 = [number, number, number];

function scaleVec(v: number[], s: number): number[] {
  return v.map((x) => x * s);
}

export function spdToXyz(
  spec: SpectralDistribution<number>,
  cmfs: SpectralDistribution<[number, number, number]> = cmf31,
  emissive = false,
  illuminant: SpectralDistribution<number> = D65
): Vec3 {
  let xyz = cmfs.combine(spec, (a, b) => scaleVec(a, b)).sum();
  xyz = scaleVec(xyz, cmfs.shape.interval);
  if (!emissive) {
    const k = illuminant.combine(cmfs, (a, b) => a * b[1]).sum() * illuminant.shape.interval;
    xyz = scaleVec(xyz, 1 / k);
  }
  return xyz as Vec3;
}

export function illuminateDistribution(
  spec: SpectralDistribution<number>,
  illuminant: SpectralDistribution<number> = D65
): SpectralDistribution<number> {
  return spec.combine(illuminant, (a, b) => a * b);
}
