# Observability Specification

This document defines the observability architecture for the Unified Beads WebUI, including tracing, metrics, and logging patterns.

## Overview

The observability stack is built on OpenTelemetry, providing:
- **Traces**: Distributed tracing for request flows across CLI commands, WebSocket events, and DB operations
- **Metrics**: Counters, histograms, and gauges for system health and business KPIs
- **Logs**: Structured logging with trace context correlation via Pino

**Key References**:
- [ADR-0011: Use OpenTelemetry for Observability](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md)
- [Constraint 0001: Bun OTEL Compatibility](../docs/constraint-0001-bun-otel-compatibility.md)
- [Constraint 0002: OTEL Signal Maturity](../docs/constraint-0002-otel-signal-maturity.md)
- [Constraint 0003: CLI Instrumentation Patterns](../docs/constraint-0003-cli-instrumentation-patterns.md)
- [O11Y Research Report](../references/o11y-research-report.md)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Application Code                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ProcessSuper- │  │  WebSocket   │  │    Data      │              │
│  │   visor      │  │   Server     │  │Access Layer  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│  ┌──────▼─────────────────▼─────────────────▼───────┐              │
│  │              Telemetry Module                     │              │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────────────┐  │              │
│  │  │ Tracer  │  │  Meter  │  │ Logger (Pino)   │  │              │
│  │  └────┬────┘  └────┬────┘  └────────┬────────┘  │              │
│  │       │            │                │            │              │
│  │  ┌────▼────────────▼────────────────▼────┐      │              │
│  │  │         Context Propagation           │      │              │
│  │  │      (trace_id, span_id in logs)      │      │              │
│  │  └───────────────────┬───────────────────┘      │              │
│  └──────────────────────┼───────────────────────────┘              │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
           ┌──────────────▼──────────────┐
           │     OTLP HTTP Exporter      │
           │  (http://collector:4318)    │
           └──────────────┬──────────────┘
                          │
           ┌──────────────▼──────────────┐
           │       OTEL Collector        │
           │   (optional, for routing)   │
           └──────────────┬──────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌─────────┐      ┌─────────┐      ┌─────────┐
   │ Jaeger  │      │Prometheus│     │  Loki   │
   │(traces) │      │(metrics) │     │ (logs)  │
   └─────────┘      └─────────┘      └─────────┘
```

---

## Module Structure

```
src/lib/telemetry/
├── index.ts           # Public API exports
├── init.ts            # SDK initialization (preload)
├── tracer.ts          # Tracer configuration
├── metrics.ts         # Metrics definitions
├── logger.ts          # Pino logger with trace context
└── types.ts           # Type definitions
```

---

## Initialization

### Bun Preload

```toml
# bunfig.toml
preload = ["./src/lib/telemetry/init.ts"]
```

### SDK Setup

```typescript
// src/lib/telemetry/init.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { Resource } from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

const resource = new Resource({
  [ATTR_SERVICE_NAME]: 'projx-ui',
  [ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
  [ATTR_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development',
});

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
      ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
      : undefined,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`
        : undefined,
    }),
    exportIntervalMillis: 60000,
  }),
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await sdk.shutdown();
  process.exit(0);
});
```

---

## Traces

### Tracer Factory

```typescript
// src/lib/telemetry/tracer.ts
import { trace, Tracer } from '@opentelemetry/api';

export function getTracer(name: string, version?: string): Tracer {
  return trace.getTracer(`projx-ui.${name}`, version ?? '1.0.0');
}

// Pre-configured tracers for common modules
export const tracers = {
  cli: getTracer('cli'),
  ws: getTracer('websocket'),
  db: getTracer('database'),
  http: getTracer('http'),
};
```

### Span Naming Conventions

| Module | Span Name Pattern | Example |
|--------|-------------------|---------|
| CLI | `cli.<command>` | `cli.execute`, `cli.bd.create` |
| WebSocket | `ws.<event>` | `ws.connection`, `ws.broadcast` |
| Database | `db.<operation>` | `db.query`, `db.execute` |
| HTTP | `http.<method>.<route>` | `http.get./api/issues` |

### Required Attributes

**All spans:**
| Attribute | Type | Description |
|-----------|------|-------------|
| `service.name` | string | Always `projx-ui` |
| `service.version` | string | Package version |

**CLI spans:**
| Attribute | Type | Description |
|-----------|------|-------------|
| `process.command` | string | Command name (e.g., `bd`) |
| `process.command_args` | string[] | Command arguments |
| `process.exit.code` | int | Exit code (0 = success) |

**WebSocket spans:**
| Attribute | Type | Description |
|-----------|------|-------------|
| `ws.event_type` | string | Event name |
| `ws.client_count` | int | Connected clients |

**Database spans:**
| Attribute | Type | Description |
|-----------|------|-------------|
| `db.system` | string | `sqlite` or `dolt` |
| `db.statement` | string | SQL query (sanitized) |
| `db.operation` | string | `SELECT`, `INSERT`, etc. |

---

## Metrics

### Metric Definitions

```typescript
// src/lib/telemetry/metrics.ts
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('projx-ui', '1.0.0');

// CLI metrics
export const cliMetrics = {
  commandsTotal: meter.createCounter('cli.commands.total', {
    description: 'Total CLI commands executed',
    unit: '{command}',
  }),

  commandDuration: meter.createHistogram('cli.commands.duration', {
    description: 'CLI command execution duration',
    unit: 'ms',
  }),

  commandErrors: meter.createCounter('cli.commands.errors', {
    description: 'CLI command errors',
    unit: '{error}',
  }),
};

// Circuit breaker metrics
export const circuitBreakerMetrics = {
  state: meter.createObservableGauge('cli.circuit_breaker.state', {
    description: 'Circuit breaker state (0=closed, 1=half-open, 2=open)',
  }),

  transitions: meter.createCounter('cli.circuit_breaker.transitions', {
    description: 'Circuit breaker state transitions',
    unit: '{transition}',
  }),
};

// WebSocket metrics
export const wsMetrics = {
  connectionsActive: meter.createObservableGauge('ws.connections.active', {
    description: 'Active WebSocket connections',
    unit: '{connection}',
  }),

  messagesReceived: meter.createCounter('ws.messages.received', {
    description: 'WebSocket messages received',
    unit: '{message}',
  }),

  messagesSent: meter.createCounter('ws.messages.sent', {
    description: 'WebSocket messages sent',
    unit: '{message}',
  }),
};

// Database metrics
export const dbMetrics = {
  queriesTotal: meter.createCounter('db.queries.total', {
    description: 'Total database queries',
    unit: '{query}',
  }),

  queryDuration: meter.createHistogram('db.queries.duration', {
    description: 'Database query duration',
    unit: 'ms',
  }),
};
```

### Recording Metrics

```typescript
import { cliMetrics } from '$lib/telemetry/metrics';

async function executeCommand(cmd: string, args: string[]) {
  const startTime = performance.now();

  try {
    const result = await exec(cmd, args);
    cliMetrics.commandsTotal.add(1, { command: cmd, status: 'success' });
    return result;
  } catch (error) {
    cliMetrics.commandsTotal.add(1, { command: cmd, status: 'error' });
    cliMetrics.commandErrors.add(1, { command: cmd, error_type: error.name });
    throw error;
  } finally {
    const duration = performance.now() - startTime;
    cliMetrics.commandDuration.record(duration, { command: cmd });
  }
}
```

---

## Logging

### Logger Configuration

```typescript
// src/lib/telemetry/logger.ts
import pino from 'pino';
import { trace, context } from '@opentelemetry/api';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',

  // Add trace context to all log entries
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

  // Structured output for production
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
});

// Create child loggers for modules
export function getLogger(module: string) {
  return logger.child({ module });
}
```

### Usage Pattern

```typescript
import { getLogger } from '$lib/telemetry/logger';

const log = getLogger('process-supervisor');

class ProcessSupervisor {
  private transitionState(newState: CircuitState) {
    const previousState = this.circuitState;
    this.circuitState = newState;

    log.info(
      {
        event: 'circuit_breaker.state_change',
        previous_state: previousState,
        new_state: newState,
        consecutive_failures: this.consecutiveFailures,
      },
      `Circuit breaker: ${previousState} -> ${newState}`
    );
  }
}
```

### Log Levels

| Level | Use Case |
|-------|----------|
| `fatal` | Application crash, unrecoverable error |
| `error` | Failed operation that needs attention |
| `warn` | Recoverable issue, degraded operation |
| `info` | Significant business events |
| `debug` | Diagnostic information for debugging |
| `trace` | Highly detailed, verbose output |

---

## Instrumentation by Module

### ProcessSupervisor

```typescript
// src/lib/cli/supervisor.ts
import { tracers } from '$lib/telemetry/tracer';
import { cliMetrics, circuitBreakerMetrics } from '$lib/telemetry/metrics';
import { getLogger } from '$lib/telemetry/logger';
import { SpanKind, SpanStatusCode } from '@opentelemetry/api';

const log = getLogger('process-supervisor');

export class ProcessSupervisor {
  async execute(command: string, args: string[]): Promise<CommandResult> {
    return tracers.cli.startActiveSpan(
      'cli.execute',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'process.command': command,
          'process.command_args': args,
        },
      },
      async (span) => {
        const startTime = performance.now();

        try {
          const result = await this.exec(command, args, this.options);

          span.setAttribute('process.exit.code', 0);
          span.setStatus({ code: SpanStatusCode.OK });

          cliMetrics.commandsTotal.add(1, {
            command,
            status: 'success',
          });

          return result;
        } catch (error) {
          span.setAttribute('process.exit.code', error.exitCode ?? 1);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);

          cliMetrics.commandsTotal.add(1, {
            command,
            status: 'error',
          });
          cliMetrics.commandErrors.add(1, {
            command,
            error_type: error.name,
          });

          log.error({ command, args, error: error.message }, 'Command failed');

          throw error;
        } finally {
          const duration = performance.now() - startTime;
          cliMetrics.commandDuration.record(duration, { command });
          span.end();
        }
      }
    );
  }
}
```

### RealtimeServer (WebSocket)

```typescript
// src/lib/realtime/RealtimeServer.ts
import { tracers } from '$lib/telemetry/tracer';
import { wsMetrics } from '$lib/telemetry/metrics';
import { getLogger } from '$lib/telemetry/logger';
import { SpanKind } from '@opentelemetry/api';

const log = getLogger('realtime-server');

export class RealtimeServer extends EventEmitter {
  start(): void {
    // Register observable gauge for active connections
    wsMetrics.connectionsActive.addCallback((result) => {
      result.observe(this.clientCount);
    });

    this.wss.on('connection', (ws) => {
      tracers.ws.startActiveSpan(
        'ws.connection',
        { kind: SpanKind.SERVER },
        (span) => {
          log.info({ client_count: this.clientCount }, 'Client connected');
          span.setAttribute('ws.client_count', this.clientCount);
          span.end();
        }
      );

      ws.on('close', () => {
        tracers.ws.startActiveSpan('ws.disconnection', (span) => {
          log.info({ client_count: this.clientCount }, 'Client disconnected');
          span.end();
        });
      });
    });
  }

  broadcast(type: string, payload: unknown): void {
    tracers.ws.startActiveSpan(
      'ws.broadcast',
      {
        attributes: {
          'ws.event_type': type,
          'ws.client_count': this.clientCount,
        },
      },
      (span) => {
        const message = JSON.stringify({ type, payload });

        for (const client of this.wss.clients) {
          if (client.readyState === OPEN) {
            client.send(message);
            wsMetrics.messagesSent.add(1, { event_type: type });
          }
        }

        span.end();
      }
    );
  }
}
```

### FileWatcher

```typescript
// src/lib/realtime/FileWatcher.ts
import { tracers } from '$lib/telemetry/tracer';
import { getLogger } from '$lib/telemetry/logger';

const log = getLogger('file-watcher');

export class FileWatcher extends EventEmitter {
  private handleChange(path: string, type: 'change' | 'add' | 'unlink'): void {
    tracers.ws.startActiveSpan(
      'file.change',
      {
        attributes: {
          'file.path': path,
          'file.change_type': type,
        },
      },
      (span) => {
        log.debug({ path, type }, 'File change detected');
        this.emit('change', { path, type });
        span.end();
      }
    );
  }
}
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | (disabled) | Collector endpoint (e.g., `http://localhost:4318`) |
| `OTEL_SERVICE_NAME` | `projx-ui` | Service name for resource |
| `OTEL_LOG_LEVEL` | `info` | SDK log level |
| `LOG_LEVEL` | `info` | Application log level |
| `NODE_ENV` | `development` | Environment (affects log formatting) |

---

## Development Setup

### Local Collector (Docker Compose)

```yaml
# .docker/compose.yaml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    ports:
      - "4318:4318"   # OTLP HTTP
      - "8889:8889"   # Prometheus metrics
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    command: ["--config=/etc/otel-collector-config.yaml"]

  jaeger:
    image: jaegertracing/all-in-one:latest
    ports:
      - "16686:16686" # UI
      - "14268:14268" # Collector

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

### Disable for Tests

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    env: {
      OTEL_SDK_DISABLED: 'true', // Disable telemetry in tests
    },
  },
});
```

---

## Acceptance Criteria

All modules must meet these observability requirements:

- [ ] CLI command executions traced with span including args, exit code, duration
- [ ] WebSocket connections/disconnections emit spans
- [ ] Circuit breaker state changes logged with trace context
- [ ] Errors include span ID for correlation
- [ ] Metrics recorded: `cli.commands.total`, `ws.connections.active`, `cli.circuit_breaker.state`

---

## References

- [ADR-0011: Use OpenTelemetry for Observability](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md)
- [Constraint 0001: Bun OTEL Compatibility](../docs/constraint-0001-bun-otel-compatibility.md)
- [Constraint 0002: OTEL Signal Maturity](../docs/constraint-0002-otel-signal-maturity.md)
- [Constraint 0003: CLI Instrumentation Patterns](../docs/constraint-0003-cli-instrumentation-patterns.md)
- [O11Y Research Report](../references/o11y-research-report.md)
- [OpenTelemetry JS Documentation](https://opentelemetry.io/docs/languages/js/)
- [Pino Documentation](https://getpino.io/)
