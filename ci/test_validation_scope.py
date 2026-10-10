"""Prove a docs-only decision cannot hide earlier code or renamed inputs."""
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from validation_scope import classify, documentation_path


POLICY = json.loads(Path(__file__).with_name("docs-policy.json").read_text())


class ValidationScopeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.repo = Path(self.temp.name)
        self.git("init", "-q")
        self.git("config", "user.email", "ci@example.invalid")
        self.git("config", "user.name", "CI scope test")
        self.base = self.commit("README.md", "initial\n")
        # Match plugin-git's fetched PR target without a network or credential.
        (self.repo / ".git/FETCH_HEAD").write_text(self.base + "\n")

    def git(self, *args):
        return subprocess.check_output(
            ["git", "-C", str(self.repo), *args], stderr=subprocess.PIPE,
        ).decode().strip()

    def commit(self, name, content):
        path = self.repo / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        self.git("add", "--all")
        self.git("commit", "-qm", "scope test")
        return self.git("rev-parse", "HEAD")

    def scope(self, **env):
        return classify(self.repo, {"CI_PIPELINE_EVENT": "pull_request", **env}, POLICY)[0]

    def test_g1_docs_pr(self):
        for name in ("CHANGELOG.md", "docs/adr/0005-verdict.md", "docs/adr/0028-evidence.md", "docs/adr/0003-launchd-nix-volume-race.md"):
            self.commit(name, "amendment\n")
        self.assertEqual(self.scope(), "docs")

    def test_earlier_code_is_not_hidden_by_latest_docs_commit(self):
        self.commit("codex-scripts/code.py", "broken code\n")
        for n in range(16):
            self.commit("README.md", str(n))
        self.assertEqual(self.scope(CI_PIPELINE_FILES='["README.md"]'), "full")

    def test_non_docs_rename_to_docs_still_runs_full(self):
        self.base = self.commit("code.py", "code\n")
        (self.repo / ".git/FETCH_HEAD").write_text(self.base + "\n")
        self.git("mv", "code.py", "CHANGELOG.md")
        self.git("commit", "-qm", "rename")
        self.assertEqual(self.scope(), "full")

    def test_deleted_code_still_runs_full(self):
        base = self.commit("code.py", "code\n")
        (self.repo / ".git/FETCH_HEAD").write_text(base + "\n")
        self.git("rm", "code.py")
        self.commit("README.md", "docs\n")
        self.assertEqual(self.scope(), "full")

    def test_empty_and_missing_base_run_full(self):
        self.assertEqual(self.scope(), "full")
        (self.repo / ".git/FETCH_HEAD").unlink()
        self.commit("README.md", "docs\n")
        self.assertEqual(self.scope(), "full")

    def test_push_requires_successful_same_branch_push_ancestor(self):
        self.commit("README.md", "docs\n")
        env = dict(CI_PIPELINE_EVENT="push", CI_COMMIT_BRANCH="main",
                   CI_PREV_PIPELINE_EVENT="push", CI_PREV_PIPELINE_STATUS="success",
                   CI_PREV_COMMIT_BRANCH="main", CI_PREV_COMMIT_SHA=self.base)
        self.assertEqual(self.scope(**env), "docs")
        for key, value in (("CI_PREV_PIPELINE_EVENT", "pull_request"),
                           ("CI_PREV_PIPELINE_STATUS", "failure"),
                           ("CI_PREV_COMMIT_BRANCH", "other"),
                           ("CI_PREV_COMMIT_SHA", ""),
                           ("CI_PREV_COMMIT_SHA", "0" * 40)):
            with self.subTest(key=key):
                self.assertEqual(self.scope(**{**env, key: value}), "full")

    def test_divergent_push_runs_full(self):
        self.git("checkout", "-qb", "other")
        other = self.commit("README.md", "other\n")
        self.git("checkout", "-q", self.base)
        self.commit("README.md", "docs\n")
        self.assertEqual(self.scope(
            CI_PIPELINE_EVENT="push", CI_COMMIT_BRANCH="main",
            CI_PREV_PIPELINE_EVENT="push", CI_PREV_PIPELINE_STATUS="success",
            CI_PREV_COMMIT_BRANCH="main", CI_PREV_COMMIT_SHA=other,
        ), "full")

    def test_unknown_events_run_full(self):
        self.commit("README.md", "docs\n")
        for event in ("manual", "cron", "tag", ""):
            self.assertEqual(self.scope(CI_PIPELINE_EVENT=event), "full")

    def test_documentation_rename_and_deletion(self):
        (self.repo / "docs").mkdir()
        self.git("mv", "README.md", "docs/renamed.md")
        self.git("commit", "-qm", "rename docs")
        self.assertEqual(self.scope(), "docs")
        renamed = self.git("rev-parse", "HEAD")
        (self.repo / ".git/FETCH_HEAD").write_text(renamed + "\n")
        self.git("rm", "docs/renamed.md")
        self.git("commit", "-qm", "delete docs")
        self.assertEqual(self.scope(), "docs")

    def test_runtime_markdown_commit_runs_full(self):
        self.commit("SKILLS.md", "runtime prompt\n")
        self.assertEqual(self.scope(), "full")

    def test_markdown_is_not_automatically_documentation(self):
        for path in ("Tests/fixtures/spec.md", ".impeccable/surfaces/console.md",
                     "home/claude-global-claude-md.md",
                     "web/content/runtime.md", "new-surface.md",
                     ".woodpecker/validation.yaml", "flake.lock", "ci/docs-policy.json"):
            with self.subTest(path=path):
                self.assertFalse(documentation_path(path, POLICY))


if __name__ == "__main__":
    unittest.main()
