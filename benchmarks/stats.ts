export const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
};

export const quantile = (values: number[], probability: number): number => {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  if (lower === upper) return sorted[lower];
  return (
    sorted[lower] +
    (sorted[upper] - sorted[lower]) * (position - lower)
  );
};

const bootstrapInterval = (
  values: number[],
  probability: number,
  seed: number,
  resamples = 2_000,
) => {
  const random = createSeededRandom(seed);
  const estimates: number[] = [];
  for (let iteration = 0; iteration < resamples; iteration += 1) {
    const sample = Array.from(
      { length: values.length },
      () => values[Math.floor(random() * values.length)],
    );
    estimates.push(quantile(sample, probability));
  }
  return {
    low: quantile(estimates, 0.025),
    high: quantile(estimates, 0.975),
    resamples,
  };
};

const percentileSummary = (
  values: number[],
  probability: number,
  seed: number,
) => ({
  value: quantile(values, probability),
  ci95: bootstrapInterval(values, probability, seed),
});

export const summarizeDurations = (values: number[], seed: number) => {
  const valid = values.filter(
    (value) => Number.isFinite(value) && value >= 0,
  );
  return {
    samples: valid.length,
    min: valid.length > 0 ? Math.min(...valid) : null,
    max: valid.length > 0 ? Math.max(...valid) : null,
    p50: valid.length > 0 ? percentileSummary(valid, 0.5, seed + 50) : null,
    p90: valid.length > 0 ? percentileSummary(valid, 0.9, seed + 90) : null,
    p95:
      valid.length >= 40 ? percentileSummary(valid, 0.95, seed + 95) : null,
  };
};

export const wilsonInterval = (successes: number, attempts: number) => {
  if (attempts <= 0) return { rate: 0, low: 0, high: 0 };
  const z = 1.959963984540054;
  const rate = successes / attempts;
  const denominator = 1 + (z * z) / attempts;
  const center = (rate + (z * z) / (2 * attempts)) / denominator;
  const margin =
    (z / denominator) *
    Math.sqrt(
      (rate * (1 - rate)) / attempts +
        (z * z) / (4 * attempts * attempts),
    );
  return { rate, low: center - margin, high: center + margin };
};
