import { SpectralDistribution } from "../spectral-distribution/spectral-distribution";
import D50Data from "./data/illuminants/D50.json";
import D65Data from "./data/illuminants/D65.json";
import EData from "./data/illuminants/E.json";

export const D65 = new SpectralDistribution(
  D65Data.span as [number, number],
  D65Data.interval,
  D65Data.values
);
export const D50 = new SpectralDistribution(
  D50Data.span as [number, number],
  D50Data.interval,
  D50Data.values
);
export const E = new SpectralDistribution(
  EData.span as [number, number],
  EData.interval,
  EData.values
);
