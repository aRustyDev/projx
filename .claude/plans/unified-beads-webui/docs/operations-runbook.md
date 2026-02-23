# Operations Runbook

This document covers common operations, troubleshooting, and maintenance procedures for the Unified Beads WebUI.

---

## Table of Contents

1. [Starting and Stopping](#starting-and-stopping)
2. [Database Operations](#database-operations)
3. [Troubleshooting](#troubleshooting)
4. [Log Interpretation](#log-interpretation)
5. [Backup and Restore](#backup-and-restore)
6. [Health Checks](#health-checks)
7. [Common Issues](#common-issues)

---

## Starting and Stopping

### Development Mode

```bash
# Start development server
bun dev

# With specific port
PORT=4000 bun dev

# With verbose logging
LOG_LEVEL=debug bun dev
```

### Production Mode

```bash
# Build and preview
bun run build
bun run preview

# Or run built server directly
bun ./build/index.js
```

### With Docker (Penpot + Services)

```bash
# Start all services
just init
# or
docker compose -f .docker/compose.yaml up -d

# Stop all services
just clean
# or
docker compose -f .docker/compose.yaml down
```

---

## Database Operations

### Detecting Database Backend

```bash
# Check what backend is in use
bd config get storage.backend

# Or check directly
ls -la .beads/
# If beads.db exists → SQLite
# If dolt/ exists → Dolt
```

### SQLite Operations

```bash
# Open SQLite shell
sqlite3 .beads/beads.db

# Run query directly
sqlite3 .beads/beads.db "SELECT COUNT(*) FROM issues"

# Export to CSV
sqlite3 -header -csv .beads/beads.db "SELECT * FROM issues" > issues.csv

# Check database integrity
sqlite3 .beads/beads.db "PRAGMA integrity_check"
```

### Dolt Operations

```bash
# Connect to Dolt server
mysql -h 127.0.0.1 -P 3307 -u root beads_project

# Via bd CLI
bd sql "SELECT COUNT(*) FROM issues"

# View commit history
bd sql "SELECT * FROM dolt_log LIMIT 10"

# View diff between commits
bd sql "SELECT * FROM dolt_diff_issues WHERE from_commit='abc123'"
```

### JSONL Sync

```bash
# Force sync from database to JSONL
bd sync --force

# Verify sync status
bd sync --check

# View JSONL content
cat .beads/issues.jsonl | jq .
```

---

## Troubleshooting

### ProcessSupervisor Issues

**Symptom**: CLI commands hanging or timing out

```bash
# Check if bd CLI works directly
bd list --limit 1

# Check for zombie processes
ps aux | grep -E "(bd|gt)"

# Kill stuck processes
pkill -f "bd "
```

**Symptom**: Circuit breaker tripped

```bash
# Check server logs for circuit breaker state
grep "circuit" logs/server.log

# The circuit resets after 60s by default
# Or restart the server to reset immediately
```

### Database Connection Issues

**Symptom**: "Database locked" errors (SQLite)

```bash
# Find processes holding the database
fuser .beads/beads.db

# Check for WAL/SHM files
ls -la .beads/beads.db*

# Force checkpoint (clears WAL)
sqlite3 .beads/beads.db "PRAGMA wal_checkpoint(TRUNCATE)"
```

**Symptom**: "Connection refused" (Dolt)

```bash
# Check if Dolt server is running
pgrep -f "dolt sql-server"

# Check Dolt server logs
docker logs penpot-dolt 2>&1 | tail -50

# Restart Dolt server
bd dolt restart
```

### WebSocket Connection Issues

**Symptom**: Real-time updates not working

```bash
# Check WebSocket endpoint
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:3000/api/ws

# Check for file watcher issues
ps aux | grep chokidar
```

**Symptom**: Frequent reconnections

```bash
# Check server memory
ps -o pid,rss,command -p $(pgrep -f "bun.*dev")

# Check for file watcher overload
ls -la .beads/ | wc -l  # Too many files?
```

### Build Issues

**Symptom**: TypeScript errors on build

```bash
# Regenerate SvelteKit types
bunx svelte-kit sync

# Clear build cache
rm -rf .svelte-kit/
bun run build
```

**Symptom**: Missing dependencies

```bash
# Reinstall dependencies
rm -rf node_modules bun.lockb
bun install
```

---

## Log Interpretation

### Log Levels

| Level | When Used |
|-------|-----------|
| `error` | Unrecoverable errors, crashes |
| `warn` | Recoverable issues, deprecations |
| `info` | Normal operation events |
| `debug` | Detailed debugging (dev only) |

### Log Locations

| Log | Location | Purpose |
|-----|----------|---------|
| Server | stdout / `logs/server.log` | API, WebSocket, file watcher |
| CLI | stderr | bd/gt command output |
| Build | stdout | Vite build output |

### Common Log Patterns

```bash
# Successful CLI execution
[info] CLI: bd list completed in 45ms

# Circuit breaker warning
[warn] Circuit breaker: 3/5 failures, threshold approaching

# Circuit breaker open
[error] Circuit breaker OPEN: CLI unavailable for 60s

# WebSocket events
[info] WebSocket: Client connected (id: abc123)
[info] WebSocket: Broadcasting file:changed to 3 clients

# File watcher
[debug] Chokidar: .beads/issues.jsonl changed
[info] File watcher: Triggering refresh for issues
```

### Filtering Logs

```bash
# Show only errors
grep "\[error\]" logs/server.log

# Show CLI timing
grep "completed in" logs/server.log | tail -20

# Show WebSocket activity
grep "WebSocket" logs/server.log
```

---

## Backup and Restore

### SQLite Backup

```bash
# Simple file copy (while server stopped)
cp .beads/beads.db .beads/beads.db.backup

# Online backup (while server running)
sqlite3 .beads/beads.db ".backup .beads/beads.db.backup"

# Export to SQL
sqlite3 .beads/beads.db .dump > backup.sql
```

### SQLite Restore

```bash
# From file backup
cp .beads/beads.db.backup .beads/beads.db

# From SQL dump
sqlite3 .beads/beads.db < backup.sql
```

### Dolt Backup

```bash
# Clone to backup location
dolt clone file://.beads/dolt ./backup/dolt

# Export to SQL
bd sql "CALL dolt_backup('local', '/path/to/backup')"

# Or use Docker
docker exec penpot-dolt dolt dump > backup.sql
```

### JSONL Backup

```bash
# JSONL is already version-controllable
git add .beads/issues.jsonl
git commit -m "Backup issues"

# Or manual backup
cp .beads/issues.jsonl backups/issues-$(date +%Y%m%d).jsonl
```

### Full System Backup

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Database
sqlite3 .beads/beads.db ".backup $BACKUP_DIR/beads.db"

# JSONL files
cp .beads/*.jsonl "$BACKUP_DIR/"

# Memory/knowledge
cp -r .beads/memory "$BACKUP_DIR/" 2>/dev/null || true

# Configuration
cp .beads/config.toml "$BACKUP_DIR/" 2>/dev/null || true

echo "Backup created: $BACKUP_DIR"
```

---

## Health Checks

### Server Health

```bash
# API health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {"status":"ok","version":"1.0.0","uptime":12345}
```

### Database Health

```bash
# SQLite
sqlite3 .beads/beads.db "PRAGMA integrity_check"
# Expected: ok

# Dolt
bd sql "SELECT @@dolt_status"
```

### CLI Health

```bash
# bd CLI
bd --version && echo "bd: OK"

# gt CLI (if Gas-Town enabled)
gt --version && echo "gt: OK"
```

### Full Health Check Script

```bash
#!/bin/bash
# health-check.sh

echo "=== Server ==="
curl -sf http://localhost:3000/api/health && echo " OK" || echo " FAIL"

echo "=== Database ==="
sqlite3 .beads/beads.db "SELECT COUNT(*) FROM issues" > /dev/null && echo "OK" || echo "FAIL"

echo "=== CLI ==="
bd list --limit 1 > /dev/null 2>&1 && echo "bd: OK" || echo "bd: FAIL"

echo "=== WebSocket ==="
timeout 2 websocat ws://localhost:3000/api/ws --ping-interval 1 > /dev/null 2>&1 && echo "OK" || echo "FAIL"

echo "=== File Watcher ==="
pgrep -f chokidar > /dev/null && echo "OK" || echo "NOT RUNNING"
```

---

## Common Issues

### Issue: "Cannot find .beads directory"

**Cause**: Running from wrong directory or Beads not initialized.

**Solution**:
```bash
# Check current directory
pwd

# Initialize Beads
bd init

# Or create manually
mkdir -p .beads
touch .beads/issues.jsonl
```

### Issue: "Permission denied" on CLI

**Cause**: bd/gt not in PATH or not executable.

**Solution**:
```bash
# Check if CLI exists
which bd

# Add to PATH
export PATH="$PATH:$HOME/.local/bin"

# Or install via recommended method
# (varies by system)
```

### Issue: "Port already in use"

**Cause**: Another process using port 3000.

**Solution**:
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 $(lsof -ti :3000)

# Or use different port
PORT=4000 bun dev
```

### Issue: "JSONL out of sync with database"

**Cause**: Direct database modification or interrupted sync.

**Solution**:
```bash
# Force regenerate JSONL
bd sync --force

# Verify
bd list --json | wc -l
cat .beads/issues.jsonl | wc -l
```

### Issue: "Stale data in UI"

**Cause**: File watcher not detecting changes or WebSocket disconnected.

**Solution**:
```bash
# Force refresh in browser
# Press Ctrl+Shift+R

# Check file watcher
touch .beads/issues.jsonl  # Should trigger refresh

# Restart server if needed
```

### Issue: "Agent sessions not appearing"

**Cause**: Gas-Town not enabled or gt CLI not available.

**Solution**:
```bash
# Check feature flag
echo $ENABLE_GASTOWN

# Check gt CLI
gt status

# Enable Gas-Town
ENABLE_GASTOWN=true bun dev
```

---

## Maintenance Tasks

### Weekly

- [ ] Check log file sizes, rotate if needed
- [ ] Verify backups are running
- [ ] Review error logs for patterns

### Monthly

- [ ] Database integrity check
- [ ] Clean old backup files
- [ ] Review performance metrics
- [ ] Update dependencies (minor versions)

### Quarterly

- [ ] Full dependency update
- [ ] Review and prune old issues
- [ ] Performance profiling
- [ ] Security audit

---

## Emergency Procedures

### Server Crash Recovery

1. Check logs for cause: `tail -100 logs/server.log`
2. Fix underlying issue if identifiable
3. Restart server: `bun dev` or `just init`
4. Verify health: `curl localhost:3000/api/health`

### Data Recovery

1. Stop server
2. Restore from latest backup
3. Sync JSONL: `bd sync --force`
4. Verify data: `bd list --limit 10`
5. Restart server

### Rollback Deployment

```bash
# If using git tags
git checkout v1.0.0
bun install
bun run build
bun run preview
```

---

## Contact

For issues not covered here, check:
- GitHub Issues: [project-url]/issues
- Documentation: [project-url]/docs
