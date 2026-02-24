# Constraint 0003: CLI Instrumentation Patterns

**Status**: Active
**Created**: 2026-02-23
**Related**: [ADR-0011](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md), [O11Y Research Report](../references/o11y-research-report.md)

## Summary

CLI tools and short-lived processes require different instrumentation patterns than long-running HTTP services. This constraint documents the specific patterns required for proper observability of CLI command execution.

## Constraint Details

### Span Flushing

**Problem**: Short-lived CLI processes may exit before spans are exported.

**Solution**: Use `SimpleSpanProcessor` or ensure graceful shutdown.

```typescript
// Option 1: SimpleSpanProcessor (immediate export, higher overhead)
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

// Option 2: Graceful shutdown (recommended for batch operations)
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

provider.addSpanProcessor(new BatchSpanProcessor(exporter));

// Before process exit
process.on('beforeExit', async () => {
  await provider.shutdown();
});
```

### CLI Semantic Conventions

OpenTelemetry defines specific attributes for process/CLI operations:

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `process.command` | string | Command name | `"bd"` |
| `process.command_args` | string[] | Command arguments | `["create", "--title", "Bug"]` |
| `process.command_line` | string | Full command line | `"bd create --title Bug"` |
| `process.exit.code` | int | Exit code | `0` or `1` |
| `process.pid` | int | Process ID | `12345` |
| `process.runtime.name` | string | Runtime name | `"bun"` |
| `process.runtime.version` | string | Runtime version | `"1.1.0"` |

### SpanKind

For CLI operations within the application:
- Use `SpanKind.INTERNAL` for internal CLI calls
- Use `SpanKind.CLIENT` when calling external processes

```typescript
import { SpanKind } from '@opentelemetry/api';

tracer.startActiveSpan('cli.execute', { kind: SpanKind.INTERNAL }, async (span) => {
  // ...
});
```

### Cross-Process Context Propagation

When spawning child processes that should be part of the same trace:

```typescript
import { context, propagation } from '@opentelemetry/api';

// Parent process: inject context into environment
const env = {};
propagation.inject(context.active(), env);

// Pass as TRACEPARENT environment variable
spawn('child-command', args, {
  env: { ...process.env, TRACEPARENT: env.traceparent }
});

// Child process: extract context
const parentContext = propagation.extract(context.active(), {
  traceparent: process.env.TRACEPARENT
});

context.with(parentContext, () => {
  tracer.startActiveSpan('child.operation', (span) => {
    // This span is now a child of the parent trace
  });
});
```

## Required Implementation Pattern

### ProcessSupervisor Instrumentation

```typescript
import { trace, SpanKind, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('projx-ui.cli');

export class ProcessSupervisor {
  async execute(command: string, args: string[]): Promise<CommandResult> {
    return tracer.startActiveSpan(
      'cli.execute',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'process.command': command,
          'process.command_args': args,
          'process.command_line': `${command} ${args.join(' ')}`,
        },
      },
      async (span) => {
        try {
          const result = await this.exec(command, args, this.options);

          span.setAttribute('process.exit.code', 0);
          span.setStatus({ code: SpanStatusCode.OK });

          return result;
        } catch (error) {
          span.setAttribute('process.exit.code', error.exitCode ?? 1);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.recordException(error);

          throw error;
        } finally {
          span.end();
        }
      }
    );
  }
}
```

### Circuit Breaker State Logging

Circuit breaker state changes should be logged with trace context:

```typescript
import pino from 'pino';
import { trace, context } from '@opentelemetry/api';

const logger = pino({ /* with trace context mixin */ });

class ProcessSupervisor {
  private transitionState(newState: CircuitState) {
    const previousState = this.circuitState;
    this.circuitState = newState;

    logger.info({
      event: 'circuit_breaker.state_change',
      previous_state: previousState,
      new_state: newState,
      consecutive_failures: this.consecutiveFailures,
    }, `Circuit breaker: ${previousState} -> ${newState}`);
  }
}
```

## Metrics for CLI Operations

```typescript
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('projx-ui.cli');

// Counter: total commands executed
const commandCounter = meter.createCounter('cli.commands.total', {
  description: 'Total number of CLI commands executed',
  unit: '{command}',
});

// Histogram: command duration
const commandDuration = meter.createHistogram('cli.commands.duration', {
  description: 'Duration of CLI command execution',
  unit: 'ms',
});

// Observable gauge: circuit breaker state (0=closed, 1=half-open, 2=open)
const circuitBreakerState = meter.createObservableGauge(
  'cli.circuit_breaker.state',
  {
    description: 'Current circuit breaker state',
  }
);
circuitBreakerState.addCallback((result) => {
  result.observe(STATE_VALUES[supervisor.circuitState]);
});
```

## Testing Considerations

Use dependency injection to mock telemetry in tests:

```typescript
// Production code
export function createProcessSupervisor(
  config: Config,
  tracer: Tracer = trace.getTracer('projx-ui.cli')
) {
  // ...
}

// Test
import { trace } from '@opentelemetry/api';

const mockTracer = {
  startActiveSpan: vi.fn((name, options, fn) => fn({
    setAttribute: vi.fn(),
    setStatus: vi.fn(),
    recordException: vi.fn(),
    end: vi.fn(),
  })),
};

const supervisor = createProcessSupervisor({}, mockTracer as unknown as Tracer);
```

## References

- [OpenTelemetry Process Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/resource/process/)
- [cli-opentelemetry npm package](https://www.npmjs.com/package/cli-opentelemetry)
- [O11Y Research Report - CLI section](../references/o11y-research-report.md)
- [ADR-0010: Use Dependency Injection for Testability](../../../../docs/src/adrs/0010-use-dependency-injection-for-testability.md)
