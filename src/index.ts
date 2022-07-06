import * as blackBody from "./black-body/black-body";
import * as cmfs from "./spectral-data/color-matching-functions";
import * as illuminants from "./spectral-data/illuminants";

export { spdToXyz } from "./distribution-to-xyz";
export { nearestExtrapolator } from "./sampling/extrapolation/nearest";
export { linearInterpolator } from "./sampling/interpolation/linear";
export { nearestInterpolator } from "./sampling/interpolation/nearest";
export { spragueInterpolator } from "./sampling/interpolation/sprague";
export { Shape } from "./spectral-distribution/shape";
export { SpectralDistribution } from "./spectral-distribution/spectral-distribution";
export { blackBody, cmfs, illuminants };
