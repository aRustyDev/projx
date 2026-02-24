# Constraint 0002: OpenTelemetry Signal Maturity Levels

**Status**: Active
**Created**: 2026-02-23
**Related**: [ADR-0011](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md), [O11Y Research Report](../references/o11y-research-report.md)

## Summary

OpenTelemetry JS SDK signals have different maturity levels. This constraint documents the stability status of each signal and the recommended approach for each.

## Signal Maturity Matrix

| Signal | Package | Stability | SDK Version | Approach |
|--------|---------|-----------|-------------|----------|
| **Traces** | `@opentelemetry/sdk-trace-node` | **Stable** | 2.0+ | Direct SDK usage |
| **Metrics** | `@opentelemetry/sdk-metrics` | **Stable** | 2.0+ | Direct SDK usage |
| **Logs** | `@opentelemetry/sdk-logs` | Experimental | 0.200+ | Pino + Logs Bridge |
| **Events** | Built on Logs API | Experimental | - | Defer until stable |
| **Profiling** | N/A | Not implemented | - | Use external profiler |

## Constraint Details

### Traces (Stable)

**Status**: Production-ready since SDK 1.x, long-term support in 2.0+

**Can use directly:**
```typescript
import { trace } from '@opentelemetry/api';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

const provider = new NodeTracerProvider();
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register();

const tracer = trace.getTracer('projx-ui', '1.0.0');
```

**Best practices:**
- Use `BatchSpanProcessor` in production (SimpleSpanProcessor for CLI tools)
- Follow semantic conventions for attribute names
- Set appropriate `SpanKind` (INTERNAL, CLIENT, SERVER, etc.)

### Metrics (Stable)

**Status**: Reached stability in SDK 2.0 (March 2025)

**Can use directly:**
```typescript
import { metrics } from '@opentelemetry/api';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';

const meterProvider = new MeterProvider({
  readers: [new PeriodicExportingMetricReader({ exporter })],
});
metrics.setGlobalMeterProvider(meterProvider);

const meter = metrics.getMeter('projx-ui', '1.0.0');
const commandCounter = meter.createCounter('cli.commands.total');
```

**Available instrument types:**
- Counter (monotonic)
- UpDownCounter (non-monotonic)
- Histogram (distribution)
- ObservableCounter, ObservableUpDownCounter, ObservableGauge (async)

### Logs (Experimental)

**Status**: `@opentelemetry/sdk-logs` and `@opentelemetry/api-logs` are experimental

**DO NOT use directly for application logging.** The official getting-started guide explicitly states the logging library is under development.

**Recommended approach: Logs Bridge API**

Use an established logging library (Pino, Winston) and integrate trace context:

```typescript
import pino from 'pino';
import { trace, context } from '@opentelemetry/api';

const logger = pino({
  mixin() {
    const span = trace.getSpan(context.active());
    if (span) {
      const spanContext = span.spanContext();
      return {
        trace_id: spanContext.traceId,
        span_id: spanContext.spanId,
        trace_flags: spanContext.traceFlags,
      };
    }
    return {};
  },
});
```

**Future**: When `pino-opentelemetry-transport` matures, logs can be exported through OTEL pipeline while maintaining Pino as the logging interface.

## SDK Package Notes

### `@opentelemetry/sdk-node` is Experimental

The recommended entry point `@opentelemetry/sdk-node` is technically experimental because it bundles experimental components (logs SDK). However:

- Trace and metrics functionality is solid
- Safe to use for trace/metrics initialization
- Be aware of potential breaking changes in logs-related APIs

### Package Versioning

| Tier | Version Pattern | Stability |
|------|-----------------|-----------|
| Stable | `≥2.0.0` | Long-term support |
| Experimental | `≥0.200.0` | May have breaking changes |

## Impact on Implementation

1. **Traces**: Instrument freely, production-ready
2. **Metrics**: Instrument freely, production-ready
3. **Logs**: Use Pino, add trace context correlation
4. **Events**: Wait for stability, use logs for now
5. **Profiling**: External tools only (not in OTEL JS)

## Required Dependencies

```json
{
  "dependencies": {
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-node": "^0.200.0",
    "@opentelemetry/sdk-trace-node": "^2.0.0",
    "@opentelemetry/sdk-metrics": "^2.0.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.200.0",
    "@opentelemetry/exporter-metrics-otlp-http": "^0.200.0",
    "@opentelemetry/semantic-conventions": "^1.30.0",
    "pino": "^9.0.0"
  }
}
```

## Monitoring for Changes

- [OpenTelemetry JS Releases](https://github.com/open-telemetry/opentelemetry-js/releases)
- [SDK 3.0 Roadmap](https://github.com/open-telemetry/opentelemetry-js/milestone/3) - Expected mid-2026
- [Declarative Configuration RC](https://opentelemetry.io/docs/specs/otel/configuration/) - Simplifies setup

## References

- [O11Y Research Report](../references/o11y-research-report.md)
- [OpenTelemetry JS Documentation](https://opentelemetry.io/docs/languages/js/)
- [ADR-0011: Use OpenTelemetry for Observability](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md)
