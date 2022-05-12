import { MultiSpectralDistribution } from "../spectral-distribution/spectral-distribution";
import cmf10deg06Data from "./data/color-matching-functions/cie-xyz-cmf-10deg-2006.json";
import cmf2deg31Data from "./data/color-matching-functions/cie-xyz-cmf-2deg-1931.json";
import cmf2deg06Data from "./data/color-matching-functions/cie-xyz-cmf-2deg-2006.json";

export const CIE_1931_2DEG = new MultiSpectralDistribution(
  cmf2deg31Data.span as [number, number],
  cmf2deg31Data.interval,
  cmf2deg31Data.values
);

export const CIE_2006_2DEG = new MultiSpectralDistribution(
  cmf2deg06Data.span as [number, number],
  cmf2deg06Data.interval,
  cmf2deg06Data.values
);

export const CIE_2006_10DEG = new MultiSpectralDistribution(
  cmf10deg06Data.span as [number, number],
  cmf10deg06Data.interval,
  cmf10deg06Data.values
);
