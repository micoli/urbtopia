#!/usr/bin/env bash
# Walks the owner through the one-time production setup for Cloud saves (ADR 0016).
# Needs: gh (authenticated with admin rights on the repository).
set -euo pipefail

repo="$(gh repo view --json nameWithOwner --jq .nameWithOwner)"
echo "Repository: $repo"

pause() { read -r -p "Press Enter when done... " _; }

echo
echo "Step 1/5 - create the Supabase project"
echo "  Open https://supabase.com/dashboard/new, create a project, and keep the database password."
echo "  Then: Authentication > Sign In / Providers > enable 'Allow anonymous sign-ins'."
pause

echo
echo "Step 2/5 - create the 'production' GitHub Environment restricted to main"
read -r -p "GitHub username of the required reviewer: " reviewer
reviewer_id="$(gh api "users/$reviewer" --jq .id)"
gh api -X PUT "repos/$repo/environments/production" \
  --input - <<JSON
{"reviewers":[{"type":"User","id":$reviewer_id}],"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true}}
JSON
gh api -X POST "repos/$repo/environments/production/deployment-branch-policies" -f name=main -f type=branch >/dev/null || true
echo "  Environment 'production' created, restricted to main, reviewer: $reviewer"

echo
echo "Step 3/5 - Environment secrets (values are read silently and sent straight to GitHub)"
echo "  Access token: https://supabase.com/dashboard/account/tokens"
for name in SUPABASE_ACCESS_TOKEN SUPABASE_DB_PASSWORD SUPABASE_PROJECT_REF; do
  read -r -s -p "$name: " value
  echo
  printf '%s' "$value" | gh secret set "$name" --env production --repo "$repo"
done

echo
echo "Step 4/5 - repository Variables (public values)"
echo "  Supabase dashboard > Project Settings > API: project URL and publishable key."
read -r -p "VITE_SUPABASE_URL: " url
read -r -p "VITE_SUPABASE_PUBLISHABLE_KEY: " key
gh variable set VITE_SUPABASE_URL --body "$url" --repo "$repo"
gh variable set VITE_SUPABASE_PUBLISHABLE_KEY --body "$key" --repo "$repo"

echo
echo "Step 5/5 - repository settings that cannot be set from here (see docs/security.md)"
echo "  Enable secret scanning and push protection, approval for first-time contributors,"
echo "  and read-only default workflow permissions."
echo
echo "Then run the 'Deploy database migrations' workflow once and approve it."
