---
number: 11
title: Use OpenTelemetry for Observability
status: accepted
date: 2026-02-23
tags:
  - observability
  - tracing
  - metrics
  - logging
  - infrastructure
deciders:
  - aRustyDev
---

# Use OpenTelemetry for Observability

## Context and Problem Statement

The application currently has no observability infrastructure - no structured logging, distributed tracing, or metrics collection. As the system grows to include CLI command execution, WebSocket connections, database operations, and real-time file watching, we need comprehensive observability to understand system behavior, debug issues, and monitor health in production.

## Decision Drivers

* **Vendor neutrality**: Avoid lock-in to specific APM vendors
* **Industry standard**: Use widely-adopted conventions for semantic consistency
* **Bun compatibility**: Must work with Bun runtime, our primary platform
* **Signal coverage**: Need traces, metrics, and structured logs
* **CLI support**: CLI tools have different patterns than long-running services
* **Performance**: Minimal overhead for production workloads
* **Future-proof**: Investment should carry forward as ecosystem matures

## Considered Options

* **OpenTelemetry** - Industry-standard observability framework
* **Sentry** - Error tracking with performance monitoring
* **Custom logging** - Roll our own logging/metrics solution
* **Pino + Prometheus** - Separate solutions for logs and metrics

## Decision Outcome

Chosen option: **OpenTelemetry** (`@opentelemetry/api` + `@opentelemetry/sdk-node`), because it provides vendor-neutral, standards-based observability that will serve as the foundation for all telemetry needs.

### Implementation Strategy

Given Bun's limited OTEL support (ESM auto-instrumentation doesn't work, gRPC has edge cases), we adopt a **manual instrumentation strategy**:

1. **Traces**: Manual spans for CLI commands, WebSocket events, DB operations
2. **Metrics**: Counters, histograms via `@opentelemetry/sdk-metrics`
3. **Logs**: Pino with OTEL trace context correlation via Logs Bridge API

### Consequences

* Good, because vendor-neutral - can export to any backend (Jaeger, Tempo, Honeycomb)
* Good, because semantic conventions provide consistency across signals
* Good, because traces are fully stable in SDK 2.0
* Good, because metrics reached stability in SDK 2.0
* Good, because manual instrumentation gives precise control over what's traced
* Neutral, because requires upfront instrumentation work (vs auto-instrumentation)
* Bad, because Bun compatibility requires workarounds (OTLP HTTP, not gRPC)
* Bad, because logs remain experimental, requiring Pino bridge approach
* Bad, because ESM auto-instrumentation doesn't work on Bun

### Confirmation

* All CLI command executions produce spans with args, exit code, duration
* WebSocket connections/disconnections emit spans
* Circuit breaker state changes are logged with trace context
* Errors include span ID for correlation
* Metrics available: command_count, ws_connections_active, circuit_breaker_state

## Pros and Cons of the Options

### OpenTelemetry

Industry-standard observability framework with modular SDK.

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('projx-ui');

async function executeCommand(cmd: string, args: string[]) {
  return tracer.startActiveSpan('cli.execute', async (span) => {
    span.setAttribute('process.command', cmd);
    span.setAttribute('process.command_args', args.join(' '));
    try {
      const result = await exec(cmd, args);
      span.setAttribute('process.exit.code', 0);
      return result;
    } catch (error) {
      span.setAttribute('process.exit.code', 1);
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

* Good, because vendor-neutral with OTLP export to any backend
* Good, because stable traces and metrics in SDK 2.0
* Good, because semantic conventions for CLI tools exist
* Good, because context propagation works across async boundaries
* Good, because can integrate with existing logging (Pino, Winston)
* Neutral, because sdk-node is technically "experimental" (bundles experimental logs)
* Bad, because Bun compatibility requires manual setup and OTLP HTTP
* Bad, because logs are experimental, need bridge approach
* Bad, because large dependency footprint if using auto-instrumentation

### Sentry

Error tracking platform with performance monitoring.

* Good, because excellent error tracking and grouping
* Good, because `@sentry/bun` package exists
* Good, because lower configuration overhead
* Neutral, because uses OTEL under the hood
* Bad, because vendor-specific (though has OTEL export)
* Bad, because some Bun setup difficulties reported
* Bad, because focused on errors, less on general observability

### Custom Logging

Build logging/metrics from scratch.

* Good, because complete control over implementation
* Good, because minimal dependencies
* Good, because tailored to exact needs
* Bad, because no semantic conventions
* Bad, because no ecosystem tooling
* Bad, because significant development effort
* Bad, because no trace correlation built-in

### Pino + Prometheus

Separate solutions for structured logging and metrics.

* Good, because Pino is mature and fast
* Good, because Prometheus metrics are well-understood
* Good, because less complex than full OTEL
* Bad, because no trace correlation between logs and metrics
* Bad, because two separate systems to configure
* Bad, because no distributed tracing

## More Information

### Bun Compatibility Constraints

From the [O11Y Research Report](../../.claude/plans/unified-beads-webui/references/o11y-research-report.md):

| What Works | What Breaks/Degrades |
|------------|---------------------|
| `@opentelemetry/sdk-node` initializes | ESM auto-instrumentation (no `module.register()`) |
| OTLP HTTP exporter | gRPC exporter (protocol errors in edge cases) |
| AsyncLocalStorage for context | Some custom thenables lose context |
| Bun preload mechanism | `--require` flag (Node.js specific) |

**Required workarounds:**
- Use OTLP HTTP (`http/protobuf`), not gRPC
- Initialize via Bun's `bunfig.toml` preload
- Mark instrumented libs as `--external` when bundling
- Disable problematic auto-instrumentations (fs, dns)

### Signal Maturity

| Signal | Status | Approach |
|--------|--------|----------|
| Traces | Stable | Direct SDK usage, manual spans |
| Metrics | Stable (SDK 2.0) | Direct SDK usage, custom business metrics |
| Logs | Experimental | Pino with OTEL Logs Bridge API for trace correlation |

### CLI-Specific Patterns

CLI tools require special handling:
- Use `SimpleSpanProcessor` or call `provider.shutdown()` before exit
- Set `SpanKind.INTERNAL` for CLI operations
- Record `process.command_args` and `process.exit.code` as attributes
- For cross-process tracing, use `TRACEPARENT` environment variable

### Package Structure

```
@opentelemetry/api              # Stable - trace/metrics interfaces
@opentelemetry/sdk-node         # Experimental (bundles logs) - SDK entry point
@opentelemetry/sdk-trace-node   # Stable - trace SDK
@opentelemetry/sdk-metrics      # Stable - metrics SDK
@opentelemetry/exporter-trace-otlp-http    # OTLP HTTP export
@opentelemetry/exporter-metrics-otlp-http  # OTLP HTTP export
@opentelemetry/semantic-conventions        # Standard attribute names
pino                            # Structured logging
pino-opentelemetry-transport    # Logs Bridge integration (when available)
```

### References

* [OpenTelemetry JS SDK](https://opentelemetry.io/docs/languages/js/)
* [O11Y Research Report](../../.claude/plans/unified-beads-webui/references/o11y-research-report.md)
* [Constraint: Bun OTEL Compatibility](../../.claude/plans/unified-beads-webui/docs/constraint-0001-bun-otel-compatibility.md)
* [Spec: Observability Architecture](../../.claude/plans/unified-beads-webui/spec/observability.md)
* [ADR-0002: Use Bun as Primary Runtime](./0002-use-bun-as-primary-runtime.md)
