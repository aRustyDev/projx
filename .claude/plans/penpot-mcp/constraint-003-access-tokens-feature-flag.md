# CONSTRAINT-003: Access Tokens Require Feature Flag

## Constraint
Penpot access tokens (for REST API authentication) require the `enable-access-tokens` feature flag to be set in `PENPOT_FLAGS` for both frontend and backend services.

## Configuration Required

### Docker Compose (compose.yaml)
```yaml
x-flags: &penpot-flags
  PENPOT_FLAGS: >-
    enable-access-tokens    # Required for API tokens
    enable-login-with-password
    enable-registration
    # ... other flags
```

Both services must include the flags:
```yaml
penpot-frontend:
  environment:
    <<: [*penpot-flags, ...]  # Must include enable-access-tokens

penpot-backend:
  environment:
    <<: [*penpot-flags, ...]  # Must include enable-access-tokens
```

## Feature Flag Details

| Flag | Service | Purpose |
|------|---------|---------|
| `enable-access-tokens` | Backend | Enables token generation API |
| `enable-access-tokens` | Frontend | Shows Access Tokens UI in account settings |

## User Workflow to Create Token

1. Log into Penpot web UI
2. Click avatar → "Your account"
3. Navigate to "Access tokens" tab (only visible if flag enabled)
4. Create new token with name and expiration
5. Copy token immediately (shown only once)

## Token Usage

```bash
# In API requests
curl -X POST http://localhost:9001/api/rpc/command/get-profile \
  -H "Authorization: Token YOUR_TOKEN_HERE" \
  -H "Accept: application/json" \
  -d '{}'
```

## Troubleshooting

### Token Option Not Visible in UI
1. Verify flag in compose.yaml
2. Restart containers: `docker compose -f .docker/compose.yaml down && docker compose -f .docker/compose.yaml up -d`
3. Hard refresh browser (Cmd+Shift+R)
4. Log out and back in

### Verify Flag in Running Container
```bash
docker inspect penpot-backend --format '{{range .Config.Env}}{{println .}}{{end}}' | grep PENPOT_FLAGS
# Should include: enable-access-tokens
```

### Demo Users May Have Restrictions
If using `enable-demo-users` flag, demo accounts may have limited access to token creation. Create a full registered account instead.

## Related
- bug-003-rest-api-transit-format-default.md
- scripts/penpot-setup.sh (uses access tokens)
