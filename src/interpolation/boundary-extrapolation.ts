export type ExtrapolatorType = Record<number, number> & { clear: () => void };

export function createExtrapolator(
  samples: readonly number[],
  extrapolate: (samples: readonly number[], i: number) => number
): ExtrapolatorType {
  const handler: ProxyHandler<object> = {
    get(target: object, prop: PropertyKey) {
      if (!target.hasOwnProperty(prop)) {
        const i = Number.parseFloat(prop as string);
        if (Number.isInteger(i)) {
          const value = extrapolate(samples, i);
          Reflect.set(target, prop, value);
          return value;
        }
      }
      return Reflect.get(target, prop);
    },
  };
  const extrapolator = new Proxy({}, handler);
  Object.defineProperty(extrapolator, "clear", {
    value(): void {
      for (const key in this) {
        delete this[key];
      }
    },
    enumerable: false,
  });
  return extrapolator as ExtrapolatorType;
}
