---
number: 16
title: Use gh CLI for GitHub Operations
status: proposed
date: 2026-02-24
tags:
  - git
  - infrastructure
  - cli
deciders:
  - aRustyDev
links:
  - rel: Extends
    target: 5
---

# Use gh CLI for GitHub Operations

## Context and Problem Statement

The Unified Beads WebUI needs to interact with GitHub for pull request management, CI status tracking, and repository operations. We need to choose between using the official GitHub CLI (`gh`), a JavaScript SDK (Octokit), or direct REST/GraphQL API calls.

This decision extends ADR-0005 (CLI for writes, SQL for reads) by applying the same pattern to GitHub operations.

## Decision Drivers

* **Authentication**: Leverage existing user credentials without managing tokens
* **Consistency**: Align with ADR-0005 pattern (CLI for external interactions)
* **Feature parity**: Support all needed GitHub operations
* **Rate limiting**: Handle API limits gracefully
* **Offline resilience**: Degrade gracefully when GitHub is unreachable
* **Enterprise support**: Work with GitHub Enterprise Server

## Considered Options

* **gh CLI** - Official GitHub CLI tool
* **Octokit** - Official JavaScript SDK for GitHub API
* **Direct REST API** - Raw HTTP calls to api.github.com
* **GraphQL API** - GitHub's GraphQL endpoint

## Decision Outcome

Chosen option: **gh CLI**, because it provides authentication delegation, aligns with our CLI-first pattern, and handles edge cases (enterprise, SSO, rate limits) that we'd otherwise need to implement ourselves.

### Consequences

* Good, because authentication is handled by gh (OAuth, SSO, tokens)
* Good, because consistent with ADR-0005 pattern
* Good, because gh handles rate limiting and retries
* Good, because enterprise/GHES support built-in
* Good, because users can debug with same CLI locally
* Neutral, because requires gh CLI installation (in Brewfile)
* Bad, because CLI parsing adds small overhead vs direct API
* Bad, because harder to mock in tests than SDK

### Confirmation

* PR operations work via ProcessSupervisor with gh commands
* Auth status checked on startup, login flow available
* Rate limit errors handled with backoff and user notification

## Pros and Cons of the Options

### gh CLI

The official GitHub CLI tool, written in Go.

* Good, because handles OAuth flow with browser redirect
* Good, because supports SSO/SAML authentication automatically
* Good, because enterprise server support built-in
* Good, because handles rate limiting with retries
* Good, because JSON output mode for easy parsing
* Good, because users already familiar with it
* Good, because ProcessSupervisor integration is straightforward
* Neutral, because requires installation (but in Brewfile)
* Bad, because CLI output parsing is less structured than SDK
* Bad, because harder to unit test (need to mock ProcessSupervisor)

### Octokit

The official JavaScript/TypeScript SDK for GitHub API.

* Good, because native TypeScript types
* Good, because easy to unit test with mocks
* Good, because fine-grained control over requests
* Good, because supports both REST and GraphQL
* Neutral, because requires managing auth tokens ourselves
* Bad, because need to implement OAuth flow ourselves
* Bad, because SSO/SAML handling is complex
* Bad, because rate limiting logic must be implemented
* Bad, because doesn't align with ADR-0005 pattern

### Direct REST API

Raw HTTP calls using fetch or axios.

* Good, because no dependencies
* Good, because full control
* Bad, because need to implement everything ourselves
* Bad, because no TypeScript types without manual definition
* Bad, because authentication is complex
* Bad, because error handling is manual
* Bad, because significant development effort

### GraphQL API

Using GitHub's GraphQL endpoint directly.

* Good, because efficient queries (get exactly what's needed)
* Good, because can batch multiple queries
* Neutral, because learning curve for GraphQL
* Bad, because still need auth implementation
* Bad, because more complex query construction
* Bad, because same drawbacks as direct REST

## Implementation Pattern

### Command Execution

All gh commands run through ProcessSupervisor (from ADR-0005):

```typescript
// List PRs
const result = await supervisor.execute('gh', [
  'pr', 'list',
  '--json', 'number,title,state,author,headRefName'
], { timeout: 15000 });

// Create PR
await supervisor.execute('gh', [
  'pr', 'create',
  '--title', title,
  '--body', body,
  '--base', 'main'
], { timeout: 30000 });
```

### Authentication Flow

```typescript
async function checkGitHubAuth(): Promise<AuthStatus> {
  const result = await supervisor.execute('gh', ['auth', 'status'], {
    timeout: 5000
  });
  return { authenticated: result.exitCode === 0 };
}

async function initiateLogin(): Promise<void> {
  // Opens browser for OAuth
  await supervisor.execute('gh', ['auth', 'login', '--web'], {
    timeout: 120000  // 2 min for user interaction
  });
}
```

### Rate Limit Handling

```typescript
if (result.stderr.includes('rate limit')) {
  const resetMatch = result.stderr.match(/try again in (\d+)s/);
  const waitSeconds = resetMatch ? parseInt(resetMatch[1]) : 60;
  throw new RateLimitError(waitSeconds);
}
```

## Operations Supported

| Operation | Command | Timeout |
|-----------|---------|---------|
| List PRs | `gh pr list --json ...` | 15s |
| Get PR | `gh pr view <n> --json ...` | 10s |
| Create PR | `gh pr create --title ... --body ...` | 30s |
| Merge PR | `gh pr merge <n> --squash` | 30s |
| Get checks | `gh pr checks <n> --json ...` | 10s |
| Auth status | `gh auth status` | 5s |

## More Information

### Installation

```bash
# Via Homebrew (in Brewfile)
brew install gh

# Verify
gh --version
gh auth status
```

### References

* [ADR-0005: CLI for Writes and Direct SQL for Reads](./0005-cli-for-writes-and-direct-sql-for-reads.md)
* [Git Integration Spec](../../.claude/plans/unified-beads-webui/spec/git.md)
* [GitHub CLI Documentation](https://cli.github.com/manual/)
* [GitHub CLI Repository](https://github.com/cli/cli)
