import { MultiSpectralDistribution } from "../spectral-distribution";
import cmf2deg31Data from "./data/color-matching-functions/cie-xyz-cmf-2deg-1931.json";

export const CIE_1931_2DEG = new MultiSpectralDistribution(
  cmf2deg31Data.span as [number, number],
  cmf2deg31Data.interval,
  cmf2deg31Data.values
);
