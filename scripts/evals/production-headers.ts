import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type VercelConfig = {
  headers?: Array<{
    source: string;
    headers: Array<{ key: string; value: string }>;
  }>;
};

export const productionHeaders = Object.fromEntries(
  ((JSON.parse(
    readFileSync(resolve("vercel.json"), "utf8"),
  ) as VercelConfig).headers?.[0]?.headers ?? []).map(({ key, value }) => [
    key,
    value,
  ]),
);
