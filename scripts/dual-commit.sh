#!/usr/bin/env bash
#
# dual-commit.sh — commit the current working tree to both remotes with
# language-specific messages: English → GitHub, Korean → GitLab.
#
# Usage: scripts/dual-commit.sh "English message" "한글 메시지"
#
# Branch model: two parallel branches with identical trees but independent
# histories — `gh` (English, pushed to GitHub main) and `gl` (Korean, pushed
# to GitLab main). Tokens are read from the gitignored .env at runtime.

set -euo pipefail

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 \"English message\" \"한글 메시지\"" >&2
  exit 1
fi
EN="$1"; KO="$2"

ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"

GH=$(grep '^GITHUB_TOKEN=' .env | sed -E 's/^GITHUB_TOKEN="?([^"]*)"?$/\1/')
GL=$(grep '^GITLAB_TOKEN=' .env | sed -E 's/^GITLAB_TOKEN="?([^"]*)"?$/\1/')
GH_URL="https://${GH}@github.com/cuter74-dev/wowBoard.git"
GL_URL="https://oauth2:${GL}@gitlab.oopnwow.com/cuter74/wowboard.git"

TRAILER="

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"

# 1) English commit on gh → GitHub
git checkout -q gh
git add -A
git commit -q -m "${EN}${TRAILER}"
git push -q "$GH_URL" gh:main

# 2) Mirror the exact tree onto gl, Korean commit → GitLab
git checkout -q gl
git read-tree -u --reset gh   # make gl's index+worktree identical to gh's tree
git commit -q -m "${KO}${TRAILER}"
git push -q "$GL_URL" gl:main

git checkout -q gh
echo "✓ pushed EN→GitHub (gh:main), KO→GitLab (gl:main)"
