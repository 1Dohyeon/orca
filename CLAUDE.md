# CLAUDE.md

@AGENTS.md

## Language Rule

- Write everything that lands in this repository in English: code, comments, docs, commit messages, branch names, and PR text.
- Reply to the user in the user's configured language. Only repository artifacts follow the English rule.

## Test Runs

`pnpm check:changed` runs the full unit test suite (about 8 minutes) and truncates long output. Run it once and keep everything you need from that run.

- Redirect the full output to a file in the session scratchpad, then read the failure list from that file. Do not rerun the suite just to see which tests failed.
- Before blaming or clearing your change, run the failing test files on the base checkout (`develop`) with `pnpm test <files> --maxWorkers=2`. Report failures that also fail on the base as pre-existing, and the rest as possibly caused by the change.
- Tests under `tests/e2e/cross-version-wire/` need upstream release tags (for example `v1.4.222`). They fail with `unknown revision` unless the tags are fetched with `git fetch upstream --tags`.

## Fork Workflow

This repository is a personal custom fork of `stablyai/orca`. Follow `AGENTS.md` for code rules; this section covers branch management only.

### Branches

- `main`: Keep it identical to `upstream/main`. Never commit to it directly.
- `develop`: The custom work branch. Custom work is based on `develop`.
- Upstream contribution branches (`feat/*`, `fix/*`, etc.): Base them on `main`, never on `develop`. Open PRs against `stablyai/orca` `main`.

### Syncing Upstream

Precondition: the current branch is `develop` and the working tree is clean. Otherwise stop and report.

1. If the `upstream` remote is missing, add it: `git remote add upstream https://github.com/stablyai/orca`
2. `git fetch upstream`
3. Update `main`: `git push origin upstream/main:main`, then `git fetch origin main:main`
   - If the fast-forward is rejected, `main` has diverged from upstream. Do not force it; stop and report.
4. On `develop`, run `git rebase main`.
5. Resolve conflicts (during a rebase, `--ours` is `main` and `--theirs` is the custom commit).
   - `README.md`, `CLAUDE.md`: Keep the custom version (`git checkout --theirs <file>`).
   - Other files: Preserve both the upstream change and the custom intent. If the intent is unclear, stop and ask.
6. Verify: run `pnpm install` if the lockfile changed, then `pnpm tc`.
7. Report the number of upstream commits pulled in, conflicted files and how each was resolved, and the verification results. Run `git push --force-with-lease origin develop` only after the user approves.
