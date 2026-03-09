#!/usr/bin/env bash

set -euo pipefail

# Vercel ignoreCommand semantics:
#   exit 0 -> ignore this build
#   exit 1 -> continue with the build
#
# Default-deny policy:
#   - allow builds only when explicitly requested
#   - skip all routine Git-triggered commits by default

log() {
  printf '[vercel-build-filter] %s\n' "$1"
}

raw_commit_message="${VERCEL_GIT_COMMIT_MESSAGE:-}"

if [[ -z "${raw_commit_message}" ]]; then
  log "VERCEL_GIT_COMMIT_MESSAGE is empty or unavailable."
  log "Allowing build because no Git commit message was provided."
  exit 1
fi

commit_message_lc="$(printf '%s' "${raw_commit_message}" | tr '[:upper:]' '[:lower:]')"

log "Evaluating commit message against the default-deny build policy."
log "Commit preview: $(printf '%s' "${commit_message_lc}" | tr '\r\n' ' ' | cut -c1-80)"

if [[ "${commit_message_lc}" == *"[build]"* ]]; then
  log "Build allowed: commit message contains [build]."
  exit 1
fi

if [[ "${commit_message_lc}" == release:* ]]; then
  log "Build allowed: commit message starts with release:."
  exit 1
fi

if [[ "${commit_message_lc}" == hotfix:* ]]; then
  log "Build allowed: commit message starts with hotfix:."
  exit 1
fi

log "Skipping build by default."
log "To force a build, use [build], release:, or hotfix: in the commit message."
exit 0
