import { describe, expect, it, vi } from "vitest";
import { WebMcpRegistry } from "./register-tools";
import type { ModelContext, ModelContextTool } from "./model-context";

const createTool = (
  execute?: ModelContextTool["execute"],
): ModelContextTool => ({
  name: "get_canvas_summary",
  title: "Read canvas summary",
  description: "Read the current DrawMCP canvas summary.",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  execute: execute ?? (async () => ({ ok: true })),
});

describe("WebMcpRegistry", () => {
  it("awaits registration and reports registered only after it resolves", async () => {
    let resolveRegistration!: () => void;
    const registerTool = vi.fn(
      () => new Promise<void>((resolve) => (resolveRegistration = resolve)),
    );
    const states: string[] = [];
    const registry = new WebMcpRegistry({
      getModelContext: () => ({ registerTool }) as ModelContext,
      onStateChange: (state) => states.push(state.status),
      pollIntervalMs: 1,
      maxPollAttempts: 1,
    });

    const started = registry.start([createTool()]);
    await Promise.resolve();
    expect(states.at(-1)).toBe("registering");
    resolveRegistration();
    await started;
    expect(states.at(-1)).toBe("registered");
    registry.dispose();
  });

  it("passes a registration signal and aborts it on dispose", async () => {
    let registrationSignal: AbortSignal | undefined;
    const context: ModelContext = {
      registerTool: vi.fn(async (_tool, options) => {
        registrationSignal = options?.signal;
      }),
    };
    const registry = new WebMcpRegistry({ getModelContext: () => context });
    await registry.start([createTool()]);
    expect(registrationSignal?.aborted).toBe(false);
    registry.dispose();
    expect(registrationSignal?.aborted).toBe(true);
  });

  it("passes the call-level cancellation signal to handlers", async () => {
    const execute = vi.fn(async (_input, options) => ({
      aborted: options!.signal.aborted,
    }));
    let registeredTool: ModelContextTool | undefined;
    const context: ModelContext = {
      registerTool: vi.fn(async (tool) => {
        registeredTool = tool;
      }),
    };
    const registry = new WebMcpRegistry({ getModelContext: () => context });
    await registry.start([createTool(execute)]);

    const controller = new AbortController();
    controller.abort();
    await registeredTool?.execute({}, { signal: controller.signal });
    expect(execute).toHaveBeenCalledWith({}, { signal: controller.signal });
    registry.dispose();
  });

  it("reports unsupported after bounded late-detection attempts", async () => {
    vi.useFakeTimers();
    const registry = new WebMcpRegistry({
      getModelContext: () => undefined,
      pollIntervalMs: 10,
      maxPollAttempts: 2,
    });
    const started = registry.start([createTool()]);
    await vi.advanceTimersByTimeAsync(25);
    await expect(started).resolves.toMatchObject({ status: "unsupported" });
    registry.dispose();
    vi.useRealTimers();
  });

  it("settles detection promptly when disposed during a poll", async () => {
    const registry = new WebMcpRegistry({
      getModelContext: () => undefined,
      pollIntervalMs: 10_000,
      maxPollAttempts: 2,
    });
    const started = registry.start([createTool()]);
    await Promise.resolve();
    registry.dispose();
    await expect(
      Promise.race([
        started,
        new Promise((resolve) =>
          setTimeout(() => resolve({ status: "timed_out" }), 100),
        ),
      ]),
    ).resolves.toMatchObject({ status: "disposed" });
  });

  it("reports synchronous and asynchronous registration failures", async () => {
    const syncRegistry = new WebMcpRegistry({
      getModelContext: () => ({
        registerTool: () => {
          throw new Error("blocked");
        },
      }),
    });
    await expect(syncRegistry.start([createTool()])).resolves.toMatchObject({
      status: "error",
      error: expect.objectContaining({ message: "blocked" }),
    });

    const asyncRegistry = new WebMcpRegistry({
      getModelContext: () => ({
        registerTool: async () => {
          throw new Error("denied");
        },
      }),
    });
    await expect(asyncRegistry.start([createTool()])).resolves.toMatchObject({
      status: "error",
      error: expect.objectContaining({ message: "denied" }),
    });
  });
});
