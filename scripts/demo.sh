#!/usr/bin/env bash
# STEP 25 — exhibition start: Ollama up → models loaded (kept until Ollama stops) → production build → npm start → Chrome full screen.
# Usage: scripts/demo.sh            (rebuilds only when the source is newer than the last build)
#        scripts/demo.sh --rebuild  (always rebuild)
# Ollama missing or failing is fine: generation falls back to the demo recipes.
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
TEXT_MODEL="${OLLAMA_MODEL:-qwen3:8b}"
VISION_MODEL="${OLLAMA_VISION_MODEL:-gemma3:4b}"
export OLLAMA_KEEP_ALIVE="${OLLAMA_KEEP_ALIVE:--1}"

# keep_alive as JSON: a number (-1, 300) or a duration string ("10m")
if [[ "$OLLAMA_KEEP_ALIVE" =~ ^-?[0-9]+$ ]]; then KEEP_JSON="$OLLAMA_KEEP_ALIVE"; else KEEP_JSON="\"$OLLAMA_KEEP_ALIVE\""; fi

say() { printf '\033[1m[demo]\033[0m %s\n' "$*"; }

# 1. Ollama
if command -v ollama >/dev/null 2>&1; then
  if ! curl -sf "$OLLAMA_URL/api/tags" >/dev/null; then
    say "starting ollama serve"
    (ollama serve >/tmp/pure-ollama.log 2>&1 &)
    for _ in $(seq 1 30); do curl -sf "$OLLAMA_URL/api/tags" >/dev/null && break; sleep 1; done
  fi
  if curl -sf "$OLLAMA_URL/api/tags" >/dev/null; then
    for m in "$TEXT_MODEL" "$VISION_MODEL"; do
      if ollama list | awk 'NR>1 {print $1}' | grep -qx "$m"; then
        say "loading $m"
        curl -sf "$OLLAMA_URL/api/generate" -d "{\"model\":\"$m\",\"keep_alive\":$KEEP_JSON}" >/dev/null || say "could not load $m"
      else
        say "model $m is missing (ollama pull $m) — demo recipes will be used"
      fi
    done
  else
    say "ollama did not start — demo recipes will be used"
  fi
else
  say "ollama not installed — demo recipes will be used"
fi

# 2. Production build (when needed)
if [[ "${1:-}" == "--rebuild" || ! -f .next/BUILD_ID ]] || [[ -n "$(find app components lib data styles public -newer .next/BUILD_ID -type f -print -quit)" ]]; then
  say "building"
  npm run build
fi

# 3. Server
if lsof -ti "tcp:$PORT" >/dev/null 2>&1; then
  say "port $PORT is busy — stop the other server (npm run dev?) first"
  exit 1
fi
say "starting on http://localhost:$PORT"
npm start -- -p "$PORT" &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
for _ in $(seq 1 60); do curl -sf "http://localhost:$PORT" >/dev/null && break; sleep 1; done

# 4. Chrome, full screen (if Chrome is already open, press ⌘⇧F)
open -a "Google Chrome" --args --start-fullscreen "http://localhost:$PORT" || true
say "ready — reset demo data: ⌘⇧⌥R · /dev?dev=1 for the dev tools · Ctrl+C to stop"
wait $SERVER
