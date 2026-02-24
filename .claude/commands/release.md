---
description: Create a new release with lint, test, build, version bump, and tag
argument-hint: [patch|minor|major] [--dry-run]
allowed-tools: Bash, Read, Edit
---

# Release Workflow

Execute the full release workflow: lint, test, build, version bump, changelog generation, tag creation, and push to trigger CI.

## Arguments

- `$1` - Version bump type (optional, default: `patch`)
  - `patch` - Bug fixes (0.0.x)
  - `minor` - New features (0.x.0)
  - `major` - Breaking changes (x.0.0)
- `--dry-run` - Preview changes without making them

## Workflow

### Step 1: Pre-flight Checks

1. Verify working directory is clean (no uncommitted changes)
2. Verify on `main` branch (warn if not)
3. Check required tools are available: `git`, `git-cliff`, `jq`, `bun`

```bash
# Check for uncommitted changes
git status --porcelain
```

### Step 2: Run Quality Checks

1. Run TypeScript type checking
2. Run linting
3. Run unit tests

```bash
bun run check
bun run lint
bun run test:unit
```

### Step 3: Determine Version

1. Read current version from `package.json`
2. Calculate new version based on bump type:
   - `patch`: increment third number (0.0.2 -> 0.0.3)
   - `minor`: increment second number, reset third (0.0.2 -> 0.1.0)
   - `major`: increment first number, reset others (0.0.2 -> 1.0.0)

```bash
CURRENT_VERSION=$(jq -r '.version' package.json)
```

### Step 4: Generate Changelog

1. Use `git-cliff` to generate changelog for unreleased commits
2. Update `CHANGELOG.md` with new version section

```bash
git cliff --tag "v${NEW_VERSION}" -o CHANGELOG.md
```

### Step 5: Update Version

1. Update `package.json` version field

```bash
jq ".version = \"${NEW_VERSION}\"" package.json > tmp.json && mv tmp.json package.json
```

### Step 6: Commit and Tag

1. Stage `package.json` and `CHANGELOG.md`
2. Commit with message: `chore(release): v${NEW_VERSION}`
3. Create annotated tag with release notes

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): v${NEW_VERSION}"
git tag -a "v${NEW_VERSION}" -m "${RELEASE_NOTES}"
```

### Step 7: Push

1. Push commits to origin
2. Push tags to trigger GitHub Actions release workflow

```bash
git push && git push --tags
```

## What Happens After Push

The GitHub Actions workflow will automatically:

1. **Build** - Compile the application
2. **Test** - Run type checks and unit tests
3. **SBOM** - Generate Software Bill of Materials
4. **Release** - Create GitHub release with:
   - Release tarball (`projx-ui-x.x.x.tar.gz`)
   - SBOM files (`sbom.json`, `sbom.xml`)
   - Auto-generated release notes
5. **Publish** - Publish to npm with provenance
6. **Sign** - Sign artifacts with Sigstore

## Examples

```bash
# Patch release (0.0.2 -> 0.0.3)
/release patch

# Minor release (0.0.2 -> 0.1.0)
/release minor

# Major release (0.0.2 -> 1.0.0)
/release major

# Preview without making changes
/release patch --dry-run

# Default (patch release)
/release
```

## Rollback

If something goes wrong after tagging but before push:

```bash
# Delete local tag
git tag -d v${VERSION}

# Reset commit
git reset --soft HEAD~1

# Restore files
git checkout -- package.json CHANGELOG.md
```

If already pushed:

```bash
# Delete remote tag
git push origin :refs/tags/v${VERSION}

# Delete local tag
git tag -d v${VERSION}

# Reset and force push (use with caution!)
git reset --hard HEAD~1
git push --force-with-lease
```

## Notes

- Always run from the `main` branch
- Ensure all CI checks pass before releasing
- The npm publish requires `NPM_TOKEN` secret in the `release` environment
- Sigstore signing is automatic via GitHub Actions OIDC
