#!/usr/bin/env bash
# Sends the two Auth email templates and their subjects (supabase/templates, supabase/config.toml)
# to a Supabase project, without touching any other Auth setting (unlike `supabase config push`).
#
# Usage: SUPABASE_ACCESS_TOKEN=... scripts/push-email-templates.sh <project-ref> [--dry-run] [--yes]
# The token needs write access to the project's application services (Auth configuration).
set -euo pipefail

ref="${1:-}"
[ -n "$ref" ] || { echo "Usage: SUPABASE_ACCESS_TOKEN=... $0 <project-ref> [--dry-run] [--yes]" >&2; exit 2; }
shift
dry_run=false
assume_yes=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=true ;;
    --yes) assume_yes=true ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
payload="$(python3 - "$root" <<'PY'
import json, sys, tomllib
root = sys.argv[1]
with open(f"{root}/supabase/config.toml", "rb") as handle:
    config = tomllib.load(handle)
payload = {}
for name in ("email_change", "magic_link"):
    template = config["auth"]["email"]["template"][name]
    path = f"{root}/{template['content_path'].removeprefix('./')}"
    with open(path, encoding="utf-8") as handle:
        payload[f"mailer_subjects_{name}"] = template["subject"]
        payload[f"mailer_templates_{name}_content"] = handle.read()
print(json.dumps(payload))
PY
)"

echo "Project: $ref"
python3 -c 'import json,sys; [print(f"  {k}: {len(v)} characters") for k, v in json.loads(sys.argv[1]).items()]' "$payload"

if $dry_run; then
  echo "Dry run: nothing was sent."
  exit 0
fi

[ -n "${SUPABASE_ACCESS_TOKEN:-}" ] || { echo "SUPABASE_ACCESS_TOKEN is not set." >&2; exit 2; }

if ! $assume_yes; then
  read -r -p "Overwrite these templates on $ref? [y/N] " answer
  [ "$answer" = "y" ] || { echo "Cancelled."; exit 1; }
fi

status="$(printf 'header = "Authorization: Bearer %s"\n' "$SUPABASE_ACCESS_TOKEN" |
  curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
    --config - --request PATCH \
    --header 'Content-Type: application/json' \
    --data "$payload" \
    "https://api.supabase.com/v1/projects/$ref/config/auth")"

if [ "$status" != "200" ]; then
  echo "The API answered HTTP $status. 401/403: check the token permissions; 404: check the project ref." >&2
  exit 1
fi
echo "Templates updated on $ref."
