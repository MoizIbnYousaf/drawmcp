import type { ModelContext, ModelContextTool } from "./model-context";

export type RegistryStatus =
  | "detecting"
  | "registering"
  | "registered"
  | "unsupported"
  | "error"
  | "disposed";

export type RegistryState = {
  status: RegistryStatus;
  registeredCount: number;
  error?: Error;
};

type RegistryOptions = {
  getModelContext?: () => ModelContext | undefined;
  onStateChange?: (state: RegistryState) => void;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
};

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

export class WebMcpRegistry {
  private readonly getModelContext: () => ModelContext | undefined;
  private readonly onStateChange?: (state: RegistryState) => void;
  private readonly pollIntervalMs: number;
  private readonly maxPollAttempts: number;
  private registrationController?: AbortController;
  private pollTimer?: ReturnType<typeof setTimeout>;
  private settlePoll?: () => void;
  private disposed = false;
  private lifecycle = 0;
  private state: RegistryState = { status: "detecting", registeredCount: 0 };

  constructor(options: RegistryOptions = {}) {
    this.getModelContext =
      options.getModelContext ?? (() => document.modelContext);
    this.onStateChange = options.onStateChange;
    this.pollIntervalMs = options.pollIntervalMs ?? 500;
    this.maxPollAttempts = options.maxPollAttempts ?? 20;
  }

  async start(tools: ModelContextTool[]): Promise<RegistryState> {
    this.registrationController?.abort();
    this.settlePoll?.();
    const lifecycle = ++this.lifecycle;
    this.disposed = false;
    this.updateState({ status: "detecting", registeredCount: 0 });
    const context = await this.detectModelContext(lifecycle);
    if (!context || this.disposed || lifecycle !== this.lifecycle) {
      const next = this.disposed || lifecycle !== this.lifecycle
        ? { status: "disposed" as const, registeredCount: 0 }
        : { status: "unsupported" as const, registeredCount: 0 };
      this.updateState(next);
      return next;
    }

    this.registrationController = new AbortController();
    const registrationController = this.registrationController;
    this.updateState({ status: "registering", registeredCount: 0 });
    try {
      const registrations = Promise.all(
        tools.map((tool) =>
          Promise.resolve(
            context.registerTool(tool, {
              signal: registrationController.signal,
            }),
          ),
        ),
      );
      void registrations.catch(() => undefined);
      await Promise.race([
        registrations,
        new Promise<void>((resolve) =>
          registrationController.signal.addEventListener(
            "abort",
            () => resolve(),
            { once: true },
          ),
        ),
      ]);
      if (this.disposed || lifecycle !== this.lifecycle) {
        return this.state;
      }
      const next = {
        status: "registered" as const,
        registeredCount: tools.length,
      };
      this.updateState(next);
      return next;
    } catch (error) {
      registrationController.abort();
      if (this.disposed || lifecycle !== this.lifecycle) return this.state;
      const next = {
        status: "error" as const,
        registeredCount: 0,
        error: toError(error),
      };
      this.updateState(next);
      return next;
    }
  }

  dispose(): void {
    this.disposed = true;
    this.lifecycle += 1;
    this.settlePoll?.();
    this.registrationController?.abort();
    this.registrationController = undefined;
    this.updateState({ status: "disposed", registeredCount: 0 });
  }

  getState(): RegistryState {
    return this.state;
  }

  private updateState(state: RegistryState): void {
    this.state = state;
    this.onStateChange?.(state);
  }

  private async detectModelContext(
    lifecycle: number,
  ): Promise<ModelContext | undefined> {
    const immediate = this.getModelContext();
    if (immediate) {
      return immediate;
    }

    for (let attempt = 0; attempt < this.maxPollAttempts; attempt += 1) {
      if (this.disposed || lifecycle !== this.lifecycle) {
        return undefined;
      }
      await new Promise<void>((resolve) => {
        const finish = () => {
          if (this.pollTimer) clearTimeout(this.pollTimer);
          this.pollTimer = undefined;
          this.settlePoll = undefined;
          resolve();
        };
        this.settlePoll = finish;
        this.pollTimer = setTimeout(finish, this.pollIntervalMs);
      });
      if (this.disposed || lifecycle !== this.lifecycle) return undefined;
      const context = this.getModelContext();
      if (context) {
        return context;
      }
    }
    return undefined;
  }
}
