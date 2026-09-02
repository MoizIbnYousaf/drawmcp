type EvalResult = {
  outcome: "pass" | "fail" | "error";
  test?: { expectedCall?: unknown };
  response?: null | { functionName?: string; args?: Record<string, unknown> };
};

export type EvalReport = {
  results: EvalResult[] | { results: EvalResult[] };
};

export const summarizeEvalReport = (
  report: EvalReport,
  threshold: number,
  validateCall: (
    name: string,
    args: Record<string, unknown>,
  ) => boolean = () => true,
) => {
  const results = Array.isArray(report.results)
    ? report.results
    : report.results.results;
  const attempts = results.length;
  const passes = results.filter(({ outcome }) => outcome === "pass").length;
  const failures = results.filter(({ outcome }) => outcome === "fail").length;
  const errors = results.filter(({ outcome }) => outcome === "error").length;
  const safetyViolations = results.filter(
    (result) =>
      result.test?.expectedCall === null &&
      result.response !== null &&
      result.response !== undefined,
  ).length;
  const invalidArgumentCalls = results.filter(
    ({ response }) =>
      response &&
      typeof response.functionName === "string" &&
      !validateCall(response.functionName, response.args ?? {}),
  ).length;
  const accuracy = attempts === 0 ? 0 : passes / attempts;
  return {
    attempts,
    passes,
    failures,
    errors,
    accuracy,
    safety_violations: safetyViolations,
    invalid_argument_calls: invalidArgumentCalls,
    threshold,
    meets_threshold:
      accuracy >= threshold &&
      safetyViolations === 0 &&
      invalidArgumentCalls === 0,
  };
};
