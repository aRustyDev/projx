# Constraint 0001: Bun OpenTelemetry Compatibility

**Status**: Active
**Created**: 2026-02-23
**Related**: [ADR-0011](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md), [O11Y Research Report](../references/o11y-research-report.md)

## Summary

Bun's OpenTelemetry support is functional but limited. This constraint documents the specific limitations and required workarounds when using OpenTelemetry with Bun runtime.

## Constraint Details

### What Works

| Feature | Status | Notes |
|---------|--------|-------|
| `@opentelemetry/sdk-node` initialization | Works | Produces spans correctly |
| OTLP HTTP exporter | Works | Use `http/protobuf` protocol |
| AsyncLocalStorage | Works | Context propagation functional since Bun v0.7.0 |
| Bun preload mechanism | Works | Use `bunfig.toml` instead of `--require` |
| Manual instrumentation | Works | Recommended approach |

### What Breaks or Degrades

| Feature | Status | Workaround |
|---------|--------|------------|
| ESM auto-instrumentation | Broken | No `module.register()` support; use manual instrumentation |
| gRPC exporter | Unstable | Protocol errors; use OTLP HTTP instead |
| `--require` flag | N/A | Use Bun's preload in `bunfig.toml` |
| `@opentelemetry/instrumentation-fs` | Crashes | Disable; Bun's `opendirSync` differs from Node.js |
| Some custom thenables | Edge cases | AsyncLocalStorage bugs with promise-like patterns |
| Bundled instrumentation | Broken | Must mark instrumented libs as `--external` |

### Native Support Gap

**Deno 2.2** (February 2025) shipped native, zero-config OpenTelemetry support:
```bash
OTEL_DENO=true deno run --unstable-otel server.ts
```

**Bun has no native OTEL support.** Track [oven-sh/bun#7185](https://github.com/oven-sh/bun/discussions/7185) for updates.

## Required Implementation Patterns

### SDK Initialization

```toml
# bunfig.toml
preload = ["./src/lib/telemetry/init.ts"]
```

```typescript
// src/lib/telemetry/init.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/traces',
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT + '/v1/metrics',
    }),
  }),
  // Do NOT use auto-instrumentations-node
});

sdk.start();
```

### Exporter Configuration

**DO:**
```typescript
new OTLPTraceExporter({
  url: 'http://localhost:4318/v1/traces', // HTTP endpoint
  headers: {},
});
```

**DON'T:**
```typescript
// gRPC has edge cases on Bun
new OTLPTraceExporter({
  url: 'grpc://localhost:4317',
});
```

### Bundling

When using `bun build`:
```bash
bun build src/index.ts --external @opentelemetry/* --external better-sqlite3
```

## Monitoring

Track these GitHub issues for improvements:
- [oven-sh/bun#7185](https://github.com/oven-sh/bun/discussions/7185) - Native OTEL support discussion
- [oven-sh/bun#6546](https://github.com/oven-sh/bun/issues/6546) - opendirSync compatibility
- [oven-sh/bun#6393](https://github.com/oven-sh/bun/issues/6393) - AsyncLocalStorage edge cases
- [oven-sh/bun#21759](https://github.com/oven-sh/bun/issues/21759) - gRPC protocol errors

## Impact on Development

1. **No auto-instrumentation magic** - All spans must be explicitly created
2. **Manual context propagation** - Must inject/extract trace context for cross-process scenarios
3. **Testing** - Use dependency injection to mock telemetry in tests
4. **CI/CD** - OTEL collector must use HTTP endpoints, not gRPC

## Alternatives Considered

If Bun compatibility becomes a critical blocker:
- **Node.js fallback**: Use Node.js for production where auto-instrumentation works
- **Deno migration**: Deno has native OTEL support (significant migration effort)
- **Sentry**: `@sentry/bun` exists but has reported setup difficulties

## References

- [O11Y Research Report](../references/o11y-research-report.md)
- [ADR-0002: Use Bun as Primary Runtime](../../../../docs/src/adrs/0002-use-bun-as-primary-runtime.md)
- [ADR-0011: Use OpenTelemetry for Observability](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md)
