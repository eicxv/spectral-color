import { SpectralDistribution } from "../spectral-distribution/spectral-distribution";
import { Shape } from "./../spectral-distribution/shape";
import cmf10deg06Data from "./data/color-matching-functions/cie-xyz-cmf-10deg-2006.json";
import cmf2deg31Data from "./data/color-matching-functions/cie-xyz-cmf-2deg-1931.json";
import cmf2deg06Data from "./data/color-matching-functions/cie-xyz-cmf-2deg-2006.json";

export const CIE_1931_2DEG = new SpectralDistribution<[number, number, number]>({
  shape: new Shape(cmf2deg31Data.span as [number, number], cmf2deg31Data.interval),
  samples: cmf2deg31Data.values as [number, number, number][],
});

export const CIE_2006_2DEG = new SpectralDistribution<[number, number, number]>({
  shape: new Shape(cmf2deg06Data.span as [number, number], cmf2deg06Data.interval),
  samples: cmf2deg06Data.values as [number, number, number][],
});

export const CIE_2006_10DEG = new SpectralDistribution<[number, number, number]>({
  shape: new Shape(cmf10deg06Data.span as [number, number], cmf10deg06Data.interval),
  samples: cmf10deg06Data.values as [number, number, number][],
});
