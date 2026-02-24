# projx-ui justfile
# Run `just --choose` for interactive recipe selection
# Run `just --list` to see all available recipes

set shell := ["bash", "-euo", "pipefail", "-c"]
set dotenv-load := true

# Import modules
mod docker '.docker/mod.just'
mod db '.beads/mod.database.just'

# Default recipe - interactive chooser with fancy menu
[private]
default:
    @just _menu

# ─────────────────────────────────────────────────────────────────────────────
# Development
# ─────────────────────────────────────────────────────────────────────────────

# Build all compilable assets (sveltekit + mdbook + docker)
build:
    @echo "Building SvelteKit..."
    bun run build
    @echo "Building documentation..."
    mdbook build docs
    @echo "Building Docker images..."
    docker compose -f .docker/compose.yaml build

# Run development server (builds first)
run: build
    bun run preview

# Start development server with hot reload
dev:
    bun run dev

# Install build to system (symlink to data_local_directory)
install: build
    #!/usr/bin/env bash
    set -euo pipefail
    local_dir="{{ data_local_directory() }}/bin"
    mkdir -p "$local_dir"
    bun link
    echo "Installed to $local_dir"
    echo "Ensure $local_dir is in your PATH"

# ─────────────────────────────────────────────────────────────────────────────
# Testing
# ─────────────────────────────────────────────────────────────────────────────
# NOTE: Use `bun run test:unit` (Vitest) NOT `bun test` (Bun's native runner)
#       Bun's native runner doesn't support jsdom for DOM testing
# ─────────────────────────────────────────────────────────────────────────────

# Run tests (typecheck + pre-commit + unit tests)
[arg("full", long, value="true")]
test full="false":
    @echo "Running type checks..."
    bun run check
    @echo "Running pre-commit hooks..."
    pre-commit run --all-files
    @echo "Running unit tests..."
    bun run test:unit
    {{ if full == "true" { "just _test-full" } else { "" } }}

# Run full test suite (e2e + visual + integration)
[private]
_test-full:
    @echo "Running E2E tests..."
    bun run test:e2e
    @echo "TODO: Visual tests not yet configured"
    @echo "TODO: Integration tests not yet configured"

# Run only type checking
typecheck:
    bun run check

# Run tests with coverage
test-coverage:
    bun run test:coverage

# Run only unit tests (fast, no type check or pre-commit)
test-unit:
    bun run test:unit

# Run a specific test file
test-file file:
    bun run vitest run "{{ file }}"

# Run tests matching a pattern
test-grep pattern:
    bun run vitest run -t "{{ pattern }}"

# Run unit tests in watch mode
test-watch:
    bun run vitest

# Run E2E tests only
test-e2e:
    bun run test:e2e

# Run E2E tests with Playwright UI
test-e2e-ui:
    bun run test:e2e:ui

# Run E2E tests in headed mode (visible browser)
test-e2e-headed:
    bun run playwright test --headed

# Run specific E2E test file
test-e2e-file file:
    bun run playwright test "{{ file }}"

# ─────────────────────────────────────────────────────────────────────────────
# Linting & Formatting
# ─────────────────────────────────────────────────────────────────────────────

# Run all linters (eslint + prettier check + svelte-check)
lint:
    @echo "Running ESLint..."
    bun run lint
    @echo "Checking Prettier formatting..."
    bun run format:check
    @echo "Running svelte-check..."
    bun run check

# Run all linters and fix issues
fix:
    @echo "Fixing ESLint issues..."
    bun run lint:fix
    @echo "Formatting with Prettier..."
    bun run format
    @echo "Running svelte-check..."
    bun run check

# ─────────────────────────────────────────────────────────────────────────────
# Release
# ─────────────────────────────────────────────────────────────────────────────

# Create a new release (use --dry-run to preview)
[arg("dry-run", long, value="true")]
release dry-run="false":
    {{ if dry-run == "true" { "./scripts/release.sh --dry-run" } else { "./scripts/release.sh" } }}

