#!/bin/bash

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // .command // empty')

DANGEROUS_PATTERNS=(
  "git\s+branch\s+-[a-z]*D"
  "git\s+checkout\s+\."
  "git\s+clean\s+-[a-z]*f"
  "git\s+filter-branch"
  "git\s+push"
  "git\s+reset\s+--hard"
  "git\s+restore\s+\."
  "push\s+--force"
  "reset\s+--hard"
)

for pattern in "${DANGEROUS_PATTERNS[@]}"; do
  if [[ "$COMMAND" =~ $pattern ]]; then
    echo "BLOCKED (git-guard): '$COMMAND' matches dangerous pattern '$pattern'. The user has prevented you from doing this." >&2
    exit 2
  fi
done

exit 0