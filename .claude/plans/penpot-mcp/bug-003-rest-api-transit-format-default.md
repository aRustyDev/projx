# BUG-003: REST API Returns Transit Format by Default Instead of JSON

## Summary
Penpot's REST API returns data in Transit format by default, which is not parseable by standard JSON tools like `jq`. Requires explicit `Accept: application/json` header.

## Environment
- **API Endpoint**: http://localhost:9001/api/rpc/command/*
- **Penpot Version**: latest (Docker)

## Steps to Reproduce
```bash
# Without Accept header - returns Transit format
curl -s -X POST http://localhost:9001/api/rpc/command/get-profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Token $TOKEN" \
  -d '{}'

# Returns: ["^ ","~:type","~:authentication","~:code",...]
```

## Expected Behavior
REST API should return JSON by default, or clearly document Transit format requirement.

## Actual Behavior
Returns Transit JSON format:
```
["^ ","~:type","~:authentication","~:code","~:authentication-required","~:hint","authentication required for this endpoint"]
```

This format:
- Cannot be parsed by `jq`
- Cannot be parsed by standard JSON libraries
- Requires Transit-specific decoder

## Workaround
Add explicit `Accept: application/json` header:
```bash
curl -s -X POST http://localhost:9001/api/rpc/command/get-profile \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Token $TOKEN" \
  -d '{}'

# Returns: {"id":"...","fullname":"...","email":"..."}
```

## Impact
- Scripts fail with cryptic jq errors
- Not documented in API docs
- Unexpected behavior for developers expecting JSON REST API

## Documentation Gap
The Penpot API documentation at `/api/main/doc` does not mention:
- Transit format as default
- Need for Accept header
- How to request JSON format