# Generate changelog for unreleased changes
changelog:
    git cliff --unreleased

# ─────────────────────────────────────────────────────────────────────────────
# Documentation
# ─────────────────────────────────────────────────────────────────────────────

# Build documentation
[arg("open", long, value="true")]
docs open="false":
    {{ if open == "true" { "mdbook serve docs --open" } else { "mdbook build docs" } }}

# ─────────────────────────────────────────────────────────────────────────────
# Search
# ─────────────────────────────────────────────────────────────────────────────

# Search across codebase (unified search with fzf)
[arg("code", long, value="true")]
[arg("docs", long, value="true")]
[arg("files", long, value="true")]
[arg("adrs", long, value="true")]
[arg("beads", long, value="true")]
search query code="false" docs="false" files="false" adrs="false" beads="false":
    #!/usr/bin/env bash
    set -euo pipefail

    query="{{ query }}"
    code="{{ code }}"
    docs="{{ docs }}"
    files="{{ files }}"
    adrs="{{ adrs }}"
    beads="{{ beads }}"

    # If no specific flag, search all
    all_false=true
    [[ "$code" == "true" || "$docs" == "true" || "$files" == "true" || "$adrs" == "true" || "$beads" == "true" ]] && all_false=false

    results=""

    # Code search with ripgrep
    if [[ "$code" == "true" || "$all_false" == "true" ]]; then
        code_results=$(rg --line-number --color=never "$query" --type ts --type svelte --type js 2>/dev/null | sed 's/^/[code] /' || true)
        results+="$code_results"$'\n'
    fi

    # File search with fd
    if [[ "$files" == "true" || "$all_false" == "true" ]]; then
        file_results=$(fd --color=never "$query" 2>/dev/null | sed 's/^/[file] /' || true)
        results+="$file_results"$'\n'
    fi

    # ADR search
    if [[ "$adrs" == "true" || "$all_false" == "true" ]]; then
        adr_results=$(rg --line-number --color=never "$query" docs/src/adrs/ .claude/plans/*/adrs/ 2>/dev/null | sed 's/^/[adr] /' || true)
        results+="$adr_results"$'\n'
    fi

    # Beads search (issues.jsonl)
    if [[ "$beads" == "true" || "$all_false" == "true" ]]; then
        beads_results=$(rg --line-number --color=never "$query" .beads/*.jsonl 2>/dev/null | sed 's/^/[beads] /' || true)
        results+="$beads_results"$'\n'
    fi

    # Docs search (markdown files)
    if [[ "$docs" == "true" || "$all_false" == "true" ]]; then
        docs_results=$(rg --line-number --color=never "$query" --type md 2>/dev/null | sed 's/^/[docs] /' || true)
        results+="$docs_results"$'\n'
    fi

    # Display results in fzf with preview
    echo "$results" | grep -v '^$' | fzf --ansi --preview 'echo {} | cut -d: -f1-2 | xargs -I{} sh -c "bat --color=always --style=numbers --line-range=:100 \$(echo {} | sed \"s/^\[.*\] //\" | cut -d: -f1) 2>/dev/null || cat \$(echo {} | sed \"s/^\[.*\] //\" | cut -d: -f1)"' --preview-window=right:60%

# ─────────────────────────────────────────────────────────────────────────────
# Initialization & Cleanup
# ─────────────────────────────────────────────────────────────────────────────

# Initialize development environment (brew + bun + docker)
init:
    @echo "Installing Homebrew dependencies..."
    brew bundle --file=Brewfile
    @echo "Installing Bun dependencies..."
    bun install
    @echo "Setting up git hooks..."
    bun run prepare
    @echo "Starting Docker services..."
    just docker up
    @echo "Initialization complete!"

# Clean build artifacts and docker containers
[arg("force", long, value="true")]
clean force="false":
    @echo "Removing build artifacts..."
    rm -rf build .svelte-kit node_modules/.vite
    @echo "Removing documentation build..."
    rm -rf docs/book
    @echo "Stopping Docker containers..."
    just docker down
    {{ if force == "true" { "just _clean-force" } else { "" } }}

# Force clean - hard reset of all generated content
[private]
_clean-force:
    @echo "Force cleaning - removing all generated content..."
    rm -rf node_modules
    rm -rf .beads/ephemeral.sqlite3
    docker system prune -f
    @echo "Force clean complete. Run 'just init' to reinitialize."

# Clean and rebuild
rebuild: clean build

# Clean and reinitialize
reinit:
    just clean --force
    just init

# ─────────────────────────────────────────────────────────────────────────────
# Interactive Menu
# ─────────────────────────────────────────────────────────────────────────────

# Fancy interactive menu using gum
[private]
_menu:
    #!/usr/bin/env bash
    set -euo pipefail

    if ! command -v gum &> /dev/null; then
        echo "gum not found. Install with: brew install gum"
        echo "Falling back to just --choose"
        just --choose
        exit 0
    fi

    category=$(gum choose --header "Select category:" \
        "Development" \
        "Testing" \
        "Linting" \
        "Documentation" \
        "Release" \
        "Search" \
        "Maintenance" \
        "Docker" \
        "Database")

    case "$category" in
        "Development")
            recipe=$(gum choose --header "Development:" \
                "dev       → Start dev server with hot reload" \
                "run       → Build and run preview server" \
                "build     → Build all assets" \
                "install   → Install to system")
            ;;
        "Testing")
            recipe=$(gum choose --header "Testing:" \
                "test          → Run quick tests (typecheck + unit)" \
                "test --full   → Run full test suite (+ e2e)" \
                "test-unit     → Run unit tests only (fast)" \
                "test-watch    → Run unit tests in watch mode" \
                "test-e2e      → Run E2E tests" \
                "test-e2e-ui   → Run E2E tests with Playwright UI" \
                "typecheck     → Run type checking only" \
                "test-coverage → Run tests with coverage")
            ;;
        "Linting")
            recipe=$(gum choose --header "Linting:" \
                "lint → Check code style" \
                "fix  → Fix code style issues")
            ;;
        "Documentation")
            recipe=$(gum choose --header "Documentation:" \
                "docs        → Build documentation" \
                "docs --open → Build and serve docs")
            ;;
        "Release")
            recipe=$(gum choose --header "Release:" \
                "release           → Create a new release" \
                "release --dry-run → Preview release (no changes)" \
                "changelog         → Show unreleased changes")
            ;;
        "Search")
            query=$(gum input --placeholder "Enter search query...")
            flags=$(gum choose --no-limit --header "Search in (space to select, enter to confirm):" \
                "--code" \
                "--docs" \
                "--files" \
                "--adrs" \
                "--beads" || true)
            just search "$query" $flags
            exit 0
            ;;
        "Maintenance")
            recipe=$(gum choose --header "Maintenance:" \
                "init          → Initialize dev environment" \
                "clean         → Clean build artifacts" \
                "clean --force → Hard reset everything" \
                "rebuild       → Clean and rebuild" \
                "reinit        → Clean and reinitialize")
            ;;
        "Docker")
            recipe=$(gum choose --header "Docker:" \
                "docker up      → Start containers" \
                "docker down    → Stop containers" \
                "docker logs    → View container logs" \
                "docker build   → Build images" \
                "docker restart → Restart containers")
            ;;
        "Database")
            recipe=$(gum choose --header "Database:" \
                "db reset   → Reset database" \
                "db migrate → Run migrations" \
                "db seed    → Seed with test data" \
                "db backup  → Backup database")
            ;;
    esac

    # Extract recipe name (before →)
    cmd=$(echo "$recipe" | sed 's/ *→.*//' | xargs)
    just $cmd
