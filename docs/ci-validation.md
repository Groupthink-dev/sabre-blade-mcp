# CI validation

The validation workflow retains its status name and existing secret-free runner routing. The digest-pinned documentation step checks tracked Markdown and runs eleven classifier regression tests before dependency installation. Only README.md, CHANGELOG.md and Markdown directly under docs/ or docs/adr/ select documentation validation. Skill descriptions and unknown Markdown require full validation because they can be runtime product inputs.

PRs compare the whole diff against the fetched target merge base. Pushes require a successful same-branch push ancestor; missing history, empty diffs, divergent pushes, mixed changes and manual events select full validation. Both sides of renames are classified. The versioned classifier is copied from dev/stables at d8e9f559396bd14437bd3d34a5de2baa297f5dee. The existing three-green-push and three-green-PR protection gate remains in force.
