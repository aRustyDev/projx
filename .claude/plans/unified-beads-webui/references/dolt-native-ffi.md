# Dolt Native FFI Research

> Technical analysis of approaches for accessing embedded Dolt from Node.js via CGO/FFI.

**Status**: Research
**Related**: [Federated DAL Reference](./federated-dal.md) | [ADR-0022](../../../../docs/src/adrs/0022-federated-data-access-layer-for-multi-source-support.md)

---

## Executive Summary

Embedding Dolt in Node.js is **technically feasible** via CGO shared libraries and FFI bindings, but introduces significant complexity. The recommended approach depends on requirements:

| Requirement | Recommended Approach |
|-------------|---------------------|
| Need versioned SQL database | Dolt server + MySQL driver |
| Need truly embedded, single-process | CGO wrapper + N-API addon |
| Need browser/edge runtime | Not viable with current tooling |

---

## 1. The `dolthub/driver` Package

### Overview

The [dolthub/driver](https://github.com/dolthub/driver) package provides a `database/sql`-compatible driver for embedding Dolt in Go applications without running a separate server process.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                    dolthub/driver                    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐   │
│  │           go-mysql-server (475k LOC)         │   │
│  │     Storage-agnostic MySQL SQL engine        │   │
│  └─────────────────────────────────────────────┘   │
│                        │                            │
│  ┌─────────────────────────────────────────────┐   │
│  │              Dolt Core (762k LOC)            │   │
│  │   Noms storage + Prolly trees + Versioning   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### API Usage (Go)

```go
import (
    "database/sql"
    "github.com/dolthub/driver"
)

// DSN Format: file:///path/to/dbs?commitname=Name&commitemail=email@example.com&database=dbname

cfg, err := driver.ParseDSN("file:///dbs?commitname=User&commitemail=user@example.com&database=mydb")
connector, err := driver.NewConnector(cfg)
db := sql.OpenDB(connector)

rows, err := db.QueryContext(ctx, "SELECT * FROM issues")
```

### DSN Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `commitname` | Yes | Committer name for Dolt logs |
| `commitemail` | Yes | Committer email for Dolt logs |
| `database` | No | Initial database to connect to |
| `multistatements` | No | Enable multi-statement queries |

---

## 2. CGO Wrapper Approach

### Building a C-Shared Library

```go
// libdolt_wrapper.go
package main

/*
#include <stdlib.h>

typedef struct {
    char* data;
    int length;
    char* error;
} QueryResult;
*/
import "C"

import (
    "database/sql"
    "encoding/json"
    "unsafe"

    _ "github.com/dolthub/driver"
)

var connections = make(map[int]*sql.DB)
var connCounter int

//export DoltOpen
func DoltOpen(dsn *C.char) C.int {
    db, err := sql.Open("dolt", C.GoString(dsn))
    if err != nil {
        return -1
    }
    connCounter++
    connections[connCounter] = db
    return C.int(connCounter)
}

//export DoltQuery
func DoltQuery(connID C.int, query *C.char) *C.QueryResult {
    result := (*C.QueryResult)(C.malloc(C.sizeof_QueryResult))

    db, ok := connections[int(connID)]
    if !ok {
        result.error = C.CString("invalid connection")
        return result
    }

    rows, err := db.Query(C.GoString(query))
    if err != nil {
        result.error = C.CString(err.Error())
        return result
    }
    defer rows.Close()

    // Convert to JSON for cross-language compatibility
    var results []map[string]interface{}
    columns, _ := rows.Columns()

    for rows.Next() {
        values := make([]interface{}, len(columns))
        pointers := make([]interface{}, len(columns))
        for i := range values {
            pointers[i] = &values[i]
        }
        rows.Scan(pointers...)

        row := make(map[string]interface{})
        for i, col := range columns {
            row[col] = values[i]
        }
        results = append(results, row)
    }

    jsonData, _ := json.Marshal(results)
    result.data = C.CString(string(jsonData))
    result.length = C.int(len(jsonData))
    result.error = nil

    return result
}

//export DoltClose
func DoltClose(connID C.int) {
    if db, ok := connections[int(connID)]; ok {
        db.Close()
        delete(connections, int(connID))
    }
}

//export DoltFreeResult
func DoltFreeResult(result *C.QueryResult) {
    if result.data != nil {
        C.free(unsafe.Pointer(result.data))
    }
    if result.error != nil {
        C.free(unsafe.Pointer(result.error))
    }
    C.free(unsafe.Pointer(result))
}

func main() {}
```

### Build Command

```bash
CGO_ENABLED=1 go build -buildmode=c-shared -o libdolt.so libdolt_wrapper.go
```

Outputs:
- `libdolt.so` - Shared library (~100-200MB with bundled Go runtime)
- `libdolt.h` - C header with type definitions

### CGO Performance Characteristics

| Metric | Value |
|--------|-------|
| CGO call overhead | ~171 nanoseconds |
| Pure Go call | ~1.83 nanoseconds |
| Overhead ratio | ~100x per call |

This overhead is negligible for database operations where query execution dominates.

### CGO Limitations

1. **Memory Management**: Go is garbage-collected; C is not. Explicit freeing required.
2. **Complex Types**: Cannot export Go structs/slices directly - must serialize
3. **Threading**: Blocking CGO calls consume system threads
4. **Build Complexity**: Cross-compilation requires full C toolchains per platform

---

## 3. Node.js FFI Options

### Option A: node-ffi-napi

Pure JavaScript FFI without native compilation.

```javascript
// dolt.js
const ffi = require('ffi-napi');
const ref = require('ref-napi');
const StructType = require('ref-struct-napi');

const QueryResult = StructType({
    data: 'string',
    length: 'int',
    error: 'string'
});
const QueryResultPtr = ref.refType(QueryResult);

const libdolt = ffi.Library('./libdolt.so', {
    'DoltOpen': ['int', ['string']],
    'DoltQuery': [QueryResultPtr, ['int', 'string']],
    'DoltClose': ['void', ['int']],
    'DoltFreeResult': ['void', [QueryResultPtr]]
});

class DoltConnection {
    constructor(dsn) {
        this.connId = libdolt.DoltOpen(dsn);
        if (this.connId < 0) {
            throw new Error('Failed to open Dolt connection');
        }
    }

    query(sql) {
        const result = libdolt.DoltQuery(this.connId, sql);
        const deref = result.deref();

        if (deref.error) {
            const error = deref.error;
            libdolt.DoltFreeResult(result);
            throw new Error(error);
        }

        const data = JSON.parse(deref.data);
        libdolt.DoltFreeResult(result);
        return data;
    }

    close() {
        libdolt.DoltClose(this.connId);
    }
}
```

**Pros**: No native compilation for bindings, N-API stability
**Cons**: ~40ns overhead per FFI call, threading limitations

### Option B: Bun FFI

Built-in FFI with 2-6x better performance via TinyCC JIT.

```typescript
// dolt.ts (Bun)
import { dlopen, FFIType, suffix } from "bun:ffi";

const lib = dlopen(`./libdolt.${suffix}`, {
    DoltOpen: {
        args: [FFIType.cstring],
        returns: FFIType.i32,
    },
    DoltQuery: {
        args: [FFIType.i32, FFIType.cstring],
        returns: FFIType.ptr,
    },
    DoltClose: {
        args: [FFIType.i32],
        returns: FFIType.void,
    },
});

export function openDolt(dsn: string): number {
    const connId = lib.symbols.DoltOpen(Buffer.from(dsn + '\0'));
    if (connId < 0) throw new Error('Failed to open connection');
    return connId;
}
```

**Note**: Bun FFI is marked experimental, not recommended for production.

### Option C: N-API Native Addon

Most performant, requires C/C++ compilation.

```cpp
// dolt_addon.cpp
#include <napi.h>
#include "libdolt.h"

Napi::Value Open(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    std::string dsn = info[0].As<Napi::String>().Utf8Value();
    int connId = DoltOpen(dsn.c_str());
    return Napi::Number::New(env, connId);
}

Napi::Value Query(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    int connId = info[0].As<Napi::Number>().Int32Value();
    std::string sql = info[1].As<Napi::String>().Utf8Value();

    QueryResult* result = DoltQuery(connId, sql.c_str());

    if (result->error) {
        std::string error(result->error);
        DoltFreeResult(result);
        Napi::Error::New(env, error).ThrowAsJavaScriptException();
        return env.Undefined();
    }

    std::string json(result->data, result->length);
    DoltFreeResult(result);

    return Napi::String::New(env, json);
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("open", Napi::Function::New(env, Open));
    exports.Set("query", Napi::Function::New(env, Query));
    return exports;
}

NODE_API_MODULE(dolt, Init)
```

**Pros**: Best performance, full N-API stability
**Cons**: Requires C++ toolchain, platform-specific compilation

---

## 4. WASM Compilation Feasibility

### TinyGo Limitations

- **CGO Support**: Partial, Dolt dependencies may not compile
- **database/sql**: Has compilation issues in TinyGo
- **Reflection**: Limited support breaks many packages
- **Package Compatibility**: 204 Dolt packages likely won't all compile

### Standard Go WASM

- **No CGO**: `GOOS=js GOARCH=wasm` disables CGO entirely
- **Browser-focused**: Not designed for Node.js backends
- **Large binaries**: 10-50MB+ typical

### WASM Performance

| Approach | Overhead vs Native |
|----------|-------------------|
| Simple queries | 1.2x slower |
| Bulk operations | 1.5x slower |
| CPU-intensive | 2-3x slower |

### Verdict

**WASM not recommended for Dolt**. The massive codebase, complex dependencies, and database/sql requirements make it impractical.

---

## 5. Comparison Matrix

| Approach | Setup | Runtime Perf | Cross-Platform | Production Ready |
|----------|-------|--------------|----------------|------------------|
| MySQL Protocol | Low | Good | Yes | Yes |
| CGO + node-ffi-napi | High | Medium | Per-platform builds | Yes |
| CGO + Bun FFI | High | Good | Per-platform builds | No |
| CGO + N-API addon | Very High | Best | Per-platform builds | Yes |
| WASM | Very High | Poor | Yes | No |

---

## 6. Recommended Implementation Path

### For Production Today

Use Dolt's MySQL-compatible server mode:

```typescript
// Recommended approach
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,  // Dolt SQL server port
    user: 'root',
    database: 'mydb'
});
```

### For Future Embedded Support

If embedded Dolt becomes a requirement:

1. **Build CGO wrapper** exposing essential operations:
   - `DoltOpen(dsn) -> connId`
   - `DoltQuery(connId, sql) -> JSON results`
   - `DoltExec(connId, sql) -> affected rows`
   - `DoltClose(connId)`

2. **Use N-API addon** for best performance

3. **Serialize results as JSON** to avoid complex type marshaling

4. **Implement connection pooling** in Go layer

5. **Pre-compile for all targets**:
   - `linux-x64`
   - `darwin-x64`
   - `darwin-arm64`
   - `win32-x64`

### Build System Integration

```makefile
# Makefile for libdolt

PLATFORMS := linux-amd64 darwin-amd64 darwin-arm64 windows-amd64

.PHONY: all $(PLATFORMS)

all: $(PLATFORMS)

linux-amd64:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=1 \
		go build -buildmode=c-shared -o dist/linux-x64/libdolt.so

darwin-amd64:
	GOOS=darwin GOARCH=amd64 CGO_ENABLED=1 \
		go build -buildmode=c-shared -o dist/darwin-x64/libdolt.dylib

darwin-arm64:
	GOOS=darwin GOARCH=arm64 CGO_ENABLED=1 \
		go build -buildmode=c-shared -o dist/darwin-arm64/libdolt.dylib

windows-amd64:
	GOOS=windows GOARCH=amd64 CGO_ENABLED=1 \
		go build -buildmode=c-shared -o dist/win32-x64/libdolt.dll
```

---

## 7. Similar Projects for Reference

| Project | Approach | Notes |
|---------|----------|-------|
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | N-API + C | Gold standard for SQLite in Node.js |
| [sql.js](https://github.com/sql-js/sql.js) | WASM | SQLite compiled to WebAssembly |
| [go-ffi-demo](https://github.com/redredgroovy/go-ffi-demo) | CGO + FFI | Demonstrates Go→Node.js pattern |

---

## 8. Conclusion

| Scenario | Recommendation |
|----------|---------------|
| Team collaboration | Dolt server + mysql2 driver |
| Single-user local | Dolt server (localhost) or SQLite |
| Serverless/Edge | Not currently viable |
| Offline-first app | Future: CGO + N-API when needed |

The Federated DAL architecture ([federated-dal.md](./federated-dal.md)) is designed to accommodate a future `DoltNativeAdapter` when the FFI bindings are implemented. Until then, use `DoltServerAdapter` with the MySQL protocol.

---

## Sources

- [dolthub/driver - GitHub](https://github.com/dolthub/driver)
- [Embedding Dolt in Go Applications - DoltHub Blog](https://www.dolthub.com/blog/2022-07-25-embedded/)
- [The Cost and Complexity of Cgo - CockroachDB](https://www.cockroachlabs.com/blog/the-cost-and-complexity-of-cgo/)
- [node-ffi-napi - GitHub](https://github.com/node-ffi-napi/node-ffi-napi)
- [Bun FFI Documentation](https://bun.sh/docs/runtime/ffi)
- [go-cshared-examples - GitHub](https://github.com/vladimirvivien/go-cshared-examples)
