/**
 * OpenTelemetry SDK initialization
 * @module lib/telemetry/init
 *
 * This file should be loaded via Bun's preload mechanism:
 * ```toml
 * # bunfig.toml
 * preload = ["./src/lib/telemetry/init.ts"]
 * ```
 *
 * @see https://opentelemetry.io/docs/languages/js/getting-started/nodejs/
 * @see ADR-0011 for decision rationale
 * @see Constraint 0001 for Bun compatibility requirements
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
	ATTR_SERVICE_NAME,
	ATTR_SERVICE_VERSION,
	SEMRESATTRS_DEPLOYMENT_ENVIRONMENT
} from '@opentelemetry/semantic-conventions';

// Skip initialization if disabled
if (process.env.OTEL_SDK_DISABLED === 'true') {
	console.log('[telemetry] SDK disabled via OTEL_SDK_DISABLED');
} else {
	const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

	// Resource attributes for this service
	const resource = resourceFromAttributes({
		[ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME ?? 'projx-ui',
		[ATTR_SERVICE_VERSION]: process.env.npm_package_version ?? '0.0.0',
		[SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV ?? 'development'
	});

	// Configure exporters only if endpoint is set
	const traceExporter = otlpEndpoint
		? new OTLPTraceExporter({
				url: `${otlpEndpoint}/v1/traces`
			})
		: undefined;

	const metricReader = otlpEndpoint
		? new PeriodicExportingMetricReader({
				exporter: new OTLPMetricExporter({
					url: `${otlpEndpoint}/v1/metrics`
				}),
				exportIntervalMillis: 60000
			})
		: undefined;

	// Initialize the SDK
	const sdk = new NodeSDK({
		resource,
		traceExporter,
		metricReader
	});

	sdk.start();

	if (otlpEndpoint) {
		console.log(`[telemetry] SDK initialized, exporting to ${otlpEndpoint}`);
	} else {
		console.log('[telemetry] SDK initialized (no export endpoint configured)');
	}

	// Graceful shutdown
	const shutdown = async () => {
		try {
			await sdk.shutdown();
			console.log('[telemetry] SDK shut down gracefully');
		} catch (error) {
			console.error('[telemetry] Error shutting down SDK:', error);
		}
	};

	process.on('SIGTERM', shutdown);
	process.on('SIGINT', shutdown);
}
