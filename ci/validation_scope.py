#!/usr/bin/env python3
"""Select docs only from a complete Git diff; uncertainty means full validation.

Do not use CI_PIPELINE_FILES: Forgejo push payloads can truncate commit lists.
The clone plugin fetches the PR target. Pushes can use a previous successful
push on the same branch; missing/unrelated/failed predecessors run in full.
"""
from __future__ import annotations

import json
import os
from pathlib import Path, PurePosixPath
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def documentation_path(path, policy):
    if path in policy["fullValidation"]:
        return False
    item = PurePosixPath(path)
    return path in policy["files"] or (
        item.suffix == ".md" and str(item.parent) in policy["markdownDirectories"]
    )


def git(repo, *args):
    return subprocess.check_output(
        ["git", "-C", str(repo), *args], stderr=subprocess.PIPE,
    ).decode("utf-8", errors="surrogateescape").strip("\n")


def classify(repo, env, policy):
    try:
        head = git(repo, "rev-parse", "HEAD")
        event = env.get("CI_PIPELINE_EVENT")
        if event == "pull_request":
            # plugin-git's fetch_target_branch leaves the target in FETCH_HEAD.
            # No HEAD^ fallback: that would overlook earlier commits in a PR.
            base = git(repo, "merge-base", "HEAD", "FETCH_HEAD")
        elif event == "push" and (
            env.get("CI_PREV_PIPELINE_EVENT") == "push"
            and env.get("CI_PREV_PIPELINE_STATUS") == "success"
            and env.get("CI_COMMIT_BRANCH")
            and env.get("CI_PREV_COMMIT_BRANCH") == env["CI_COMMIT_BRANCH"]
        ):
            previous = env.get("CI_PREV_COMMIT_SHA", "")
            # Accept only a SHA, never a Git revision expression from metadata.
            if len(previous) not in (40, 64) or any(c not in "0123456789abcdef" for c in previous):
                return "full", "no previous successful push SHA"
            base = git(repo, "rev-parse", previous + "^{commit}")
            if git(repo, "merge-base", base, head) != base:
                return "full", "previous push is not an ancestor"
        else:
            return "full", "no complete comparison base for this event"
        if base == head:
            return "full", "empty comparison"
        # Disable rename detection so BOTH sides of a rename are classified.
        paths = git(repo, "diff", "--no-renames", "--name-only", "-z", base, head, "--").split("\0")
        paths = [path for path in paths if path]
        if not paths:
            return "full", "empty diff"
        if all(documentation_path(path, policy) for path in paths):
            return "docs", f"{len(paths)} documentation paths against {base}"
        return "full", "code, fixtures, configuration or unclassified paths changed"
    except (subprocess.CalledProcessError, OSError):
        return "full", "Git comparison unavailable"


def main():
    policy = json.loads((ROOT / "ci/docs-policy.json").read_text())
    scope, reason = classify(ROOT, os.environ, policy)
    (ROOT / ".ci-validation-scope").write_text(scope + "\n")
    print(f"Validation scope: {scope} ({reason})")


if __name__ == "__main__":
    main()
