import { Shape } from "../spectral-distribution/shape";
import { SpectralDistribution } from "../spectral-distribution/spectral-distribution";
import D50Data from "./data/illuminants/D50.json";
import D65Data from "./data/illuminants/D65.json";
import EData from "./data/illuminants/E.json";

/**
 * CIE Standard Illuminant D65.
 */
export const D65 = new SpectralDistribution<number>({
  shape: new Shape(D65Data.domain as [number, number], D65Data.interval),
  samples: D65Data.samples,
});

/**
 * CIE Standard Illuminant D50.
 */
export const D50 = new SpectralDistribution({
  shape: new Shape(D50Data.domain as [number, number], D50Data.interval),
  samples: D50Data.samples,
});

/**
 * CIE Standard Illuminant E (equal energy).
 */
export const E = new SpectralDistribution({
  shape: new Shape(EData.domain as [number, number], EData.interval),
  samples: EData.samples,
});
