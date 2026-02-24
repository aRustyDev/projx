# OTEL instrumentation for TypeScript: a pragmatic landscape guide

**The official OpenTelemetry JS SDK is the clear starting point for greenfield TypeScript observability, but the ecosystem demands patience — traces are production-ready, metrics recently stabilized, and logs remain experimental.** For a Bun-first stack spanning HTTP services, serverless functions, and CLI tools, the story is more nuanced: the SDK works on Bun with manual setup and workarounds, but auto-instrumentation is partial and native runtime support doesn't exist. The wrapper ecosystem is growing but tilts heavily toward AI/LLM observability, leaving general-purpose developers largely working with the official SDK directly. This report maps the full instrumentation landscape, warts included.

---

## The official SDK after 2.0: modular, capable, verbose

The **OpenTelemetry JS SDK 2.0** shipped in March 2025, marking the project's most significant milestone. Stable packages now version at **≥2.0.0** while experimental packages sit at **≥0.200.0**. The release raised the floor to Node.js **≥18.19.0 || ≥20.6.0**, TypeScript **5.0.4**, and targets **ES2022** for better tree-shaking.

The SDK is genuinely modular. The core packages break into three tiers:

- **API layer** (`@opentelemetry/api`): Stable interfaces for traces, metrics, context, and baggage. Versioned independently from the SDK — library authors depend on this alone.
- **Stable SDK packages**: `@opentelemetry/sdk-trace-base`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/sdk-metrics`, `@opentelemetry/context-async-hooks`, `@opentelemetry/semantic-conventions`. These carry long-term support guarantees.
- **Experimental packages**: `@opentelemetry/sdk-logs`, `@opentelemetry/api-logs`, `@opentelemetry/sdk-node`, and all OTLP exporters. These may introduce breaking changes between releases.

A critical gotcha: **`@opentelemetry/sdk-node` — the recommended entry point — is itself experimental** because it bundles experimental components like the logs SDK. This creates a confusing situation where the "getting started" package technically lacks stability guarantees. In practice, its trace and metrics functionality is solid, but teams sensitive to semver breakage should be aware.

The dependency footprint is a real concern. The meta-package `@opentelemetry/auto-instrumentations-node` (v0.70.0) pulls in instrumentation for **dozens of libraries** — Express, Fastify, PostgreSQL, MongoDB, Redis, Kafka, AWS SDK, gRPC, and many more. The official docs explicitly warn that this "increases your dependency graph size" and recommend individual instrumentation packages if you know what you need. For CLI tools or lean services, cherry-picking `@opentelemetry/instrumentation-http` and only what's needed keeps `node_modules` manageable.

Configuration verbosity remains the ecosystem's biggest DX complaint. Setting up the SDK requires understanding span processors, exporters, propagators, resource attributes, and the relationships between them. A **declarative YAML-based configuration** initiative reached RC3 in late 2025, promising simpler setup in the future. Environment variable configuration (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, etc.) helps but doesn't eliminate the boilerplate for programmatic setups.

---

## Signal maturity varies sharply between traces, metrics, and logs

Not all telemetry signals are created equal in the JS SDK. The maturity gap matters for planning:

**Traces are fully stable** and have been for years. The `sdk-trace-base` and `sdk-trace-node` packages are battle-tested, and auto-instrumentation covers the most common HTTP, database, and messaging libraries. This is the signal to start with.

**Metrics reached stability in SDK 2.0.** The `sdk-metrics` package is now in the stable tier, and `NodeSDK` auto-instantiates a metrics provider by default (disable with `OTEL_METRICS_EXPORTER=none`). Counter, histogram, gauge, and observable instrument types are all available. The ecosystem still has fewer metrics-specific auto-instrumentations compared to traces, so expect more manual instrumentation for custom business metrics.

**Logs remain experimental.** The `sdk-logs` and `api-logs` packages live in the experimental directory. The official getting-started guide explicitly states: "The logging library for OpenTelemetry for Node.js is still under development hence an example for it is not provided." The recommended approach is the **Logs Bridge API** — integrating with existing logging frameworks (Winston, Pino, Bunyan) via transport/hook packages that attach trace context to log records and forward them through the OTEL pipeline. Direct use of the Logs API is discouraged for application developers.

**Events** (built atop the Logs Bridge API) are also experimental. **Profiling** has no JS SDK implementation yet.

---

## Bun compatibility: functional but fragile

Bun's OpenTelemetry story as of early 2026 is best described as "works with effort, breaks at edges." The core SDK functions, but the developer experience lags significantly behind Node.js.

**What works:** The `@opentelemetry/sdk-node` package initializes and produces spans on Bun. The setup requires using Bun's preload mechanism rather than Node.js's `--require` flag:

```toml
# bunfig.toml
preload = ["./otel.ts"]
```

The OTLP HTTP exporter (`@opentelemetry/exporter-trace-otlp-http`) works reliably. **AsyncLocalStorage** — the foundation of OTEL context propagation — has been implemented in Bun since v0.7.0 and handles typical request-scoped tracing patterns correctly.

**What breaks or degrades:**

- **ESM auto-instrumentation is non-functional.** Bun doesn't implement `module.register()` or support Node's `--experimental-loader` hooks. The `import-in-the-middle` library that OTEL uses for ESM monkey-patching doesn't work. Only CommonJS module patching functions, and only when the SDK initializes before those modules are imported.
- **Some Node.js API gaps cause instrumentation failures.** GitHub issue **oven-sh/bun#6546** documents that OTEL's filesystem instrumentation crashes because Bun doesn't expose `opendirSync` identically to Node.js. Disable `@opentelemetry/instrumentation-fs` on Bun.
- **The gRPC exporter has edge cases.** Bun added HTTP/2 and gRPC support in v1.1.31 (passing ~95% of the gRPC test suite), but issue **#21759** reports protocol errors with `@grpc/grpc-js`. **Use OTLP HTTP (`http/protobuf`), not gRPC, on Bun.**
- **AsyncLocalStorage has edge-case bugs** with custom thenables (**#6393**) and NAPI interactions (**#13638**). This means some ORMs or libraries using promise-like patterns may lose trace context.
- **When using `bun build`**, instrumented libraries must be marked as `--external` to prevent bundling, since OTEL relies on runtime monkey-patching of `node_modules`.

**The Deno contrast is stark.** Deno 2.2 (February 2025) shipped **native, zero-config OpenTelemetry support** — running `OTEL_DENO=true deno run --unstable-otel server.ts` auto-instruments HTTP handlers, `fetch`, and even `console.log` with trace context. Bun has no equivalent. In GitHub Discussion **#7185**, Bun creator Jarred Sumner acknowledged "a telemetry API is something that a runtime should provide," but **no native OTEL support has been implemented or announced.** Community members describe this as a "critical blocker for production adoption."

For Bun-specific frameworks, the **`@elysiajs/opentelemetry`** plugin (v1.4.10, actively maintained) provides the most polished path, wrapping `@opentelemetry/sdk-node` with Bun-aware configuration. **Sentry's `@sentry/bun`** also uses OTEL under the hood, though some users report setup difficulties.

---

## Auto-instrumentation versus manual: when each makes sense

Auto-instrumentation via `@opentelemetry/auto-instrumentations-node` offers zero-code telemetry for dozens of libraries. It can be loaded entirely via environment variables:

```bash
node --require @opentelemetry/auto-instrumentations-node/register app.js
```

Or selectively:
```bash
export OTEL_NODE_ENABLED_INSTRUMENTATIONS="http,express,pg"
```

The tradeoffs are significant. Benchmarks from Platformatic on Node.js v22–v24 show full auto-instrumentation can **reduce throughput by over 80%**, though AsyncLocalStorage alone adds only ~7%. The massive overhead comes from hooking every library operation — filesystem calls, DNS lookups, and network activity generate enormous span volumes. Production deployments should disable noisy instrumentations (`fs`, `dns`, `net`) and use `BatchSpanProcessor` with sampling.

**Manual instrumentation wins for:**
- **CLI tools and batch jobs** — no HTTP frameworks to hook into, so auto-instrumentation adds nothing meaningful
- **Performance-critical paths** — you control exactly which operations generate spans
- **Business logic tracing** — auto-instrumentation captures infrastructure operations (HTTP calls, DB queries) but not domain-specific operations (order processing, payment workflows)
- **Bun applications** — ESM auto-instrumentation doesn't work, making manual instrumentation the more reliable path
- **ESM-only codebases on Node.js** — auto-instrumentation via `import-in-the-middle` is still experimental

**Auto-instrumentation wins for:** rapid prototyping, HTTP-heavy services where infrastructure-level traces provide immediate value, and teams that want baseline observability without writing instrumentation code.

The practical recommendation for the user's stack: **start with manual instrumentation for CLI tools and serverless functions**, use selective auto-instrumentation for HTTP services (enable only the libraries you actually use), and layer in manual business-logic spans on top.

---

## The wrapper ecosystem: mostly AI-focused, few general-purpose options

The landscape of libraries wrapping OTEL JS for better DX divides into four categories, and the options for general-purpose use are thinner than expected.

**General-purpose DX wrappers** are the smallest category. **HyperDX** (`@hyperdx/node-opentelemetry`, MIT license, ~9,300 GitHub stars) provides a `initSDK()` one-liner that auto-configures tracing, metrics, and logs with Winston/Pino integration. **Uptrace** (`@uptrace/node`) is self-described as "a thin wrapper that configures the OpenTelemetry SDK" — purely a configuration convenience using DSN-based setup. **`@vercel/otel`** simplifies setup for Next.js with `registerOTel({ serviceName: 'my-app' })` and works outside Vercel (falling back to standard OTLP environment variables), but it's optimized for HTTP request tracing, not CLI or background work.

**AI/LLM observability wrappers** dominate the ecosystem. **Laminar** (`@lmnr-ai/lmnr`, Apache-2.0, ~2,600 stars) provides `observe()` function wrappers and auto-instruments OpenAI, Anthropic, and LangChain. **OpenLLMetry** by Traceloop (`openllmetry-js`, Apache-2.0) extends OTEL with GenAI semantic conventions for LLM providers and vector databases. **Axiom's AI SDK** wraps Vercel AI SDK models with OTEL spans. All are OTEL-native but exclusively target AI workloads — **none are useful as general-purpose instrumentation layers.**

**Framework-specific plugins** fill important gaps. **`@fastify/otel`** (MIT) is now the official Fastify instrumentation, replacing the deprecated `@opentelemetry/instrumentation-fastify` as of June 2025. **`@microlabs/otel-cf-workers`** (MIT) is essential for Cloudflare Workers, where the standard Node.js SDK cannot run — it wraps Worker handlers and auto-instruments `fetch`, KV, D1, and Durable Objects. **`@elysiajs/opentelemetry`** serves the Bun/ElysiaJS ecosystem.

**Full observability platforms with open-source SDKs** include **Highlight.io** (`@highlight-run/node`, Apache-2.0, now owned by LaunchDarkly) which bundles OTEL internally with session replay, error tracking, and framework-specific packages for Next.js, NestJS, Remix, and notably Cloudflare Workers. **SigNoz** takes the opposite approach — no custom SDK at all, directing users to raw OTEL packages.

The honest assessment: **there is no standout general-purpose library that dramatically improves OTEL JS DX for non-AI workloads.** The official SDK, despite its verbosity, remains the most flexible and well-documented option. The configuration boilerplate is a one-time cost that pays for itself in customization ability.

---

## Instrumenting CLI tools, serverless, and non-HTTP workloads

Non-HTTP applications require patterns that differ significantly from the auto-instrumentation-friendly HTTP world.

**For CLI tools**, the critical concerns are span flushing and manual span creation. Short-lived processes must use either `SimpleSpanProcessor` (exports each span immediately, higher per-span overhead) or call `await provider.shutdown()` before process exit. OpenTelemetry has **dedicated CLI semantic conventions** specifying that span names should match the executable name, `SpanKind` should be `INTERNAL`, and `process.command_args` and `process.exit.code` should be recorded as attributes. A small community package called **`cli-opentelemetry`** on npm wraps CLI entry points with basic span creation, though it's minimally maintained. For cross-process context propagation, the `TRACEPARENT` environment variable convention (used by tools like `otel-cli`) works.

**For AWS Lambda**, the ecosystem is mature. `@opentelemetry/instrumentation-aws-lambda` (part of opentelemetry-js-contrib) wraps handlers and auto-flushes providers after each invocation. Official Lambda Layers from `open-telemetry/opentelemetry-lambda` bundle the SDK with an in-process Collector extension. The key gotcha: **set `disableAwsContextPropagation: true`** unless you're using X-Ray, because the default X-Ray propagator produces `NonRecordingSpan` without Active Tracing enabled. For esbuild users, Lambda handlers must use `module.exports` (not ES `export`) because the layer hot-patches handlers at runtime.

**For Cloudflare Workers**, two paths exist: Cloudflare's **built-in automatic tracing** (open beta, zero code changes, `observability.traces.enabled = true` in `wrangler.toml`) or `@microlabs/otel-cf-workers` for more control. The built-in option auto-instruments all I/O and exports OTEL-compliant spans to any OTLP endpoint — billing starts March 2026.

**For background job queues**, BullMQ offers **first-party OTEL support** via the `bullmq-otel` package, which traces job addition, bulk operations, and per-job processing with automatic context propagation between producer and consumer. Third-party alternatives from `@jenniferplusplus` and `@appsignal` provide auto-instrumentation via monkey-patching. For generic background workers and cron jobs, manual `tracer.startActiveSpan()` with appropriate `SpanKind.INTERNAL` or `SpanKind.CONSUMER` is the standard pattern.

**Context propagation across non-HTTP boundaries** follows a universal inject/extract pattern: the producer calls `propagation.inject(context.active(), carrier)` to serialize trace context into a carrier object (message metadata, job data, environment variable), and the consumer calls `propagation.extract(context.active(), carrier)` to reconstruct the parent context before creating child spans.

---

## Conclusion

The OTEL JS instrumentation ecosystem is capable but demands deliberate choices. For a greenfield Bun-first stack, the pragmatic path is: **use `@opentelemetry/api` and `@opentelemetry/sdk-node` directly**, configure OTLP HTTP export (not gRPC), initialize via Bun's preload mechanism, and lean on manual instrumentation over auto-instrumentation — especially for CLI tools and serverless functions where auto-instrumentation adds little value and Bun compatibility is shakiest. Cherry-pick individual auto-instrumentation packages for HTTP services rather than loading the full meta-package.

The biggest risk is Bun's lack of native OTEL support. Deno's built-in implementation shows what's possible, and the gap will likely narrow — but today, Bun users operate on a "works with workarounds" basis. Track **oven-sh/bun#7185** for any movement on native support. For production-critical services where observability cannot be fragile, Node.js remains the safer runtime choice. The logs signal's experimental status means structured logging through Pino or Winston with trace-context correlation (via the Logs Bridge API) is more practical than direct OTEL log emission. Finally, monitor the **declarative configuration** initiative and SDK 3.0 (expected mid-2026) — both aim to substantially reduce the setup complexity that is the ecosystem's most persistent pain point.
