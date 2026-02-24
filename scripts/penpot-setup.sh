#!/usr/bin/env bash
# Penpot Project Structure Setup Script
# Creates the Unified Beads WebUI design project with component files
#
# Prerequisites:
# 1. Get your Penpot access token from: Your Account → Access Tokens
# 2. Set PENPOT_TOKEN environment variable or pass as argument
#
# Usage:
#   PENPOT_TOKEN=your-token ./scripts/penpot-setup.sh
#   # or
#   ./scripts/penpot-setup.sh your-token

set -euo pipefail

# Configuration
PENPOT_API="${PENPOT_API:-http://localhost:9001/api/rpc/command}"
PENPOT_TOKEN="${PENPOT_TOKEN:-$1}"

if [[ -z "${PENPOT_TOKEN:-}" ]]; then
  echo "Error: PENPOT_TOKEN is required"
  echo "Get your token from Penpot: Your Account → Access Tokens"
  echo ""
  echo "Usage:"
  echo "  PENPOT_TOKEN=your-token ./scripts/penpot-setup.sh"
  echo "  ./scripts/penpot-setup.sh your-token"
  exit 1
fi

# Helper function for API calls
penpot_api() {
  local command="$1"
  local data="${2:-{}}"

  curl -s -X POST "${PENPOT_API}/${command}" \
    -H "Content-Type: application/json" \
    -H "Accept: application/json" \
    -H "Authorization: Token ${PENPOT_TOKEN}" \
    -d "${data}"
}

echo "=== Penpot Project Setup ==="
echo "API: ${PENPOT_API}"
echo ""

# Step 1: Get profile to find default team ID
echo "→ Fetching profile..."
PROFILE=$(penpot_api "get-profile")
echo "  Profile: $(echo "$PROFILE" | jq -c '{id, fullname, email}')"

TEAM_ID=$(echo "$PROFILE" | jq -r '.defaultTeamId // empty')

# Fallback: get teams if defaultTeamId not in profile
if [[ -z "$TEAM_ID" ]]; then
  echo "  defaultTeamId not in profile, fetching teams..."
  TEAMS=$(penpot_api "get-teams")
  # Get the first team (personal team)
  TEAM_ID=$(echo "$TEAMS" | jq -r '.[0].id // empty')
fi

if [[ -z "$TEAM_ID" ]]; then
  echo "Error: Could not get team ID. Check your token."
  echo "Profile response: $PROFILE"
  echo "Teams response: ${TEAMS:-'not fetched'}"
  exit 1
fi

echo "  Team ID: $TEAM_ID"

# Step 2: Create the project
echo ""
echo "→ Creating project: Unified Beads WebUI..."
PROJECT=$(penpot_api "create-project" "{\"teamId\":\"${TEAM_ID}\",\"name\":\"Unified Beads WebUI\"}")
PROJECT_ID=$(echo "$PROJECT" | jq -r '.id')

if [[ "$PROJECT_ID" == "null" || -z "$PROJECT_ID" ]]; then
  echo "Error: Could not create project."
  echo "Response: $PROJECT"
  exit 1
fi

echo "  Project ID: $PROJECT_ID"

# Step 3: Create design files for each component
echo ""
echo "→ Creating design files..."

FILES=(
  "00-Design-System"
  "01-Issue-List-View"
  "02-Kanban-Board"
  "03-Issue-Detail-Modal"
  "04-Filter-Panel"
  "05-Create-Issue-Modal"
  "06-Dashboard-Overview"
)

declare -A FILE_IDS

for file_name in "${FILES[@]}"; do
  echo "  Creating: $file_name"
  FILE=$(penpot_api "create-file" "{\"projectId\":\"${PROJECT_ID}\",\"name\":\"${file_name}\"}")
  FILE_ID=$(echo "$FILE" | jq -r '.id')

  if [[ "$FILE_ID" != "null" && -n "$FILE_ID" ]]; then
    FILE_IDS["$file_name"]="$FILE_ID"
    echo "    ID: $FILE_ID"
  else
    echo "    Warning: Could not create file"
  fi
done

# Summary
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Project: Unified Beads WebUI"
echo "Project ID: $PROJECT_ID"
echo ""
echo "Files created:"
for file_name in "${FILES[@]}"; do
  echo "  - $file_name: ${FILE_IDS[$file_name]:-'(failed)'}"
done
echo ""
echo "Next steps:"
echo "1. Open Penpot at ${PENPOT_API%/api/rpc/command}"
echo "2. Navigate to each file to create pages (wireframes, components, etc.)"
echo "3. Connect the penpot-plugin MCP to each file for programmatic page creation"
echo ""
echo "Suggested page structure per file:"
echo "  00-Design-System: Tokens, Colors, Typography, Components"
echo "  01-Issue-List-View: List, Empty State, Loading, Error"
echo "  02-Kanban-Board: Board, Columns, Cards, Drag States"
echo "  03-Issue-Detail-Modal: View, Edit, Comments, Activity"
echo "  04-Filter-Panel: Filters, Search, Presets, Applied"
echo "  05-Create-Issue-Modal: Form, Validation, Success"
echo "  06-Dashboard-Overview: Stats, Charts, Recent Activity"
