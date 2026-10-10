#!/usr/bin/env python3
"""Cheap tracked Markdown hygiene; no packages or toolchain installation."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def main():
    paths = subprocess.check_output(
        ["git", "-C", str(ROOT), "ls-files", "-z", "*.md"]
    ).decode().split("\0")
    failures = []
    for name in filter(None, paths):
        path = ROOT / name
        if not path.exists():
            continue
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeError:
            failures.append(f"{name}: invalid UTF-8")
            continue
        if "\0" in text:
            failures.append(f"{name}: NUL byte")
        for number, line in enumerate(text.splitlines(), 1):
            if line.startswith(("<<<<<<< ", ">>>>>>> ")):
                failures.append(f"{name}:{number}: unresolved merge marker")
    if failures:
        raise SystemExit("\n".join(failures))
    print("Tracked Markdown: UTF-8 and merge-marker checks passed")


if __name__ == "__main__":
    main()
