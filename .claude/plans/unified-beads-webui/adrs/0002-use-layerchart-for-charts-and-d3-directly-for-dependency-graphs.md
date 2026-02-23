---
number: 2
title: Use Layerchart for charts and D3 directly for dependency graphs
status: accepted
date: 2026-02-23
---

# Use Layerchart for charts and D3 directly for dependency graphs

## Context and Problem Statement

The Unified Beads WebUI requires two distinct types of visualizations:

1. **Analytics charts** - Lead Time scatterplots, Throughput bar charts, CFD area charts, Aging WIP charts, Gantt timelines
2. **Dependency graphs** - Force-directed node+edge visualizations showing issue relationships (blocks, blocked_by, relates_to)

We need to select charting libraries that work well with SvelteKit 2.x and Svelte 5, provide good developer experience, and meet our performance requirements.

## Decision Drivers

* Must be compatible with SvelteKit 2.x and Svelte 5 runes
* Reasonable bundle size (tree-shakeable preferred)
* Good documentation and community support
* Support for required chart types (scatter, bar, area, timeline)
* Support for interactive dependency graph visualization
* Accessibility support for charts
* SSR compatibility

## Considered Options

* **Layerchart only** - Svelte-native charting library built on D3
* **Chart.js + svelte-chartjs** - Mature canvas-based library with Svelte wrapper
* **D3.js only** - Maximum flexibility, direct DOM manipulation
* **Apache ECharts** - Feature-rich enterprise charting
* **Recharts** - React-specific (not compatible)
* **Hybrid: Layerchart + D3 directly** - Best of both worlds

## Decision Outcome

Chosen option: **Hybrid: Layerchart for analytics charts + D3 directly for dependency graphs**, because:

1. Layerchart is Svelte-native with excellent DX for standard charts
2. Layerchart does NOT support force-directed network graphs (only Sankey flow diagrams)
3. D3's `d3-force` module is the industry standard for dependency graph layout
4. Both share D3 foundations, so no conceptual overhead
5. D3 utilities (`d3-scale`, `d3-shape`, `d3-array`) are already included with Layerchart

### Consequences

* Good, because Layerchart provides declarative Svelte components for common charts
* Good, because D3 gives full control over dependency graph interactions
* Good, because both are SSR-compatible
* Good, because bundle size is reasonable with tree-shaking
* Neutral, because developers need familiarity with two APIs
* Bad, because D3 has a steeper learning curve for the dependency graph feature

### Confirmation

* Phase 2 analytics charts will use Layerchart exclusively
* Phase 3 dependency graph will use D3 directly with `d3-force`
* Performance benchmarks: charts render in <200ms, graphs handle 100+ nodes in <500ms
* Accessibility audit with axe-core

## Pros and Cons of the Options

### Layerchart only

Svelte-native charting library built on Layer Cake framework.

* Good, because native Svelte components with runes support
* Good, because built on D3 foundations
* Good, because composable architecture for custom visualizations
* Good, because good documentation
* Bad, because **does NOT support force-directed network graphs**
* Bad, because only supports Sankey (flow-based), not arbitrary node+edge graphs

### Chart.js + svelte-chartjs

Mature canvas-based library with Svelte wrapper.

* Good, because very mature and well-documented
* Good, because simpler API for basic charts
* Neutral, because canvas-based (harder to style, better performance for large datasets)
* Bad, because wrapper adds overhead
* Bad, because canvas is less accessible than SVG
* Bad, because no dependency graph support

### D3.js only

Direct D3 usage for all visualizations.

* Good, because maximum flexibility
* Good, because industry standard
* Good, because excellent for dependency graphs via d3-force
* Bad, because verbose for simple charts
* Bad, because steeper learning curve
* Bad, because more boilerplate code

### Apache ECharts

Feature-rich enterprise charting library.

* Good, because extensive chart types
* Good, because good performance
* Neutral, because has graph support but not force-directed layout
* Bad, because large bundle size
* Bad, because not Svelte-native
* Bad, because over-engineered for our needs

## More Information

### Usage Pattern

```svelte
<!-- Analytics charts: Layerchart -->
<script>
  import { Chart, Svg, Axis, Scatter } from 'layerchart';
</script>

<Chart {data} x="date" y="leadTime">
  <Svg>
    <Axis placement="bottom" />
    <Scatter radius={4} />
  </Svg>
</Chart>
```

```svelte
<!-- Dependency graph: D3 directly -->
<script>
  import { forceSimulation, forceLink, forceManyBody } from 'd3-force';

  const simulation = forceSimulation(nodes)
    .force('link', forceLink(edges))
    .force('charge', forceManyBody());
</script>

<svg>
  {#each edges as edge}
    <line x1={edge.source.x} y1={edge.source.y} x2={edge.target.x} y2={edge.target.y} />
  {/each}
  {#each nodes as node}
    <circle cx={node.x} cy={node.y} r={10} />
  {/each}
</svg>
```

### References

* [Layerchart Documentation](https://www.layerchart.com/)
* [D3 Force Documentation](https://d3js.org/d3-force)
* [Phase 2: Analytics & Timeline](../phase/02-analytics.md)
* [Phase 3: Git Integration - Dependency Graph](../phase/03-git-integration.md#33-dependency-graph-basic)
