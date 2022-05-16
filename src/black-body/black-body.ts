import { Shape } from "../spectral-distribution/shape";
import { SpectralDistribution } from "../spectral-distribution/spectral-distribution";
import { BOLTZMANN_CONSTANT as k, PLANCK_CONSTANT as h, SPEED_OF_LIGHT as c } from "./constants";

const c1 = 2 * h * c ** 2;
const c2 = (h * c) / k;

/**
 * Planck's radiation law.
 *
 * Calculates spectral radiance of black body at given temperature and wavelength.
 * temperature in Kelvin, Wavelength must be in metres.
 * Resulting spectral radiance is in Watts / steradian / square metres / metre.
 *
 * @param temperature - temperature in [K].
 * @param wavelength - wavelength in [m].
 * @returns spectral radiance in [W / (sr * m^2 * m)].
 */
export function plancksLaw(temperature: number, wavelength: number): number {
  const L = c1 / (wavelength ** 5 * (Math.exp(c2 / (wavelength * temperature)) - 1));
  return L;
}

/**
 * Generates a black-body spectrum at the given temperature.
 *
 * The domain and interval of shape should be defined in nanometres.
 * The returned spectral radiance distribution is in Watts / steradian / square metres / metre.
 *
 * @param shape - Domain and sampling interval in [nm].
 * @param temperature - Temperature in [K].
 * @returns Distribution of spectral radiance in [W / (sr * m^2 * m)].
 */
export function blackBodyDistribution(shape: Shape, temperature: number): SpectralDistribution<number> {
  return SpectralDistribution.fromFunction((x) => plancksLaw(temperature, x * 1e9), shape);
}
