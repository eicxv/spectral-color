import { Shape } from "../spectral-distribution/shape";
import { SpectralDistribution } from "../spectral-distribution/spectral-distribution";
import D50Data from "./data/illuminants/D50.json";
import D65Data from "./data/illuminants/D65.json";
import EData from "./data/illuminants/E.json";

export const D65 = new SpectralDistribution<number>({
  shape: new Shape(D65Data.span as [number, number], D65Data.interval),
  samples: D65Data.values,
});

export const D50 = new SpectralDistribution({
  shape: new Shape(D50Data.span as [number, number], D50Data.interval),
  samples: D50Data.values,
});

export const E = new SpectralDistribution({
  shape: new Shape(EData.span as [number, number], EData.interval),
  samples: EData.values,
});
