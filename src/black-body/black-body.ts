import { Shape } from "../spectral-distribution/shape";
import { SpectralDistribution } from "../spectral-distribution/spectral-distribution";
import { BOLTZMANN_CONSTANT as k, PLANCK_CONSTANT as h, SPEED_OF_LIGHT as c } from "./constants";

const c1 = 2 * h * c ** 2;
const c2 = (h * c) / k;

// temperature in Kelvin, wavelength in meters
// calculates spectral radiance in W / (sr * m^2 * m)
export function plancksLaw(temperature: number, wavelength: number): number {
  const L = c1 / (wavelength ** 5 * (Math.exp(c2 / (wavelength * temperature)) - 1));
  return L;
}

// temperature in Kelvin
export function blackBodyDistribution(shape: Shape, temperature: number): SpectralDistribution<number> {
  return SpectralDistribution.fromFunction((x) => plancksLaw(temperature, x * 1e9), shape);
}
