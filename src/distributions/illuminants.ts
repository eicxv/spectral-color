import { SpectralDistribution } from "../spectral-distribution";
import D65Data from "./data/illuminants/D65.json";

export const D65 = new SpectralDistribution(
  D65Data.span as [number, number],
  D65Data.interval,
  D65Data.values
);
