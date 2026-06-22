/** Minimal tracing seam — swap for OpenTelemetry later (JD asks for tracing/metrics/alerts). */
export interface Span {
  end(attrs?: Record<string, unknown>): void;
}

export interface Tracer {
  start(name: string, attrs?: Record<string, unknown>): Span;
}

/** Writes to stderr so it never pollutes stdout artifact output. */
export const consoleTracer: Tracer = {
  start(name, attrs) {
    const t0 = Date.now();
    console.error(`[trace] ▶ ${name}`, attrs ?? '');
    return {
      end: (a) => console.error(`[trace] ■ ${name} (${Date.now() - t0}ms)`, a ?? ''),
    };
  },
};
